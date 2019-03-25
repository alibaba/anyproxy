const WebInterface = require('../../lib/webInterface.js');
const Recorder = require('../../lib/recorder');
const { directGet } = require('../util/HttpUtil.js');

describe('WebInterface server', () => {
  let webServer = null;
  let webHost = 'http://127.0.0.1:8002';

  beforeAll(() => {
    const recorder = new Recorder();
    webServer = new WebInterface({
      webPort: 8002,
    }, recorder);
  });

  afterAll(() => {
    webServer.close();
  });

  it('should support change CA extensions in /getQrCode', done => {
    const certFileTypes = ['crt', 'cer', 'pem', 'der'];
    const tasks = certFileTypes.map((type) => {
      return directGet(`${webHost}/api/getQrCode`, { type })
        .then(res => {
          const body = JSON.parse(res.body);
          expect(body.qrImgDom).toMatch('<img src="data:image/');
          expect(body.url).toBe(`${webHost}/fetchCrtFile?type=${type}`);
        });
    });

    Promise.all(tasks)
      .then(done)
      .catch(done);
  });

  it('should fallback to .crt file in /getQrCode', done => {
    directGet(`${webHost}/api/getQrCode`, { type: 'unkonw' })
      .then(res => {
        expect(JSON.parse(res.body).url).toBe(`${webHost}/fetchCrtFile?type=crt`);
        done();
      })
      .catch(done);
  });
});