var https = require("https"),
	http  = require("http"),
	proxy = require("./proxy"),
	tunnel= require('tunnel'),
	tls   = require("tls");

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

module.exports.httpOverHttp = function(test){
	var testDesc    = "httpOverHttp",
        proxyServer = new proxy.proxyServer("http","8004");

	try{
		var test_option_http_over_http = {
		    host: "localhost",
		    port: 8004,
		    path: "/",
		    headers: {
		        Host: "www.baidu.com"
			}
		};

		http.get(test_option_http_over_http, function(res) {
			var data = "";
			res.on("data",function(chunk){
				data += chunk;
			});
			res.on("end",function(){
				proxyServer.close();
				test.ok(data.length > 50, testDesc);
			    test.done();
			});
		});
	}catch(e){
		console.log(e);
		test.ok(false,testDesc);
		test.done();
	}
}


module.exports.testHttpsOverHttp = function(test){
	var testDesc = "httpsOverHttp";
    var proxyServer = new proxy.proxyServer("http","8004");

    try{
	    var tunnelingAgent = tunnel.httpsOverHttp({
			proxy: {
				host: 'localhost',
				port: 8004
			}
	    });

	    var req = https.request({
			host: 'www.alipay.com',
			port: 443,
			agent: tunnelingAgent
	    },function(res){
	    	var data = "";
	    	res.on("data",function(chunk){
	    		data += chunk;
	    	});

	    	res.on("end",function(){
	    		proxyServer.close();
				test.ok(data.length > 50, testDesc);
			    test.done();
	    	});
	    });

	    req.end();
    	
    }catch(e){
    	console.log(e);
    	test.ok(false,testDesc);
    	test.done();
    }
}