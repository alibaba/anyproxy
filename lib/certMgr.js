var exec = require('child_process').exec,
    spawn        = require('child_process').spawn,
    path         = require("path"),
    fs           = require("fs"),
    os           = require("os"),
    color        = require('colorful'),
    readline     = require('readline'),
    util         = require('./util'),
    logUtil      = require("./log"),
    asyncTask    = require("async-task-mgr"),
    inpathSync   = require('inpath').sync,
    read         = require('read'),
    pidof        = require('pidof'),
    sPath         = process.env['PATH'].split(':'),
    sudoBin      = inpathSync('sudo', sPath);

var isWin             = /^win/.test(process.platform);
    certDir           = path.join(util.getUserHome(),"/.anyproxy_certs/"),
    cmdDir            = path.join(__dirname,"..","./cert/"),
    cmd_genRoot       = isWin ? path.join(cmdDir,"./gen-rootCA.cmd") : path.join(cmdDir,"./gen-rootCA"),
    cmd_genCert       = isWin ? path.join(cmdDir,"./gen-cer.cmd") : path.join(cmdDir,"./gen-cer"),
    createCertTaskMgr = new asyncTask();

if(!fs.existsSync(certDir)){
    try{
        fs.mkdirSync(certDir);
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

function generateRootCA(callback){
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

                if(code === 0){
                    logUtil.printLog(color.green("rootCA generated"));
                    if (callback) {
                        callback();
                    } else {
                        logUtil.printLog(color.green(color.bold("please trust the rootCA.crt in " + certDir)));
                    }
                }else{
                    logUtil.printLog(color.red("fail to generate root CA"),logUtil.T_ERR);
                }
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

function trustRootCA(callback) {
    if (isWin) {
        callback(false);
        return; // todo support windows os
    }
    var prompts = 0;
    var prompt = '#node-sudo-passwd#';
    var cmd = 'security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain'.split(/\s+/).concat([path.join(certDir,"rootCA.crt")]);
    var child = spawn(sudoBin, ['-S', '-p', prompt].concat(cmd), {
        stdio: 'pipe'
    });
    // Wait for the sudo:d binary to start up
    function waitForStartup(err, pid) {
        if (err) {
            throw new Error('Couldn\'t start security');
        }

        if (pid || child.exitCode !== null) {
            child.emit('started');
        } else {
            setTimeout(function () {
                pidof('security', waitForStartup);
            }, 100);
        }
    }
    pidof('security', waitForStartup);
    child.stderr.on('data', function (data) {
        var lines = data.toString().trim().split('\n');
        lines.forEach(function (line) {
            if (line === prompt) {
                if (prompts === 0) {
                    logUtil.printLog('Please Enter your sudo password to allow AnyProxy to trust your root CA.');
                    logUtil.printLog('If you do not want to tell AnyProxy your password and want to trust by yourself, you can just enter ↵ to ignore.');
                }
                prompts++;
                read({
                    prompt: prompts > 1 ? 'Password wrong, try again: ' : 'Enter sudo password( ↵ to ignore):',
                    silent: true
                }, function (error, answer) {
                    if (!error && answer) {
                        child.stdin.write(answer + '\n');
                    } else {
                        logUtil.printLog('Ignored. Please trust root CA by yourself.');
                        callback(false);
                    }
                });
            }
        });
        child.on('close', function() {
            logUtil.printLog('Root CA trusted!');
            callback(true);
        });
    });
}

function isRootCATrusted(callback) {
    if (isWin) {
        callback(true); // 不支持 windows 系统, 暂时直接返回 true
        return;
    }
    /*
     * 用下面的方法只能判断出证书是否注册到系统里, 但无法判断是否被用户信任.
     * 暂时认为只要注册了就是信任了的(除非用户手动取消了信任)
     */
    exec('security find-certificate -c Anyproxy -p', function(err, stdout, stderr) {
        if (err) {
            callback(false);
            return;
        }
        callback(stdout.indexOf('-----BEGIN CERTIFICATE-----') >= 0);
    });
}

module.exports.getRootCAFilePath  = getRootCAFilePath;
module.exports.generateRootCA     = generateRootCA;
module.exports.getCertificate     = getCertificate;
module.exports.createCert         = createCert;
module.exports.clearCerts         = clearCerts;
module.exports.isRootCAFileExists = isRootCAFileExists;
module.exports.trustRootCA        = trustRootCA;
module.exports.isRootCATrusted    = isRootCATrusted;