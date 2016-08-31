var logUtil = require('./log');
var util = require('./util');
var color = require('colorful');
var EasyCert = require('node-easy-cert');
var exec = require('child_process').exec;
var path = require('path');
var readline = require('readline');

var isWin = /^win/.test(process.platform);
var options = {
    rootDirPath: util.getUserHome() + '/.anyproxy_certs',
    defaultCertAttrs: [
        { name: 'countryName', value: 'CN' },
        { name: 'organizationName', value: 'AnyProxy' },
        { shortName: 'ST', value: 'SH' },
        { shortName: 'OU', value: 'AnyProxy SSL Proxy' }
    ]
};

var easyCert = new EasyCert(options);
var crtMgr = util.merge({}, easyCert);

// catch specified error, such as ROOT_CA_NOT_EXISTS
crtMgr.getCertificate = function (host, cb) {
    easyCert.getCertificate(host, (error, keyContent, crtContent) => {
        if (error === 'ROOT_CA_NOT_EXISTS') {
            util.showRootInstallTip();
            process.exit(0);
            return;
        }

        cb(error, keyContent, crtContent);
    });
};

// set default common name of the cert
crtMgr.generateRootCA = function (cb) {
    doGenerate(false);

    function doGenerate(overwrite) {
        const rootOptions = {
            commonName: 'AnyProxy',
            overwrite: !!overwrite
        };

        easyCert.generateRootCA(rootOptions, (error, keyPath, crtPath) => {
            if (!error) {
                const certDir = path.dirname(keyPath);
                logUtil.printLog(color.cyan('The cert is generated at "' + certDir + '"'));
                if(isWin){
                    exec("start .",{ cwd : certDir });
                }else{
                    exec("open .",{ cwd : certDir });
                }
            }

            if (error === 'ROOT_CA_EXISTED') {
                var rl = readline.createInterface({
                    input : process.stdin,
                    output: process.stdout
                });

                rl.question("do you really want to generate a new one ?)(yes/NO)", function(answer) {
                    if(/yes/i.test(answer)){
                        doGenerate(true);
                    }else{
                        console.log("will not generate a new one");

                    }
                    rl.close();
                });

                return;
            }
            cb(error, keyPath, crtPath);
        });
    }

};

module.exports = crtMgr;