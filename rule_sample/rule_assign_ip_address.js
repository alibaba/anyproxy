//sample : assign 127.0.0.1 to www.taobao.com

module.exports = {

    replaceRequestOption : function(req,option){
        if(option.hostname == "www.taobao.com"){
        	option.hostname = "127.0.0.1";
        }

        return option;
    }

};