//mix some modules to global.util
try{
    GLOBAL.util                     = require('./lib/util');
    GLOBAL.util['iconv-lite']       = require("iconv-lite");
    GLOBAL.util['colorful']         = require("colorful");
    GLOBAL.util['path']             = require("path");
}catch(e){}

var http = require('http'),
    https           = require('https'),
    fs              = require('fs'),
    async           = require("async"),
    url             = require('url'),
    program         = require('commander'),
    color           = require('colorful'),
    certMgr         = require("./lib/certMgr"),
    getPort         = require("./lib/getPort"),
    requestHandler  = require("./lib/requestHandler"),
    Recorder        = require("./lib/Recorder"),
    inherits        = require("util").inherits,
    util            = require("./lib/util"),
    entities        = require("entities"),
    express         = require("express"),
    path            = require("path"),
    juicer          = require('juicer'),
    events          = require("events"),
    WebSocketServer = require('ws').Server;

GLOBAL.recorder = new Recorder();

var T_TYPE_HTTP            = 0,
    T_TYPE_HTTPS           = 1,
    DEFAULT_PORT           = 8001,
    DEFAULT_WEB_PORT       = 8002,
    DEFAULT_WEBSOCKET_PORT = 8003,
    DEFAULT_CONFIG_PORT    = 8080,
    DEFAULT_HOST           = "localhost",
    DEFAULT_TYPE           = T_TYPE_HTTP;

var default_rule = require('./lib/rule_default');
var anyproxyHome = path.join(util.getUserHome(),"/.anyproxy/");
if(!fs.existsSync(anyproxyHome)){
    fs.mkdirSync(anyproxyHome);
}
if(fs.existsSync(path.join(anyproxyHome,"rule_default.js"))){
    default_rule = require(path.join(anyproxyHome,"rule_default"));
}
if(fs.existsSync(process.cwd() + '/rule.js')){
    default_rule = require(process.cwd() + '/rule');
}

//option
//option.type     : 'http'(default) or 'https'
//option.port     : 8001(default)
//option.rule     : ruleModule
//option.hostname : localhost(default)
function proxyServer(option){
    option = option || {};

    var self       = this,
        proxyType  = /https/i.test(option.type || DEFAULT_TYPE) ? T_TYPE_HTTPS : T_TYPE_HTTP ,
        proxyPort  = option.port     || DEFAULT_PORT,
        proxyHost  = option.hostname || DEFAULT_HOST,
        proxyRules = option.rule     || default_rule; 

    requestHandler.setRules(proxyRules); //TODO : optimize calling for set rule
    self.httpProxyServer = null;

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
            },

            //start web interface
            function(callback){
                var webServer  = new proxyWebServer();
                var wss = webServer.wss;

                var configServer = new UIConfigServer(DEFAULT_CONFIG_PORT);
                configServer.on("rule_changed",function() {
                    console.log(arguments);
                })
                // var wss = proxyWebServer();

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

    self.close = function(){
        self.httpProxyServer && self.httpProxyServer.close();
        console.log(color.green("server closed :" + proxyHost + ":" + proxyPort));
    }
}

// doing
function UIConfigServer(port){
    var self = this;

    var app          = express(),
        customerRule = {
            summary: function(){
                console.log("replace some response with local response");
                return "replace some response with local response";
            }
        },
        userKey;


    customerRule.shouldUseLocalResponse = function(req,reqBody){
        var url = req.url;
        if(userKey){
            var ifMatch = false;
            userKey.map(function(item){
                if(ifMatch) return;

                var matchCount = 0;
                if( !item.urlKey && !item.reqBodyKey){
                    ifMatch = false;
                    return;
                }else{
                    if(!item.urlKey || (item.urlKey && url.indexOf(item.urlKey) >= 0 ) ){
                        ++matchCount;
                    }

                    if(!item.reqBodyKey || (item.reqBodyKey && reqBody.toString().indexOf(item.reqBodyKey) >= 0) ){
                        ++matchCount;
                    }

                    ifMatch = (matchCount==2);
                    if(ifMatch){
                        req.willResponse = item.localResponse;
                    }
                }
            });

            return ifMatch;
        }else{
            return false;
        }
    };

    customerRule.dealLocalResponse = function(req,reqBody,callback){
        callback(200,{"content-type":"text/html"},req.willResponse)

        return req.willResponse;
    };

    app.post("/update",function(req,res){
        var data = "";
        req.on("data",function(chunk){
            data += chunk;
        });

        req.on("end",function(){
            userKey = JSON.parse(data);

            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json;charset=UTF-8");
            res.end(JSON.stringify({success : true}));

            requestHandler.setRules(customerRule);    
            self.emit("rule_changed");
        });
    });

    app.use(express.static(__dirname + "/web_uiconfig"));
    app.listen(port);

    self.app = app;
}

inherits(UIConfigServer, events.EventEmitter);


function proxyWebServer(port){
    var self = this;

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

    app.use(function(req,res,next){
        var indexHTML       = fs.readFileSync(__dirname + "/web/index.html",{encoding:"utf8"});
            
        if(req.url == "/"){
            res.setHeader("Content-Type", "text/html");
            res.end(indexHTML.replace("{{rule}}",requestHandler.getRuleSummary()) );
        }else{
            next();
        }
    });

    app.use(express.static(__dirname + '/web'));

    app.listen(port);

    var tipText = "web interface started at port " + port;

    //web socket interface
    var wss = new WebSocketServer({port: DEFAULT_WEBSOCKET_PORT});
    wss.on("connection",function(ws){});
    wss.broadcast = function(data) {
        for(var i in this.clients){
            this.clients[i].send(data);
        }
    };
    GLOBAL.recorder.on("update",function(data){
        wss.broadcast( JSON.stringify(data) );
    });

    self.app  = app;
    self.wss  = wss;
}


module.exports.proxyServer        = proxyServer;
module.exports.generateRootCA     = certMgr.generateRootCA;
module.exports.isRootCAFileExists = certMgr.isRootCAFileExists;