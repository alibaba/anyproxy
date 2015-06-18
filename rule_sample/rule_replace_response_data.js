//rule scheme :

module.exports = {

    replaceServerResDataAsync: function(req,res,serverResData,callback){
        //append "hello world" to all web pages

        //for those non-unicode response , serverResData.toString() should not be your first choice.
        //this issue may help you understanding how to modify an non-unicode response: https://github.com/alibaba/anyproxy/issues/20
        if(/html/i.test(res.headers['content-type'])){
            var newDataStr = serverResData.toString();
            newDataStr += "hello world!";
            callback(newDataStr);
        }else{
            callback(serverResData);
        }

    }
};
