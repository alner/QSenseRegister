var https = require('https');
var url = require('url');
var path = require('path');
var makeHttpsRequest = require('./utils').makeHttpsRequest;
var generateXrfkey = require('./utils').generateXrfkey;
var Config = require('./config');
var config = Config.config;
var https_options = Config.https_options;

exports.requestTicket = function requestTicket(user, directory, resturi, targetid) {
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
    pfx: https_options.pfx,
    passphrase: https_options.passphrase,
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

exports.proxyDeleteUser = function proxyDeleteUser(user, directory) {
  var xrfkey = generateXrfkey();
  var options = {
    host: config.proxy.hostname,
    port: config.proxy.port,
    path: config.proxy.url + '/user/' + directory +'/' + user + '?xrfkey=' + xrfkey,
    method: 'DELETE',
    headers: {
      'X-qlik-xrfkey': xrfkey,
      'Content-Type': 'application/json'
    },
    pfx: https_options.pfx,
    passphrase: https_options.passphrase,
    rejectUnauthorized: false,
    agent: false
  };

  return makeHttpsRequest(options);
};

exports.repositoryGetApps = function repositoryGetApps(){
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/app/full?xrfkey=' + xrfkey,
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
};

exports.repositoryFilterUserByName = function repositoryFilterUserByName(user, directory){
  var xrfkey = generateXrfkey();
  var filter = encodeURIComponent("Name eq '"+ user + "'");
  if(directory)
    filter = filter + encodeURIComponent(" and userDirectory eq '"+ directory + "'");

  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: "/qrs/user/full?xrfkey=" + xrfkey +"&filter=" + filter,
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

  return makeHttpsRequest(options);
};


exports.repositoryFilterSystemRuleByName = function repositoryFilterSystemRuleByName(rule){
  var xrfkey = generateXrfkey();
  var filter = encodeURIComponent("Name eq '"+ rule + "'");

  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: "/qrs/systemrule/full?xrfkey=" + xrfkey +"&filter=" + filter,
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

  return makeHttpsRequest(options);
};


exports.repositoryDeleteUser = function repositoryDeleteUser(id) {
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/user/' + id + '?xrfkey=' + xrfkey,
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

exports.repositoryCreateRule = function repositoryCreateRule(user, appid) {
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/systemrule?xrfkey=' + xrfkey,
    method: 'POST',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User'],
      'Content-Type': 'application/json'
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };

  // {"name":"TestRuleAppsRead",
  // "category":"Security",
  // "rule":"
  //   (resource.resourcetype = "App" and resource.stream.HasPrivilege("read")) or ((resource.resourcetype = "App.Object" and resource.published ="true") and resource.app.stream.HasPrivilege("read")) and (user.name="demo1")",
  //
  // "type":"Custom",
  // "privileges":["create","read","update"],
  // "resourceFilter":"app_dd586e6e-c8e8-40d0-9a2b-724b8c3ff147, App.Object_*",
  // "actions":2,
  // "ruleContext":"BothQlikSenseAndQMC",
  // "disabled":false,"comment":""}

  var data = {
    name: user,
    category: 'Security',
    rule: '(resource.resourcetype = "App" and resource.stream.HasPrivilege("read")) ' +
      ' or ((resource.resourcetype = "App.Object" and resource.published ="true") ' +
      ' and resource.app.stream.HasPrivilege("read")) and (user.name="' + user + '")',
    type: 'Custom',
    privileges: ['create','read','update'],
    resourceFilter:'app_' + appid + ', App.Object_*',
    ruleContext: 'BothQlikSenseAndQMC',
    actions: 2, // BITS 0 - Create, 1 - Read, 2 - Update ... see qmc, SystemRule props
    disabled: false,
    comment: 'DEMO APPS RULE'
  };

  return makeHttpsRequest(options, JSON.stringify(data));
}

exports.repositoryDeleteSystemRule = function repositoryDeleteSystemRule(id) {
  var xrfkey = generateXrfkey();
  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: '/qrs/systemrule/' + id + '?xrfkey=' + xrfkey,
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


exports.repositoryLicenses = function repositoryLicenses(rule){
  var xrfkey = generateXrfkey();
  var filter = encodeURIComponent("name so '"+ rule + "'");

  var options = {
    host: config.repository.host,
    port: config.repository.port,
    path: "/qrs/License/LoginAccessType/table?filter=(" + filter + ")&orderAscending=true&skip=0&sortColumn=name&take=200&xrfkey=" + xrfkey,
    method: 'POST',
    headers: {
      'X-Qlik-Xrfkey': xrfkey,
      'X-Qlik-User': config.repository['X-Qlik-User'],
      'Content-Type': 'application/json'
    },
    key: https_options.pem.key,
    cert: https_options.pem.cert,
    ca: https_options.pem.ca
  };

  var data = {
    entity: "License.LoginAccessType",
    columns:[
        {name: "id", columnType:"Property", definition:"id"},
        {name: "privileges", columnType:"Privileges", definition:"privileges"},
        {name: "name", columnType: "Property", definition: "name"},
        {name: "assignedTokens", columnType: "Property", definition: "assignedTokens"},
        {name: "usedAccessTypes", columnType: "Property", definition: "usedAccessTypes"},
        {name: "remainingAccessTypes", columnType: "Property", definition: "remainingAccessTypes"}
    ]
  };

  return makeHttpsRequest(options, JSON.stringify(data));
};


// Additional utils functions
exports.utils = {
  getColumnValue: function getColumnValue(data, columnName, rowIndex) {
      // data should have columnNames array
      var columnIndex = -1;
      var rowIndex = rowIndex || 0;

      if(!data.columnNames
      || (columnIndex = data.columnNames.indexOf(columnName)) === -1)
        return null;

      var rowdata = data.rows[rowIndex];
      if(rowdata && rowdata.length > 0)
        return data.rows[rowIndex][columnIndex];
      else
        return null;
  }
};
