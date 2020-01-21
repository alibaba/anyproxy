const httpsServerMgr = require('../../lib/httpsServerMgr');

describe('httpsServerMgr', () => {
  it('get https server', async () => {
    const serverMgr = new httpsServerMgr({
      hostname: '127.0.0.1',
      handler: () => {
        console.log('this is handler');
      },
      wsHandler: () => {
        console.log('this is handler');
      },
    });
    await serverMgr.getSharedHttpsServer();
    serverMgr.close();
  });
});
