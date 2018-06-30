'use strict'

const color = require('colorful');
const util = require('./util');

let ifPrint = true;
let logLevel = 0;
const LogLevelMap = {
  tip: 0,
  system_error: 1,
  rule_error: 2,
  warn: 3,
  debug: 4,
};

function setPrintStatus(status) {
  ifPrint = !!status;
}

function setLogLevel(level) {
  logLevel = parseInt(level, 10);
}

function printLog(content, type) {
  if (!ifPrint) {
    return;
  }

  const timeString = util.formatDate(new Date(), 'YYYY-MM-DD hh:mm:ss');
  switch (type) {
    case LogLevelMap.tip: {
      if (logLevel > 0) {
        return;
      }
      console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.system_error: {
      if (logLevel > 1) {
        return;
      }
      console.error(color.red(`[AnyProxy ERROR][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.rule_error: {
      if (logLevel > 2) {
        return;
      }

      console.error(color.red(`[AnyProxy RULE_ERROR][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.warn: {
      if (logLevel > 3) {
        return;
      }

      console.error(color.yellow(`[AnyProxy WARN][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.debug: {
      console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
      return;
    }

    default : {
      console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
      break;
    }
  }
}

module.exports.printLog = printLog;

module.exports.debug = (content) => {
  printLog(content, LogLevelMap.debug);
};

module.exports.info = (content) => {
  printLog(content, LogLevelMap.tip);
};

module.exports.warn = (content) => {
  printLog(content, LogLevelMap.warn);
};

module.exports.error = (content) => {
  printLog(content, LogLevelMap.system_error);
};

module.exports.ruleError = (content) => {
  printLog(content, LogLevelMap.rule_error);
};

module.exports.setPrintStatus = setPrintStatus;
module.exports.setLogLevel = setLogLevel;
module.exports.T_TIP = LogLevelMap.tip;
module.exports.T_ERR = LogLevelMap.system_error;
module.exports.T_RULE_ERROR = LogLevelMap.rule_error;
module.exports.T_WARN = LogLevelMap.warn;
module.exports.T_DEBUG = LogLevelMap.debug;
