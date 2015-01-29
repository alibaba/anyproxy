/*
read the following wiki before using rule file
https://github.com/alibaba/anyproxy/wiki/What-is-rule-file-and-how-to-write-one
*/
module.exports = {

    summary:function(){
        return "reverse proxy - assign an IP adress for some request";
    },

    replaceRequestOption : function(req,option){
        var newOption = option;
        
        //options : http://nodejs.org/api/http.html#http_http_request_options_callback
        if(newOption.headers.host == "www.taobao.com"){
            newOption.hostname = "127.0.0.1";
            newOption.port     = "80";
        }

        return newOption;
    }

};