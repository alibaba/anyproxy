var http           = require("http"),
    https          = require("https"),
    net            = require("net"),
    fs             = require("fs"),
    url            = require("url"),
    pathUtil       = require("path"),
    zlib           = require('zlib'),
    async          = require('async'),
    color          = require("colorful"),
    Buffer         = require('buffer').Buffer,
    iconv          = require('iconv-lite'),
    httpsServerMgr = require("./httpsServerMgr");

var httpsServerMgrInstance = new httpsServerMgr(),
    userRule               = require("./rule_default.js"); //default rule file

function userRequestHandler(req,userRes){
    var host               = req.headers.host,
        urlPattern         = url.parse(req.url),
        path               = urlPattern.path,
        protocol           = (!!req.connection.encrypted && !/http:/.test(req.url)) ? "https" : "http",
        resourceInfo,
        resourceInfoId     = -1;

    //record
    resourceInfo = {
        host      : host,
        method    : req.method,
        path      : path,
        url       : protocol + "://" + host + path,
        req       : req,
        startTime : new Date().getTime()
    };

    try{
        resourceInfoId = GLOBAL.recorder.appendRecord(resourceInfo);
    }catch(e){}

    console.log(color.green("\nreceived request to : " + host + path));
    /*
        req.url is wired
        in http  server : http://www.example.com/a/b/c
        in https server : /work/alibaba
    */

    if(userRule.shouldUseLocalResponse(req)){
        console.log("==>use local rules");
        userRule.dealLocalResponse(req,function(statusCode,resHeader,resBody){

            //update record info
            resourceInfo.endTime = new Date().getTime();
            resourceInfo.res     = { //construct a self-defined res object
                statusCode : statusCode || "",
                headers    : resHeader || {}
            }
            resourceInfo.resBody = resBody;
            resourceInfo.length  = resBody.length;

            try{
                GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);
            }catch(e){}

            userRes.writeHead(statusCode,resHeader);
            userRes.end(resBody);
        });

        return;

    }else{
        console.log("==>will forward to real server by proxy");

        //modify protocol if needed
        protocol = userRule.replaceRequestProtocol(req,protocol) || protocol;

        var options = {
            hostname : urlPattern.hostname || req.headers.host,
            port     : urlPattern.port || req.port || (/https/.test(protocol) ? 443 : 80),
            path     : path,
            method   : req.method,
            headers  : req.headers
        };

        //modify request options
        options = userRule.replaceRequestOption(req,options) || options;

        var proxyReq = ( /https/.test(protocol) ? https : http).request(options, function(res) {
            var statusCode = res.statusCode;
            statusCode = userRule.replaceResponseStatusCode(req,res,statusCode) || statusCode;

            var resHeader = userRule.replaceResponseHeader(req,res,res.headers) || res.headers;
            resHeader = lower_keys(resHeader);

            /* remove gzip related header, and ungzip the content */
            var ifServerGzipped = /gzip/i.test(resHeader['content-encoding']);
            delete resHeader['content-encoding'];
            delete resHeader['content-length'];

            userRes.writeHead(statusCode, resHeader);

            //waiting for data
            var resData = [],
                length;

            res.on("data",function(chunk){
                resData.push(chunk);
            });

            res.on("end",function(){

                var serverResData,
                    userCustomResData;

                async.series([

                    //ungzip server res
                    function(callback){
                        serverResData     = Buffer.concat(resData);
                        if(ifServerGzipped ){
                            zlib.gunzip(serverResData,function(err,buff){
                                serverResData = buff;
                                callback();
                            });
                        }else{
                            callback();
                        }

                    //get custom response
                    },function(callback){
                        
                        userCustomResData = userRule.replaceServerResData(req,res,serverResData);
                        serverResData = userCustomResData || serverResData;
                        callback();

                    //delay
                    },function(callback){
                        var pauseTimeInMS = userRule.pauseBeforeSendingResponse(req,res);
                        if(pauseTimeInMS){
                            setTimeout(callback,pauseTimeInMS);
                        }else{
                            callback();
                        }

                    //send response
                    },function(callback){
                        userRes.end(serverResData);
                        callback();

                    //udpate record info
                    },function(callback){
                        resourceInfo.endTime    = new Date().getTime();
                        resourceInfo.statusCode = statusCode;
                        resourceInfo.resHeader  = resHeader;
                        resourceInfo.resBody    = serverResData;
                        resourceInfo.length     = serverResData.length;
                        
                        try{
                            GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);
                        }catch(e){}

                        callback();
                    }

                ],function(err,result){

                });

            });
            res.on('error',function(error){
                console.log('error',error);
            });

        });

        proxyReq.on("error",function(e){
            console.log("err with request :" + e.code + "  " + req.url);
            userRes.end();
        });

        req.pipe(proxyReq);
    }
}

function connectReqHandler(req, socket, head){
    var host      = req.url.split(":")[0],
        targetPort= req.url.split(":")[1],
        resourceInfo,
        resourceInfoId;

    var shouldIntercept = userRule.shouldInterceptHttpsReq(req);

    console.log(color.green("\nreceived https CONNECT request " + host));
    if(shouldIntercept){
        console.log("==>will forward to local https server");    
    }else{
        console.log("==>will bypass the man-in-the-middle proxy");
    }

    //record
    resourceInfo = {
        host      : host,
        method    : req.method,
        path      : "",
        url       : "https://" + host,
        req       : req,
        startTime : new Date().getTime()
    };
    resourceInfoId = GLOBAL.recorder.appendRecord(resourceInfo);

    var proxyPort, proxyHost;
    async.series([

        //find port 
        function(callback){
            if(shouldIntercept){
                //TODO : remote port other than 433
                httpsServerMgrInstance.fetchPort(host,userRequestHandler,function(err,port){
                    if(!err && port){
                        proxyPort = port;
                        proxyHost = "127.0.0.1";
                        callback();
                    }else{
                        callback(err);
                    }
                });

            }else{
                proxyPort = targetPort;
                proxyHost = host;

                callback();
            }

        //connect
        },function(callback){
            try{
                var conn = net.connect(proxyPort, proxyHost, function(){
                    socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
                        conn.pipe(socket);
                        socket.pipe(conn);
                        callback();
                    });
                }); 

                conn.on("error",function(e){
                    console.log("err when connect to __host".replace(/__host/,host));
                });  
            }catch(e){
                console.log("err when connect to remote https server (__host)".replace(/__host/,host));
            }

        //update record
        },function(callback){
            resourceInfo.endTime    = new Date().getTime();
            resourceInfo.statusCode = "200";
            resourceInfo.resHeader  = {};
            resourceInfo.resBody    = "";
            resourceInfo.length     = 0;
            
            try{
                GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);
            }catch(e){}

            callback();
        }
    ],function(err,result){
        if(err){
            console.log("err " + err);
            throw err;
        }
    });
}

// {"Content-Encoding":"gzip"} --> {"content-encoding":"gzip"}
function lower_keys(obj){
    for(var key in obj){
        var val = obj[key];
        delete obj[key];

        obj[key.toLowerCase()] = val;
    }

    return obj;
}

function setRules(newRule){
    if(!newRule){
        return;
    }else{
        userRule = newRule;
    }
}

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
