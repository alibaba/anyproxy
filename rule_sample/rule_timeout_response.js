//rule scheme :

module.exports = {
    summary: function () {
        return 'A rule to lazily return the response';
    },
    replaceServerResData: function(req,res,serverResData){
        //append "hello world" to all web pages
        return new Promise((resolve, reject) => {
            //for those non-unicode response , serverResData.toString() should not be your first choice.
            //refer to the issue for more detail: https://github.com/alibaba/anyproxy/issues/20
            if(/json/i.test(res.headers['content-type'])){
                setTimeout(function () {
                    resolve(serverResData);
                }, 500);
            }else{
                resolve(serverResData);
            }
        });
    }
};
