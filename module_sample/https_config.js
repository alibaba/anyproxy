const AnyProxy = require('../proxy');
const exec = require('child_process').exec;

if (!AnyProxy.utils.certMgr.ifRootCAFileExists()) {
  AnyProxy.utils.certMgr.generateRootCA((error, keyPath) => {
    // let users to trust this CA before using proxy
    if (!error) {
      const certDir = require('path').dirname(keyPath);
      console.log('The cert is generated at', certDir);
      const isWin = /^win/.test(process.platform);
      if (isWin) {
        exec('start .', { cwd: certDir });
      } else {
        exec('open .', { cwd: certDir });
      }
    } else {
      console.error('error when generating rootCA', error);
    }
  });
} else {
  // clear all the certificates
  // AnyProxy.utils.certMgr.clearCerts()
}
