var https = require('https'),
  Promise = require('promise'),
  crypto = require('crypto');

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
      res.on('data', function (data) {
        if(dataCallback)
          resolve(dataCallback({data: data, response: res}));
        else
          resolve({data: data, response: res});
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

exports.makeHttpsRequest = makeHttpsRequest;
exports.generateXrfkey = generateXrfkey;
