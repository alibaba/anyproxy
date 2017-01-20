//rule scheme :

module.exports = {
    summary: function () {
        return 'Rule to intercept https request';
    },

    replaceServerResData: function(req,res,serverResData){
        return new Promise((resolve, reject) => {
            //add "hello github" to all github pages
            if(req.headers.host == "github.com"){
                serverResData += "hello github";
            }
            resolve(serverResData);
        });
    },

    shouldInterceptHttpsReq :function(req){
        //intercept https://github.com/
        //otherwise, all the https traffic will not go through this proxy

        return new Promise((resolve, reject) => {
            // return true;
            if(req.headers.host.indexOf('github.com') > -1){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    }
};