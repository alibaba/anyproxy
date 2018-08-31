'use strict';

// (function (): void {
// const fs = require('fs'),
//   path = require('path'),
//   mime = require('mime-types'),
//   color = require('colorful'),
//   crypto = require('crypto'),
//   Buffer = require('buffer').Buffer,
//   logUtil = require('./log');
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';
import * as color from 'colorful';
import { Buffer } from 'buffer';
import { execSync } from 'child_process';
import logUtil from './log';
import * as os from 'os';
import { IncomingHttpHeaders } from 'http';

const networkInterfaces = os.networkInterfaces();

// {"Content-Encoding":"gzip"} --> {"content-encoding":"gzip"}
function lower_keys(obj: object): object {
  for (const key in obj) {
    const val = obj[key];
    delete obj[key];

    obj[key.toLowerCase()] = val;
  }

  return obj;
}

function merge(baseObj: object, extendObj: object): object {
  for (const key in extendObj) {
    baseObj[key] = extendObj[key];
  }

  return baseObj;
}

function getUserHome(): string {
  return process.env.HOME || process.env.USERPROFILE;
}

function getAnyProxyHome(): string {
  const home = path.join(getUserHome(), '/.anyproxy/');
  if (!fs.existsSync(home)) {
    fs.mkdirSync(home);
  }
  return home;
}

function getAnyProxyPath(pathName: string): string {
  const home = getAnyProxyHome();
  const targetPath = path.join(home, pathName);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }
  return targetPath;
}

/**
 * 简易字符串render替换
 */
function simpleRender(str: string, object: object, regexp: RegExp): string {
  return String(str).replace(regexp || (/\{\{([^{}]+)\}\}/g), (match, name) => {
    if (match.charAt(0) === '\\') {
      return match.slice(1);
    }
    return (object[name] != null) ? object[name] : '';
  });
}

/**
 * 读取指定目录下的子目录
 */
function filewalker(root: string, cb: (err: Error, result: any) => void): void {
  root = root || process.cwd();

  const ret = {
    directory: [],
    file: [],
  };

  fs.readdir(root, (err, list) => {
    if (list && list.length) {
      list.map((item) => {
        const fullPath = path.join(root, item);
        const stat = fs.lstatSync(fullPath);

        if (stat.isFile()) {
          ret.file.push({
            name: item,
            fullPath,
          });
        } else if (stat.isDirectory()) {
          ret.directory.push({
            name: item,
            fullPath,
          });
        }
      });
    }

    cb && cb.apply(null, [null, ret]);
  });
}

/*
* 获取文件所对应的content-type以及content-length等信息
* 比如在useLocalResponse的时候会使用到
*/
function contentType(filepath: string): string {
  return mime.contentType(path.extname(filepath)) || '';
}

/*
* 读取file的大小，以byte为单位
*/
function contentLength(filepath: string): number {
  try {
    const stat = fs.statSync(filepath);
    return stat.size;
  } catch (e) {
    logUtil.printLog(color.red('\nfailed to ready local file : ' + filepath));
    logUtil.printLog(color.red(e));
    return 0;
  }
}

/*
* remove the cache before requiring, the path SHOULD BE RELATIVE TO UTIL.JS
*/
function freshRequire(modulePath: string): NodeModule {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
}

/*
* format the date string
* @param date Date or timestamp
* @param formatter YYYYMMDDHHmmss
*/
function formatDate(date: Date | number, formatter: string): string {
  let finalDate: Date;
  if (typeof date !== 'object') {
    finalDate = new Date(date);
  } else {
    finalDate = date;
  }
  const transform = function(value: number): string {
    return value < 10 ? '0' + value : '' + value;
  };
  return formatter.replace(/^YYYY|MM|DD|hh|mm|ss/g, (match) => {
    switch (match) {
      case 'YYYY':
        return transform(finalDate.getFullYear());
      case 'MM':
        return transform(finalDate.getMonth() + 1);
      case 'mm':
        return transform(finalDate.getMinutes());
      case 'DD':
        return transform(finalDate.getDate());
      case 'hh':
        return transform(finalDate.getHours());
      case 'ss':
        return transform(finalDate.getSeconds());
      default:
        return '';
    }
  });
}

/**
* get headers(Object) from rawHeaders(Array)
* @param rawHeaders  [key, value, key2, value2, ...]

*/

