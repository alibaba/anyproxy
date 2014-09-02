//rule scheme :

module.exports = {

    replaceServerResData: function(req,res,serverResData){

        //append "hello world" to all web pages
        if(/html/i.test(res.headers['content-type'])){
            var newDataStr = serverResData.toString();
            newDataStr += "hello world!";
            return newDataStr;
        }else{
            return serverResData;
        }

    }
};