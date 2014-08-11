var http = require('http'),
    https          = require('https'),
    fs             = require('fs'),
    net            = require('net'),
    async          = require("async"),
    url            = require('url'),
    exec           = require('child_process').exec,
    httpsServerMgr = require("./lib/httpsServerMgr"),
    certMgr        = require("./lib/certMgr"),
    program        = require('commander'),
    requestHandler = require("./lib/requestHandler");

var T_TYPE_HTTP  = 0,
    T_TYPE_HTTPS = 1,
    DEFAULT_PORT = 8001,
    DEFAULT_HOST = "localhost",
    DEFAULT_TYPE = T_TYPE_HTTP;

var httpsServerMgrInstance = new httpsServerMgr(),
    httpProxyServer;

function startServer(type, port, hostname){
    var proxyType = /https/i.test(type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP ,
        proxyPort = port     || DEFAULT_PORT,
        proxyHost = hostname || DEFAULT_HOST;

    async.series([

            //creat server
            function(callback){
                if(proxyType == T_TYPE_HTTPS){
                    certMgr.getCertificate(proxyHost,function(err,keyContent,crtContent){
                        if(err){
                            callback(err);
                        }else{
                            httpProxyServer = https.createServer({
                                key : keyContent,
                                cert: crtContent
                            },requestHandler);
                            callback(null);
                        }
                    });

                }else{
                    httpProxyServer = http.createServer(requestHandler);
                    callback(null);
                    
                }        
            },

            //listen CONNECT method for https over http
            function(callback){
                httpProxyServer.on('connect',dealProxyConnectReq);
                httpProxyServer.listen(proxyPort);
                callback(null);
            }
            
        ],

        //final callback
        function(err,result){
            if(!err){
                console.log( (proxyType == T_TYPE_HTTP ? "Http" : "Https") + " proxy started at port " + proxyPort);
            }else{
                console.log("err when start proxy server :(");
                console.log(err);
            }
        }
    );
}

function dealProxyConnectReq(req, socket, head){
    var hostname = req.url.split(":")[0];

    //forward the https-request to local https server
    httpsServerMgrInstance.fetchPort(hostname,function(err,port){
        if(!err && port){
            try{
                var conn = net.connect(port, 'localhost', function(){
                    socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
                        conn.pipe(socket);
                        socket.pipe(conn);
                    });
                });     
            }catch(e){
                console.log("err when connect to local https server (__hostname)".replace(/__hostname/,hostname));//TODO 
            }
            
        }else{
            console.log("err fetch HTTPS server for host:" + hostname);
        }
    });
}

module.exports.startServer = startServer;
