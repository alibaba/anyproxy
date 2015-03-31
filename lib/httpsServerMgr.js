//manage https servers
var getPort        = require('./getPort'),
    async          = require("async"),
    http           = require('http'),
    https          = require('https'),
    fs             = require('fs'),
    net            = require('net'),
    tls            = require('tls'),
    crypto         = require('crypto'),
    color          = require('colorful'),
    certMgr        = require("./certMgr"),
    logUtil        = require("./log"),
    asyncTask      = require("async-task-mgr");

var createSecureContext = tls.createSecureContext || crypto.createSecureContext;

//using sni to avoid multiple ports
function SNIPrepareCert(serverName,SNICallback){
    var keyContent, crtContent,ctx;

    async.series([
        function(callback){
            certMgr.getCertificate(serverName,function(err,key,crt){
                if(err){
                    callback(err);
                }else{
                    keyContent = key;
                    crtContent = crt;
                    callback();
                }
            });
        },
        function(callback){
            try{
                ctx = createSecureContext({
                    key  :keyContent,
                    cert :crtContent
                });
                callback();
            }catch(e){
                callback(e);
            }
        }
    ],function(err,result){
        if(!err){
            var tipText = "proxy server for __NAME established".replace("__NAME",serverName);
            logUtil.printLog(color.yellow(color.bold("[internal https]")) + color.yellow(tipText));
            SNICallback(null,ctx);
        }else{
            logUtil.printLog("err occurred when prepare certs for SNI - " + err, logUtil.T_ERR);
            logUtil.printLog("you may upgrade your Node.js to the lastest version", logUtil.T_ERR);
        }
    });
}

//config.port - port to start https server
//config.handler - request handler
module.exports =function(config){
    var self = this;

    if(!config || !config.port ){
        throw(new Error("please assign a port"));
    }

    certMgr.getCertificate("anyproxy_internal_https_server",function(err,keyContent,crtContent){
        https.createServer({
            SNICallback : SNIPrepareCert ,
            key         : keyContent,
            cert        : crtContent
        },config.handler).listen(config.port);
    });

}


