var CronJob = require('cron').CronJob;
var moment = require('moment');
var async = require('async');
var logger = require('./logger')(module);
var db = require('./db');
var helpers = require('./helpers');

moment().local();

// Seconds: 0-59
// Minutes: 0-59
// Hours: 0-23
// Day of Month: 1-31
// Months: 0-11
// Day of Week: 0-6
var closeAccessJob = new CronJob('0 */1 * * * *', // run every 1 minutes
  function onJob(){
    var now = moment();
    var formatedDate = now.format(db.DateTimeFormat);
    // Update DB, send notify email
    helpers.closeAccessAsOf(formatedDate);
  },
  function onJobComplete(){
    //logger.info('Job completed!');
  },
  false // start the job right now
);

// Seconds: 0-59
// Minutes: 0-59
// Hours: 0-23
// Day of Month: 1-31
// Months: 0-11
// Day of Week: 0-6
var checkLicensesJob = new CronJob('0 */1 * * * *', // run every 1 minutes
  function onJob(){
    async.waterfall([
      // 1. check licenses availability
      helpers.checkLicensesAvailability,
      // 2. check NoLicense records only
      helpers.checkNoLicenseRecords
    ],

    function(err, result){
      if(err) logger.error(err);
    });
  },
  function onJobComplete(){
    //logger.info('Job completed!');
  },
  false // start the job right now
);

db.connect().then(function(){
  closeAccessJob.start();
  checkLicensesJob.start();
  logger.info('CronJob started');
});
