
module.exports = {

    summary:function(){
        return "reply with 200 OK";
    },

    //mark if use local response
    shouldUseLocalResponse : function(req,reqBody){return true;},

    dealLocalResponse : function(req,reqBody,callback){
        callback(200, {"content-type":"application/javascript"}, "{}" );
    }
};
