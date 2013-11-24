var http = require('http');
var net = require('net');

var through = require('through');


var is_0_10 = /^v0\.10\.\d+$/.test(process.version);

module.exports.startServer = function startServer(handler, opts) {
    var server = http.createServer();
    server.on('connection', function(stream) {
        var bypass = stream._bypass = through();
        bypass.pause();
        stream._handled = false;
        polyfill(stream, bypass);
    });

    server.on('upgrade', handle_inbound);
    server.on('request', handle_inbound);

    server.listen(opts.port);
    return server;

    function handle_inbound(req, res) {
        if (req.connection._handled) return;
        req.connection._handled = true;

        var bypass = req.connection._bypass;
        var port = handler(req, res);
        if (!port) {
            return;
        }

        var remote = net.connect(port);

        function destroy() {
            bypass.destroy();
            remote.destroy();
        }
        bypass.on('error', destroy);
        remote.on('error', destroy);

        bypass.pipe(remote).pipe(req.connection);
        bypass.resume();
    }
};

function polyfill(stream, bypass) {
    if (!is_0_10) {
        stream.pipe(src);
        return;
    }

    var orig_ondata = stream.ondata;
    var orig_onend = stream.onend;

    stream.ondata = function(buffer, i, j) {
        var res = orig_ondata(buffer, i, j);
        bypass.write(buffer.slice(i, j));
        return res;
    };

    stream.onend = function() {
        var res = orig_onend();
        bypass.end();
        return res;
    };

    stream.on('data', bypass.write.bind(bypass));
    stream.on('end', bypass.end.bind(bypass));
}

