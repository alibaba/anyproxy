//rule scheme :

module.exports = {

    replaceServerResDataAsync: function(req,res,serverResData,callback){

        //append "hello world" to all web pages
        if(/html/i.test(res.headers['content-type'])){
            var newDataStr = serverResData.toString();
            newDataStr += "hello world!";
            callback(newDataStr);
        }else{
            callback(serverResData);
        }

    }
};