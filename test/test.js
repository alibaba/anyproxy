var proxy       = require("../proxy.js"),
    proxyTester = require("proxy-eval"),
    WebSocket   = require("ws");

//start a new proxy at port 8995, with websocket port 8996
var SOCKET_PORT = 8996,
    PROXY_PORT  = 8995;

new proxy.proxyServer({
    type       :"http",
    port       :PROXY_PORT,
    socketPort :SOCKET_PORT,
    silent     :true
});


exports.avalibility = function(test){
    test.expect(2);
    var updateCount = 0;

    //test web socket
    setTimeout(function(){
        var ws = new WebSocket('ws://127.0.0.1:' + SOCKET_PORT , {
           protocolVersion: 8
        });
         
        ws.on('open', function open(){});
        ws.on('close', function close(){});
        ws.on('message', function message(data, flags) {
            try{
                var jsonData = JSON.parse(data);
                jsonData.type == "update" && ++updateCount;
            }catch(e){}
        });
        setTimeout(function(){
            test.ok(updateCount >= 4,"web socket message count of type 'update' ");
            test.done();
            setTimeout(function(){
                process.exit();
            },1000);
        },10*1000);

    },1000);

    //test the basic availibility of proxy server
    setTimeout(function(){
        proxyTester.test({proxy : 'http://127.0.0.1:8995',reqTimeout:4500} ,function(results){
            var successCount = 0;
            results.map(function(item){
                item.success && ++successCount;
            });

            var ifPassed = (true || results.length == successCount);
            if(!ifPassed){
                proxyTester.printResult(results);
            }
            test.ok(ifPassed, "availibility test failed");
        });
    },1000);
};
