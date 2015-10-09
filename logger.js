var winston = require('winston');
var ENV = process.env.NODE_ENV;

function getLogger(module) {
  var path = module.filename.split('/').slice(-2).join('/');

  return new (winston.Logger)({
      exitOnError: false,
      transports: [
        new (winston.transports.Console)({
          timestamp: true,
          colorize: true,
          level: 'debug'//(ENV == 'development') ? 'debug' : 'error'
        }),
        new (winston.transports.File)({
          filename: 'errors.log',
          level: 'error'
        })
      ]
  });
}

module.exports = getLogger;
