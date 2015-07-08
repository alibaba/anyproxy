var utils      = require("./util"),
    bodyParser = require("body-parser"),
    fs         = require("fs");

var isRootCAFileExists = require("./certMgr.js").isRootCAFileExists(),
    interceptFlag      = false;

//e.g. [ { keyword: 'aaa', local: '/Users/Stella/061739.pdf' } ]
var mapConfig = [];

module.exports = {
    summary:function(){
        var tip = "the default rule for anyproxy which supports CORS. ";
        if(!isRootCAFileExists){
            tip += "\nRoot CA does not exist, will not intercept any https requests.";
        }
        return tip;
    },

    shouldUseLocalResponse : function(req,reqBody){
        //intercept all options request
        if(req.method == "OPTIONS"){
            return true;
        }else{
            var simpleUrl = (req.headers.host || "") + (req.url || "");
            mapConfig.map(function(item){
                var key = item.keyword;
                if(simpleUrl.indexOf(key) >= 0){
                    req.anyproxy_map_local = item.local;
                    return false;
                }
            });


            return !!req.anyproxy_map_local;
        }
    },

    dealLocalResponse : function(req,reqBody,callback){
        if(req.method == "OPTIONS"){
            callback(200,mergeCORSHeader(req.headers),"");
        }else if(req.anyproxy_map_local){
            try{
                var fileContent = fs.readFile(req.anyproxy_map_local,function(err,buffer){
                    callback(200, {}, buffer);
                });
            }catch(e){
                callback(200, {}, "failed to load local file :" + req.anyproxy_map_local);
            }
        }
    },

    replaceRequestProtocol:function(req,protocol){
    },

    replaceRequestOption : function(req,option){
    },

    replaceRequestData: function(req,data){
    },

    replaceResponseStatusCode: function(req,res,statusCode){
    },

    replaceResponseHeader: function(req,res,header){
        return mergeCORSHeader(req.headers, header);
    },

    // Deprecated
    // replaceServerResData: function(req,res,serverResData){ 
    //     return serverResData;
    // },

    replaceServerResDataAsync: function(req,res,serverResData,callback){
        callback(serverResData);
    },

    pauseBeforeSendingResponse: function(req,res){
    },

    shouldInterceptHttpsReq:function(req){
        return interceptFlag;
    },

    //[beta]
    //fetch entire traffic data
    fetchTrafficData: function(id,info){},

    setInterceptFlag: function(flag){
        interceptFlag = flag && isRootCAFileExists;
    },

    _plugIntoWebinterface: function(app,cb){

        app.get("/filetree",function(req,res){
            try{
                var root = req.query.root || process.env.HOME || "/";
                utils.filewalker(root,function(err, info){
                    res.json(info);
                });
            }catch(e){
                res.end(e);
            }
        });

        app.use(bodyParser.json());
        app.get("/getMapConfig",function(req,res){
            res.json(mapConfig);
        });
        app.post("/setMapConfig",function(req,res){
            mapConfig = req.body;
            res.json(mapConfig);
        });

        cb();
    }

};

function mergeCORSHeader(reqHeader,originHeader){
    var targetObj = originHeader || {};

    delete targetObj["Access-Control-Allow-Credentials"];
    delete targetObj["Access-Control-Allow-Origin"];
    delete targetObj["Access-Control-Allow-Methods"];
    delete targetObj["Access-Control-Allow-Headers"];

    targetObj["access-control-allow-credentials"] = "true";
    targetObj["access-control-allow-origin"]      = reqHeader['origin'] || reqHeader['Origin'] || "-___-||";
    targetObj["access-control-allow-methods"]     = "GET, POST, PUT";
    targetObj["access-control-allow-headers"]     = reqHeader['access-control-request-headers'] || "-___-||";

    return targetObj;
}