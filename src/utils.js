var net = require('net');


function testPort(port, cb) {
    try {
        var server = net.createServer(function(sock) {
            sock.end();
            server.close();
            cb(true);
        });
        server.on('error', function(err) {
            cb(false);
        });
        server.listen(port, '127.0.0.1', 1, function() {
            server.close();
            cb(true);
        });
    } catch(e) {
        cb(false);
    }
}

module.exports.getPort = function(default_, cb) {
    var position = default_;
    function doPortTest(result) {
        if (result) {
            cb(position);
        } else {
            position++;
            testPort(position, doPortTest);
        }
    }
    testPort(position, doPortTest);
};

