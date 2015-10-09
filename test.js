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


var config = require('./config');
var api = require('./api');

var record = {
  Login: 'ad9bbf0f-497b-411d-82f8-95471d6dc57a'
}
var proxy = config.getProxyUrl();
console.log(proxy);
api.deleteUser(
  config.https_options.pfx,
  config.https_options.passphrase,
  record.Login,
  config.config.authmodule.UserDirectory,
  proxy
)
.then(function(info){
  console.log(info);
})
.catch(function(err){
  console.error(err);
});
