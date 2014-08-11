var exec = require('child_process').exec,
    path         = require("path"),
    fs           = require("fs"),
    os           = require("os"),
    asyncTaskMgr = require("./asyncTaskMgr");

var certDir      = path.join(getUserHome(),"/.anyproxy_certs/"),
    asyncTaskMgr = new asyncTaskMgr();

if(!fs.existsSync(certDir)){
    fs.mkdirSync(certDir);
}

function getCertificate(hostname,cb){
    var keyFile = path.join(certDir , "__hostname.key".replace(/__hostname/,hostname) ),
        crtFile = path.join(certDir , "__hostname.crt".replace(/__hostname/,hostname) );

    if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
        asyncTaskMgr.addTask(hostname,function(err){
            if(!err){
                cb(null , fs.readFileSync(keyFile) , fs.readFileSync(crtFile) );
            }else{
                cb(err);
            }
        },function(cb){
            createCert(hostname,function(err){
                cb(err ? -1 : null);
            });
        });

    }else{
        cb(null , fs.readFileSync(keyFile) , fs.readFileSync(crtFile) );
    }
}

function getUserHome() {
    return process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
}

function createCert(hostname,callback){
    console.log("creating cert for :" + hostname);

    var cmd = "./gen-cer __host __path".replace(/__host/,hostname).replace(/__path/,certDir);
    exec(cmd,{cwd:"./cert/"},function(err,stdout,stderr){
        if(err){
            callback && callback(new Error("error when generating certificate"),null);
        }else{
            console.log("certificate created for __HOST".replace(/__HOST/,hostname));
            callback(null);
        }
    });  
}

function clearCerts(cb){
    exec("rm *.key *.csr *.crt",{cwd : certDir},cb);
}

module.exports.getCertificate = getCertificate;
module.exports.createCert     = createCert;
module.exports.clearCerts     = clearCerts;