'use strict';
const color = require('colorful');
const util = require('./util');

let ifPrint = true;
let logLevel = 0;
const LogLevelMap = {
    tip: 0,
    system_error: 1,
    rule_error: 2
};

function setPrintStatus(status){
    ifPrint = !!status;
}

function setLogLevel (level) {
    logLevel = parseInt(level);
}

function printLog(content,type){
    if(!ifPrint) {
        return;
    }

    const timeString = util.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss');

    switch (type) {
        case LogLevelMap.type: {
            if (logLevel < 0) {
                return;
            }
            console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
            break;
        }

        case LogLevelMap.system_error: {
            if (logLevel < 1) {
                return;
            }
            console.error(color.red(`[AnyProxy ERROR][${timeString}]: ` + content));
            break;
        }

        case LogLevelMap.rule_error: {
            if (logLevel < 2) {
                return;
            }

            console.error(color.red(`[AnyProxy RULE_ERROR] [${timeString}]: ` + content));
            break;
        }

        default : {
            console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
            break;
        }
    }
}

module.exports.printLog       = printLog;
module.exports.setPrintStatus = setPrintStatus;
module.exports.setLogLevel    = setLogLevel;
module.exports.T_TIP          = logLevel.tip;
module.exports.T_ERR          = logLevel.system_error;
module.exports.T_RULE_ERROR   = logLevel.rule_error;