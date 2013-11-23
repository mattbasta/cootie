var fs = require('fs');
var path = require('path');

var bouncy = require('bouncy');
var forever = require('forever');

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

function startApp(app) {
    var instance = forever.startDaemon([app.script], {
        silent: true,
        env: {PORT: app.port},
        cwd: path.dirname(app.script)
    });
    instance.app = app;
    for (var i = 0, host; host = app.hosts[i++];) {
        hosts[host] = app.port;
    }

    instance.on('exit', function() {
        console.warn('Script has exited: ' + app.script);
    });
    instances.push(instance);
}

cootie.start = function start() {
    var apps = cootie.config['apps'] || [];
    for (var i = 0, app; app = apps[i++];) {
        console.log('Starting app ' + app.script);
        startApp(app);
    }

    var server = bouncy(function(req, res, bounce) {
        if (req.headers.host in hosts) {
            bounce(hosts[req.headers.host]);
            return;
        }
        res.statusCode = 404;
        res.end('Hostname could not be resolved.');
    });
    server.listen(cootie.config['port'] || 80);
    console.log('Server started.');
};

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

