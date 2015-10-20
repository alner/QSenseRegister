var https = require('https'),
  Promise = require('promise'),
  crypto = require('crypto'),
  config = require('./config').config;

function generateXrfkey(size, chars) {
  size = size || 16;
  chars = chars || 'abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789';

  var rnd = crypto.randomBytes(size), value = new Array(size), len = chars.length;

  for (var i = 0; i < size; i++) {
    value[i] = chars[rnd[i] % len]
  };

  return value.join('');
}

function makeHttpsRequest(settings, body, dataCallback){
  return new Promise(function(resolve, reject) {
    var req = https.request(settings, function (res) {
      var d = '';
      res.on('data', function (data) {
        d += data.toString();
      })
      .on('end', function(){
        if(dataCallback)
          resolve(dataCallback({data: d, response: res}));
        else
          resolve({data: d, response: res});
      })
      .on('error', function(e){
        reject(e);
      });
    });

    req.on('error', function(e) {
      reject(e);
    });

    if(body) {
      req.write(body);
    }

    req.end();
  });
}

function makeAppUrl(appId) {
  var url = 'http://' + config.hub.host;

  if(config.hub.port)
    url += (':' + config.hub.port);

  url += (config.hub.url + '/sense/app/' + appId);

  return url;
}

function makeAuthAppUrl(login, appid) {
  // Auth module url
  return config.authmodule.external_url + '/auth?userId=' + login + '&appId=' + appid;
}

exports.makeHttpsRequest = makeHttpsRequest;
exports.generateXrfkey = generateXrfkey;
exports.makeAppUrl = makeAppUrl;
exports.makeAuthAppUrl = makeAuthAppUrl;
