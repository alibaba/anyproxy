//rule scheme :

const Q = require('q');

module.exports = {
    summary: function () {
        return 'Rule to intercept https request';
    },

    replaceServerResData: function(req,res,serverResData){
        const d = Q.defer();

        //add "hello github" to all github pages
        if(req.headers.host == "github.com"){
            serverResData += "hello github";
        }
        d.resolve(serverResData);

        return d.promise;
    },

    shouldInterceptHttpsReq :function(req){
        //intercept https://github.com/
        //otherwise, all the https traffic will not go through this proxy

        const d = Q.defer();

        // return true;
        if(req.headers.host.indexOf('github.com') > -1){
            d.resolve(true);
        }else{
            d.resolve(false);
        }

        return d.promise;
    }
};