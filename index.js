var http      = require('http'),
    https     = require('https'),
    fs        = require('fs'),
    net       = require('net'),
    url       = require('url'),
    exec      = require('child_process').exec,
    serverMgr = require("./lib/serverMgr"),
    createCert= require("./lib/createCert");

var PROXY_PORT    = 8001,
    T_PROXY_HTTP  = 0,
    T_PROXY_HTTPS = 1,
    PROXY_TYPE    = T_PROXY_HTTPS,
    HOSTNAME      = "localhost";

var serverMgrInstance = new serverMgr(),
    httpProxyServer;

if(PROXY_TYPE == T_PROXY_HTTP){
    httpProxyServer = http.createServer(dealProxyUserHttpReq);
}else{

    var keyFile = "./cert/tmpCert/__hostname.key".replace(/__hostname/,HOSTNAME),
        crtFile = "./cert/tmpCert/__hostname.crt".replace(/__hostname/,HOSTNAME);

    if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
        createCert(HOSTNAME,function(){
            httpProxyServer = https.createServer({
                key : fs.readFileSync(keyFile),
                cert: fs.readFileSync(crtFile)
            },dealProxyUserHttpReq);
        });
    }else{
        httpProxyServer = https.createServer({
            key : fs.readFileSync(keyFile),
            cert: fs.readFileSync(crtFile)
        },dealProxyUserHttpReq);
    }
}

//listen CONNECT method for https over http
httpProxyServer.on('connect',dealProxyConnectReq);
httpProxyServer.listen(PROXY_PORT);
console.log( (PROXY_TYPE == T_PROXY_HTTP ? "Http" : "Https") + " proxy started at port " + PROXY_PORT);


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
