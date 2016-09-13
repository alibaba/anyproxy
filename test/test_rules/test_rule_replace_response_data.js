//rule scheme : replace the reponse data
const Buffer = require('buffer').Buffer;
const Q = require('q');

module.exports = {

    replaceServerResData: function(req,res,serverResData){

        const d = Q.defer();
        if(req.url.indexOf('/test/normal_request1') > -1){
            var newDataStr = serverResData.toString();
            newDataStr += "_hello_world!";
            d.resolve(Buffer.from(newDataStr));
        }else{
            d.resolve(serverResData);
        }
        return d.promise;
    }
};
