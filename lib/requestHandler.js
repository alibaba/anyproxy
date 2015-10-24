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
    getPort        = require("./getPort"),
    Stream         = require("stream"),
    logUtil        = require("./log"),
    httpsServerMgr = require("./httpsServerMgr");

var defaultRule = require("./rule_default.js"),
    userRule    = defaultRule; //init

function userRequestHandler(req,userRes){
    /*
    note
        req.url is wired
        in http  server : http://www.example.com/a/b/c
        in https server : /a/b/c
    */

    var host               = req.headers.host,
        protocol           = (!!req.connection.encrypted && !/^http:/.test(req.url)) ? "https" : "http",
        fullUrl            = protocol === "http" ? req.url : (protocol + '://' + host + req.url),
        urlPattern         = url.parse(fullUrl),
        path               = urlPattern.path,
        resourceInfo,
        resourceInfoId     = -1,
        reqData;

    // console.log(req.url);
    // console.log(path);

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

    logUtil.printLog(color.green("\nreceived request to : " + host + path));

    //get request body and route to local or remote
    async.series([
        fetchReqData,
        routeReq
    ],function(){
        //mark some ext info
        if(req.anyproxy_map_local){
            GLOBAL.recorder.updateExtInfo(resourceInfoId, {map : req.anyproxy_map_local});
        }
    });

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
            logUtil.printLog("==>use local rules");
            dealWithLocalResponse(callback);
        }else{
            logUtil.printLog("==>will forward to real server by proxy");
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
        options.rejectUnauthorized = false;
        try{
            delete options.headers['accept-encoding']; //avoid gzipped response
        }catch(e){}

        //update request data
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
            // note there are other compression types like deflate
            var ifServerGzipped =  /gzip/i.test(resHeader['content-encoding']);
            if(ifServerGzipped){
                delete resHeader['content-encoding'];
            }
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
                            logUtil.printLog(color.red("replaceServerResData is deprecated, and will be unavilable soon. Use replaceServerResDataAsync instead."), logUtil.T_ERR);
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
                logUtil.printLog('error' + error, logUtil.T_ERR);
            });

        });

        proxyReq.on("error",function(e){
            logUtil.printLog("err with request :" + e + "  " + req.url, logUtil.T_ERR);
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

    logUtil.printLog(color.green("\nreceived https CONNECT request " + host));
    if(shouldIntercept){
        logUtil.printLog("==>will forward to local https server");    
    }else{
        logUtil.printLog("==>will bypass the man-in-the-middle proxy");
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

    var proxyPort,
        proxyHost,
        internalHttpsPort,
        httpsServerMgrInstance;

    async.series([

        //check if internal https server exists
        function(callback){
            if(!shouldIntercept){
                callback();
                return;
            }else{
                if(internalHttpsPort){
                    callback();
                }else{
                    getPort(function(port){
                        internalHttpsPort = port;
                        httpsServerMgrInstance = new httpsServerMgr({
                            port    :port,
                            handler :userRequestHandler
                        });
                        callback();
                    });
                }
            }
        },

        //determine the target server
        function(callback){
            
            if(shouldIntercept){
                proxyPort = internalHttpsPort;
                proxyHost = "127.0.0.1";
                callback();

            }else{
                proxyPort = (targetPort == 80)? 443 : targetPort;
                proxyHost = host;

                callback();
            }

        //connect
        },function(callback){
            try{
                var conn = net.connect(proxyPort, proxyHost, function(){
                    socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function(){

                        //throttle for direct-foward https
                        if(GLOBAL._throttle && !shouldIntercept ){
                            var readable = conn.pipe(GLOBAL._throttle.throttle());
                            readable.pipe(socket);
                            socket.pipe(conn);
                        }else{
                            conn.pipe(socket);
                            socket.pipe(conn);
                        }

                        callback();
                    });
                }); 

                conn.on("error",function(e){
                    logUtil.printLog("err when connect to + " + host + " , " + e, logUtil.T_ERR);
                });  
            }catch(e){
                logUtil.printLog("err when connect to remote https server (__host)".replace(/__host/,host), logUtil.T_ERR);
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
            logUtil.printLog("err " + err, logUtil.T_ERR);
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
                logUtil.printLog(userRule.summary());
                cb(null);
            });
        }
        async.series(functions,function(errors,result){
            if(!errors){
                logUtil.printLog(color.green('Anyproxy rules initialize finished, have fun!'));
            }
        });

    }
}

function getRuleSummary(){
    return userRule.summary();
}

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
module.exports.getRuleSummary     = getRuleSummary;
