"use strict";

var express = require('express');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var recaptcha = require('express-recaptcha');
var validator = require('express-validator');
var uuid = require('node-uuid');
var https = require('https');
var fs = require('fs');
var path = require('path');
var async = require('async');
var moment = require('moment');
var request = require('request');
var querystring = require('querystring');

var logger = require('./logger')(module);
var db = require('./db');
var makeHttpsRequest = require('./utils').makeHttpsRequest;
var requestTicket = require('./api').requestTicket;
var repositoryGetApps = require('./api').repositoryGetApps;
var config = require('./config.json');
var translations = require('./views/translations');
var mailer = require('./mailer');

var https_options = {
  pfx: fs.readFileSync(path.resolve('certificates', config.certificates.pfx.client)),
  pem: {
    key: fs.readFileSync(path.resolve('certificates', config.certificates.pem.key)),
    cert: fs.readFileSync(path.resolve('certificates', config.certificates.pem.cert)),
    ca: fs.readFileSync(path.resolve('certificates', config.certificates.pem.ca))
  },
  passphrase: config.certificates.passphrase
};

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
moment().local();

var SITE_KEY = config.recaptcha.SITE_KEY;
var SECRET_KEY = config.recaptcha.SECRET_KEY;
recaptcha.init(SITE_KEY, SECRET_KEY);

var app = express();
app.set('PORT', process.env.PORT || config.authmodule.port);

var hbs = exphbs({
  extname:'hbs',
  defaultLayout: 'main'
});

app.engine('hbs', hbs);
app.set('view engine', 'hbs');

// static middleware
app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(validator());
// parse application/json
// app.use(bodyParser.json());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'SenseDemoApps',
  cookie: {
    secure: true
  }
}));


/**
  * Render index page
  */
function renderIndex(errors, values, req, res, next){
  async.waterfall([
    function(callback){
      // get apps list
      repositoryGetApps(config, https_options)
      .then(function(response){
        var data = JSON.parse(response.data);
        var apps = [];
        if(data)
          apps = data.filter(function(appinfo) {
            return appinfo.published;
          });

        callback(null, apps);
      })
      .catch(function(err){
        callback(err);
      });
    },

    function(apps, callback){
      var streams = {};
      if(apps && apps.length > 0) {
        apps.map(function(appinfo) {
          streams[appinfo.stream.name] = {
            value: appinfo.stream.name,
            toString: function(){
              return this.value;
            }
          };
        });
      }
      callback(null, streams, apps); // Object.keys(streams)
    }
  ], function(err, streams, apps){
    if(err) return next(err);

    // selected stream/industry
    if(values && streams[values.industry]) {
      streams[values.industry].selected = true;
    }

    // selected application
    if(values && values.application) {
      apps.map(function(app) {
        if(app.name == values.application)
          app.selected = true;
      });
    }

    res.render('index',
      {
        translations: translations.ru,
        streams: streams,
        apps: apps,
        errors: errors,
        values: values,
        recaptcha:req.recaptcha,
        SITE_KEY: SITE_KEY
      }
    );
  });
}

app.get('/', recaptcha.middleware.render, function(req, res, next){
  renderIndex(null, {}, req, res, next);
});

