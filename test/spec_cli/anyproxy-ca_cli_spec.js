'use strict';

const path = require('path');
const childProcess = require('child_process');

const pkg = require('../../package');

const binFile = path.resolve(pkg.bin['anyproxy-ca']);

// TODO: more cases are wanted
describe('anyproxy line tool test', () => {
  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000;
  });
  it('should check the ca status', done => {
    childProcess.execFile(binFile, [''], (error, stdout, stderr) => {
      if (error) {
        console.error(error);
        done.fail('anyproxy-ca failed');
      }
      // If the cert is already generated, the cli will print the info,
      // If the cert is not generated, the cli will prompt to install, also contains the `AnyProxy CA/
      expect(stdout).toMatch(/AnyProxy CA/);
      done();
    })
  });
});
