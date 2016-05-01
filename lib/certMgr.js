var exec = require('child_process').exec,
    spawn         = require('child_process').spawn,
    path          = require("path"),
    fs            = require("fs"),
    os            = require("os"),
    color         = require('colorful'),
    readline      = require('readline'),
    util          = require('./util'),
    logUtil       = require("./log"),
    certGenerator = require("./certGenerator"),
    asyncTask     = require("async-task-mgr");

var isWin             = /^win/.test(process.platform),
    certDir           = path.join(util.getUserHome(),"/.anyproxy_certs/"),
    rootCAcrtFilePath = path.join(certDir,"rootCA.crt"),
    rootCAkeyFilePath = path.join(certDir,"rootCA.key"),
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

var cache_rootCACrtFileContent, cache_rootCAKeyFileContent;
function getCertificate(hostname,certCallback){
    checkRootCA();
    var keyFile = path.join(certDir , "__hostname.key".replace(/__hostname/,hostname) ),
        crtFile = path.join(certDir , "__hostname.crt".replace(/__hostname/,hostname) );

    if(!cache_rootCACrtFileContent || !cache_rootCAKeyFileContent){
      cache_rootCACrtFileContent = fs.readFileSync(rootCAcrtFilePath, {encoding: 'utf8'});
      cache_rootCAKeyFileContent = fs.readFileSync(rootCAkeyFilePath, {encoding: 'utf8'});
    }

    createCertTaskMgr.addTask(hostname,function(callback){
        if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
            try{
              var result = certGenerator.generateCertsForHostname(hostname, {
                cert: cache_rootCACrtFileContent,
                key: cache_rootCAKeyFileContent
              });
              fs.writeFileSync(keyFile, result.privateKey);
              fs.writeFileSync(crtFile, result.certificate);
              callback(null, result.privateKey, result.certificate);

            }catch(e){
              callback(e);
            }
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
        exec("rm *.key *.csr *.crt *.srl",{cwd : certDir},cb);
    }
}

function isRootCAFileExists(){
   return (fs.existsSync(rootCAcrtFilePath) && fs.existsSync(rootCAkeyFilePath));
}

var rootCAExists = false;
function checkRootCA(){
    if(rootCAExists) return;
    if(!isRootCAFileExists()){
        logUtil.printLog(color.red("can not find rootCA.crt or rootCA.key"), logUtil.T_ERR);
        logUtil.printLog(color.red("you may generate one by the following methods"), logUtil.T_ERR);
        logUtil.printLog(color.red("\twhen using globally : anyproxy --root"), logUtil.T_ERR);
        logUtil.printLog(color.red("\twhen using as a module : require(\"anyproxy\").generateRootCA();"), logUtil.T_ERR);
        logUtil.printLog(color.red("\tmore info : https://github.com/alibaba/anyproxy/wiki/How-to-config-https-proxy"), logUtil.T_ERR);
        process.exit(0);
    } else{
      rootCAExists = true;
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
            try{
              var result = certGenerator.generateRootCA();
              fs.writeFileSync(rootCAkeyFilePath, result.privateKey);
              fs.writeFileSync(rootCAcrtFilePath, result.certificate);

              logUtil.printLog(color.green("rootCA generated"));
              logUtil.printLog(color.green(color.bold("please trust the rootCA.crt in " + certDir)));
              logUtil.printLog(color.green(color.bold("or you may get it via anyproxy webinterface")));

              if(isWin){
                  exec("start .",{cwd : certDir});
              }else{
                  exec("open .",{cwd : certDir});
              }

            }catch(e){
              logUtil.printLog(color.red(e));
              logUtil.printLog(color.red(e.stack));
              logUtil.printLog(color.red("fail to generate root CA"),logUtil.T_ERR);
            }
        });
    }
}

function getRootCAFilePath(){
    if(isRootCAFileExists()){
        return rootCAcrtFilePath;
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