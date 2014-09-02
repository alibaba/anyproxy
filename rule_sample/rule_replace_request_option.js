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
        if(option.hostname == "www.taobao.com" && option.path == "/"){
            option.path = "/about/";
        }
    }
};