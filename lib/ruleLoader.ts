'use strict';

import proxyUtil from './util';
import * as path from 'path';
import * as fs from 'fs';
import * as request from 'request';

const cachePath = proxyUtil.getAnyProxyPath('cache');

/**
 * download a file and cache
 *
 * @param {any} url
 * @returns {string} cachePath
 */
function cacheRemoteFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    request(url, (error, response, body) => {
      if (error) {
        return reject(error);
      } else if (response.statusCode !== 200) {
        return reject(`failed to load with a status code ${response.statusCode}`);
      } else {
        const fileCreatedTime = proxyUtil.formatDate(new Date(), 'YYYY_MM_DD_hh_mm_ss');
        const random = Math.ceil(Math.random() * 500);
        const fileName = `remote_rule_${fileCreatedTime}_r${random}.js`;
        const filePath = path.join(cachePath, fileName);
        fs.writeFileSync(filePath, body);
        resolve(filePath);
      }
    });
  });
}


/**
 * load a local npm module
 *
 * @param {any} filePath
 * @returns module
 */
function loadLocalPath(filePath: string): Promise<NodeJS.Module> {
  return new Promise((resolve, reject) => {
    const ruleFilePath = path.resolve(process.cwd(), filePath);
    if (fs.existsSync(ruleFilePath)) {
      resolve(require(ruleFilePath));
    } else {
      resolve(require(filePath));
    }
  });
}


/**
 * load a module from url or local path
 *
 * @param {any} urlOrPath
 * @returns module
 */
function requireModule(urlOrPath: string): Promise<NodeJS.Module> {
  return new Promise((resolve, reject) => {
    if (/^http/i.test(urlOrPath)) {
      resolve(cacheRemoteFile(urlOrPath));
    } else {
      resolve(urlOrPath);
    }
  }).then((localPath: string) => loadLocalPath(localPath));
}

module.exports = {
  cacheRemoteFile,
  loadLocalPath,
  requireModule,
};
