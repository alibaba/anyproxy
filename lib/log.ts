'use strict';

import * as color from 'colorful';
import util from './util';

let ifPrint = true;
let logLevel = 0;
enum LogLevelMap {
  tip = 0,
  system_error = 1,
  error = 1,
  rule_error = 2,
  warn = 3,
  debug = 4,
};

function setPrintStatus(status: boolean): void {
  ifPrint = !!status;
}

function setLogLevel(level: string): void {
  logLevel = parseInt(level, 10);
}

function printLog(content: string, type?: LogLevelMap) {
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

      console.error(color.magenta(`[AnyProxy WARN][${timeString}]: ` + content));
      break;
    }

    case LogLevelMap.debug: {
      console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
      return;
    }

    default: {
      console.log(color.cyan(`[AnyProxy Log][${timeString}]: ` + content));
      break;
    }
  }
}

module.exports.printLog = printLog;

function debug (content): void {
  printLog(content, LogLevelMap.debug);
};

function info (content): void {
  printLog(content, LogLevelMap.tip);
};

function warn (content) {
  printLog(content, LogLevelMap.warn);
};

function error (content) {
  printLog(content, LogLevelMap.system_error);
};

function ruleError (content) {
  printLog(content, LogLevelMap.rule_error);
};

module.exports.setPrintStatus = setPrintStatus;
module.exports.setLogLevel = setLogLevel;
module.exports.T_TIP = LogLevelMap.tip;
module.exports.T_ERR = LogLevelMap.system_error;
module.exports.T_RULE_ERROR = LogLevelMap.rule_error;
module.exports.T_WARN = LogLevelMap.warn;
module.exports.T_DEBUG = LogLevelMap.debug;

const LogUtil = {
  setPrintStatus,
  setLogLevel,
  printLog,
  debug,
  info,
  warn,
  error,
  ruleError,
  T_TIP: LogLevelMap.tip,
  T_ERR: LogLevelMap.error,
  T_RULE_ERROR: LogLevelMap.rule_error,
  T_WARN: LogLevelMap.warn,
  T_DEBUG: LogLevelMap.debug,
};

exports.LogUtil = LogUtil;
export default LogUtil;
