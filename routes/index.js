var express = require('express');
var router = express.Router();
//var sys = require('sys');
var meta = require('../apps/meta.js');

//passport
var passport = require('passport');
require('../apps/passport/passport_cfg.js')(passport);
var isLoggedIn = require('../apps/passport/isLoggedIn.js');

// sequelize
var db = require('../models');

// globalJSON
var gJSON = require('../apps/globalJSON.js');
gJSON = gJSON(); //compile the object.

module.exports = router;

// Homepage
router.get('/', function(req, res) {
  //sys.puts(sys.inspect(req));

  //res.send(stream)
  res.render('index', { 
    title: meta.header(),
    isLoggedIn: isLoggedIn(req),
    gJSON: gJSON,
    p: gJSON.paths,
    streamJSON: ''
  });

});

/* signup, LOGINS LOGOUTS */
router.get('/signup', function(req, res) {
  res.render('signup', { 
    title: meta.header(),
    gJSON: gJSON,
    p: gJSON.paths,
    message: req.flash('signupMessage'),
    
    //scripts required
    sValidator: true,
    sSignup: true
  });
});

router.post('/signup', 
  passport.authenticate('local-signup', {
    successRedirect : '/login', // redirect to the secure profile section
    failureRedirect : '/signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  })
);

router.get('/login', function(req, res) {
  res.render('login', { 
    title: meta.header(),
    gJSON: gJSON,
    p: gJSON.paths,
    message: req.flash('loginMessage')
  });
});

router.post('/login', 
  passport.authenticate('local-login', {
    successRedirect : '/', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  })
);

router.get('/logout', function(req, res) {

  req.logout();
  res.redirect('/');

});

//dev routes
router.get('/dbtest', function(req, res) {
     
  db.sequelize.authenticate().complete(function(err) {
    if (!!err) {
      console.log('Unable to connect to the database:', err);
      res.send(err);
    } else {
      console.log('Connection has been established successfully.');
      res.send('Connection has been established successfully.');
    }
  });

});