function getHeaderFromRawHeaders(rawHeaders: string[]): IncomingHttpHeaders {
  const headerObj = {};
  const handleSetCookieHeader = function(key: string, value: string): void {
    if (headerObj[key].constructor === Array) {
      headerObj[key].push(value);
    } else {
      headerObj[key] = [headerObj[key], value];
    }
  };

  if (!!rawHeaders) {
    for (let i = 0; i < rawHeaders.length; i += 2) {
      const key = rawHeaders[i];
      let value = rawHeaders[i + 1];

      if (typeof value === 'string') {
        value = value.replace(/\0+$/g, ''); // 去除 \u0000的null字符串
      }

      if (!headerObj[key]) {
        headerObj[key] = value;
      } else {
        // headers with same fields could be combined with comma. Ref: https://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
        // set-cookie should NOT be combined. Ref: https://tools.ietf.org/html/rfc6265
        if (key.toLowerCase() === 'set-cookie') {
          handleSetCookieHeader(key, value);
        } else {
          headerObj[key] = headerObj[key] + ',' + value;
        }
      }
    }
  }
  return headerObj;
}

function getAllIpAddress(): string[] {
  const allIp = [];

  Object.keys(networkInterfaces).map((nic) => {
    networkInterfaces[nic].filter((detail) => {
      if (detail.family.toLowerCase() === 'ipv4') {
        allIp.push(detail.address);
      }
    });
  });

  return allIp.length ? allIp : ['127.0.0.1'];
}

function deleteFolderContentsRecursive(dirPath: string, ifClearFolderItself: boolean): void {
  if (!dirPath.trim() || dirPath === '/') {
    throw new Error('can_not_delete_this_dir');
  }

  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderContentsRecursive(curPath, true);
      } else { // delete all files
        fs.unlinkSync(curPath);
      }
    });

    if (ifClearFolderItself) {
      try {
        // ref: https://github.com/shelljs/shelljs/issues/49
        const start = Date.now();
        while (true) {
          try {
            fs.rmdirSync(dirPath);
            break;
          } catch (er) {
            if (process.platform === 'win32' && (er.code === 'ENOTEMPTY' || er.code === 'EBUSY' || er.code === 'EPERM')) {
              // Retry on windows, sometimes it takes a little time before all the files in the directory are gone
              if (Date.now() - start > 1000) {
                throw er;
              }
            } else if (er.code === 'ENOENT') {
              break;
            } else {
              throw er;
            }
          }
        }
      } catch (e) {
        throw new Error('could not remove directory (code ' + e.code + '): ' + dirPath);
      }
    }
  }
}

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = require('net').createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, () => {
      const port = server.address().port;
      server.close(() => {
        resolve(port);
      });
    });
  });
}

function collectErrorLog(error: any): string {
  if (error && error.code && error.toString()) {
    return error.toString();
  } else {
    let result = [error, error.stack].join('\n');
    try {
      const errorString = error.toString();
      if (errorString.indexOf('You may only yield a function') >= 0) {
        result = 'Function is not yieldable. Did you forget to provide a generator or promise in rule file ? '
          + '\nFAQ http://anyproxy.io/4.x/#faq';
      }
    } catch (e) { logUtil.error(e.stack); }
    return result;
  }
}

function isFunc(source: object): boolean {
  return source && Object.prototype.toString.call(source) === '[object Function]';
}

/**
* @param {object} content
* @returns the size of the content
*/
function getByteSize(content: Buffer | string): number {
  return Buffer.byteLength(content);
}

/*
* identify whether the
*/
function isIpDomain(domain: string): boolean {
  if (!domain) {
    return false;
  }
  const ipReg = /^\d+?\.\d+?\.\d+?\.\d+?$/;

  return ipReg.test(domain);
}

function execScriptSync(cmd: string): object {
  let stdout;
  let status = 0;
  try {
    stdout = execSync(cmd);
  } catch (err) {
    stdout = err.stdout;
    status = err.status;
  }

  return {
    stdout: stdout.toString(),
    status,
  };
}

function guideToHomePage(): void {
  logUtil.info('Refer to http://anyproxy.io for more detail');
}

const Util = {
  lower_keys,
  merge,
  getUserHome,
  contentType,
  getAnyProxyPath,
  getAnyProxyHome,
  simpleRender,
  filewalker,
  contentLength,
  freshRequire,
  getHeaderFromRawHeaders,
  getAllIpAddress,
  getFreePort,
  collectErrorLog,
  isFunc,
  isIpDomain,
  getByteSize,
  deleteFolderContentsRecursive,
  execScriptSync,
  guideToHomePage,
  formatDate,
};

export default Util;


