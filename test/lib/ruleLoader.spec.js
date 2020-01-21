const ruleLoader = require('../../lib/ruleLoader');
const fs = require('fs');
const path = require('path');

const localModulePath = path.join(__dirname, '../fixtures/someRule.js');
describe('ruleLoader', () => {
  it('should successfully cache a remote file', async () => {
    await ruleLoader.cacheRemoteFile('https://cdn.bootcss.com/lodash.js/4.16.4/lodash.min.js')
      .then(filePath => {
        let content;
        if (filePath) {
          content = fs.readFileSync(filePath, { encoding: 'utf8' });
        }
        expect(content && content.length > 100).toBe(true);
      });
  });

  it('should load a local module ../util/CommonUtil', async () => {
    await ruleLoader.loadLocalPath(localModulePath)
      .then(module => {
        expect(module.foo).not.toBeUndefined();
      });
  });

  it('should smart load a remote module', done => {
    ruleLoader.requireModule('https://cdn.bootcss.com/lodash.js/4.16.4/lodash.min.js')
      .then(module => {
        expect(module.VERSION).toEqual('4.16.4');
        done();
      })
      .catch(done.fail);
  });

  it('should smart load a local module', done => {
    ruleLoader.requireModule(localModulePath)
      .then(module => {
        expect(module.foo).not.toBeUndefined();
        done();
      })
      .catch(done.fail);
  });
});
