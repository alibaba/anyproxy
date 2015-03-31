var exec = require('child_process').exec,
    spawn        = require('child_process').spawn,
    path         = require("path"),
    fs           = require("fs"),
    os           = require("os"),
    color        = require('colorful'),
    readline     = require('readline'),
    util         = require('./util'),
    logUtil      = require("./log"),
    asyncTask    = require("async-task-mgr");

var isWin             = /^win/.test(process.platform);
    certDir           = path.join(util.getUserHome(),"/.anyproxy_certs/"),
    cmdDir            = path.join(__dirname,"..","./cert/"),
    cmd_genRoot       = isWin ? path.join(cmdDir,"./gen-rootCA.cmd") : path.join(cmdDir,"./gen-rootCA"),
    cmd_genCert       = isWin ? path.join(cmdDir,"./gen-cer.cmd") : path.join(cmdDir,"./gen-cer"),
    createCertTaskMgr = new asyncTask();

if(!fs.existsSync(certDir)){
    try{
        fs.mkdirSync(certDir,0777);
    }catch(e){
        logUtil.printLog("===========", logUtil.T_ERR);
        logUtil.printLog("failed to create cert dir ,please create one by yourself - " + certDir, logUtil.T_ERR);
        logUtil.printLog("this error will not block main thread unless you use https-related features in anyproxy", logUtil.T_ERR);
        logUtil.printLog("===========", logUtil.T_ERR);
    }
}

function getCertificate(hostname,certCallback){

    var keyFile = path.join(certDir , "__hostname.key".replace(/__hostname/,hostname) ),
        crtFile = path.join(certDir , "__hostname.crt".replace(/__hostname/,hostname) );

    createCertTaskMgr.addTask(hostname,function(callback){
        if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
            createCert(hostname,function(err){
                if(err){
                    callback(err);
                }else{
                    callback(null , fs.readFileSync(keyFile) , fs.readFileSync(crtFile));
                }
            });
        }else{
            callback(null , fs.readFileSync(keyFile) , fs.readFileSync(crtFile));
        }

    },function(err,keyContent,crtContent){
        if(!err){
            certCallback(null ,keyContent,crtContent);
        }else{
            certCallback(err);
        }
    });
}

function createCert(hostname,callback){
    checkRootCA();

    var cmd = cmd_genCert + " __host __path".replace(/__host/,hostname).replace(/__path/,certDir);
    exec(cmd,{ cwd : certDir },function(err,stdout,stderr){
        if(err){
            callback && callback(new Error("error when generating certificate"),null);
        }else{
            var tipText = "certificate created for __HOST".replace(/__HOST/,hostname);
            logUtil.printLog(color.yellow(color.bold("[internal https]")) + color.yellow(tipText)) ;
            callback(null);
        }
    });  
}

function clearCerts(cb){
    if(isWin){
        exec("del * /q",{cwd : certDir},cb);
    }else{
        exec("rm *.key *.csr *.crt",{cwd : certDir},cb);        
    }
}


function isRootCAFileExists(){
   var crtFile = path.join(certDir,"rootCA.crt"),
       keyFile = path.join(certDir,"rootCA.key");
       
   return (fs.existsSync(crtFile) && fs.existsSync(keyFile)); 
}

function checkRootCA(){
    if(!isRootCAFileExists()){
        logUtil.printLog(color.red("can not find rootCA.crt or rootCA.key"), logUtil.T_ERR);
        logUtil.printLog(color.red("you may generate one by the following methods"), logUtil.T_ERR);
        logUtil.printLog(color.red("\twhen using globally : anyproxy --root"), logUtil.T_ERR);
        logUtil.printLog(color.red("\twhen using as a module : require(\"anyproxy\").generateRootCA();"), logUtil.T_ERR);
        logUtil.printLog(color.red("\tmore info : https://github.com/alibaba/anyproxy/wiki/How-to-config-https-proxy"), logUtil.T_ERR);
        process.exit(0);        
    }
}

function generateRootCA(){
    if(isRootCAFileExists()){
        logUtil.printLog(color.yellow("rootCA exists at " + certDir));
        var rl = readline.createInterface({
            input : process.stdin,
            output: process.stdout
        });

        rl.question("do you really want to generate a new one ?)(yes/NO)", function(answer) {
            if(/yes/i.test(answer)){
                startGenerating();
            }else{
                logUtil.printLog("will not generate a new one");
                process.exit(0);
            }

            rl.close();
        });
    }else{
        startGenerating();
    }

    function startGenerating(){
        //clear old certs
        clearCerts(function(){
            logUtil.printLog(color.green("temp certs cleared"));

            var spawnSteam = spawn(cmd_genRoot,['.'],{cwd:certDir,stdio: 'inherit'});

            spawnSteam.on('close', function (code) {

                if(code == 0){
                    logUtil.printLog(color.green("rootCA generated"));
                    logUtil.printLog(color.green(color.bold("please trust the rootCA.crt in " + certDir)));
                    logUtil.printLog(color.green(color.bold("or you may get it via anyproxy webinterface")));
                }else{
                    logUtil.printLog(color.red("fail to generate root CA"),logUtil.T_ERR);
                }
                process.exit(0);
            });

        });
    }
}


function getRootCAFilePath(){
    if(isRootCAFileExists()){
        return path.join(certDir,"rootCA.crt");
    }else{
        return "";
    }
}

module.exports.getRootCAFilePath  = getRootCAFilePath;
module.exports.generateRootCA     = generateRootCA;
module.exports.getCertificate     = getCertificate;
module.exports.createCert         = createCert;
module.exports.clearCerts         = clearCerts;
module.exports.isRootCAFileExists = isRootCAFileExists;