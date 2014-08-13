var httpsServerMgr = require("./httpsServerMgr");


var instance = new httpsServerMgr();

instance.fetchPort("localhost",function(err,port){
	console.log(port);
});