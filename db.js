var sql = require('mssql');
var config = require('./config.json').db;

var SQL = " set dateformat dmy " +
"insert into [dbo].[RegistrationInfoes] " +
"([Surname], [Name], [Email], [Phone], [Position], [Company], [IndustryID], [SelectedApplication], [Login], [Lang], Registered, Granted, State) " +
" values(@surname, @name, @email, @phone, @position, @company, @industry, @application, @login, @lang, @registeredDate, @grantedDate, @state)";

var connection = new sql.Connection(config);
var ps;

exports.connect = function connect(cb) {
  return connection.connect(cb);
};

exports.close = function close() {
  if(ps) {
    ps.unprepare(function(err){
      if(err) console.error(err);
    });
  }
  connection.close();
}

exports.prepare = function prepare(cb){
  ps = new sql.PreparedStatement(connection);
  ps.input('surname', sql.NVarChar);
  ps.input('name', sql.NVarChar);
  ps.input('email', sql.NVarChar);
  ps.input('phone', sql.NVarChar);
  ps.input('position', sql.NVarChar);
  ps.input('company', sql.NVarChar);
  ps.input('industry', sql.NVarChar);
  ps.input('application', sql.NVarChar);
  ps.input('login', sql.NVarChar);
  ps.input('lang', sql.NVarChar);
  ps.input('registeredDate', sql.NVarChar);
  ps.input('grantedDate', sql.NVarChar);
  ps.input('state', sql.TinyInt);

  return ps.prepare(SQL, cb);
};

exports.insert = function insert(data, cb) {
  if(!ps) return null;

  return ps.execute(data, cb);
};
