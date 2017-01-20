//rule scheme :

const Q = require('q');
const Buffer = require('buffer').Buffer;

module.exports = {
    summary: function () {
        return 'Rule to intercept https request';
    },

    replaceServerResData: function(req,res,serverResData){
        const d = Q.defer();

        //add "hello github" to all github pages
        serverResData = serverResData.toString();
        serverResData += "_hello_world!";
        d.resolve(new Buffer(serverResData));

        return d.promise;
    },

    shouldInterceptHttpsReq :function(req){
        //intercept https://github.com/
        //otherwise, all the https traffic will not go through this proxy

        const d = Q.defer();

        // return true;
        const headers = req.headers;
        console.info('=======headers is', headers);

        if(req.headers.host.indexOf('localhost:3001') > -1){
            d.resolve(true);
        }else{
            d.resolve(false);
        }

        return d.promise;
    }
};