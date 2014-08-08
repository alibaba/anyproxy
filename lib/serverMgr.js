//manage https servers
var getPort   = require('./getPort'),
    async     = require("async"),
    http      = require('http'),
    https     = require('https'),
    fs        = require('fs'),
    net       = require('net'),
    url       = require('url'),
    exec      = require('child_process').exec;

module.exports =function(){
    var self = this;
    self.serverList = {
        /* schema sample 
        "www.alipay.com":{
            port:123,
            server : serverInstance
        }
        */
    };

    //fetch a port for https server with hostname
    this.fetchPort = function(hostname,userCB){
        var serverInfo = self.serverList[hostname],
            port;

        //server exists
        if(serverInfo){
            port = serverInfo.port;
            userCB && userCB(null,port);

        //create server with corresponding CA
        }else{
            var keyFile = "./cert/tmpCert/__hostname.key".replace(/__hostname/,hostname),
                crtFile = "./cert/tmpCert/__hostname.crt".replace(/__hostname/,hostname);

            async.series([
                //find a clean port
                function(callback){
                    getPort(function(cleanPort){
                        port = cleanPort;
                        callback(null,port);
                    });
                },

                //create a cert for this hostname if not exists
                function(callback){
                    if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
                        console.log("creating cert for :" + hostname);

                        var cmd = "./gen-cer "+hostname;
                        exec(cmd,{cwd:"./cert/"},function(err,stdout,stderr){
                            if(err){
                                callback && callback(new Error("error when generating certificate"),null);
                            }else{
                                console.log("certificate created for __HOST".replace(/__HOST/,hostname));
                                callback(null);
                            }
                        });
                    }else{
                        callback(null);
                    }    

                //create server  
                },function(callback){
                    var server = createHttpsServer(port,keyFile,crtFile);
                    self.serverList[hostname] = {
                        port   : port,
                        server : server
                    };
                    console.log("https server @port __portNum for __HOST established".replace(/__portNum/,port).replace(/__HOST/,hostname));
                    callback && callback(null,port);
                }
            ],function(err,result){
                userCB && userCB(err,result[result.length - 1]);
            });
        }
    };
}

function createHttpsServer(port,keyFile,crtFile){
    return https.createServer({
        key : fs.readFileSync(keyFile),
        cert: fs.readFileSync(crtFile)
    },function(req,userRes){
        var options = {
            hostname: req.headers.host,
            port: req.port || 443,
            path: req.url,
            method: req.method,
            headers:req.headers
        };

        var proxyReq = https.request(options, function(res) {
            userRes.writeHead(res.statusCode,res.headers);
            res.pipe(userRes);
        });

        proxyReq.on("error",function(e){
            console.log("err with request :" + req.url);
            userRes.end();
        });
        proxyReq.end();

    }).listen(port);
}