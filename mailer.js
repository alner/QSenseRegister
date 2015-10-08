var nodemailer = require('nodemailer');
var Promise = require('promise');
var hbs = require('nodemailer-express-handlebars');
var config = require('./config.json');

var hbsOptions = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: 'views/email/',
    defaultLayout: 'main'
  },
  viewPath: 'views/email/',
  extName: '.hbs'
};

// create reusable transporter object using SMTP transport
var transporter = nodemailer.createTransport({
    service: config.mail.service,
    auth: {
      user: config.mail.user,
      pass: config.mail.pass
    }
});

transporter.use('compile', hbs(hbsOptions));

exports.sendMail = function(to, subject, context) {
  return new Promise(function(resolve, reject) {
      transporter.sendMail({
        from: config.mail.user, // sender address
        to: to, // list of receivers
        subject: subject || 'Qlik Sense registration ✔', // Subject line
        template: "mail.ru",
        context: context
        //text: 'Hello world ✔', // plaintext body
        //html: '<b>Hello world ✔</b>' // html body
      },
      function(error, info){
        if(error) return reject(error);
        resolve(info);
      });
  });
}
