var program   = require('commander'),
    mainProxy = require("./index.js");

program
    .option('-u, --host [value]', 'hostname for https proxy, localhost for default')
    .option('-t, --type [value]', 'http|https,http for default')
    .option('-p, --port [value]', 'proxy port, 8001 for default')
    .option('-c, --clear', 'clear all the tmp certificates')
    .parse(process.argv);

if(program.clear){
    exec("rm -rf ./cert/tmpCert",function(){
        console.log("certificates cleared");
        process.exit(0);
    });

}else{
    mainProxy.startServer(program.type,program.port, program.host);

}