var http = require('http'),
    https          = require('https'),
    fs             = require('fs'),
    net            = require('net'),
    async          = require("async"),
    url            = require('url'),
    exec           = require('child_process').exec,
    program        = require('commander'),
    color          = require('colorful'),
    certMgr        = require("./lib/certMgr"),
    requestHandler = require("./lib/requestHandler");

var T_TYPE_HTTP  = 0,
    T_TYPE_HTTPS = 1,
    DEFAULT_PORT = 8001,
    DEFAULT_HOST = "localhost",
    DEFAULT_TYPE = T_TYPE_HTTP;

var httpProxyServer;

function startServer(type, port, hostname,rule){
    var proxyType = /https/i.test(type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP ,
        proxyPort = port     || DEFAULT_PORT,
        proxyHost = hostname || DEFAULT_HOST;

    requestHandler.setRules(rule);

    async.series([

            //creat proxy server
            function(callback){
                if(proxyType == T_TYPE_HTTPS){
                    certMgr.getCertificate(proxyHost,function(err,keyContent,crtContent){
                        if(err){
                            callback(err);
                        }else{
                            httpProxyServer = https.createServer({
                                key : keyContent,
                                cert: crtContent
                            },requestHandler.userRequestHandler);
                            callback(null);
                        }
                    });

                }else{
                    httpProxyServer = http.createServer(requestHandler.userRequestHandler);
                    callback(null);
                }        
            },

            //listen CONNECT method for https over http
            function(callback){
                httpProxyServer.on('connect',requestHandler.connectReqHandler);
                httpProxyServer.listen(proxyPort);
                callback(null);
            }
            
        ],

        //final callback
        function(err,result){
            if(!err){
                var tipText = (proxyType == T_TYPE_HTTP ? "Http" : "Https") + " proxy started at port " + proxyPort;
                console.log(color.green(tipText)); 
            }else{
                var tipText = "err when start proxy server :(";
                console.log(color.red(tipText));
                console.log(err);
            }
        }
    );
}

module.exports.startServer = startServer;