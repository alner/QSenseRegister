'use strict';

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

var senseUtils = require('./utils');
var requestTicket = require('./api').requestTicket;
var repositoryGetApps = require('./api').repositoryGetApps;
var config = require('./config.json');

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

var SITE_KEY = config.recaptcha.SITE_KEY;
var SECRET_KEY = config.recaptcha.SECRET_KEY;
recaptcha.init(SITE_KEY, SECRET_KEY);

var app = express();
app.set('PORT', process.env.PORT || config.authmodule.port);

var hbs = exphbs({
  extname:'hbs',
  defaultLayout: 'main',
  helpers: {
    eq: function(a,b){
      return a == b;
    }
  }
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
          streams[appinfo.stream.name] = appinfo.stream.name;
        });
      }
      callback(null, Object.keys(streams), apps)
    }
  ], function(err, streams, apps){
    if(err) return next(err);

    res.render('index',
      {
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
  recaptcha.verify(req, function(error) {
        if(!error) {
          req.assert('industry', 'Сделайте выбор в поле "Область интереса"').notEmpty();
          req.assert('application', 'Выберите приложение из списка "Демо-приложение"').notEmpty();
          req.assert('name', 'Имя обязательно для заполнения').notEmpty();
          req.assert('surname', 'Фамилия обязательна для заполнения').notEmpty();
          req.assert('email', 'Поле "Email" обязательно для заполнения').notEmpty()
          req.assert('email', 'Укажите правильный Email').isEmail();
          req.assert('phone', 'Поле "Телефон" обязательно для заполнения').notEmpty();
          req.assert('company', 'Поле "Компания" обязательно для заполнения').notEmpty();
          req.assert('position', 'Поле "Должность" обязательно для заполнения').notEmpty();

          var errors = req.validationErrors();
          if(errors) {
            var values = {}
            errors.map(function(error){
              values[error.param].msg = error.msg;
              values[error.param].value = error.value;
            });
            renderIndex(errors, values, req, res, next);
          } else {
            // save to db
            // set access rule
            // send email
          }
        }
        else {
          //error code
        }
  });
});

// get app list
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
    console.error(err);
    next(err);
  });
});

app.get('/auth', function(req, res, next){
  req.session.targetId = req.query.targetId;
  req.session.resturi = req.query.proxyRestUri;

  var user_login = uuid.v4().toString();

  if(req.session.resturi)
  requestTicket(user_login, 'DEMOAPPS', req.session.resturi, req.session.targetId,
  https_options.pfx, https_options.passphrase)
  .then(function(response){
    if(response && response.data) {
      //console.log(response.data.toString());
      var data = JSON.parse(response.data.toString());
      if(data && data.Ticket) {
          var redirectURI;

          if (data.TargetUri && data.TargetUri.indexOf("?") > 0) {
            redirectURI = data.TargetUri + '&qlikTicket=' + data.Ticket;
          } else {
            redirectURI = data.TargetUri + '?qlikTicket=' + data.Ticket;
          }

          res.redirect(redirectURI);
          console.log("Login redirect:", redirectURI);
      } else res.sendStatus(401); // authentication is possible but has failed
    } else res.sendStatus(401);
  })
  .catch(function(err){
    console.error(err);
    next(err);
  });

  req.session.destroy();
});

var server = https.createServer(https_options, app);
server.listen(app.get('PORT'), function() {
  var host = server.address().host;
  var port = server.address().port;
  console.log('Listening https://%s:%s', host, port);
});
