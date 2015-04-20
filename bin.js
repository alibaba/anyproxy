#!/usr/bin/env node

var program     = require('commander'),
    color       = require('colorful'),
    fs          = require("fs"),
    path        = require("path"),
    npm         = require("npm"),
    packageInfo = require("./package.json"),
    logUtil     = require("./lib/log");

program
    .version(packageInfo.version)
    .option('-u, --host [value]', 'hostname for https proxy, localhost for default')
    .option('-t, --type [value]', 'http|https, http for default')
    .option('-p, --port [value]', 'proxy port, 8001 for default')
    .option('-w, --web [value]' , 'web GUI port, 8002 for default')
    .option('-f, --file [value]', 'save request data to a specified file, will use in-memory db if not specified')
    .option('-r, --rule [value]', 'path for rule file,')
    .option('-g, --root [value]', 'generate root CA')
    .option('-l, --throttle [value]', 'throttle speed in kb/s (kbyte / sec)')
    .option('-i, --intercept', 'intercept(decrypt) https requests when root CA exists')
    .option('-s, --silent', 'do not print anything into terminal')
    .option('-c, --clear', 'clear all the tmp certificates')
    .option('install', 'install node modules')
    .parse(process.argv);

if(program.clear){
    require("./lib/certMgr").clearCerts(function(){
        console.log( color.green("all certs cleared") );
        process.exit(0);
    });

}else if(program.root){
    require("./lib/certMgr").generateRootCA(function(){
        process.exit(0);
    });

}else if(program.install){
    npm.load({
        "prefix": process.env.NODE_PATH + '/anyproxy/'
    }, function (er) {
        npm.commands.install(program.args || [], function (er, data) {
            if(er)throw er;
        });
        npm.registry.log.on("log", function (message) {});
    });
}else{
    var proxy = require("./proxy.js");
    var ruleModule;

    if(program.silent){
        logUtil.setPrintStatus(false);
    }

    if(program.rule){
        var ruleFilePath = path.resolve(process.cwd(),program.rule);
        try{
            if(fs.existsSync(ruleFilePath)){
                ruleModule = require(ruleFilePath);
                logUtil.printLog("rule file loaded :" + ruleFilePath);
            }else{
                var logText = color.red("can not find rule file at " + ruleFilePath);
                logUtil.printLog(logText, logUtil.T_ERR);
            }
        }catch(e){
            logUtil.printLog("failed to load rule file :" + e.toString(), logUtil.T_ERR);
        }
    }

    new proxy.proxyServer({
        type                : program.type,
        port                : program.port,
        hostname            : program.host,
        dbFile              : program.file,
        throttle            : program.throttle,
        webPort             : program.web,
        rule                : ruleModule,
        disableWebInterface : false,
        interceptHttps      : program.intercept,
        silent              : program.silent
    });
}
