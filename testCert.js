var certMgr = require("./lib/certMgr");

certMgr.clearCerts(function(){
	console.log(arguments);
});

certMgr.getCertificate("www.test3.com",function(){
	console.log(arguments);
});

certMgr.getCertificate("www.test2.com",function(){
	console.log(arguments);
});

certMgr.getCertificate("www.test3.com",function(){
	console.log(arguments);
});

certMgr.getCertificate("www.test3.com",function(){
	console.log(arguments);
});