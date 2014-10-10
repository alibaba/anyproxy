// var process = require("child_process")
var express         = require("express"),
    url             = require('url'),
    fs              = require("fs"),
    util            = require("./lib/util"),
    events          = require("events"),
    inherits        = require("util").inherits,
    entities        = require("entities"),
    WebSocketServer = require('ws').Server;

function proxyWebServer(port,webSocketPort,proxyConfigPort,ruleSummary,ipAddress){
    var self = this;

    if(arguments.length < 3){
    	throw new Error("please assign ports");
    }

    //web interface
    var app = express();
    app.use(function(req, res, next) {
        res.setHeader("note", "THIS IS A REQUEST FROM ANYPROXY WEB INTERFACE");
        return next();
    });

    // app.get("/summary",function(req,res){
    //     recorder.getSummaryList(function(err,docs){
    //         if(err){
    //             res.end(err.toString());
    //         }else{
    //             res.json(docs.slice(docs.length -500));
    //         }
    //     });
    // });

    app.get("/body",function(req,res){
        var reqQuery = url.parse(req.url,true);
        var id = reqQuery.query.id;

        res.setHeader("Content-Type","text/html");
        res.writeHead(200);

        fetchBody(id,function(body){
	        res.end(entities.encodeHTML(body));
        });
    });

    app.use(function(req,res,next){
        var indexHTML       = fs.readFileSync(__dirname + "/web/index.html",{encoding:"utf8"});
            
        if(req.url == "/"){
            res.setHeader("Content-Type", "text/html");
            res.end(util.simpleRender(indexHTML, {
                rule            : ruleSummary || "",
                webSocketPort   : webSocketPort,
                proxyConfigPort : proxyConfigPort,
                ipAddress       : ipAddress || "127.0.0.1"
            }));
        }else{
            next();
        }
    });

    app.use(express.static(__dirname + '/web'));
    app.listen(port);

    //web socket interface
    var wss = new WebSocketServer({port: webSocketPort});
    wss.on("connection",function(ws){});
    wss.broadcast = function(data) {
        for(var i in this.clients){
            this.clients[i].send(data);
        }
    };

    self.on("update",function(data){
        wss.broadcast( JSON.stringify(data) );
    })

    self.app  = app;
    self.wss  = wss;
}

inherits(proxyWebServer, events.EventEmitter);

var	param  = process.argv.slice(2),
    server = new proxyWebServer(param[0],param[1],param[2],param[3],param[4]),
	cbMap = {}; // id body cb


process.on("message",function(data){

	if(data.type == "update"){
		server.emit("update",data.body);

	}else if( data.type == "body"){
		try{
			var key = data.id + "";
			cbMap[key].body = data.body;
			cbMap[key].cb.call(null,data.body);
		}catch(e){}
	}
});

function fetchBody(id,cb){
	var key = id + "";
	if(cbMap[key]){
		cb(cbMap[key].body);
	}else{
		cbMap[key] = {
			cb : cb
		};
		process.send({type : "reqBody", id: id});
	}
}