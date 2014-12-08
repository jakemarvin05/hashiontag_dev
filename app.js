var express = require('express');

/* routes */
var routes = require('./routes/index');
var api = require('./routes/api');


var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
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

// Postgres Session Store
var pgSession = require('connect-pg-simple')(session)


var instaNode = require('instagram-node').instagram();
// //calvintwr
// instaNode.use({
//     client_id: '4a9652ccccb249f080062589a45abcbd',
//     client_secret: '1b39017f1b824f569c02ace3de52a665'
// });
//vogueverve
instaNode.use({
    client_id: '844863a3cde44828abd6fb9c36171807',
    client_secret: '828501c67ad643cca11109b4e728f735'
});
global.instaNode = instaNode;

var app = express();

app.use(favicon(__dirname + '/public/assets/favicon/favicon-160x160.png'));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
//app.enable('view cache');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(cookieParser('hashionhashion'));
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    store: new pgSession({
        conString: db.databaseUrl
    }),
    secret: '048B71B3349A1BC745B20BC923F0C82FCE9CE3FDE0F4DFD0F6A2CBFC34ACDC62',
    cookie: { maxAge: 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

//routing
app.use('/', routes);
app.use('/api', api);

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

var moment = require('moment');
//console.log time very 5 minutes
setInterval(function() {
    console.log(moment().format());
}, 300000);

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

global.ioSockets = ioSockets;

module.exports = app;

server.listen(3001, function() {
    console.log('Congrats, nothing broke!! Listening on port %d', server.address().port);
});

//instagram
var igg = require('./apps/instagram-grabber/iggMain.js');
//igg(5); //duration in minutes. use "no rerun" if running single instance.
//igg("no rerun");

//STREAM UPDATE
//TODO, shift this and instagram grabber into another app.
var streamUpdate = require('./apps/streamUpdate.js');
//var updateStreamEvery = 5; //5 minutes.
//streamUpdate();//initial run
// //interval
// setInterval(function() {
//     streamUpdate();
// }, updateStreamEvery*60*1000);