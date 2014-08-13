var https = require("https");

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

var options = {
  host: "localhost",
  port: 8001,
  path: "/",
  headers: {
    Host: "www.alipay.com"
  }
};
https.get(options, function(res) {
  console.log(res);
  res.pipe(process.stdout);
});