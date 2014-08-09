//TODO : move to the tmp/ dir
var exec      = require('child_process').exec;

module.exports = function(hostname,callback){
    console.log("creating cert for :" + hostname);

    var cmd = "./gen-cer "+hostname;
    exec(cmd,{cwd:"./cert/"},function(err,stdout,stderr){
        if(err){
            callback && callback(new Error("error when generating certificate"),null);
        }else{
            console.log("certificate created for __HOST".replace(/__HOST/,hostname));
            callback(null);
        }
    });
}