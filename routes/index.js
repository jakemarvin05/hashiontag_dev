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

// createPost
var createPost = require('../apps/createPost.js');

// globalJSON
var gJSON = require('../apps/globalJSON.js');

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


//ajax login. to be implemented soon...

// app.post('/login', function(req, res) {
//     console.log(res);
//     passport.authenticate('local', function(err, user) {
//       if (req.xhr) {
//         //thanks @jkevinburton
//         if (err)   { return res.json({ error: err.message }); }
//         if (!user) { return res.json({error : "Invalid Login"}); }
//         req.login(user, {}, function(err) {
//           if (err) { return res.json({error:err}); }
//           return res.json(
//             { user: {
//                       id: req.user.id,
//                       email: req.user.email,
//                       joined: req.user.joined
//               },
//               success: true
//             });
//         });
//       } else {
//         if (err)   { return res.redirect('/login'); }
//         if (!user) { return res.redirect('/login'); }
//         req.login(user, {}, function(err) {
//           if (err) { return res.redirect('/login'); }
//           return res.redirect('/');
//         });
//       }
//     })(req, res);
// });

router.get('/logout', function(req, res) {

  req.logout();
  res.redirect('/');

});

router.get('/post', function(req, res) {
  res.render('post', { 
    title: meta.header(),
    isLoggedIn: isLoggedIn(req),
    gJSON: gJSON,
    p: gJSON.paths
  });
});

  router.post('/post', function(req, res) {
    // db.User.find({ where: { user_id: req.user.user_id } }).success(function(user) {
    //     db.Post.create({ desc: req.param('desc'), user_id: user.user_id }).success(function(post) {
    //         thepost.setUser(user).success(function(){
    //             res.redirect('/')
    //         });
    //     });
    //   });
    createPost(req, res);
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