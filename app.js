var express = require('express');
/* routes */
var routes = require('./routes/index');
var users = require('./routes/users');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//dev utilities
//var sys = require('sys');
//var util = require('util');

var cons = require('consolidate');

/* sequelize */
var db = require('./models');
global.db = db;
var Promise = require('bluebird');
global.Promise = Promise;

/* passport and its friends */
var passport = require('passport');
//flash messages is deprecated.
//var flash = require('connect-flash');
var session = require('express-session');

var instaNode = require('instagram-node').instagram();
instaNode.use({ client_id: '4a9652ccccb249f080062589a45abcbd',
         client_secret: '1b39017f1b824f569c02ace3de52a665' });
global.instaNode = instaNode;

var igg = require('./apps/instagram-grabber/iggMain.js');
igg();

var app = express();
app.use(favicon(__dirname + '/public/assets/favicon/favicon-160x160.png'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
//app.enable('view cache'); //enable this and the page rendering speed will blow dust in your face.


app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('hashionhashion'));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({ secret: 'hashionhashion' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
//app.use(flash()); // DEPRECATED: use connect-flash for flash messages stored in session

//routing
app.use('/', routes);
app.use('/users', users);

//safari caching bug.
//disabling etag takes away some performance gains.
//more on this issue: https://github.com/jshttp/fresh/issues/8
//app.disable('etag');



/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


//start the server
var server = require('http').Server(app);

var io = require('socket.io')(server);
var ioSockets = {};

io.on('connection', function(socket) {

    ioSockets[socket.id] = socket;

    socket.emit('welcome', {message: socket.id});

    socket.on('disconnect', function(socket) {
        delete ioSockets[socket.id];
    });
});

//uncomment if we need to export io instance
//exports.io = io;
global.ioSockets = ioSockets;

module.exports = app;

server.listen(3001, function() {
    console.log('Congrats, nothing broke!! Listening on port %d', server.address().port);
});

var moment = require('moment');
//console.log time very 5 minutes
setInterval(function() {
    console.log(moment().format());
}, 300000);
