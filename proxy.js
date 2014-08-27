var http = require('http'),
    https          = require('https'),
    fs             = require('fs'),
    async          = require("async"),
    url            = require('url'),
    program        = require('commander'),
    color          = require('colorful'),
    certMgr        = require("./lib/certMgr"),
    getPort        = require("./lib/getPort"),
    requestHandler = require("./lib/requestHandler"),
    Recorder       = require("./lib/Recorder"),
    entities       = require("entities"),
    express        = require("express"),
    WebSocketServer= require('ws').Server;

GLOBAL.recorder = new Recorder();

var T_TYPE_HTTP  = 0,
    T_TYPE_HTTPS           = 1,
    DEFAULT_PORT           = 8001,
    DEFAULT_WEB_PORT       = 8002,
    DEFAULT_WEBSOCKET_PORT = 8003,
    DEFAULT_HOST           = "localhost",
    DEFAULT_TYPE           = T_TYPE_HTTP;

function proxyServer(type, port, hostname,ruleFile){
    var self      = this,
        proxyType = /https/i.test(type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP ,
        proxyPort = port     || DEFAULT_PORT,
        proxyHost = hostname || DEFAULT_HOST;

    self.httpProxyServer = null;
    self.close = function(){
        self.httpProxyServer && self.httpProxyServer.close();
        console.log(color.green("server closed :" + proxyHost + ":" + proxyPort));
    }

    startWebServer();

    if(ruleFile){
        if(fs.existsSync(ruleFile)){
            try{ //for abs path
                requestHandler.setRules(require(ruleFile)); //todo : require path
            }catch(e){ //for relative path
                requestHandler.setRules(require("./" + ruleFile));
            }
            console.log(color.green("rule file loaded"));
        }else{
            console.log(color.red("can not find rule file"));
        }
    }

    async.series(
        [
            //creat proxy server
            function(callback){
                if(proxyType == T_TYPE_HTTPS){
                    certMgr.getCertificate(proxyHost,function(err,keyContent,crtContent){
                        if(err){
                            callback(err);
                        }else{
                            self.httpProxyServer = https.createServer({
                                key : keyContent,
                                cert: crtContent
                            },requestHandler.userRequestHandler);
                            callback(null);
                        }
                    });

                }else{
                    self.httpProxyServer = http.createServer(requestHandler.userRequestHandler);
                    callback(null);
                }        
            },

            //listen CONNECT method for https over http
            function(callback){
                self.httpProxyServer.on('connect',requestHandler.connectReqHandler);
                self.httpProxyServer.listen(proxyPort);
                callback(null);
            }
        ],

        //final callback
        function(err,result){
            if(!err){
                var tipText = (proxyType == T_TYPE_HTTP ? "Http" : "Https") + " proxy started at port " + proxyPort;
                console.log(color.green(tipText)); 
            }else{
                var tipText = "err when start proxy server :(";
                console.log(color.red(tipText));
                console.log(err);
            }
        }
    );

}

function startWebServer(port){
    port = port || DEFAULT_WEB_PORT;

    //web interface
    var app = express();
    app.use(function(req, res, next) {
        res.setHeader("note", "THIS IS A REQUEST FROM ANYPROXY WEB INTERFACE");
        return next();
    });

    app.get("/summary",function(req,res){
        GLOBAL.recorder.getSummaryList(function(err,docs){
            if(err){
                res.end(err.toString());
            }else{
                res.json(docs.slice(docs.length -500));
            }
        });
    });

    app.get("/body",function(req,res){
        var reqQuery = url.parse(req.url,true);
        var id = reqQuery.query.id;

        res.setHeader("Content-Type","text/html");
        res.writeHead(200);

        var body = GLOBAL.recorder.getBody(id);
        res.end(entities.encodeHTML(body));
    });

    app.use(express.static(__dirname + '/web'));

    app.listen(port);

    var tipText = "web interface started at port " + port;
    console.log(color.green(tipText));



    //web socket interface
    var wss = new WebSocketServer({port: DEFAULT_WEBSOCKET_PORT});
    wss.broadcast = function(data) {
        for(var i in this.clients){
            this.clients[i].send(data);
        }
    };
    GLOBAL.recorder.on("update",function(data){
        wss.broadcast( JSON.stringify(data) );
    });
}


module.exports.proxyServer        = proxyServer;
module.exports.generateRootCA     = certMgr.generateRootCA;
module.exports.isRootCAFileExists = certMgr.isRootCAFileExists;