var express = require('express');
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

app.get('/', function(req, res){
  res.end('Hello world!');
});

var server = https.createServer(https_options, app);
server.listen(app.get('PORT'), function(){
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
