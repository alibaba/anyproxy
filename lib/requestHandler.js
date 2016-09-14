'use strict';
let http           = require("http"),
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
    co             = require("co"),
    httpsServerMgr = require("./httpsServerMgr");

let userRule = util.freshRequire('./rule_default');

function userRequestHandler(req,userRes){
    /*
    note
        req.url is wired
        in http  server : http://www.example.com/a/b/c
        in https server : /a/b/c
    */

    let host               = req.headers.host,
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
    if(global.recorder){
        resourceInfoId = global.recorder.appendRecord(resourceInfo);
    }

    logUtil.printLog(color.green("\nreceived request to : " + host + path));

    // response when error happened in proxy
    function _sendFailedResponse (error) {
        let resBody = 'Proxy Error happened when the request is handled in AnyProxy.';
        resBody = error ? resBody + ' The error is:' + error : resBody;

        userRes.writeHead(502, 'Proxy Inner Error', {
            'Proxy-Error': true,
            'Proxy-Error-Message': error || 'null'
        });

        userRes.end(resBody);
    }

    //get request body and route to local or remote
    async.series([
        fetchReqData,
        routeReq
    ],function(){
        //mark some ext info
        if(req.anyproxy_map_local){
            global.recorder.updateExtInfo(resourceInfoId, { map : req.anyproxy_map_local });
        }
    });

    //get request body
    function fetchReqData(callback){
        let postData = [];
        req.on("data",function(chunk){
            postData.push(chunk);
        });
        req.on("end",function(){
            reqData = Buffer.concat(postData);
            resourceInfo.reqBody = reqData.toString();
            global.recorder && global.recorder.updateRecord(resourceInfoId,resourceInfo);

            callback();
        });
    }

    //route to dealing function
    function routeReq(callback){
        co(function * () {
            const shouldUseLocal = yield userRule.shouldUseLocalResponse(req,reqData);
            if(shouldUseLocal){
                logUtil.printLog("==>use local rules");
                dealWithLocalResponse(callback);
            }else{
                logUtil.printLog("==>will forward to real server by proxy");
                dealWithRemoteResonse(callback);
            }
        })
        .catch(error => {
            logUtil.printLog("error happend in co for routeReq':" + error + "  " + req.url, logUtil.T_ERR);
            _sendFailedResponse(error);
        });
    }

    function dealWithLocalResponse(callback){
        co(function * () {
            const responseData =
                yield userRule.dealLocalResponse(req,reqData);

            // we don't utlize destructing here, for it's pool support in node versions.
            // refer to http://node.green/#destructuring--assignment
            const statusCode = responseData.code;
            const resHeader = responseData.header;
            const resBody = responseData.body;
            //update record info
            resourceInfo.endTime = new Date().getTime();
            resourceInfo.res     = { //construct a self-defined res object
                statusCode : statusCode || "",
                headers    : resHeader  || {}
            };

            resourceInfo.resHeader  = resHeader || {};
            resourceInfo.resBody    = resBody;
            resourceInfo.length     = resBody ? resBody.length : 0;
            resourceInfo.statusCode = statusCode;

            global.recorder && global.recorder.updateRecord(resourceInfoId,resourceInfo);

            userRes.writeHead(statusCode,resHeader);
            userRes.end(resBody);
            callback && callback();
        })
        .catch(error => {
            logUtil.printLog("error happend in co for dealWithLocalResponse':" + error + "  " + req.url, logUtil.T_ERR);
            _sendFailedResponse(error);
        });
    }

    function dealWithRemoteResonse(callback){
        co(function* doDealWithRemoteResponse () {
            let options;

            //modify request protocol
            protocol = (yield userRule.replaceRequestProtocol(req,protocol)) || protocol;

            //modify request options
            options = {
                hostname : urlPattern.hostname || req.headers.host,
                port     : urlPattern.port || req.port || (/https/.test(protocol) ? 443 : 80),
                path     : path,
                method   : req.method,
                headers  : req.headers
            };

            options = (yield userRule.replaceRequestOption(req,options)) || options;
            options.rejectUnauthorized = false;
            try{
                delete options.headers['accept-encoding']; //avoid gzipped response
            }catch(e){}

            //update request data
            reqData = (yield userRule.replaceRequestData(req,reqData)) || reqData;
            options.headers = util.lower_keys(options.headers);
            options.headers["content-length"] = reqData.length; //rewrite content length info

            options.headers = util.upper_keys(options.headers);

            //send request
            let proxyReq = ( /https/.test(protocol) ? https : http).request(options, function(res) {
                co(function * () {
                    //deal response header
                    let statusCode = res.statusCode;
                    statusCode = (yield userRule.replaceResponseStatusCode(req,res,statusCode)) || statusCode;

                    let resHeader = (yield userRule.replaceResponseHeader(req,res,res.headers)) || res.headers;
                    resHeader = util.lower_keys(resHeader);

                    // remove gzip related header, and ungzip the content
                    // note there are other compression types like deflate
                    let ifServerGzipped =  /gzip/i.test(resHeader['content-encoding']);
                    if(ifServerGzipped){
                        delete resHeader['content-encoding'];
                    }
                    delete resHeader['content-length'];

                    userRes.writeHead(statusCode, resHeader);

                    //deal response data
                    let length,
                        resData = [];

                    res.on("data",function(chunk){
                        resData.push(chunk);
                    });

                    res.on("end",function(){
                        let serverResData;

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
                                co(function * () {
                                    serverResData = yield userRule.replaceServerResData(req,res,serverResData);
                                    callback();
                                })
                                .catch(error => {
                                    logUtil.printLog("error happend in co with replaceServerResData:" +
                                        error + "  " + req.url, logUtil.T_ERR);
                                });
                            //delay
                            },function(callback){
                                let pauseTimeInMS = userRule.pauseBeforeSendingResponse(req,res);
                                if(pauseTimeInMS){
                                    setTimeout(callback,pauseTimeInMS);
                                }else{
                                    callback();
                                }

                            //send response
                            },function(callback){
                                if(global._throttle){
                                    let thrStream = new Stream();

                                    let readable = thrStream.pipe(global._throttle.throttle());
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

                                global.recorder && global.recorder.updateRecord(resourceInfoId,resourceInfo);

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

                }).catch(error => {
                    logUtil.printLog("error happend in co for proxy req :" + error + "  " + req.url, logUtil.T_ERR);
                    _sendFailedResponse(error);
                });

            });

            proxyReq.on("error",function(e){
                logUtil.printLog("err with request :" + e + "  " + req.url, logUtil.T_ERR);
                userRes.end();
            });

            proxyReq.end(reqData);

        }).catch(error => {
            logUtil.printLog("error happend in co for userRequestHandler':" + error + "  " + req.url, logUtil.T_ERR);
            _sendFailedResponse(error);
        });
    }
}

function connectReqHandler(req, socket, head){
    let host      = req.url.split(":")[0],
        targetPort= req.url.split(":")[1],
        resourceInfo,
        resourceInfoId;
    let shouldIntercept;

    function _sendFailedSocket (error) {
        let errorHeader = 'Proxy-Error: true\r\n';
        errorHeader += 'Proxy-Error-Message: ' + error || 'null' + '\r\n';
        errorHeader += 'Content-Type: text/html\r\n';
        socket.write('HTTP/' + req.httpVersion + ' 502 Proxy Inner Error\r\n' + errorHeader +'\r\n\r\n');
    }

    co(function * () {

        shouldIntercept = yield userRule.shouldInterceptHttpsReq(req);

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
        resourceInfoId = global.recorder.appendRecord(resourceInfo);

        let proxyPort,
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
                    let conn = net.connect(proxyPort, proxyHost, function(){
                        socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function(){

                            //throttle for direct-foward https
                            if(global._throttle && !shouldIntercept ){
                                let readable = conn.pipe(global._throttle.throttle());
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

                global.recorder && global.recorder.updateRecord(resourceInfoId,resourceInfo);

                callback();
            }
        ],function(err,result){
            if(err){
                logUtil.printLog("err " + err, logUtil.T_ERR);
                throw err;
            }
        });
    })
    .catch(error => {
        logUtil.printLog("error happend in co for connect req :" + error + "  " + req.headers.host, logUtil.T_ERR);
        try{
            _sendFailedSocket(error);

        } catch(error) {
            console.error('-==========error', error);
        }
    });
}

/**
* @return return the merged rule for reference
*/
function setRules(newRule){

    if(!newRule){
        return userRule;
    }else{

        if(!newRule.summary){
            newRule.summary = function(){
                return "this rule file does not have a summary";
            };
        }

        userRule = util.merge(userRule,newRule);

        let functions = [];
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

        return userRule;
    }
}

function getRuleSummary(){
    return userRule.summary();
}

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
module.exports.getRuleSummary     = getRuleSummary;
module.exports.token = Date.now();
