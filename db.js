var sql = require('mssql');
var logger = require('./logger')(module);
var config = require('./config.json').db;

var connection = new sql.Connection(config);
var ps;

var RegistrationState = {
  Registered: 0,
  Deleted: 1,
  NoLicense: 2,
  Granted: 3,
  Accessed: 4,
  NotifyRegistration: 5
};

var defaultOverdueStates = [
  RegistrationState.Registered,
  RegistrationState.Granted,
  RegistrationState.Accessed,
  RegistrationState.NotifyRegistration
].toString();

exports.RegistrationState = RegistrationState;

exports.DateTimeFormat = 'DD-MM-YYYY HH:mm:ss';

exports.connect = function connect(cb) {
  return connection.connect(cb);
};

exports.isConnected = function isConnected(){
  return connection.connected;
};

exports.close = function close() {
  if(ps) {
    ps.unprepare(function(err){
      if(err) logger.error(err);
    });
  }

  if(connection.connected)
    connection.close();
};

exports.prepare = function prepare(cb){
  var SQL = " set dateformat dmy " +
  "insert into [dbo].[RegistrationInfoes] " +
  "([Surname], [Name], [Email], [Phone], [Position], [Company], [IndustryID], [SelectedApplication], [Login], [Lang], Registered, Granted, State) " +
  " values(@Surname, @Name, @Email, @Phone, @Position, @Company, @IndustryID, @SelectedApplication, @Login, @Lang, @Registered, @Granted, @State)";

  ps = new sql.PreparedStatement(connection);
  ps.input('Surname', sql.NVarChar);
  ps.input('Name', sql.NVarChar);
  ps.input('Email', sql.NVarChar);
  ps.input('Phone', sql.NVarChar);
  ps.input('Position', sql.NVarChar);
  ps.input('Company', sql.NVarChar);
  ps.input('IndustryID', sql.NVarChar);
  ps.input('SelectedApplication', sql.NVarChar);
  ps.input('Login', sql.NVarChar);
  ps.input('Lang', sql.NVarChar);
  ps.input('Registered', sql.NVarChar);
  ps.input('Granted', sql.NVarChar);
  ps.input('State', sql.TinyInt, RegistrationState.Registered);

  return ps.prepare(SQL, cb);
};

exports.queryByUserAndApp = function(userid, appId, nowDate) {
  var SQL = "set dateformat dmy " +
  "select * from [dbo].[RegistrationInfoes] where Login=@login and SelectedApplication like @application and Granted > @grantedDate";
  var request = new sql.Request(connection);
  request.input('login', sql.NVarChar, userid);
  request.input('application', sql.NVarChar, appId);
  request.input('grantedDate', sql.NVarChar, nowDate);
  return request.query(SQL);
};

exports.queryOverdueRecords = function(nowDate, states){
  var SQL = "set dateformat dmy " +
  "select * from [dbo].[RegistrationInfoes] where State in (@state) and Granted < @now"; // Deleted is null and
  var request = new sql.Request(connection);
  request.input('now', sql.NVarChar, nowDate);
  request.input('state', sql.NVarChar, states || defaultOverdueStates);
  return request.query(SQL);
};

exports.queryRecordsByStates = function(states){
  var SQL = "set dateformat dmy " +
  "select * from [dbo].[RegistrationInfoes] where State in (@state)";
  var request = new sql.Request(connection);
  request.input('state', sql.NVarChar, states || defaultOverdueStates);
  return request.query(SQL);
};

exports.setDeletedStateFor = function(id, deletedDate) {
  var SQL = "set dateformat dmy " +
    " update [dbo].[RegistrationInfoes] set Deleted = @deletedDate, State = @state " +
    " where RegistrationInfoID = @id ";

  var request = new sql.Request(connection);
  request.input('deletedDate', sql.NVarChar, deletedDate);
  request.input('state', sql.TinyInt, RegistrationState.Deleted);
  request.input('id', sql.Int, id);
  return request.query(SQL);
};

exports.insert = function insert(data, cb) {
  if(!ps) return null;

  if(!data.State)
    data.State = RegistrationState.Registered;

  return ps.execute(data, cb);
};
