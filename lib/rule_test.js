var isRootCAFileExists = require("./certMgr.js").isRootCAFileExists(),
    interceptFlag = false;


var PhaseManager = Proto(function() {
    this.init = function() {
        var that = this;
        this.phases = {};
    };
    this.addPhase = function(phase){
        var that = this, phaseName = phase.name || '';
        if(!!phaseName)that.phases[phaseName] = (function(){
            delete phase.name;
            return phase;
        })();
    };
    this.getPhase = function(name){
        var that = this;
        return that.phases[name];
    }
});
var Phase = Proto(function(){
    this.init = function(options){
        var that = this, options = options || {};
        that.name = options.phaseName || '';
        that.tasks = [];
    };
    this.addTask = function(task){
        var that = this;
        'function' == typeof task && that.tasks.push(task);
    };
    this.getTasks = function(){
        var that = this;
        return that.tasks || [];
    };
});
var phases = [
    'shouldUseLocalResponse'
    , 'dealLocalResponse'
    , 'replaceRequestProtocol'
    , 'replaceRequestOption'
    , 'replaceRequestData'
    , 'replaceResponseStatusCode'
    , 'replaceResponseHeader'
    , 'replaceServerResDataAsync'
    // , 'pauseBeforeSendingResponse'
    , 'shouldInterceptHttpsReq'
    , 'fetchTrafficData'
];
var pm = new PhaseManager();
phases.forEach(function(phaseName, index){
    var phase = new Phase({phaseName:phaseName});
    console.log('phase', phase);
    pm.addPhase(phase);
});

var replaceServerResDataAsync = pm.getPhase('replaceServerResDataAsync');
replaceServerResDataAsync.addTask(function(req,res,serverResData,callback){
    if(/weibo\.com/.test(req.url) && /text\/html/.test(req.headers['accept'])){
        console.log('第一个任务');
        serverResData = '被篡改了';
    }
    callback(serverResData);
});
replaceServerResDataAsync.addTask(function(req,res,serverResData,callback){
    console.log('第二个任务',serverResData.toString());
    callback(serverResData);
});
replaceServerResDataAsync.addTask(function(req,res,serverResData,callback){
    console.log('第三个任务');
    callback(serverResData);
});




module.exports = {
    summary:function(){
        var tip = "the default rule for anyproxy, support : CORS. ";
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
            return false;
        }
    },

    dealLocalResponse : function(req,reqBody,callback){
        if(req.method == "OPTIONS"){
            callback(200,mergeCORSHeader(req.headers),"");
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

    //[internal]
    customMenu:[
        {
            name    :"test",
            handler :function(){}
        },{
            name    :"second-test",
            handler :function(){}
        }
    ],

    setInterceptFlag:function(flag){
        interceptFlag = flag && isRootCAFileExists;
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
