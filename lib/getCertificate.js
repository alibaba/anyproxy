const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const util = require('./util');

const CERT_ROOT = util.getAnyProxyPath('certificates');

function generateForHost(domain, altName, caCert, privateKey, serial, callback) {
  const privateCAKey = forge.pki.privateKeyFromPem(privateKey);
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  caCert = forge.pki.certificateFromPem(caCert);

  cert.publicKey = keys.publicKey;
  cert.serialNumber = serial.toString();
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setDate(cert.validity.notBefore.getDate() - 1);
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 2);
  const attrs = [
    {
      name: 'commonName',
      value: domain,
    },
    {
      name: 'organizationName',
      value: 'Eden Proxy Authority',
    },
  ];

  cert.setSubject(attrs);
  cert.setIssuer(caCert.subject.attributes);
  cert.setExtensions([
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          //      type: 6, // URI
          value: altName,
        },
      ],
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
    },
  ]);

  cert.sign(privateCAKey, forge.md.sha256.create());

  // PEM-format keys and cert
  const pem = {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert),
  };

  callback(null, pem);
}

const CA_CERT_PATH = path.resolve(CERT_ROOT, 'rootCA.crt');
const CA_KEY_PATH = path.resolve(CERT_ROOT, 'rootCA.key');

let caCert, caKey;

function getCertificate(hostname, callback) {
  if (typeof caCert === 'undefined') {
    caCert = fs.readFileSync(CA_CERT_PATH);
    caKey = fs.readFileSync(CA_KEY_PATH);
  }

  const serialNumber = Math.floor(Math.random() * 1000000);

  generateForHost(hostname, hostname, caCert, caKey, serialNumber, (err, result) => {
    if (err) {
      callback(err);
    } else {
      callback(err, result.privateKey, result.certificate);
    }
  });
}

module.exports = {
  getCertificate,
};
