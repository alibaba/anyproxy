http-proxy
==========

A nodejs proxy like charles/fiddler, which generates child certificates for all domains automatically. Any https requests can easily go through this proxy.

## how to use
### step 0 - setup env
* install NodeJS
* install [openssl](http://www.openssl.org/) , i.e. the command ``openssl`` should be exposed to your shell

### step 1 - clone codes
* Clone repo with ``git clone https://github.com/ottomao/http-proxy``
* change working directory to http-proxy ``cd http-proxy``

### step 2 - generate a rootCA and trust it
* ``cd cert``
* run ``./gen-rootCA`` ,filling the necessary info according to the tip
* trust this rootCA. In OSX, just double-click rootCA.crt and add to system keychain
* ``cd ..``

### start server
* ``node index.js``



## Contact
Otto Mao
ottomao@gmail.com
