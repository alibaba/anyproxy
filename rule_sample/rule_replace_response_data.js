//rule scheme : replace the reponse data
const Buffer = require('buffer').Buffer;

module.exports = {

    replaceServerResData: function(req,res,serverResData){
        //append "hello world" to all web pages
        return new Promise((resolve, reject) => {
            //for those non-unicode response , serverResData.toString() should not be your first choice.
            //refer to the issue for more detail: https://github.com/alibaba/anyproxy/issues/20
            if(/html/i.test(res.headers['content-type'])){
                var newDataStr = serverResData.toString();
                newDataStr += "hello world!";
                resolve(Buffer.from(newDataStr));
            }else{
                resolve(serverResData);
            }
        });
    }
};
