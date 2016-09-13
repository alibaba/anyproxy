//rule scheme :
// Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
const Q = require('q');

module.exports = {
    summary: function () {
        return 'allow CORS request';
    },

    shouldUseLocalResponse : function(req,reqBody){
        const d = Q.defer();
        //intercept all options request
        if(req.method == "OPTIONS"){
            d.resolve(true);
        }else{
            d.resolve(false);
        }

        return d.promise;
    },

    dealLocalResponse : function(req,reqBody){
        const d = Q.defer();

        if(req.method == "OPTIONS"){
            d.resolve({
                code: 200,
                header: mergeCORSHeader(req.headers),
                body: ''
            });
        } else {
            d.resolve({
                code: 200,
                header: {},
                body: ''
            });
        }

        return d.promise;
    },

    replaceResponseHeader: function(req,res,header){
        const d = Q.defer();
        d.resolve(mergeCORSHeader(req.headers, header));
        return d.promise;
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
