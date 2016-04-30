var fs    = require('fs')
var forge = require('node-forge')
var rsa   = forge.pki.rsa

module.exports = function (domain, cb) {
  var subject = [{
    name: 'commonName',
    value: domain
  }, {
    name: 'countryName',
    value: 'CN'
  }, {
    shortName: 'ST',
    value: 'ZJ'
  }, {
    name: 'localityName',
    value: 'HZ'
  }, {
    name: 'organizationName',
    value: 'Alibaba'
  }, {
    shortName: 'OU',
    value: 'FE'
  }]

  //make csr
  var keypair   = rsa.generateKeyPair({bits: 1024, e: 0x10001})
  var csr       = forge.pki.createCertificationRequest()
  csr.publicKey = keypair.publicKey
  csr.setSubject(subject)
  csr.sign(keypair.privateKey, forge.md.sha256.create())

  var output_key = forge.pki.privateKeyToPem(keypair.privateKey)

  // Read CA cert and key
  var caCertPem = fs.readFileSync(__dirname + "/rootCA.crt", 'utf8')
  var caKeyPem  = fs.readFileSync(__dirname + "/rootCA.key", 'utf8')
  var caCert    = forge.pki.certificateFromPem(caCertPem)
  var caKey     = forge.pki.privateKeyFromPem(caKeyPem)
  var cert      = forge.pki.createCertificate()

  cert.serialNumber = 'C41C8AA3025C0808'

  var notBefore           = new Date()
  notBefore.setFullYear(notBefore.getFullYear() - 1)
  cert.validity.notBefore = notBefore

  var notAfter           = new Date()
  notAfter.setFullYear(notAfter.getFullYear() + 1)
  cert.validity.notAfter = notAfter

  // subject from CSR
  cert.setSubject(csr.subject.attributes)
  // issuer from CA
  cert.setIssuer(caCert.subject.attributes)

  cert.publicKey = csr.publicKey

  cert.sign(caKey, forge.md.sha256.create())

  var output_cert = forge.pki.certificateToPem(cert)

  cb(null, output_key, output_cert)
}
