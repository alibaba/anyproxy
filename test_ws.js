var WebSocket = require('ws');
var ws = new WebSocket('ws://127.0.0.1:8003/');

ws.on('open', function open() {
	console.log("open");
});

ws.on('message', function(data, flags) {
	console.log("new msg:");

	try{
		var dataObj = JSON.parse(data);
		console.log(dataObj);
		testBody(dataObj.content.id);
	}catch(e){}
});

function testBody(id){
	var reqData = {
		type:"reqBody",
		id:id
	};

	ws.send(JSON.stringify(reqData),{binary:false});
}

