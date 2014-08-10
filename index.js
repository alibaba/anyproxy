var http      = require('http'),
    https     = require('https'),
    fs        = require('fs'),
    net       = require('net'),
    async     = require("async"),
    url       = require('url'),
    exec      = require('child_process').exec,
    serverMgr = require("./lib/serverMgr"),
    createCert= require("./lib/createCert"),
    program   = require('commander');

program
    .option('-u, --url [value]', 'hostname for https proxy, localhost for default')
    .option('-t, --type [value]', 'http|https,http for default')
    .option('-p, --port [value]', 'proxy port, 8001 for default')
    .option('-c, --clear', 'clear all the tmp certificates')
    .parse(process.argv);

var PROXY_PORT    = program.port || 8001,
    T_PROXY_HTTP  = 0,
    T_PROXY_HTTPS = 1,
    PROXY_TYPE    = /https/i.test(program.type)? T_PROXY_HTTPS : T_PROXY_HTTP;
    HOSTNAME      = program.host || "localhost";


var count = 0;
if(program.clear){
    exec("rm -rf ./cert/tmpCert",function(){
        console.log("certificates cleared");
        process.exit(0);
    });

}else if(program.help && false){ //TODO 
    program.help();
    
}else{
    var serverMgrInstance = new serverMgr(),
        httpProxyServer;

    async.series([
        //creat server
        function(callback){
            if(PROXY_TYPE == T_PROXY_HTTP){
                httpProxyServer = http.createServer(dealProxyUserHttpReq);
                callback(null);
            }else{

                var keyFile = "./cert/tmpCert/__hostname.key".replace(/__hostname/,HOSTNAME),
                    crtFile = "./cert/tmpCert/__hostname.crt".replace(/__hostname/,HOSTNAME);

                if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
                    createCert(HOSTNAME,function(){
                        httpProxyServer = https.createServer({
                            key : fs.readFileSync(keyFile),
                            cert: fs.readFileSync(crtFile)
                        },dealProxyUserHttpReq);
                        callback(null);
                    });
                }else{
                    httpProxyServer = https.createServer({
                        key : fs.readFileSync(keyFile),
                        cert: fs.readFileSync(crtFile)
                    },dealProxyUserHttpReq);
                    callback(null);
                }
            }        
        },

        //
        function(callback){
            //listen CONNECT method for https over http
            httpProxyServer.on('connect',dealProxyConnectReq);
            httpProxyServer.listen(PROXY_PORT);
            callback(null);

        }],function(err,result){
            if(!err){
                console.log( (PROXY_TYPE == T_PROXY_HTTP ? "Http" : "Https") + " proxy started at port " + PROXY_PORT);
            }else{
                console.log("err when start proxy server :(");
                console.log(err);
            }
        }
    );    
}

function dealProxyUserHttpReq(req,res){
    var urlPattern = url.parse(req.url);
    var options = {
        hostname : urlPattern.host,
        port     : urlPattern.port || 80,
        path     : urlPattern.path,
        method   : req.method,
        headers  : req.headers
    };

    //forward to real server
    var directReq = http.request(options,function(directRes){
        res.writeHead(directRes.statusCode , directRes.headers);
        directRes.pipe(res);
    });

    directReq.on("error",function(e){
        console.log("err with request :" + req.url);
        res.end();
    });

    directReq.end();    
}


function dealProxyConnectReq(req, socket, head){
    var hostname = req.url.split(":")[0];

    //forward the https-request to local https server
    serverMgrInstance.fetchPort(hostname,function(err,port){
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
