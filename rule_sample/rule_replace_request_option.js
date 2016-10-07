//rule scheme :

module.exports = {

    replaceRequestOption : function(req,option){
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
        return new Promise((resolve, reject) => {
            const newOption = Object.assign({}, option);
            if(newOption.hostname == "www.taobao.com" && newOption.path == "/"){
                newOption.path = "/about/";
            }
            resolve(newOption);
        });
    }
};