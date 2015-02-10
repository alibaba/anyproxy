//manage https servers
var getPort        = require('./getPort'),
    async          = require("async"),
    http           = require('http'),
    https          = require('https'),
    fs             = require('fs'),
    net            = require('net'),
    tls            = require('tls'),
    color          = require('colorful'),
    certMgr        = require("./certMgr"),
    asyncTask      = require("async-task-mgr");

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
                ctx = tls.createSecureContext({
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
            console.log(color.yellow(color.bold("[internal https]")) + color.yellow(tipText));
            SNICallback(null,ctx);
        }else{
            console.log("err occurred when prepare certs for SNI - " + e);
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

    https.createServer({
        SNICallback : SNIPrepareCert
    },config.handler).listen(config.port);
}