app.post('/', function(req, res, next){
  var now = moment();
  var values = {};
  values.industry = req.body.industry;
  values.application = req.body.application;
  values.name = req.body.name;
  values.surname = req.body.surname;
  values.email = req.body.email;
  values.phone = req.body.phone;
  values.company = req.body.company;
  values.position = req.body.position;
  values.login = uuid.v4().toString();
  values.lang = 'ru';
  values.registeredDate = now.format(db.DateTimeFormat);
  values.grantedDate = now.add({days: config.authmodule.AccessDays}).format(db.DateTimeFormat);
  values.state = 0;
  // enum RegistrationState : byte
  // {
  //     Registered = 0,
  //     Deleted = 1,
  //     NoLicense = 2,
  //     Granted = 3,
  //     Accessed = 4,
  //     NotifyRegistration = 5
  // }

  recaptcha.verify(req, function(error) {
        if(error) {
          var errors = {};
          errors.captcha = {
            error: translations.ru.errors.captcha
          };
          renderIndex(errors, values, req, res, next);
        } else {
          req.assert('industry', translations.ru.errors.industry_notEmpty).notEmpty();
          req.assert('application', translations.ru.errors.application_notEmpty).notEmpty();
          req.assert('name', translations.ru.errors.name_notEmpty).notEmpty();
          req.assert('surname', translations.ru.errors.surname_notEmpty).notEmpty();
          req.assert('email', translations.ru.errors.email_notEmpty).notEmpty()
          req.assert('email', translations.ru.errors.email_isEmail).isEmail();
          req.assert('phone', translations.ru.errors.phone_notEmpty).notEmpty();
          req.assert('company', translations.ru.errors.company_notEmpty).notEmpty();
          req.assert('position', translations.ru.errors.position_notEmpty).notEmpty();

          var validationErrors = req.validationErrors();
          if(validationErrors) {
            var errors = {};
            validationErrors.map(function(error){
              errors[error.param] = {
                error: error.msg,
                toString: function(){
                  return this.error
                }
              };
            });

            renderIndex(errors, values, req, res, next);
          } else {

            async.waterfall([

              // Save to database
              function(callback){
                  db.insert(values).then(function(){
                      logger.info('Data saved');
                      logger.info(values);
                      callback(null, values);
                  }).catch(function(err){
                      callback(err, values);
                  });
              },

              // Qlik Sense document redirect, through auth module
              function(values, callback){
                // Create qlik sense user login
                var appId = values.application.split('|')[0];
                var appTitle = values.application.split('|')[1];
                var proxyRestUri = makeAppUrl(appId);
                var authQuery = '/auth?userId=' + values.login +
                '&appId=' + appId +
                '&proxyRestUri=' + proxyRestUri;

                // Auth module url
                var req_url = config.authmodule.external_url + authQuery;
                //'https://' + config.authmodule.host + ':' + config.authmodule.port

                // used in email
                values.access_url = req_url;
                values.applicationTitle = appTitle;

                res.redirect(req_url);
                callback(null, values);
              },

              // Send email
              function(values, callback) {
                mailer.sendMail(values.email, // email
                  config.mail.subject[values.lang], // email subject
                  values, // context/data
                  "message." + values.lang // email template
                ).then(function(info){
                  callback(null, values);
                  logger.info(info);
                }).catch(function(err){
                  callback(err);
                  logger.error(err);
                });
              }

            ],
            function(err, response){
                if(err) {
                  logger.error(err);
                  return next(err);
                }
                /*
                if(response.statusCode === 200)
                  res.redirect(response.request.uri.href);
                else {
                  logger.info(response.statusCode);
                  return next(401);
                }
                */
            });
          }
        }
  });
});


/**
  * Get app list for appropriate stream
  */
app.get('/api/:stream/apps', function(req, res, next){
  var stream = req.params.stream;
  repositoryGetApps(config, https_options)
  .then(function(response){
    var apps = [];
    if(response.data) {
      apps = JSON.parse(response.data);
      apps = apps.filter(function(appinfo){
        return appinfo.stream.name === stream;
      });
    }
    res.json(apps);
  })
  .catch(function(err){
    logger.error(err);
    next(err);
  });
});


/**
  * Auth module
  */
function makeRequestTicketStep(userId, req) {
  var proxyRestUri = req.session.resturi;
  var targetId = req.session.targetId;
  return function(response, callback) {
      var query = response && response.request && response.request.uri && response.request.uri.query;
      var par;
      if(query) {
        par = querystring.parse(query);
        if(!par.proxyRestUri || !par.targetId)
          return callback(401);
      } else {
        par = {
          proxyRestUri: proxyRestUri,
          targetId: targetId
        };
      }

      requestTicket(
        https_options.pfx,
        https_options.passphrase,
        userId,
        config.authmodule.UserDirectory,
        par.proxyRestUri,
        par.targetId
      ).then(function(data){
        if(!callback) callback = response;
        callback(null, data);
      })
      .catch(function(err){
        callback(err);
      });
  }
}

