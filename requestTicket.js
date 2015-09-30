var https = require('https');
var url = require('url');
var path = require('path');
var makeHttpsRequest = require('./utils').makeHttpsRequest;
var generateXrfkey = require('./utils').generateXrfkey;

exports.requestTicket = function(user, directory, resturi, targetid, cert, passphrase) {
  var urlObject = url.parse(resturi);
  var xrfkey = generateXrfkey();

  var options = {
    host: urlObject.hostname,
    port: urlObject.port,
    path: urlObject.path + '/ticket?xrfkey=' + xrfkey,
    method: 'POST',
    headers: {
      'X-qlik-xrfkey': xrfkey,
      'Content-Type': 'application/json'
    },
    pfx: cert,
    passphrase: passphrase,
    rejectUnauthorized: false,
    agent: false
  };

  var data = JSON.stringify({
    'UserDirectory':  directory,
    'UserId': user,
    'Attributes': [],
    'TargetId': targetid
  });

  return makeHttpsRequest(options, data);
}
