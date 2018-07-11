'use strict'

const EasyCert = require('node-easy-cert');
const co = require('co');
const os = require('os');
const inquirer = require('inquirer');

const util = require('./util');
const logUtil = require('./log');

const options = {
  rootDirPath: util.getAnyProxyPath('certificates'),
  inMemory: false,
  defaultCertAttrs: [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'AnyProxy' },
    { shortName: 'ST', value: 'SH' },
    { shortName: 'OU', value: 'AnyProxy SSL Proxy' }
  ]
};

const easyCert = new EasyCert(options);
const crtMgr = util.merge({}, easyCert);

// rename function
crtMgr.ifRootCAFileExists = easyCert.isRootCAFileExists;

crtMgr.generateRootCA = function (cb) {
  doGenerate(false);

  // set default common name of the cert
  function doGenerate(overwrite) {
    const rootOptions = {
      commonName: 'AnyProxy',
      overwrite: !!overwrite
    };

    easyCert.generateRootCA(rootOptions, (error, keyPath, crtPath) => {
      cb(error, keyPath, crtPath);
    });
  }
};

crtMgr.getCAStatus = function *() {
  return co(function *() {
    const result = {
      exist: false,
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
}

/**
 * trust the root ca by command
 */
crtMgr.trustRootCA = function *() {
  const platform = os.platform();
  const rootCAPath = crtMgr.getRootCAFilePath();
  const trustInquiry = [
    {
      type: 'list',
      name: 'trustCA',
      message: 'The rootCA is not trusted yet, install it to the trust store now?',
      choices: ['Yes', "No, I'll do it myself"]
    }
  ];

  if (platform === 'darwin') {
    const answer = yield inquirer.prompt(trustInquiry);
    if (answer.trustCA === 'Yes') {
      logUtil.info('About to trust the root CA, this may requires your password');
      // https://ss64.com/osx/security-cert.html
      const result = util.execScriptSync(`sudo security add-trusted-cert -d -k /Library/Keychains/System.keychain ${rootCAPath}`);
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
}

module.exports = crtMgr;
