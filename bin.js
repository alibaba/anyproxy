#!/usr/bin/env node

var program = require('commander'),
    mainProxy   = require("./proxy.js"),
    color       = require('colorful'),
    fs          = require("fs");

program
    .option('-u, --host [value]', 'hostname for https proxy, localhost for default')
    .option('-t, --type [value]', 'http|https,http for default')
    .option('-p, --port [value]', 'proxy port, 8001 for default')
    .option('-r, --rule [value]', 'rule file to map localfiles')
    .option('-g, --root [value]', 'generate root CA')
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
    var handleRule;
    if(program.rule){
        console.log("parsing rule file..");
        var handleRule = require(program.rule);
    }

    mainProxy.startServer(program.type,program.port, program.host ,handleRule);

}