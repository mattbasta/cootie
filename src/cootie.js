var fs = require('fs');
var path = require('path');

var async = require('async');
var forever = require('forever');
var utile = require('utile');

var proxy = require('./proxy');
var utils = require('./utils');

var cootie = {};

cootie.root = path.join(process.env.HOME || process.env.USERPROFILE || '/root', '.cootie');
cootie.config_file = path.join(cootie.root, 'config.json');
cootie.config = {};

if (!fs.existsSync(cootie.root)) {
    try {
        fs.mkdirSync(cootie.root, '0755');
    } catch(e) {}
}
if (fs.existsSync(cootie.config_file)) {
    cootie.config = JSON.parse(fs.readFileSync(cootie.config_file).toString());
}


var hosts = {};
var instances = [];

function startApp(app, cb) {
    var uid = utile.randomString(4).replace(/^\-/, '_');
    console.log('Starting app ' + app.script + ' with uid ' + uid);
    utils.getPort(app.port, _start);

    function _start(port) {
        var instance = forever.startDaemon([app.script], {
            silent: true,
            env: {PORT: port},
            cwd: path.dirname(app.script),
            uid: uid
        });
        instance.uid = uid;
        instance.app = app;
        for (var i = 0, host; host = app.hosts[i++];) {
            hosts[host] = port;
        }

        instance.on('exit', function() {
            console.warn('Script has exited: ' + app.script);
        });
        instances.push(instance);
        cb();
    }
}

cootie.start = function start() {
    var apps = cootie.config['apps'] || [];
    async.eachSeries(apps, startApp, _daemon);
};

function _daemon() {
    var server = proxy.startServer(function(req, res) {
        if (!(req.headers.host in hosts)) {
            res.statusCode = 404;
            res.end('Hostname could not be resolved.');
            return 0;
        }
        return hosts[req.headers.host];
    }, {port: cootie.config['port'] || 80});
    console.log('Server started.');

    process.on('exit', function() {
        server.close();
        for (var i = 0; i < instances.length; i++) {
            forever.stop(instances[i].uid);
        }
    });
}

cootie.addApp = function addApp(app) {
    var apps = cootie.config['apps'] || [];
    for (var i = 0; i < apps.length; i++) {
        if (apps[i].script === app.script) {
            console.log('App with same path already registered.');
            return;
        }
        if (apps[i].port === app.port) {
            console.log('App `' + apps[i].script + '` already registered on that port.');
            return;
        }
    }
    apps.push(app);
    cootie.config['apps'] = apps;
    cootie.save();
};


cootie.save = function save() {
    fs.writeFile(
        cootie.config_file,
        JSON.stringify(cootie.config),
        function(err) {
            if (err) {
                console.error('Could not save cootie data: ', err);
                return;
            }
        }
    );
};


module.exports = cootie;

