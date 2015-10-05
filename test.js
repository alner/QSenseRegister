var https = require('https');
var fs = require('fs');
var options = {
   hostname: 'qsdemo.rbcgrp.com',
   port: 4242,
   path: '/qrs/app?xrfkey=abcdefghijklmnop',
   method: 'GET',
   headers: {
      'x-qlik-xrfkey' : 'abcdefghijklmnop',
      'X-Qlik-User' : 'UserDirectory= Internal; UserId= sa_repository '
   },
   key: fs.readFileSync("certificates/client_key.pem"),
   cert: fs.readFileSync("certificates/client.pem"),
   ca: fs.readFileSync("certificates/root.pem")
};

https.get(options, function(res) {
   console.log("Got response: " + res.statusCode);
   res.on("data", function(chunk) {
      console.log("BODY: " + chunk);
   });
   }).on('error', function(e) {
      console.log("Got error: " + e.message);
});
