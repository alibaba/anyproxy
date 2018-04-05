/*
* test for rule replaceOption rule
*
*/
const util = require('../../lib/util');

describe('utils', () => {
  it('should get some free ports', done => {
    const count = 100;
    const tasks = [];
    for (let i = 1; i <= count; i++) {
      tasks.push(util.getFreePort());
    }
    Promise.all(tasks)
      .then((results) => {
        // ensure ports are unique
        const portMap = {};
        results.map((portNumber) => {
          portMap[portNumber] = true;
        });
        expect(Object.keys(portMap).length).toEqual(count);
        done();
      })
      .catch(done.fail);
  });
});
