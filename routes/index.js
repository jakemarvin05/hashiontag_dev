var express = require('express');
var router = express.Router();
var sys = require('sys');



module.exports = router;

//online users-online app
var redis = require('redis');
var db = redis.createClient();

router.use( function (req, res, next) {
  var ua = req.headers['user-agent'];
  db.zadd('online', Date.now(), ua, next);
});

router.use( function (req, res, next) {
  var min = 60 * 1000;
  var ago = Date.now() - min;
  db.zrevrangebyscore('online', '+inf', ago, function (err,users) {
    if (err) return  next(err);
    req.online = users;
    next();
  });
});

// Render my homepage
router.get('/', function (req, res) {
  sys.puts(sys.inspect(req));
  res.render('index', { title: 'Hashionable', 
                        onlineCount: req.online.length
  });
});



/* GET home page. */
// router.get('/', function(req, res) {
  
// });