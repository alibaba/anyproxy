'use strict';

const fs = require('fs'),
  path = require('path'),
  mime = require('mime-types'),
  color = require('colorful'),
  child_process = require('child_process'),
  Buffer = require('buffer').Buffer,
  logUtil = require('./log');
const networkInterfaces = require('os').networkInterfaces();

// {"Content-Encoding":"gzip"} --> {"content-encoding":"gzip"}
module.exports.lower_keys = (obj) => {
  for (const key in obj) {
    const val = obj[key];
    delete obj[key];

    obj[key.toLowerCase()] = val;
  }

  return obj;
};

module.exports.merge = function (baseObj, extendObj) {
  for (const key in extendObj) {
    baseObj[key] = extendObj[key];
  }

  return baseObj;
};

function getUserHome() {
  return process.env.HOME || process.env.USERPROFILE;
}
module.exports.getUserHome = getUserHome;

function getAnyProxyHome() {
  const home = path.join(getUserHome(), '/.anyproxy/');
  if (!fs.existsSync(home)) {
    fs.mkdirSync(home);
  }
  return home;
}
module.exports.getAnyProxyHome = getAnyProxyHome;

module.exports.getAnyProxyPath = function (pathName) {
  const home = getAnyProxyHome();
  const targetPath = path.join(home, pathName);
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath);
  }
  return targetPath;
}

module.exports.simpleRender = function (str, object, regexp) {
  return String(str).replace(regexp || (/\{\{([^{}]+)\}\}/g), (match, name) => {
    if (match.charAt(0) === '\\') {
      return match.slice(1);
    }
    return (object[name] != null) ? object[name] : '';
  });
};

module.exports.filewalker = function (root, cb) {
  root = root || process.cwd();

  const ret = {
    directory: [],
    file: []
  };

  fs.readdir(root, (err, list) => {
    if (list && list.length) {
      list.map((item) => {
        const fullPath = path.join(root, item),
          stat = fs.lstatSync(fullPath);

        if (stat.isFile()) {
          ret.file.push({
            name: item,
            fullPath
          });
        } else if (stat.isDirectory()) {
          ret.directory.push({
            name: item,
            fullPath
          });
        }
      });
    }

    cb && cb.apply(null, [null, ret]);
  });
};

/*
* 获取文件所对应的content-type以及content-length等信息
* 比如在useLocalResponse的时候会使用到
*/
module.exports.contentType = function (filepath) {
  return mime.contentType(path.extname(filepath));
};

/*
* 读取file的大小，以byte为单位
*/
module.exports.contentLength = function (filepath) {
  try {
    const stat = fs.statSync(filepath);
    return stat.size;
  } catch (e) {
    logUtil.printLog(color.red('\nfailed to ready local file : ' + filepath));
    logUtil.printLog(color.red(e));
    return 0;
  }
};

/*
* remove the cache before requiring, the path SHOULD BE RELATIVE TO UTIL.JS
*/
module.exports.freshRequire = function (modulePath) {
  delete require.cache[require.resolve(modulePath)];
  return require(modulePath);
};

/*
* format the date string
* @param date Date or timestamp
* @param formatter YYYYMMDDHHmmss
*/
module.exports.formatDate = function (date, formatter) {
  if (typeof date !== 'object') {
    date = new Date(date);
  }
  const transform = function (value) {
    return value < 10 ? '0' + value : value;
  };
  return formatter.replace(/^YYYY|MM|DD|hh|mm|ss/g, (match) => {
    switch (match) {
      case 'YYYY':
        return transform(date.getFullYear());
      case 'MM':
        return transform(date.getMonth() + 1);
      case 'mm':
        return transform(date.getMinutes());
      case 'DD':
        return transform(date.getDate());
      case 'hh':
        return transform(date.getHours());
      case 'ss':
        return transform(date.getSeconds());
      default:
        return ''
    }
  });
};


/**
* get headers(Object) from rawHeaders(Array)
* @param rawHeaders  [key, value, key2, value2, ...]

*/

module.exports.getHeaderFromRawHeaders = function (rawHeaders) {
  const headerObj = {};
  const _handleSetCookieHeader = function (key, value) {
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
          _handleSetCookieHeader(key, value);
        } else {
          headerObj[key] = headerObj[key] + ',' + value;
        }
      }
    }
  }
  return headerObj;
};

module.exports.getAllIpAddress = function getAllIpAddress() {
  const allIp = [];

  Object.keys(networkInterfaces).map((nic) => {
    networkInterfaces[nic].filter((detail) => {
      if (detail.family.toLowerCase() === 'ipv4') {
        allIp.push(detail.address);
      }
    });
  });

  return allIp.length ? allIp : ['127.0.0.1'];
};

function deleteFolderContentsRecursive(dirPath, ifClearFolderItself) {
  if (!dirPath.trim() || dirPath === '/') {
    throw new Error('can_not_delete_this_dir');
  }

  logUtil.info('==>>> clearing cache ', dirPath);

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
              if (Date.now() - start > 1000) throw er;
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

module.exports.deleteFolderContentsRecursive = deleteFolderContentsRecursive;

module.exports.getFreePort = function () {
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

module.exports.collectErrorLog = function (error) {
  if (error && error.code && error.toString()) {
    return error.toString();
  } else {
    let result = [error, error.stack].join('\n');
    try {
      const errorString = error.toString();
      if (errorString.indexOf('You may only yield a function') >= 0) {
        result = 'Function is not yieldable. Did you forget to provide a generator or promise in rule file ? \nFAQ http://anyproxy.io/4.x/#faq';
      }
    } catch (e) {}
    return result
  }
}

module.exports.isFunc = function (source) {
  return source && Object.tostring.call(source) === '[object Function]';
};

/**
* @param {object} content
* @returns the size of the content
*/
module.exports.getByteSize = function (content) {
  return Buffer.byteLength(content);
};

/*
* identify whether the
*/
module.exports.isIpDomain = function (domain) {
  if (!domain) {
    return false;
  }
  const ipReg = /^\d+?\.\d+?\.\d+?\.\d+?$/;

  return ipReg.test(domain);
};

module.exports.execScriptSync = function (cmd) {
  let stdout,
    status = 0;
  try {
    stdout = child_process.execSync(cmd);
  } catch (err) {
    stdout = err.stdout;
    status = err.status;
  }

  return {
    stdout: stdout.toString(),
    status
  };
};

module.exports.guideToHomePage = function () {
  logUtil.info('Refer to http://anyproxy.io for more detail');
};
