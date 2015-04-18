var isRootCAFileExists = require("./certMgr.js").isRootCAFileExists(),
    interceptFlag = false;

var replaceServerResDataAsync = AnyProxy.phaseManager.getPhase('replaceServerResDataAsync');
replaceServerResDataAsync.addTask(function(req,res,serverResData,callback){
    console.log('first task');
    callback(serverResData);
});
replaceServerResDataAsync.addTask(function(req,res,serverResData,callback){
    console.log('second task');
    callback(serverResData);
});
replaceServerResDataAsync.addTask(function(req,res,serverResData,callback){
    console.log('third task');
    callback(serverResData);
});


module.exports = {
    phaseManager:AnyProxy.phaseManager
};
