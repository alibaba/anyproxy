#!/usr/bin/env node

var program     = require('commander'),
    proxy       = require("./proxy.js"),
    color       = require('colorful'),
    fs          = require("fs");

program
    .option('-u, --host [value]', 'hostname for https proxy, localhost for default')
    .option('-t, --type [value]', 'http|https, http for default')
    .option('-p, --port [value]', 'proxy port, 8001 for default')
    .option('-f, --file [value]', 'save request data to a specified file, will use in-memory db if not specified')
    .option('-r, --rule [value]', 'path for rule file,')
    .option('-g, --root [value]', 'generate root CA')
    .option('-l, --throttle [value]', 'throttle speed in kb/s (kbyte / sec)')
    .option('-c, --clear', 'clear all the tmp certificates')
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
}else{
    var ruleModule;

    if(program.rule){
        if(fs.existsSync(program.rule)){
            try{ //for abs path
                ruleModule = require(program.rule);
            }catch(e){ //for relative path
                ruleModule = require(process.cwd() + '/' + program.rule.replace(/^\.\//,''));
            }
            console.log(color.green("rule file loaded"));
        }else{
            console.log(color.red("can not find rule file"));
        }
    }

    new proxy.proxyServer({
        type     : program.type,
        port     : program.port,
        hostname : program.hostname,
        dbFile   : program.file,
        throttle : program.throttle,
        rule     : ruleModule,
        disableWebInterface:false
    });
}


