var http  = require("http"),
	https = require("https");

function handler(req,userRes){
    console.log(req);

    var ifHttps = !!req.connection.encrypted && !/http:/.test(req.url);

    var options = {
        hostname : req.headers.host,
        port     : req.port || (ifHttps ? 443 : 80),
        path     : req.url,
        method   : req.method,
        headers  : req.headers
    };

    var proxyReq = (ifHttps ? https : http).request(options, function(res) {
        userRes.writeHead(res.statusCode,res.headers);
        res.pipe(userRes);
    });

    proxyReq.on("error",function(e){
        console.log("err with request :" + req.url);
        userRes.end();
    });
    proxyReq.end();
}

module.exports = handler;