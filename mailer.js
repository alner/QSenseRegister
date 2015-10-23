var nodemailer = require('nodemailer');
var Promise = require('promise');
var hbs = require('nodemailer-express-handlebars');
var config = require('./config.json');

var hbsOptions = {
  viewEngine: {
    extname: '.hbs',
    layoutsDir: 'views/email/',
    partialsDir: 'views/email/partials/',
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

exports.sendMail = function(to, subject, context, mailTemplate, bcc) {
  return new Promise(function(resolve, reject) {
      var options = {
        from: config.mail.user, // sender address
        to: to || context.email, // list of receivers
        subject: subject || 'Qlik Sense registration ✔', // Subject line
        template: mailTemplate,
        context: context
      };

      if(bcc)
        options.bcc = bcc;

      transporter.sendMail(options,
      function(error, info){
        if(error) return reject(error);
        resolve(info);
      });
  });
}
