var fs = require('fs');
var path = require('path');
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

exports.config = config;
exports.https_options = https_options;
exports.getProxyUrl = function(){
  return 'https://' + config.proxy.host + ':' + config.proxy.port + config.proxy.url;
};
