const tls = require('tls');
const httpsServerMgr = require('../../lib/httpsServerMgr');

describe('httpsServerMgr', () => {
  let serverMgrInstance;

  beforeAll(async () => {
    serverMgrInstance = new httpsServerMgr({
      hostname: '127.0.0.1',
      handler: (req, res) => {
        res.end('hello world');
      },
      wsHandler: () => { },
    });
  });

  afterAll(async () => {
    await serverMgrInstance.close();
  });

  it('SNI server should work properly', async () => {
    const sniServerA = await serverMgrInstance.getSharedHttpsServer('a.anyproxy.io');
    const sniServerB = await serverMgrInstance.getSharedHttpsServer('b.anyproxy.io');

    expect(sniServerA).toEqual(sniServerB); // SNI - common server

    const connectHostname = 'some_new_host.anyproxy.io';
    const connectOpt = {
      servername: connectHostname, // servername is required for sni server
      rejectUnauthorized: false,
    }
    await new Promise((resolve, reject) => {
      const socketToSNIServer = tls.connect(sniServerA.port, '127.0.0.1', connectOpt, (tlsSocket) => {
        // console.log('client to SNI server connected, ', socketToSNIServer.authorized ? 'authorized' : 'unauthorized');
        const certSubject = socketToSNIServer.getPeerCertificate().subject;
        expect(certSubject.CN).toEqual(connectHostname);
        socketToSNIServer.end();
        resolve();
      });

      socketToSNIServer.on('keylog', line => {
        console.log(line);
      })
    });
  });

  it('IP server should work properly', async () => {
    const ipServerHost = '1.2.3.4';
    const anotherSNIServer = await serverMgrInstance.getSharedHttpsServer('c.anyproxy.io');
    const ipServerA = await serverMgrInstance.getSharedHttpsServer(ipServerHost);
    const ipServerB = await serverMgrInstance.getSharedHttpsServer('5.6.7.8');
    expect(ipServerA).not.toEqual(ipServerB);
    expect(anotherSNIServer).not.toEqual(ipServerA);

    const connectOpt = {
      rejectUnauthorized: false,
    }
    await new Promise((resolve, reject) => {
      const socketToIpServer = tls.connect(ipServerA.port, '127.0.0.1', connectOpt, () => {
        const certSubject = socketToIpServer.getPeerCertificate().subject;
        expect(certSubject.CN).toEqual(ipServerHost);
        socketToIpServer.end();
        resolve();
      });
    });
  });
});
