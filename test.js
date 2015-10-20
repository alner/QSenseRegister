// var options = {
//    hostname: 'qsdemo.rbcgrp.com',
//    port: 4242,
//    path: '/qrs/app?xrfkey=abcdefghijklmnop',
//    method: 'GET',
//    headers: {
//       'x-qlik-xrfkey' : 'abcdefghijklmnop',
//       'X-Qlik-User' : 'UserDirectory= Internal; UserId= sa_repository '
//    },
//    key: fs.readFileSync("certificates/client_key.pem"),
//    cert: fs.readFileSync("certificates/client.pem"),
//    ca: fs.readFileSync("certificates/root.pem")
// };
//
// https.get(options, function(res) {
//    console.log("Got response: " + res.statusCode);
//    res.on("data", function(chunk) {
//       console.log("BODY: " + chunk);
//    });
//    }).on('error', function(e) {
//       console.log("Got error: " + e.message);
// });


var config = require('./config').config;
var api = require('./api');
var apiUtils = api.utils;
var db = require('./db');
var mailer = require('./mailer');
var async = require('async');

// var record = {
//   Login: 'ad9bbf0f-497b-411d-82f8-95471d6dc57a'
// }
// var proxy = config.getProxyUrl();
// console.log(proxy);
// api.deleteUser(
//   config.https_options.pfx,
//   config.https_options.passphrase,
//   record.Login,
//   config.config.authmodule.UserDirectory,
//   proxy
// )
// .then(function(info){
//   console.log(info);
// })
// .catch(function(err){
//   console.error(err);
// });
//var name = 'Demo';

// api.repositoryLicenses(config.authmodule.LoginAccessRule)
// .then(function(response){
//   var data = JSON.parse(response.data);
//   var remainingAccessTypes = apiUtils.getColumnValue(data, 'remainingAccessTypes');
//   console.log(remainingAccessTypes);
//   //callback(null, remainingAccessTypes);
// })
// .catch(function(err){
//   console.log(err);
//   //callback(err);
// });


// db.connect()
// .then(function(){
//   return db.setGrantedStateFor(1088)
//   //return db.queryRecordsByStates([db.RegistrationState.NoLicense].toString());
//   //return db.queryOverdueRecords();
// })
// .then(function(recordSet){
//   console.log(recordSet);
// })
// .then(function(){
//   return db.close();
// })
// .catch(function(err){
//   console.error(err);
// });

mailer.sendMail('nerush@rbcgrp.com', // email
  config.mail.LicenseAvailabilitySubject['ru'], // email subject
  {
    Name: 'Alex',
    Surname: 'Nerush',
    applicationTitle: 'Google Search',
    access_url: 'http://www.google.com'
  },
  "availableLicenseMessage." + "ru" // email template
).then(function(info){
  logger.info('Access granted email sent');
  logger.info(info);
}).catch(function(err){
  logger.error('Mailer: ', err);
});


// async.waterfall([
//
//   function(callback) {
//     api.repositoryFilterUserByName(name)
//     .then(function(response){
//       if(response && response.data) {
//         callback(null, response);
//       } else
//         callback(response);
//     })
//     .catch(function(err){
//       callback(err);
//     });
//   },
//
//   function(response, callback) {
//     var data = JSON.parse(response.data);
//     if(data && data.length > 0) {
//       api.repositoryDeleteUser(data[0].id)
//       .then(function(response){
//         callback(null, response);
//       }).catch(function(err){
//         callback(err);
//       });
//     } else {
//       callback(data);
//     }
//   },
//
//   function(response, callback) {
//     api.proxyDeleteUser(name)
//     .then(function(response){
//       callback(null, response);
//     })
//     .catch(function(err){
//       callback(err);
//     });
//   }
//
// ],
//
// function(err, result){
//   if(err) console.error(err);
//   console.log(result);
// });


// api.repositorySelectUser(
//   config.config,
//   config.https_options,
//   "0f1f61f0-5c86-4023-81ed-d684732b12b9"
// )
// .then(function(response){
//   if(response && response.data) {
//     console.log(response.data);
//     var data = JSON.parse(response.data);
//     if(data.id)
//     api.repositoryDeleteUser(
//       config.config,
//       config.https_options,
//       data.id
//     ).then(function(response){
//       console.log(response)
//     }).catch(function(err){
//       console.error(err);
//     });
//   }
// })
// .catch(function(err){
//   console.error(err);
// });
