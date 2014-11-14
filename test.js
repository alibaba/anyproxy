var tester = require("proxy-eval"),
    proxy  = require("./proxy.js");

new proxy.proxyServer({
	type:"http"
});

setTimeout(function(){
	tester.test( {proxy : 'http://127.0.0.1:8001',reqTimeout:3000} ,function(results){
		tester.printResult(results);
	    process.exit();
	});
},2000);