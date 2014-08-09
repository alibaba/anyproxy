var PROXY_PORT = 8001;

var http      = require('http'),
    https     = require('https'),
    fs        = require('fs'),
    net       = require('net'),
    url       = require('url'),
    exec      = require('child_process').exec,
    serverMgr = require("./lib/serverMgr");

var serverMgrInstance = new serverMgr();

var httpProxyServer = http.createServer(function (req, res) {
    var urlPattern = url.parse(req.url);
    var options = {
        hostname : urlPattern.host,
        port     : urlPattern.port || 80,
        path     : urlPattern.path,
        method   : req.method,
        headers  : req.headers
    };

    var directReq = http.request(options,function(directRes){
        res.writeHead(directRes.statusCode , directRes.headers);
        directRes.pipe(res);
    });

    directReq.on("error",function(e){
        console.log("err with request :" + req.url);
        res.end();
    });

    directReq.end();
});

//connect method for HTTPS over http
httpProxyServer.on('connect', function(req, socket, head){
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
});

httpProxyServer.listen(PROXY_PORT);
console.log("proxy started at port " + PROXY_PORT);