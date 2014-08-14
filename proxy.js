//TODO : get free port

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

function proxyServer(type, port, hostname,ruleFile){
    var self      = this,
        proxyType = /https/i.test(type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP ,
        proxyPort = port     || DEFAULT_PORT,
        proxyHost = hostname || DEFAULT_HOST;

    self.httpProxyServer = null;

    if(ruleFile){ //TODO : fs.join
        if(fs.existsSync(ruleFile)){
            requestHandler.setRules(require(ruleFile));
            console.log(color.green("rule file loaded"));
        }else{
            console.log(color.red("can not find rule file"));
        }
    }

    async.series(
        [
            //creat proxy server
            function(callback){
                if(proxyType == T_TYPE_HTTPS){
                    certMgr.getCertificate(proxyHost,function(err,keyContent,crtContent){
                        if(err){
                            callback(err);
                        }else{
                            self.httpProxyServer = https.createServer({
                                key : keyContent,
                                cert: crtContent
                            },requestHandler.userRequestHandler);
                            callback(null);
                        }
                    });

                }else{
                    self.httpProxyServer = http.createServer(requestHandler.userRequestHandler);
                    callback(null);
                }        
            },

            //listen CONNECT method for https over http
            function(callback){
                self.httpProxyServer.on('connect',requestHandler.connectReqHandler);
                self.httpProxyServer.listen(proxyPort);
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

    return self.httpProxyServer;
}

module.exports.proxyServer        = proxyServer;
module.exports.generateRootCA     = certMgr.generateRootCA;
module.exports.isRootCAFileExists = certMgr.isRootCAFileExists;