var async = require('async');
var api = require('./api');
var apiUtils = api.utils;
var config = require('./config').config;
var logger = require('./logger')(module);
var db = require('./db');
var mailer = require('./mailer');
var makeAuthAppUrl = require('./utils').makeAuthAppUrl;

function checkLicensesAvailability(callback) {
  api.repositoryLicenses(config.authmodule.LoginAccessRule)
  .then(function(response){
    var data = JSON.parse(response.data);
    var remainingAccessTypes = apiUtils.getColumnValue(data, 'remainingAccessTypes');
    callback(null, remainingAccessTypes);
  })
  .catch(function(err){
    callback(err);
  });
}

function checkNoLicenseRecords(remainingAccessTypes, callback) {
  if(!remainingAccessTypes) {
    logger.error('remainingAccessTypes is ' + remainingAccessTypes);
    return callback(null, remainingAccessTypes);
  }

  db.queryRecordsByStates([db.RegistrationState.NoLicense])
  .then(function(recordSet){
    if(recordSet.length > 0)
    recordSet.forEach(function(record){
        if(remainingAccessTypes > 0) {
          record = db.addRegistrationMethods(record);
          record.access_url = makeAuthAppUrl(record.Login, record.getAppId());
          record.applicationTitle = record.getAppTitle();

          mailer.sendMail(record.Email, // email
            config.mail.LicenseAvailabilitySubject[record.Lang], // email subject
            record, // context/data
            "availableLicenseMessage." + record.Lang // email template
          ).then(function(info){
              logger.info('availableLicenseMessage email sent');
              logger.info(info);
              // Save to db
              db.setGrantedStateFor(record.RegistrationInfoID)
              .then(function(){
                  // Send Email notification
                  logger.info('Access has been granted for ' + record.RegistrationInfoID);
              })
              .catch(function(err){
                logger.error(err);
              });
          }).catch(function(err){
            logger.error('Mailer: ', err);
          });

          remainingAccessTypes -= 1;
        }
    });
    callback(null);
  })
  .catch(function(err){
    callback(err);
  });
}

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

function closeAccessAsOf(formatedDate) {
  db.queryOverdueRecords(formatedDate)
  .then(function(recordSet){
    recordSet.forEach(function(record){
      // Delete Qlik Sense user
      DeleteSenseUser(
        record.Login,
        config.authmodule.UserDirectory
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
            config.mail.AccessClosedSubject[record.Lang], // email subject
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
}


exports.checkLicensesAvailability = checkLicensesAvailability;
exports.checkNoLicenseRecords = checkNoLicenseRecords;
exports.DeleteSenseUser = DeleteSenseUser;
exports.closeAccessAsOf = closeAccessAsOf;
