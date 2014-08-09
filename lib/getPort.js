var portrange = 40000;

function getPort(cb) {
    var port = portrange;
    ++portrange;
 
    var server = require("net").createServer();
    server.listen(port, function (err) {
        server.once('close', function () {
            cb(port);
        });
        server.close();
    });
    server.on('error', function (err) {
        getPort(cb);
    });
};

module.exports = getPort;