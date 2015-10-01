'use strict';

var express = require('express');
var session = require('express-session');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var uuid = require('node-uuid');
var https = require('https');
var fs = require('fs');
var path = require('path');
var requestTicket = require('./requestTicket').requestTicket;

var https_options = {
  pfx: fs.readFileSync(path.resolve('certificates','client.pfx')),
  passphrase: '1234567890'
};

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

app.get('/', function(req, res){
  req.session.targetId = req.query.targetId;
  req.session.resturi = req.query.proxyRestUri;

  var user_login = uuid.v4().toString();

  if(req.session.resturi)
  requestTicket(user_login, 'DEMOAPPS', req.session.resturi, req.session.targetId,
  https_options.pfx, https_options.passphrase)
  .then(function(response){
    //var data = JSON.parse(data.data && data.data.toString());
    //console.log(response.data.toString());
    if(response && response.data) {
      var data = JSON.parse(response.data.toString());
      if(data) {
        if(data.Ticket)
          console.log(data.Ticket);

        if(data.TargetUri)
          console.log(data.TargetUri);
      }
    }
  })
  .catch(function(err){
    console.error(err);
  });

  res.render('index', {
    sessionID: req.sessionID,
    targetId: req.session.targetId,
    resturi: req.session.resturi
  });

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
