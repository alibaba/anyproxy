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
        bypassAll : false,
        interceptDomains:["^.*alibaba-inc\.com$"]
    }
};

function userRequestHandler(req,userRes){
    var host = req.headers.host,
        path = url.parse(req.url).path,
        ifLocalruleMatched = false;

    console.log(color.green("\nreceived request to : " + host + path));
    /*
        req.url is wired
        in http  server : http://www.baidu.com/a/b/c
        in https server : /work/alibaba
    */

    for(var index in handleRule.map){
        var rule = handleRule.map[index];

        var hostTest = new RegExp(rule.host).test(host),
            pathTest = new RegExp(rule.path).test(path);

        if(hostTest && pathTest && (rule.localFile || rule.localDir) ){
            console.log("==>meet the rules, will map to local file");

            var targetLocalfile = rule.localFile;
            if(!targetLocalfile){ //find file in dir //TODO : /a/b/c -> b/c
                var basename    = pathUtil.basename(path);
                basename = basename.slice(0,basename.indexOf("?")); //remove chars after question mark
                targetLocalfile = pathUtil.join(rule.localDir,basename);
            }

            console.log("==>local file: " + targetLocalfile);
            if(fs.existsSync(targetLocalfile)){
                try{
                    var fsStream = fs.createReadStream(targetLocalfile);
                    userRes.writeHead(200,{"cache-control":"max-age=0"}); //remove any cache related header
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
            hostname : req.headers.host,
            port     : req.port || (ifHttps ? 443 : 80),
            path     : path,
            method   : req.method,
            headers  : req.headers
        };

        var proxyReq = (ifHttps ? https : http).request(options, function(res) {
            userRes.writeHead(res.statusCode,res.headers);
            res.pipe(userRes);
        });

        proxyReq.on("error",function(e){
            console.log("err with request :" + req.url);
            userRes.end();
        });
        proxyReq.end();
    
    }
}

function connectReqHandler(req, socket, head){
    var hostname  = req.url.split(":")[0],
        targetPort= req.url.split(":")[1],
        httpsRule = handleRule.httpsConfig;

    var shouldBypass = httpsRule.bypassAll;
    if(!shouldBypass){ //read rules
        for(var index in httpsRule.interceptDomains){
            var reg = new RegExp(httpsRule.interceptDomains[index]);
            if( reg.test(hostname) ){
                shouldBypass = true;
                break;
            }
        }
    }

    console.log(color.green("\nreceived https CONNECT request " + hostname));

    if(shouldBypass){
        console.log("==>meet the rules, will bypass the man-in-the-middle proxy");
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
        console.log("==>will forward to local https server");

        //forward the https-request to local https server
        httpsServerMgrInstance.fetchPort(hostname,function(err,port){
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

module.exports.userRequestHandler = userRequestHandler;
module.exports.connectReqHandler  = connectReqHandler;
module.exports.setRules           = setRules;
