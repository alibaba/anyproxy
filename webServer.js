// var process = require("child_process")
var express         = require("express"),
    url             = require('url'),
    fs              = require("fs"),
    util            = require("./lib/util"),
    certMgr         = require("./lib/certMgr"),
    events          = require("events"),
    inherits        = require("util").inherits,
    ent             = require("ent"),
    qrCode          = require('qrcode-npm'),
    logUtil         = require("./lib/log"),
    WebSocketServer = require('ws').Server;

function proxyWebServer(port,webSocketPort,proxyConfigPort,ruleSummary,ipAddress,menuListStr){

    var self         = this,
        myAbsAddress = "http://" + ipAddress + ":" + port +"/",
        crtFilePath  = certMgr.getRootCAFilePath();

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
        var id = req.query.id;

        res.setHeader("Content-Type","text/html");
        res.writeHead(200);

        fetchBody(id,function(body){
            res.end(ent.encode(body));
        });
    });

    app.get("/fetchCrtFile",function(req,res){
        if(crtFilePath){
            res.setHeader("Content-Type","application/x-x509-ca-cert");
            res.setHeader("Content-Disposition",'attachment; filename="rootCA.crt"');
            res.end(fs.readFileSync(crtFilePath,{encoding:null}));
        }else{
            res.setHeader("Content-Type","text/html");
            res.end("can not file rootCA ,plase use <strong>anyproxy --root</strong> to generate one");
        }
    });

    //make qr code
    app.get("/qr",function(req,res){
        var qr        = qrCode.qrcode(4, 'M'),
            targetUrl = myAbsAddress,
            qrImageTag,
            resDom;

        qr.addData(targetUrl);
        qr.make();
        qrImageTag = qr.createImgTag(4);

        resDom = '<a href="__url"> __img <br> click or scan qr code to start client </a>'.replace(/__url/,targetUrl).replace(/__img/,qrImageTag);
        res.setHeader("Content-Type", "text/html");
        res.end(resDom);
    });

    app.get("/qr_root",function(req,res){
        var qr        = qrCode.qrcode(4, 'M'),
            targetUrl = myAbsAddress + "fetchCrtFile",
            qrImageTag,
            resDom;

        qr.addData(targetUrl);
        qr.make();
        qrImageTag = qr.createImgTag(4);

        resDom = '<a href="__url"> __img <br> click or scan qr code to download rootCA.crt </a>'.replace(/__url/,targetUrl).replace(/__img/,qrImageTag);
        res.setHeader("Content-Type", "text/html");
        res.end(resDom);
    });

    app.use(function(req,res,next){
        var indexHTML       = fs.readFileSync(__dirname + "/web/index.html",{encoding:"utf8"});
            
        if(req.url == "/"){
            res.setHeader("Content-Type", "text/html");
            res.end(util.simpleRender(indexHTML, {
                rule            : ruleSummary || "",
                webSocketPort   : webSocketPort,
                proxyConfigPort : proxyConfigPort,
                ipAddress       : ipAddress || "127.0.0.1",
                menu            : menuListStr
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
            try{
                this.clients[i].send(data);
            }catch(e){
                logUtil.printLog("websocket failed to send data, " + e, logUtil.T_ERR);
            }
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
    server = new proxyWebServer(param[0],param[1],param[2],param[3],param[4],param[5]),
	cbMap  = {}, // id body cb
    lastestHeartbeat = new Date().getTime();


process.on("message",function(data){

	if(data.type == "update"){
		server.emit("update",data.body);

	}else if( data.type == "body"){
		try{
			var key = data.id + "";
			cbMap[key].body = data.body;
			cbMap[key].cb.call(null,data.body);
		}catch(e){}
	}else if(data.type == "watch"){
        lastestHeartbeat = new Date().getTime();
    }
});

//watch dog
setInterval(function(){
    if(new Date().getTime() - lastestHeartbeat  > 10 * 1000){
        process.exit();
    }
},7000);

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