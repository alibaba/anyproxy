anyproxy
==========

## Intro
While there are lots of proxy written by nodejs in github, most of them can not handle users' HTTPS requests perfectly. A typical problem is that the browser will throw some warning like INVALID_CERTIFICATE when some https requests are sent. 

A simple and fast solution is to short the traffic between the user and the target server. That is to say, what the proxy do is to forward all the traffic of both sides, without intercepting or looking inside. 
This is useful when you want to establish a standard proxy and do some forwarding tasks. But this can also be useless when using as a debug tool.

To work as a debug tool of HTTPS, the proxy itself should do two things : intercept the request and cheat the browser with a valid certificate. This is what you know as the man-in-the-middle attack.

In order to have a browser-trusted certificate, we would sign certificates dynamically. The first thing to do is to generate a self-signed root CA and import to the system keychain. After trusting this CA, all child certs signed by it can be naturally trusted by the browser. 

What this proxy do is to generate and replace a temporary cert for any domain if neccessary. Using it, we can intercept all the https requests for debug. BTW, this is also what the charlse/fiddler do when you check the HTTPS_PROXY in preference settings.

## Feature
* can work as http or https proxy
* generate and intercept https requests for any domain without complaint by browser (only after you trust its root CA)

## How to use
### step 0 - setup env
* install NodeJS
* install [openssl](http://www.openssl.org/) , i.e. the command ``openssl`` should be exposed to your shell

### step 1 - clone codes
* Clone repo with ``https://github.com/ottomao/anyproxy.git``
* change working directory to http-proxy ``cd http-proxy``

### step 2 - generate a rootCA and trust it
* ``cd cert``
* run ``./gen-rootCA`` ,filling the necessary info according to the tip
* trust this rootCA. In OSX, just double-click rootCA.crt and add to system keychain
* ``cd ..``

### start server
* ``node bin.js`` , or use ``node bin.js --help`` for help



## Contact
Otto Mao
ottomao@gmail.com
