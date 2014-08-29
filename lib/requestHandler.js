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
    httpsServerMgr = require("./httpsServerMgr"),
    userRule       = require("./rule.js"); //TODO - to be configurable

var httpsServerMgrInstance = new httpsServerMgr();

//default rule
var handleRule = {
    map :[
        // {
        //     host      :".",
        //     path      :"/path/test",
        //     localFile :"",
        //     localDir  :"~/"
        // }
    ]
    ,httpsConfig:{
        bypassAll : true,
        interceptDomains:["^.*alibaba-inc\.com$"]
    }
};

function userRequestHandler(req,userRes){
    var host = req.headers.host,
        urlPattern         = url.parse(req.url),
        path               = urlPattern.path,
        callback           = null, //TODO : remove callback
        protocol           = (!!req.connection.encrypted && !/http:/.test(req.url)) ? "https" : "http",
        resourceInfo       = {},
        resourceInfoId     = -1;

    //record
    resourceInfo.host      = host;
    resourceInfo.method    = req.method;
    resourceInfo.path      = path;
    resourceInfo.url       = protocol + "://" + host + path;
    resourceInfo.req       = req;
    resourceInfo.startTime = new Date().getTime();

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

            var resHeader = res.headers;
            resHeader = userRule.replaceResponseHeader(req,res,resHeader) || resHeader;

            //remove content-encoding
            // delete resHeader['content-encoding'];

            userRes.writeHead(statusCode, resHeader);

            var resData = [],
                length;

            res.on("data",function(chunk){
                resData.push(chunk);
            });

            res.on("end",function(){

                var serverResData,
                    userCustomResData;

                async.series([
                    //TODO : manage gzip 

                    //unzip server res
                    function(callback){
                        serverResData     = Buffer.concat(resData);
                        if(/gzip/i.test(res.headers['content-encoding'])){
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

                        //gzip users' string if necessary
                        if(typeof userCustomResData == "string" && /gzip/i.test(res.headers['content-encoding']) ){
                            zlib.gzip(userCustomResData,function(err,data){
                                userCustomResData = data;
                                console.log(data);
                                callback();
                            });
                        }else{
                            callback();
                        }

                    //generate response data
                    },function(callback){
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
                        userRes.write(serverResData);
                        userRes.end();

                        callback();

                    //udpate record info
                    },function(callback){
                        resourceInfo.endTime = new Date().getTime();
                        resourceInfo.res     = res; //TODO : replace res header / statusCode ?
                        resourceInfo.resBody = serverResData;
                        resourceInfo.length  = serverResData.length;

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
    var hostname  = req.url.split(":")[0],
        targetPort= req.url.split(":")[1],
        httpsRule = handleRule.httpsConfig;

    var shouldBypass = !!httpsRule.bypassAll;
    if(!shouldBypass){ //read rules
        shouldBypass = true;
        for(var index in httpsRule.interceptDomains){
            var reg = new RegExp(httpsRule.interceptDomains[index]);
            if( reg.test(hostname) ){
                shouldBypass = false;
                break;
            }
        }
    }

    console.log(color.green("\nreceived https CONNECT request " + hostname));

    if(shouldBypass){
        console.log("==>will bypass the man-in-the-middle proxy");
        try{
            var conn = net.connect(targetPort, hostname, function(){
                socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
                    conn.pipe(socket);
                    socket.pipe(conn);
                });
            }); 

            conn.on("error",function(e){
                console.log("err when connect to __host".replace(/__host/,hostname));
            });  
        }catch(e){
            console.log("err when connect to remote https server (__hostname)".replace(/__hostname/,hostname));//TODO 
        }

    }else{
        //TODO : remote port other than 433
        console.log("==>meet the rules, will forward to local https server");

        //forward the https-request to local https server
        httpsServerMgrInstance.fetchPort(hostname,userRequestHandler,function(err,port){
            if(!err && port){
                try{
                    var conn = net.connect(port, 'localhost', function(){ //TODO : localhost -> server
                        socket.write('HTTP/' + req.httpVersion + ' 200 OK\r\n\r\n', 'UTF-8', function() {
                            conn.pipe(socket);
                            socket.pipe(conn);
                        });
                    });   

                    conn.on("error",function(e){
                        console.log("err when connect to __host".replace(/__host/,hostname));
                    });
                }catch(e){
                    console.log("err when connect to local https server (__hostname)".replace(/__hostname/,hostname));//TODO 
                }
                
            }else{
                console.log("err fetch HTTPS server for host:" + hostname);
            }
        });        
    }
}

//TODO : reactive this function
function setRules(newRule){
    if(!newRule){
        return;
    }

    if(!newRule.map || !newRule.httpsConfig){
        throw(new Error("invalid rule schema"));
    }else{
        handleRule = newRule;
    }
}

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
