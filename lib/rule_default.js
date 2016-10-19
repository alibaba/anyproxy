'use strict';

const utils      = require("./util"),
    bodyParser = require("body-parser"),
    path       = require("path"),
    fs         = require("fs"),
    Q          = require("q");

const isRootCAFileExists = require("./certMgr.js").isRootCAFileExists();
let interceptFlag = false;

//e.g. [ { keyword: 'aaa', local: '/Users/Stella/061739.pdf' } ]
let mapConfig = [],
    configFile = "mapConfig.json";
function saveMapConfig(content,cb){

    const d = Q.defer();
    Q.fcall(function() {
        const anyproxyHome = utils.getAnyProxyHome(),
            mapCfgPath   = path.join(anyproxyHome,configFile);

        if(typeof content == "object"){
            content = JSON.stringify(content);
        }
        return {
            path    :mapCfgPath,
            content :content
        };
    })
    .then(function(config){
        const d = Q.defer();
        fs.writeFile(config.path, config.content, function(e){
            if(e){
                d.reject(e);
            }else{
                d.resolve();
            }
        });
        return d.promise;
    })
    .catch(function(e){
        cb && cb(e);
    })
    .done(function(){
        cb && cb();
    });
}
function getMapConfig(cb){
    const read = Q.denodeify(fs.readFile);

    Q.Promise(function(resolve,reject){
        var anyproxyHome = utils.getAnyProxyHome(),
            mapCfgPath   = path.join(anyproxyHome,configFile);

        resolve(mapCfgPath);
    })
    .then(read)
    .then(function(content){
        return JSON.parse(content);
    })
    .catch(function(e){
        cb && cb(e);
    })
    .done(function(obj){
        cb && cb(null,obj);
    });
}

setTimeout(function(){
    //load saved config file
    getMapConfig(function(err,result){
        if(result){
            mapConfig = result;
        }
    });
},1000);


module.exports = {
    summary:function(){
        var tip = "the default rule for AnyProxy.";
        if(!isRootCAFileExists){
            tip += "\nRoot CA does not exist, will not intercept any https requests.";
        }
        return tip;
    },

    shouldUseLocalResponse : function(req,reqBody){
        const d = Q.defer();
        //intercept all options request
        var simpleUrl = (req.headers.host || "") + (req.url || "");
        mapConfig.map(function(item){
            var key = item.keyword;
            if(simpleUrl.indexOf(key) >= 0){
                req.anyproxy_map_local = item.local;
                return false;
            }
        });
        d.resolve(!!req.anyproxy_map_local);
        return d.promise;
    },

    dealLocalResponse : function(req,reqBody,callback){
        const d = Q.defer();
        if(req.anyproxy_map_local){
            fs.readFile(req.anyproxy_map_local,function(err,buffer){
                if(err){
                    d.resolve({
                        code: 200,
                        header: {},
                        body: "[AnyProxy failed to load local file] " + err
                    });
                }else{
                    var header = {
                        'Content-Type': utils.contentType(req.anyproxy_map_local)
                    };
                    d.resolve({
                        code: 200,
                        header: header,
                        body: buffer
                    });
                }
            });
        }

        return d.promise;
    },

    replaceRequestProtocol:function(req,protocol){
        const d = Q.defer();
        d.resolve(protocol);
        return d.promise;
    },

    replaceRequestOption : function(req,option){
        const d = Q.defer();
        d.resolve(option);
        return d.promise;
    },

    replaceRequestData: function(req,data){
        const d = Q.defer();
        d.resolve(data);
        return d.promise;
    },

    replaceResponseStatusCode: function(req,res,statusCode){
        const d = Q.defer();
        d.resolve(statusCode);
        return d.promise;
    },

    replaceResponseHeader: function(req,res,header){
        const d = Q.defer();
        d.resolve(header);
        return d.promise;
    },

    replaceServerResData: function(req,res,serverResData){
        const d = Q.defer();
        d.resolve(serverResData);
        return d.promise;
    },

    pauseBeforeSendingResponse: function(req,res){

    },

    shouldInterceptHttpsReq:function(req){
        const d = Q.defer();
        d.resolve(interceptFlag);
        return d.promise;
    },

    setInterceptFlag: function(flag){
        interceptFlag = flag && isRootCAFileExists;
    },

    _plugIntoWebinterface: function(app,cb){

        app.get("/filetree",function(req,res){
            try{
                var root = req.query.root || utils.getUserHome() || "/";
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

            saveMapConfig(mapConfig);
        });

        cb();
    },

    _getCustomMenu : function(){
        return [
            // {
            //     name:"test",
            //     icon:"uk-icon-lemon-o",
            //     url :"http://anyproxy.io"
            // }
        ];
    }
};