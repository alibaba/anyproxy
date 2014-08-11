//manage https servers
var getPort    = require('./getPort'),
    async          = require("async"),
    http           = require('http'),
    https          = require('https'),
    fs             = require('fs'),
    net            = require('net'),
    url            = require('url'),
    certMgr        = require("./certMgr"),
    requestHandler = require("./requestHandler");

if(!fs.existsSync("cert/tmpCert")){
    fs.mkdirSync("cert/tmpCert");
}

var DEFAULT_RELEASE_TIME = 120*1000;

module.exports =function(){
    var self = this;
    self.serverList = {
        /* schema sample 
        "www.alipay.com":{
            port:123,
            server : serverInstance,
            lastestUse: 99999 //unix time stamp
        }
        */
    };

    //fetch a port for https server with hostname
    this.fetchPort = function(hostname,userCB){
        var serverInfo = self.serverList[hostname],
            port;

        //server exists
        if(serverInfo){
            console.log("exists :" + hostname );
            serverInfo.lastestUse = new Date().getTime();
            port = serverInfo.port;
            userCB && userCB(null,port);

        //create server with corresponding CA
        }else{
            console.log("creating :" + hostname );
            async.series([
                //find a clean port
                function(callback){
                    getPort(function(cleanPort){
                        port = cleanPort;
                        callback(null,port);
                    });
                }

                //create server  
                ,function(callback){
                    certMgr.getCertificate(hostname,function(err,keyContent,crtContent){
                        var server = createHttpsServer(port,keyContent,crtContent);
                        self.serverList[hostname] = {
                            port   : port,
                            server : server,
                            lastestUse : new Date().getTime()
                        };
                        console.log("https server @port __portNum for __HOST established".replace(/__portNum/,port).replace(/__HOST/,hostname));
                        callback && callback(null,port);
                        
                    });
                }
            ],function(err,result){
                userCB && userCB(err,result[result.length - 1]);
            });
        }
    };

    //clear servers which have been idle for some time
    setInterval(function(){
        var timeNow = new Date().getTime();
        for(var serverName in self.serverList){
            var item = self.serverList[serverName];
            if( (timeNow - item.lastestUse) > DEFAULT_RELEASE_TIME){
                item.server.close();
                delete self.serverList[serverName];
                console.log("https server released : " + serverName);
            }
        }

    },DEFAULT_RELEASE_TIME);
}

function createHttpsServer(port,keyContent,crtContent){
    return https.createServer({
        key : keyContent,
        cert: crtContent
    },requestHandler).listen(port);
}

