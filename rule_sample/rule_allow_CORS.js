//rule scheme :
// Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS

module.exports = {
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

    replaceResponseHeader: function(req,res,header){
        return mergeCORSHeader(req.headers, header);
    }
    
};

function mergeCORSHeader(reqHeader,originHeader){
    var targetObj = originHeader || {};

    delete targetObj["Access-Control-Allow-Credentials"];
    delete targetObj["Access-Control-Allow-Origin"];
    delete targetObj["Access-Control-Allow-Methods"];
    delete targetObj["Access-Control-Allow-Headers"];

    targetObj["access-control-allow-credentials"] = "true";
    targetObj["access-control-allow-origin"]      = reqHeader['origin'] || "-___-||";
    targetObj["access-control-allow-methods"]     = "GET, POST, PUT";
    targetObj["access-control-allow-headers"]     = reqHeader['access-control-request-headers'] || "-___-||";

    return targetObj;
}