function makeHubRequestStep(url) {
  return function(response, callback) {
    request.get(url)
    .on('response', function(response){
      if(response && response.statusCode === 401) {
        callback(null, response);
      } else {
        callback(response);
      }
    })
    .on('error', function(err) {
      callback(err);
    });
  }
}

function makeCheckDbRequest(userId, appId) {
  return function(callback){
    var now = moment().format(db.DateTimeFormat);
    db.query(userId, appId, now).then(function(data){
      if(data && data[0].Login && !data[0].Deleted) {
        callback(null, data[0]);
      } else {
        callback(404); // requested resource could not be found
      }
    }).catch(function(err){
      logger.error(err);
      callback(err);
    });
  }
}

function makeAppUrl(appId) {
  var url = 'http://' + config.hub.host;

  if(config.hub.port)
    url += (':' + config.hub.port);

  url += (config.hub.url + '/sense/app/' + appId);

  return url;
}

app.get('/auth', function(req, res, next){
  req.session.targetId = req.query.targetId;
  req.session.resturi = req.query.proxyRestUri;
  var userId = req.query.userId;
  var appId = req.query.appId;

  if(!userId
  || !appId
  || !req.session.resturi)
    return res.sendStatus(401);

  //if(!userId) userId = 'test';

  var authSteps = [];
  authSteps.push(makeCheckDbRequest(userId, appId + '%'));
  authSteps.push(makeHubRequestStep(req.session.resturi));
  authSteps.push(makeRequestTicketStep(userId, req));

  async.waterfall(authSteps,
    function(err, result) {
      if(req.session)
        req.session.destroy();

      if(err) {
        logger.error(err);
        return next(err);
      }
      if(!result || !result.data) return res.sendStatus(401);
      var data;
      try {
        data = JSON.parse(result.data.toString());
      } catch(err) {
        logger.error(err);
        logger.error(result.data);
        return res.sendStatus(401);
      }
      if(typeof data === 'string') {
        logger.error(data);
        return res.sendStatus(401);
      }

      if(!data.Ticket || !data.TargetUri) res.sendStatus(401);

      var redirectURI;
      if(data.TargetUri.indexOf("?") > 0) {
        redirectURI = data.TargetUri + '&qlikTicket=' + data.Ticket;
      } else {
        redirectURI = data.TargetUri + '?qlikTicket=' + data.Ticket;
      }
      res.redirect(redirectURI);
      logger.info("Redirected ", redirectURI);
    }
  );

  //var user_login = uuid.v4().toString();
  /*
  if(req.session.resturi) {
      requestTicket(
        https_options.pfx,
        https_options.passphrase,
        req.session.userId,
        config.authmodule.UserDirectory,
        req.session.resturi,
        req.session.targetId
      ).then(function(response){
        if(response && response.data) {
          //console.log(response.data.toString());
          var data = JSON.parse(response.data.toString());
          if(data && data.Ticket) {
              var redirectURI;

              if (data.TargetUri) {
                if(data.TargetUri.indexOf("?") > 0) {
                  redirectURI = data.TargetUri + '&qlikTicket=' + data.Ticket;
                } else {
                  redirectURI = data.TargetUri + '?qlikTicket=' + data.Ticket;
                }
                res.redirect(redirectURI);
                logger.log("Login redirect:", redirectURI);
              } else {
                res.sendStatus(200);
                logger.log("Auth 200 OK ", data.Ticket);
              }
          } else res.sendStatus(401); // authentication is possible but has failed
        } else res.sendStatus(401);
      })
      .catch(function(err){
        logger.error(err);
        next(err);
      });
  } else res.sendStatus(401);

  req.session.destroy();
  */
});

// Connect to db, run web app
db.connect().then(function(){
  return db.prepare();
}).then(function(){
  var server = https.createServer(https_options, app);
  server.listen(app.get('PORT'), function() {
    var address = server.address().address;
    var port = server.address().port;
    logger.info('Listening https://%s:%s', address, port);
  });
}).catch(function(err){
  logger.error(err);
  if(db.isConnected)
    db.close();
});
