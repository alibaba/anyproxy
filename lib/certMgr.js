var exec = require('child_process').exec,
    spawn        = require('child_process').spawn,
    path         = require("path"),
    fs           = require("fs"),
    os           = require("os"),
    color        = require('colorful'),
    readline     = require('readline'),
    util         = require('./util'),
    asyncTask    = require("async-task-mgr");

var certDir      = path.join(util.getUserHome(),"/.anyproxy_certs/"),
    cmdDir       = path.join(__dirname,"..","./cert/"),
    asyncTaskMgr = new asyncTask();

if(!fs.existsSync(certDir)){
    fs.mkdirSync(certDir);
}

function getCertificate(hostname,cb){
    var keyFile = path.join(certDir , "__hostname.key".replace(/__hostname/,hostname) ),
        crtFile = path.join(certDir , "__hostname.crt".replace(/__hostname/,hostname) );

    if(!fs.existsSync(keyFile) || !fs.existsSync(crtFile)){
        asyncTaskMgr.addTask(hostname,function(cb){
            createCert(hostname,function(err){
                cb(err ? err : null);
            });
        },function(err){
            if(!err){
                cb(null , fs.readFileSync(keyFile) , fs.readFileSync(crtFile) );
            }else{
                cb(err);
            }
        });

    }else{
        cb(null , fs.readFileSync(keyFile) , fs.readFileSync(crtFile) );
    }
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

function isRootCAFileExists(){
   var crtFile = path.join(cmdDir,"rootCA.crt"),
       keyFile = path.join(cmdDir,"rootCA.key");
       
   return (fs.existsSync(crtFile) && fs.existsSync(keyFile)); 
}

function checkRootCA(){
    if(!isRootCAFileExists()){
        console.log(color.red("can not find rootCA.crt or rootCA.key"));
        console.log(color.red("you may generate one by the following methods"));
        console.log(color.red("\twhen using globally : anyproxy --root"));
        console.log(color.red("\twhen using as a module : require(\"anyproxy\").generateRootCA();"));
        process.exit(0);        
    }
}

function generateRootCA(){
    if(isRootCAFileExists()){
        console.log(color.yellow("rootCA exists at " + cmdDir));
        var rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question("do you really want to generate a new one ?)(yes/NO)", function(answer) {
            if(/yes/i.test(answer)){
                startGenerating();
            }else{
                console.log("will not generate a new one");
                process.exit(0);
            }

            rl.close();
        });
    }else{
        startGenerating();
    }

    function startGenerating(){
        var spawnSteam = spawn("./gen-rootCA",['.'],{cwd:cmdDir,stdio: 'inherit'});

        spawnSteam.on('close', function (code) {
            if(code == 0){
                console.log(color.green("rootCA generated"));
                console.log(color.green(color.bold("please trust the rootCA.crt in " + cmdDir)));
                clearCerts(function(){
                    console.log(color.green("temp certs cleared"));
                    process.exit(0);
                });
            }else{
                console.log(color.red("fail to generate root CA"));
            }
        });
    }
}

module.exports.generateRootCA     = generateRootCA;
module.exports.getCertificate     = getCertificate;
module.exports.createCert         = createCert;
module.exports.clearCerts         = clearCerts;
module.exports.isRootCAFileExists = isRootCAFileExists;