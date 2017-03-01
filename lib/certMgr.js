'use strict'

const util = require('./util');
const EasyCert = require('node-easy-cert');
const co = require('co');

const options = {
  rootDirPath: util.getAnyProxyPath('certificates'),
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

module.exports = crtMgr;
