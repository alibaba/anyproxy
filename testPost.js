// We need this to build our post string
var http = require('http');
var fs = require('fs');



  // An object of options to indicate where to post to
  var post_options = {
      host: 'localhost',
      port: '8004',
      path: '/',
      method: 'POST',
      headers: {
         Host: "127.0.0.1"
      }
  };

  // Set up the request
  var post_req = http.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
          console.log('Response: ' + chunk);
      });
  });

  // post the data
  post_req.write("hello world hello world hello world hello world hello world ");
  post_req.end();
