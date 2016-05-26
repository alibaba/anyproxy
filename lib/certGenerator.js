var forge = require('node-forge');

var defaultAttrs = [
    { name: 'countryName', value: 'CN' },
    { name: 'organizationName', value: 'AnyProxy' },
    { shortName: 'ST', value: 'SH' },
    { shortName: 'OU', value: 'AnyProxy SSL Proxy'}
];

function getKeysAndCert(){
  var keys = forge.pki.rsa.generateKeyPair(1024);
  var cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 10); // 10 years
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10); // 10 years
  return {
    keys: keys,
    cert: cert
  };
}

function generateRootCA(){
  var keysAndCert = getKeysAndCert();
  keys = keysAndCert.keys;
  cert = keysAndCert.cert;

  var attrs = defaultAttrs.concat([
    {
      name: 'commonName',
      value: 'AnyProxy'
    }
  ]);
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.setExtensions([
    { name: 'basicConstraints', cA: true }
    // { name: 'keyUsage', keyCertSign: true, digitalSignature: true, nonRepudiation: true, keyEncipherment: true, dataEncipherment: true },
    // { name: 'extKeyUsage', serverAuth: true, clientAuth: true, codeSigning: true, emailProtection: true, timeStamping: true },
    // { name: 'nsCertType', client: true, server: true, email: true, objsign: true, sslCA: true, emailCA: true, objCA: true },
    // { name: 'subjectAltName', altNames: [ { type: 6, /* URI */ value: 'http://example.org/webid#me' }, { type: 7, /* IP */ ip: '127.0.0.1' } ] },
    // { name: 'subjectKeyIdentifier' }
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert)
  };

  return pem;
}

function generateCertsForHostname(domain, rootCAConfig){
  var keysAndCert = getKeysAndCert();
  keys = keysAndCert.keys;
  cert = keysAndCert.cert;

  var caCert    = forge.pki.certificateFromPem(rootCAConfig.cert)
  var caKey     = forge.pki.privateKeyFromPem(rootCAConfig.key)

  // issuer from CA
  cert.setIssuer(caCert.subject.attributes)

  var attrs = defaultAttrs.concat([
    {
      name: 'commonName',
      value: domain
    }
  ]);
  cert.setSubject(attrs);
  cert.sign(caKey, forge.md.sha256.create());

  return {
    privateKey: forge.pki.privateKeyToPem(keys.privateKey),
    publicKey: forge.pki.publicKeyToPem(keys.publicKey),
    certificate: forge.pki.certificateToPem(cert)
  };
}

module.exports.generateRootCA = generateRootCA;
module.exports.generateCertsForHostname = generateCertsForHostname;
