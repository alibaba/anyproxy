'use strict';

import * as EasyCert from 'node-easy-cert';
import * as co from 'co';
import * as os from 'os';
import * as inquirer from 'inquirer';
import util from './util';
import logUtil from './log';

declare interface ICertMgr {
  generateRootCA?: ( cb: (error: boolean, keyPath: string, crtPath: string) => void ) => void;
  getCAStatus?: () => Generator;
  trustRootCA?: () => Generator;
  getRootCAFilePath?: () => string;
  ifRootCAFileExists?: () => boolean;
  isRootCAFileExists?: () => boolean;
  getRootDirPath?: () => string;
  getCertificate?: (serverName: string, cb: (err: Error, key: string, crt: string) => void) => void;
}

const options = {
  rootDirPath: util.getAnyProxyPath('certificates'),
  inMemory: false,
  defaultCertAttrs: [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'AnyProxy' },
    { shortName: 'ST', value: 'SH' },
    { shortName: 'OU', value: 'AnyProxy SSL Proxy' },
  ],
};

const easyCert = new EasyCert(options);
const crtMgr: ICertMgr = util.merge({}, easyCert);

// rename function
crtMgr.ifRootCAFileExists = easyCert.isRootCAFileExists;

crtMgr.generateRootCA = function(cb: (error: boolean, keyPath: string, crtPath: string) => void): void {
  doGenerate(false);

  // set default common name of the cert
  function doGenerate(overwrite: boolean): void {
    const rootOptions = {
      commonName: 'AnyProxy',
      overwrite: !!overwrite,
    };

    easyCert.generateRootCA(rootOptions, (error, keyPath, crtPath) => {
      cb(error, keyPath, crtPath);
    });
  }
};

crtMgr.getCAStatus = function *(): Generator {
  return co(function *(): Generator {
    const result = {
      exist: false,
      trusted: undefined,
    };
    const ifExist = easyCert.isRootCAFileExists();
    if (!ifExist) {
      return result;
    } else {
      result.exist = true;
      if (!/^win/.test(process.platform)) {
        result.trusted = yield easyCert.ifRootCATrusted;
      }
      return result;
    }
  });
};

/**
 * trust the root ca by command
 */
crtMgr.trustRootCA = function *(): Generator {
  const platform = os.platform();
  const rootCAPath = crtMgr.getRootCAFilePath();
  const trustInquiry = [
    {
      type: 'list',
      name: 'trustCA',
      message: 'The rootCA is not trusted yet, install it to the trust store now?',
      choices: ['Yes', 'No, I\'ll do it myself'],
    },
  ];

  if (platform === 'darwin') {
    const answer = yield inquirer.prompt(trustInquiry);
    if (answer.trustCA === 'Yes') {
      logUtil.info('About to trust the root CA, this may requires your password');
      // https://ss64.com/osx/security-cert.html
      const result =
        (util.execScriptSync(`sudo security add-trusted-cert -d -k /Library/Keychains/System.keychain ${rootCAPath}`) as IExecScriptResult);
      if (result.status === 0) {
        logUtil.info('Root CA install, you are ready to intercept the https now');
      } else {
        console.error(result);
        logUtil.info('Failed to trust the root CA, please trust it manually');
        util.guideToHomePage();
      }
    } else {
      logUtil.info('Please trust the root CA manually so https interception works');
      util.guideToHomePage();
    }
  }


  if (/^win/.test(process.platform)) {
    logUtil.info('You can install the root CA manually.');
  }
  logUtil.info('The root CA file path is: ' + crtMgr.getRootCAFilePath());
};

export default crtMgr;
