'use strict';
const color = require('colorful');

let ifPrint = true;
const logLevel = {
    tip: 0,
    error: 1
};

function setPrintStatus(status){
    ifPrint = !!status;
}

function printLog(content,type){
    if(!ifPrint) {
        return;
    }

    var tip = content;
    switch (type) {
    case logLevel.tip: {
        console.log(color.cyan('[AnyProxy Log]: ' + content));
        break;
    }

    case logLevel.error: {
        console.error(color.red('[AnyProxy error]: ' + content));
        break;
    }

    default : {
        console.log(color.cyan('[AnyProxy Log]: ' + content));
        break;
    }
    }
}

module.exports.printLog       = printLog;
module.exports.setPrintStatus = setPrintStatus;
module.exports.T_TIP          = logLevel.tip;
module.exports.T_ERR          = logLevel.error;