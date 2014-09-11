//rule scheme :

module.exports = {


    replaceServerResData: function(req,res,serverResData){
        //add "hello github" to all github pages
        if(req.headers.host == "github.com"){
            serverResData += "hello github";
        }
        return serverResData;
    },

    shouldInterceptHttpsReq :function(req){
        //intercept https://github.com/
        //otherwise, all the https traffic will not go through this proxy

        // return true;
        if(req.headers.host == "github.com"){
            return true;
        }else{
            return false;
        }
    }
};