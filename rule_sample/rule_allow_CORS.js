//rule scheme :
// Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS

module.exports = {
    summary: function () {
        return 'allow CORS request';
    },

    shouldUseLocalResponse : function(req,reqBody){
        return new Promise((resolve, reject) => {
            //intercept all options request
            if(req.method == "OPTIONS"){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    },

    dealLocalResponse : function(req,reqBody){
        return new Promise((resolve, reject) => {
            if(req.method == "OPTIONS"){
                resolve({
                    code: 200,
                    header: mergeCORSHeader(req.headers),
                    body: ''
                });
            } else {
                resolve({
                    code: 200,
                    header: {},
                    body: ''
                });
            }

        });

    },

    replaceResponseHeader: function(req,res,header){
        return new Promise((resolve, reject) => {
            resolve(mergeCORSHeader(req.headers, header));
        });
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
