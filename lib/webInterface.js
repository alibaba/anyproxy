var express         = require("express"),
    url             = require('url'),
    fs              = require("fs"),
    path            = require("path"),
    events          = require("events"),
    inherits        = require("util").inherits,
    qrCode          = require('qrcode-npm'),
    util            = require("./util"),
    certMgr         = require("./certMgr"),
    logUtil         = require("./log"),
    compress        = require('compression');


function webInterface(config){
    var port = config.port,
        wsPort        = config.wsPort,
        ruleSummary   = config.ruleSummary,
        ipAddress     = config.ip;

    var self         = this,
        myAbsAddress = "http://" + ipAddress + ":" + port +"/",
        crtFilePath  = certMgr.getRootCAFilePath(),
        staticDir    = path.join(__dirname,'../web');

    var app = express();
    app.use(compress()); //invoke gzip
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
        var indexTpl  = fs.readFileSync(path.join(staticDir,"/index.html"),{encoding:"utf8"}),
            indexHTML = util.simpleRender(indexTpl, {
                rule            : ruleSummary || "",
                wsPort          : wsPort,
                ipAddress       : ipAddress || "127.0.0.1"
            });
        
        if(req.url == "/"){
            res.setHeader("Content-Type", "text/html");
            res.end(indexHTML);
        }else{
            next();
        }
    });

    app.use(express.static(staticDir));
    app.listen(port);

    self.app  = app;
}

inherits(webInterface, events.EventEmitter);

module.exports = webInterface;