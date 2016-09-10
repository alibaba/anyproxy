//rule scheme :
const Q = require('q');

module.exports = {

    replaceRequestOption : function(req,option){
        const d = Q.defer();
        //replace request towards http://www.taobao.com
        //                     to http://www.taobao.com/about/

        /*
        option scheme:
        {
            hostname : "www.taobao.com"
            port     : 80
            path     : "/"
            method   : "GET"
            headers  : {cookie:""}
        }
        */
        const newOption = Object.assign({}, option);
        if(newOption.hostname == "www.taobao.com" && newOption.path == "/"){
            newOption.path = "/about/";
        }
        d.resolve(newOption)
        return d.promise;
    }
};