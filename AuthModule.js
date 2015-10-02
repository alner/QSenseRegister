'use strict';

var express = require('express');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var recaptcha = require('express-recaptcha');
var uuid = require('node-uuid');
var https = require('https');
var fs = require('fs');
var path = require('path');
var requestTicket = require('./requestTicket').requestTicket;

var https_options = {
  pfx: fs.readFileSync(path.resolve('certificates','client.pfx')),
  passphrase: '1234567890'
};

var SITE_KEY = '6LesAA4TAAAAAD1rn9Jfy6ENT_1pa2IK6eWy_mVJ';
var SECRET_KEY = '6LesAA4TAAAAAMPKGwWayCuStiJHtSh8m6uOPkDh';
recaptcha.init(SITE_KEY, SECRET_KEY);

var app = express();
app.set('PORT', process.env.PORT || 8888);

app.engine('hbs', exphbs({ extname:'hbs', defaultLayout: 'main' }));
app.set('view engine', 'hbs');

// static middleware
app.use(express.static('public/'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
//app.use(bodyParser.json());
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: 'SenseDemoApps',
  cookie: {
    secure: true
  }
}));

app.get('/', recaptcha.middleware.render, function(req, res){
  res.render('index',  { recaptcha:req.recaptcha,  SITE_KEY: SITE_KEY });
});

app.post('/', function(req, res){
  recaptcha.verify(req, function(error) {
      /*
        if(!error)
            ;//success code
        else
            ;//error code
      */
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

  // res.render('index', {
  //   sessionID: req.sessionID,
  //   targetId: req.session.targetId,
  //   resturi: req.session.resturi
  // });

  req.session.destroy();
});

var server = https.createServer(https_options, app);
server.listen(app.get('PORT'), function() {
  var host = server.address().host;
  var port = server.address().port;
  console.log('Listening https://%s:%s', host, port);
});

/*
var proxyURL = 'https://qsdemo:4243/qps';
requestTicket('test', 'test', proxyURL, '', https_options.pfx, https_options.passphrase)
.then(function(data){
  //var data = JSON.parse(data);
  //var data = JSON.parse(data.data && data.data.toString());
  console.log(data.data.toString());
  //console.log(data);
})
.catch(function(err){
  console.error(err);
});
*/
