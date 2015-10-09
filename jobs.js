var CronJob = require('cron').CronJob;
var moment = require('moment');
//var async = require('async');
var logger = require('./logger')(module);
var db = require('./db');
var mailer = require('./mailer');
var config = require('./config.json');

moment().local();

// Seconds: 0-59
// Minutes: 0-59
// Hours: 0-23
// Day of Month: 1-31
// Months: 0-11
// Day of Week: 0-6
var job = new CronJob('* */1 * * * *', // run every 1 minutes
  function onJob(){
    var now = moment();
    var formatedDate = now.format(db.DateTimeFormat);
    // Update DB, send notify email
    db.queryOverdueNotDeletedRecords(formatedDate)
    .then(function(recordSet){
      recordSet.forEach(function(record){
        db.setDeletedStateFor(record.RegistrationInfoID, formatedDate)
        .then(function(){
            logger.info('Access closed for ' + record.RegistrationInfoID);
            // Send Email notification
            mailer.sendMail(record.Email, // email
              config.mail.AccessClosedSubject[record.Lang], // email subject
              record, // context/data
              "accessClosed." + record.Lang // email template
            ).then(function(info){
              logger.info('Access closed email sent');
              logger.info(info);
            }).catch(function(err){
              logger.error(err);
            });
        })
        .catch(function(err){
          logger.error(err);
        });
      });
    });
  },
  function onJobComplete(){
    //logger.info('Job completed!');
  },
  false // start the job right now
);


db.connect().then(function(){
  job.start();
  logger.info('CronJob started');
});
