var sql = require('mssql');
var moment = require('moment');
var config = require('./config.json').db;
var db = require('./db');

moment().local();

// var SQL = " set dateformat dmy " +
// "insert into [dbo].[RegistrationInfoes] " +
// "([Surname], [Name], [Email], [Phone], [Position], [Company], [IndustryID], [SelectedApplication], [Login], [Lang], Registered, Granted, State) " +
// " values(@surname, @name, @email, @phone, @position, @company, @industry, @application, @login, @lang, @registeredDate, @grantedDate, @state)";
//
// var test = {};
// test['industry'] = 'Sales Analysis';
// test['application'] = 'Sales Analysis (Distribution)';
// test['name'] = 'John';
// test['surname'] = 'Doe';
// test['email'] = 'john.doe@corporation.com';
// test['phone'] = '1234567890';
// test['company'] = 'Corporation';
// test['position'] = 'Test Lead';
//
// test.login = 'john.doe';
// test.lang = 'ru';
var test = {};
var now = moment();
var login = 'f2c9b1f1-9780-45d9-9a1f-88b9f4f81c41';
var application = 'c0178a21-14ed-401c-8fe3-7252f017299d%';
var nowDate = now.add({days: 1}).format('DD-MM-YYYY HH:mm:ss');

db.connect().then(function(){
  return db.query(login, application, nowDate);
}).then(function(data) {
  console.log(data);
  db.close();
}).catch(function (err) {
  console.error(err);
  db.close();
});

// var connection = new sql.Connection(config);
// connection.connect(function(err){
//
//   if(err) return console.log(err);
//
//   var ps = new sql.PreparedStatement(connection);
//   ps.verbose = true;
//   ps.input('surname', sql.NVarChar);
//   ps.input('name', sql.NVarChar);
//   ps.input('email', sql.NVarChar);
//   ps.input('phone', sql.NVarChar);
//   ps.input('position', sql.NVarChar);
//   ps.input('company', sql.NVarChar);
//   ps.input('industry', sql.NVarChar);
//   ps.input('application', sql.NVarChar);
//   ps.input('login', sql.NVarChar);
//   ps.input('lang', sql.NVarChar);
//   ps.input('registeredDate', sql.NVarChar);
//   ps.input('grantedDate', sql.NVarChar);
//   ps.input('state', sql.TinyInt);
//
//   ps.prepare(SQL, function(err) {
//         // ... error checks
//         if(err) return console.error(err);
//         console.log(test);
//         request = ps.execute(test, function(err){
//           if(err) console.error(err);
//         });
//
//         ps.unprepare(function(err){
//           if(err) console.error(err);
//           connection.close();
//         });
//   });
// });
