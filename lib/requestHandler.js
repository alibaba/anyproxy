var http  = require("http"),
    https          = require("https"),
    net            = require("net"),
    fs             = require("fs"),
    url            = require("url"),
    pathUtil       = require("path"),
    color          = require("colorful"),
    httpsServerMgr = require("./httpsServerMgr");

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
        urlPattern = url.parse(req.url),
        path       = urlPattern.path,
        ifLocalruleMatched = false;

    console.log(color.green("\nreceived request to : " + host + path));
    /*
        req.url is wired
        in http  server : http://www.baidu.com/a/b/c
        in https server : /work/alibaba
    */

    if(req.method == "OPTIONS"){
        console.log("==>OPTIONS req for CROS, will allow all");
        userRes.writeHead(200,mergeCORSHeader(req.headers)); //remove any cache related header, add crossdomain headers
        userRes.end();
        return;
    }

    for(var index in handleRule.map){
        var rule = handleRule.map[index];

        var hostTest = new RegExp(rule.host).test(host),
            pathTest = new RegExp(rule.path).test(path);

        //TODO : CORS for local file
        if(hostTest && pathTest && (rule.localFile || rule.localDir) ){
            console.log("==>meet the rules, will map to local file");

            var targetLocalfile = rule.localFile;

            //localfile not set, map to dir
            if(!targetLocalfile){ //find file in dir, /a/b/file.html -> dir + b/file.html
                var remotePathWithoutPrefix = path.replace(new RegExp(rule.path),""); //remove prefix
                targetLocalfile = pathUtil.join(rule.localDir,remotePathWithoutPrefix);
            }

            console.log("==>local file: " + targetLocalfile);
            if(fs.existsSync(targetLocalfile)){
                try{
                    var fsStream = fs.createReadStream(targetLocalfile);
                    fsStream.pipe(userRes);
                    ifLocalruleMatched = true;
                    break;
                }catch(e){
                    console.log(e.message);
                }
            }else{
                console.log("file not exist : " + targetLocalfile);
            }
        }
    }

    if(ifLocalruleMatched){
        return;

    }else{
        console.log("==>will forward to real server by proxy");
        var ifHttps = !!req.connection.encrypted && !/http:/.test(req.url);

        var options = {
            hostname : urlPattern.hostname || req.headers.host,
            port     : urlPattern.port || req.port || (ifHttps ? 443 : 80),
            path     : path,
            method   : req.method,
            headers  : req.headers
        };

        var proxyReq = (ifHttps ? https : http).request(options, function(res) {
            userRes.writeHead(res.statusCode,mergeCORSHeader(req.headers,res.headers));
            res.pipe(userRes);
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

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
function mergeCORSHeader(reqHeader,originHeader){
    var targetObj = originHeader || {};

    delete targetObj["Access-Control-Allow-Credentials"];
    delete targetObj["Access-Control-Allow-Origin"];
    delete targetObj["Access-Control-Allow-Methods"];
    delete targetObj["Access-Control-Allow-Headers"];

    targetObj["access-control-allow-credentials"] = "true";
    targetObj["access-control-allow-origin"]      = reqHeader['origin'] || "-___-||";
    targetObj["access-control-allow-methods"]     = "GET, POST, PUT";
    targetObj["access-control-allow-headers"]     = reqHeader['access-control-request-headers'] || "-___-||";

    return targetObj;
}

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
