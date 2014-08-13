var exec = require('child_process').exec,
    spawn        = require('child_process').spawn,
    path         = require("path"),
    fs           = require("fs"),
    os           = require("os"),
    color        = require('colorful'),
    asyncTask    = require("./asyncTaskMgr");

var certDir      = path.join(getUserHome(),"/.anyproxy_certs/"),
    cmdDir       = path.join(__dirname,"..","./cert/"),
    asyncTaskMgr = new asyncTask();

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
    console.log(hostname);
    checkRootCA();

    var cmd = "./gen-cer __host __path".replace(/__host/,hostname).replace(/__path/,certDir);
    exec(cmd,{ cwd : cmdDir },function(err,stdout,stderr){
        if(err){
            callback && callback(new Error("error when generating certificate"),null);
        }else{
            var tipText = "certificate created for __HOST".replace(/__HOST/,hostname);
            console.log(color.yellow(color.bold("[internal https]")) + color.yellow(tipText));
            callback(null);
        }
    });  
}

function clearCerts(cb){
    exec("rm *.key *.csr *.crt",{cwd : certDir},cb);
}

function checkRootCA(){

    var crtFile = path.join(cmdDir,"rootCA.crt"),
        keyFile = path.join(cmdDir,"rootCA.key");

    if(!fs.existsSync(crtFile) || !fs.existsSync(keyFile)){
        console.log(color.red("can not find rootCA.crt or rootCA.key"));
        process.exit(0);
    }
}

function generateRootCA(){
    var spawnSteam = spawn("./gen-rootCA",['.'],{cwd:cmdDir,stdio: 'inherit'});

    spawnSteam.on('close', function (code) {
        if(code == 0){
            console.log(color.green("rootCA generated"));
            console.log("now clearing temp certs...");
            clearCerts(function(){
                console.log(color.green("done"));
                process.exit(0);
            });
        }else{
            console.log(color.red("fail to generate root CA"));
        }
    });
}

module.exports.generateRootCA = generateRootCA;
module.exports.getCertificate = getCertificate;
module.exports.createCert     = createCert;
module.exports.clearCerts     = clearCerts;