const util = require('../../lib/util');

describe('utils', () => {
  it('getFreePort', async () => {
    const count = 100;
    const tasks = [];
    for (let i = 1; i <= count; i++) {
      tasks.push(util.getFreePort());
    }
    await Promise.all(tasks)
      .then((results) => {
        // ensure ports are unique
        const portMap = {};
        results.map((portNumber) => {
          portMap[portNumber] = true;
        });
        expect(Object.keys(portMap).length).toEqual(count);
      });
  });
});
