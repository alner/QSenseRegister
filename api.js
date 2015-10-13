var https = require('https');
var url = require('url');
var path = require('path');
var querystring = require('querystring');
var makeHttpsRequest = require('./utils').makeHttpsRequest;
var generateXrfkey = require('./utils').generateXrfkey;

exports.requestTicket = function(cert, passphrase, user, directory, resturi, targetid) {
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

  var data = {
    'UserDirectory':  directory,
    'UserId': user,
    'Attributes': [],
  };

  if(targetid) data.TargetId = targetid;

  return makeHttpsRequest(options, JSON.stringify(data));
}

exports.deleteUser = function deleteUser(cert, passphrase, user, directory, resturi) {
  var urlObject = url.parse(resturi);
  var xrfkey = generateXrfkey();

  var options = {
    host: urlObject.hostname,
    port: urlObject.port,
    path: urlObject.path + '/user/' + directory +'/' + user + '?xrfkey=' + xrfkey,
    method: 'DELETE',
    headers: {
      'X-qlik-xrfkey': xrfkey,
      'Content-Type': 'application/json'
    },
    pfx: cert,
    passphrase: passphrase,
    rejectUnauthorized: false,
    agent: false
  };

  return makeHttpsRequest(options);
};

exports.repositoryGetApps = function repositoryGetApps(config, https_options){
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/app?xrfkey=' + xrfkey,
    method: 'GET',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User']
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };
  return makeHttpsRequest(options);
}

exports.repositorySelectUser = function repositorySelectUser(config, https_options, user){
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: "/qrs/selection?xrfkey=" + xrfkey, // +"&filter=" + encodeURIComponent("Name eq '"+ user + "'"), //"/qrs/user/count?xrfkey=" + xrfkey + "&filter=" + encodeURIComponent("Name eq '"+ user + "'"),  //'/qrs/selection?xrfkey=' + xrfkey,
    method: 'POST', //'POST',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User'],
      'Content-Type': 'application/json'
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };

// items: [{type: "User", objectID: "38b6ab72-ebe2-43d3-aaab-607881dbca0b"}]
  var data = {
    items: [
      {
        type: "User",
        objectID: user
      }
    ]
  };

  return makeHttpsRequest(options, JSON.stringify(data)); //, JSON.stringify(data));
};

exports.repositoryFilterUserByName = function repositoryFilterUserByName(config, https_options, user){
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: "/qrs/user/full?xrfkey=" + xrfkey +"&filter=" + encodeURIComponent("Name eq '"+ user + "'"), //"/qrs/user/count?xrfkey=" + xrfkey + "&filter=" + encodeURIComponent("Name eq '"+ user + "'"),  //'/qrs/selection?xrfkey=' + xrfkey,
    method: 'GET', //'POST',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User'],
      'Content-Type': 'application/json'
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };

  return makeHttpsRequest(options); //, JSON.stringify(data));
};

exports.repositoryDeleteUser = function repositoryDeleteUser(config, https_options, id) {
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/user/' + id + '?xrfkey=' + xrfkey, //'/qrs/selection/' + id + '/user?xrfkey=' + xrfkey,
    method: 'DELETE',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User'],
      'Content-Type': 'application/json'
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };

  return makeHttpsRequest(options);
}

exports.repositoryDelete = function repositoryDelete(config, https_options, id) {
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/selection/' + id + '?xrfkey=' + xrfkey,
    method: 'DELETE',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User'],
      'Content-Type': 'application/json'
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };

  return makeHttpsRequest(options);
};
