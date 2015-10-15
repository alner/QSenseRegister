var CronJob = require('cron').CronJob;
var moment = require('moment');
var async = require('async');
//var async = require('async');
var logger = require('./logger')(module);
var db = require('./db');
var mailer = require('./mailer');
var config = require('./config');
var api = require('./api');

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
        // Delete Qlik Sense user
        DeleteSenseUser(
          record.Login,
          config.config.authmodule.UserDirectory
        )
        .then(function(){
          //logger.info(info);
          // Save to db
          return db.setDeletedStateFor(record.RegistrationInfoID, formatedDate);
        })
        .then(function(){
            // Send Email notification
            logger.info('Access closed for ' + record.RegistrationInfoID);
            mailer.sendMail(record.Email, // email
              config.config.mail.AccessClosedSubject[record.Lang], // email subject
              record, // context/data
              "accessClosed." + record.Lang // email template
            ).then(function(info){
              logger.info('Access closed email sent');
              logger.info(info);
            }).catch(function(err){
              logger.error('Mailer: ', err);
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


function DeleteSenseUser(name, directory){
  return new Promise(function(resolve, reject) {
    async.waterfall([
      // Repository: Step 1. get user id by name
      function(callback) {
        api.repositoryFilterUserByName(name, directory)
        .then(function(response){
          if(response && response.data) {
            logger.info('repositoryFilterUserByName');
            callback(null, response);
          } else {
            logger.error(response);
            callback(response);
          }
        })
        .catch(function(err){
          callback(err);
        });
      },

      // Repository: Step 2. delete user using id
      function(response, callback) {
        var data = JSON.parse(response.data);
        if(data && data.length > 0) {
          logger.info('repositoryDeleteUser');
          api.repositoryDeleteUser(data[0].id)
          .then(function(response){
            callback(null, response);
          })
          .catch(function(err){
            callback(err);
          });
        } else {
          logger.info('repositoryDeleteUser else');
          if(Array.isArray(data) && data.length === 0)
            callback(null, data);
          else
            callback(data);
        }
      },

      // Repository: Step 1. filter system rule by name (user name equal to system rule name)
      function(response, callback) {
        api.repositoryFilterSystemRuleByName(name)
        .then(function(response){
          if(response && response.data) {
            logger.info('repositoryFilterSystemRuleByName');
            callback(null, response);
          } else {
            logger.error(response);
            callback(response);
          }
        })
        .catch(function(err){
          callback(err);
        });
      },

      // Repository: Step 2. delete system rule by id
      function(response, callback) {
        var data = JSON.parse(response.data);
        if(data && data.length > 0) {
          logger.info('repositoryDeleteSystemRule');
          api.repositoryDeleteSystemRule(data[0].id)
          .then(function(response){
            callback(null, response);
          })
          .catch(function(err){
            callback(err);
          });
        } else {
          logger.info('repositoryDeleteSystemRule else');
          if(Array.isArray(data) && data.length === 0)
            callback(null, data);
          else
            callback(data);
        }
      },

      // TODO: Proxy: delete user sessions (if any)
      /*
      function(response, callback) {
        logger.info('proxyDeleteUser');
        api.proxyDeleteUser(name, directory)
        .then(function(response){
          logger.info('proxyDeleteUser completed');
          callback(null, response);
        })
        .catch(function(err){
          logger.error('proxyDeleteUser error');
          callback(err);
        });
      }
      */

    ],

    function(err, result){
      if(err) reject(err);
      else resolve(result);
    });
  });
}
