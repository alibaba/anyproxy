var http= require("http");

var s = http.createServer(function(req,res) {
	var total = "";
	req.on("data",function(chunk){
		total += chunk;
	});

	req.on("end",function(){
		console.log(total);
	});

	console.log(req);
	// body...
});

s.listen(80);

