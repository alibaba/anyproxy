var proxy       = require("../proxy.js"),
	proxyTester = require("proxy-eval"),
	WebSocket   = require("ws"),
    Buffer      = require("buffer").Buffer,
    express     = require("express");

var app = express()
 
app.post('/', function (req, res) {
    var bigBody = new Buffer(1024 * 1024 * 10);
    res.send( bigBody ); //10 mb
});
app.listen(3000);

function test(){
    //test the basic availibility of proxy server
    setTimeout(function(){
        var testParam = {
            proxy         : 'http://127.0.0.1:8001/',
            reqTimeout    : 4500,
            httpGetUrl    : "",
            httpPostUrl   : "http://127.0.0.1:3000/",
            httpPostBody  : "123",
            httpsGetUrl   : "",
            httpsPostUrl  : "",
            httpsPostBody : ""
        };
    	proxyTester.test(testParam ,function(results){
            process.exit();
        });
    },1000);
};

setTimeout(function(){
    test();
},3000);

