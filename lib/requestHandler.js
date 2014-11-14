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
    util           = require("./util"),
    Stream         = require("stream"),
    httpsServerMgr = require("./httpsServerMgr");

var httpsServerMgrInstance = new httpsServerMgr(),
    defaultRule            = require("./rule_default.js"),
    userRule               = defaultRule; //init

function userRequestHandler(req,userRes){

    var host               = req.headers.host,
        urlPattern         = url.parse(req.url),
        path               = urlPattern.path,
        protocol           = (!!req.connection.encrypted && !/http:/.test(req.url)) ? "https" : "http",
        resourceInfo,
        resourceInfoId     = -1,
        reqData;

    //record
    resourceInfo = {
        host      : host,
        method    : req.method,
        path      : path,
        protocol  : protocol,
        url       : protocol + "://" + host + path,
        req       : req,
        startTime : new Date().getTime()
    };
    if(GLOBAL.recorder){
        resourceInfoId = GLOBAL.recorder.appendRecord(resourceInfo);
    }

    console.log(color.green("\nreceived request to : " + host + path));

    //get request body and route to local or remote
    async.series([fetchReqData,routeReq],function(){});

    //get request body
    function fetchReqData(callback){
        var postData = [];
        req.on("data",function(chunk){
            postData.push(chunk);
        });
        req.on("end",function(){
            reqData = Buffer.concat(postData);
            resourceInfo.reqBody = reqData.toString();
            GLOBAL.recorder && GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);

            callback();
        });
    }

    //route to dealing function
    function routeReq(callback){
        if(userRule.shouldUseLocalResponse(req,reqData)){
            console.log("==>use local rules");
            dealWithLocalResponse(callback);
        }else{
            console.log("==>will forward to real server by proxy");
            dealWithRemoteResonse(callback);
        }
    }

    function dealWithLocalResponse(callback){
        userRule.dealLocalResponse(req,reqData,function(statusCode,resHeader,resBody){

            //update record info
            resourceInfo.endTime = new Date().getTime();
            resourceInfo.res     = { //construct a self-defined res object
                statusCode : statusCode || "",
                headers    : resHeader  || {}
            }
            resourceInfo.resHeader  = resHeader || {};
            resourceInfo.resBody    = resBody;
            resourceInfo.length     = resBody ? resBody.length : 0;
            resourceInfo.statusCode = statusCode;
            
            GLOBAL.recorder && GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);

            userRes.writeHead(statusCode,resHeader);
            userRes.end(resBody);
            callback && callback();
        });

        return;
    }

    function dealWithRemoteResonse(callback){
        var options;

        //modify request protocol
        protocol = userRule.replaceRequestProtocol(req,protocol) || protocol;

        //modify request options
        options = {
            hostname : urlPattern.hostname || req.headers.host,
            port     : urlPattern.port || req.port || (/https/.test(protocol) ? 443 : 80),
            path     : path,
            method   : req.method,
            headers  : req.headers
        };

        options = userRule.replaceRequestOption(req,options) || options;

        //update quest data
        reqData = userRule.replaceRequestData(req,reqData) || reqData;
        options.headers = util.lower_keys(options.headers);
        options.headers["content-length"] = reqData.length; //rewrite content length info

        //send request
        var proxyReq = ( /https/.test(protocol) ? https : http).request(options, function(res) {

            //deal response header
            var statusCode = res.statusCode;
            statusCode = userRule.replaceResponseStatusCode(req,res,statusCode) || statusCode;

            var resHeader = userRule.replaceResponseHeader(req,res,res.headers) || res.headers;
            resHeader = util.lower_keys(resHeader);

            // remove gzip related header, and ungzip the content
            var ifServerGzipped = /gzip/i.test(resHeader['content-encoding']);
            delete resHeader['content-encoding'];
            delete resHeader['content-length'];

            userRes.writeHead(statusCode, resHeader);

            //deal response data
            var length,
                resData = [];

            res.on("data",function(chunk){
                resData.push(chunk);
            });

            res.on("end",function(){
                var serverResData;

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
                        if(userRule.replaceServerResData){
                            console.log(color.red("replaceServerResData is deprecated, and will be unavilable soon. Use replaceServerResDataAsync instead."));
                            serverResData = userRule.replaceServerResData(req,res,serverResData) || serverResData;
                            callback();
                        }else if(userRule.replaceServerResDataAsync){
                            userRule.replaceServerResDataAsync(req,res,serverResData,function(newRes){
                                serverResData = newRes;
                                callback();
                            });
                        }else{
                            callback();
                        }

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
                        if(GLOBAL._throttle){
                            var thrStream = new Stream();

                            var readable = thrStream.pipe(GLOBAL._throttle.throttle());
                            readable.pipe(userRes);

                            thrStream.emit("data",serverResData);
                            thrStream.emit("end");
                            callback();
                        }else{
                            userRes.end(serverResData);
                            callback();
                        }

                    //udpate record info
                    },function(callback){
                        resourceInfo.endTime    = new Date().getTime();
                        resourceInfo.statusCode = statusCode;
                        resourceInfo.resHeader  = resHeader;
                        resourceInfo.resBody    = serverResData;
                        resourceInfo.length     = serverResData ? serverResData.length : 0;
                        
                        GLOBAL.recorder && GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);

                        callback();

                    //push trafic data to rule file
                    },function(callback){
                        userRule.fetchTrafficData && userRule.fetchTrafficData(resourceInfoId,resourceInfo);
                        callback();

                    }

                ],function(err,result){
                    callback && callback();
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

        proxyReq.end(reqData); 
    }
}

function connectReqHandler(req, socket, head){
    var host      = req.url.split(":")[0],
        targetPort= req.url.split(":")[1],
        resourceInfo,
        resourceInfoId;

    var shouldIntercept = userRule.shouldInterceptHttpsReq(req);

    //bypass webSocket on webinterface 
    if(targetPort == 8003){
        shouldIntercept = false; // TODO : a more general solution?
    }

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
                    console.log("err when connect to %j, %j" , host , e);
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
            
            GLOBAL.recorder && GLOBAL.recorder.updateRecord(resourceInfoId,resourceInfo);

            callback();
        }
    ],function(err,result){
        if(err){
            console.log("err " + err);
            throw err;
        }
    });
}

function setRules(newRule){
    if(!newRule){
        return;
    }else{

        if(!newRule.summary){
            newRule.summary = function(){
                return "this rule file does not have a summary";
            };
        }

        userRule = util.merge(defaultRule,newRule);
        
        var functions = [];
        if('function' == typeof(userRule.init)){
            functions.push(function(cb){
                userRule.init(cb);
            });
        }
        if('function' == typeof(userRule.summary)){
            functions.push(function(cb){
                userRule.summary();
                cb(null);
            });
        }
        async.series(functions,function(errors,result){
            if(!errors){
                console.log(color.green('Anyproxy initialize finished, have a fun!'));
            }
        });

        //'function' == typeof(userRule.init) && console.log(userRule.init());
        //'function' == typeof(userRule.summary) && console.log(userRule.summary());
    }
}

function getRuleSummary(){
    return userRule.summary();
}

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
module.exports.getRuleSummary     = getRuleSummary;

/*
note
    req.url is wired
    in http  server : http://www.example.com/a/b/c
    in https server : /work/alibaba
*/
