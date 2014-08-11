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

var T_TYPE_HTTP  = 0,
    T_TYPE_HTTPS = 1,
    DEFAULT_PORT = 8001,
    DEFAULT_HOST = "localhost",
    DEFAULT_TYPE = T_TYPE_HTTP;

var serverMgrInstance = new serverMgr(),
    httpProxyServer;

function startServer(type, port, hostname){
    var proxyType = /https/i.test(type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP ,
        proxyPort = port     || DEFAULT_PORT,
        proxyHost = hostname || DEFAULT_HOST;

    async.series([
        //creat server
        function(callback){
            if(proxyType == T_TYPE_HTTPS){
                var keyFile = "./cert/tmpCert/__hostname.key".replace(/__hostname/,proxyHost),
                    crtFile = "./cert/tmpCert/__hostname.crt".replace(/__hostname/,proxyHost);

                if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
                    createCert(proxyHost,function(){
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

            }else{
                httpProxyServer = http.createServer(dealProxyUserHttpReq);
                callback(null);
                
            }        
        },

        function(callback){
            //listen CONNECT method for https over http
            httpProxyServer.on('connect',dealProxyConnectReq);
            httpProxyServer.listen(proxyPort);
            callback(null);

        }],

        //final callback
        function(err,result){
            if(!err){
                console.log( (proxyType == T_TYPE_HTTP ? "Http" : "Https") + " proxy started at port " + proxyPort);
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

module.exports.startServer = startServer;
