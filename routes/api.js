var express = require('express');
var router = express.Router();

 //passport
var passport = require('passport');
require('../apps/passport/passport_cfg.js')(passport);
var isLoggedIn = require('../apps/passport/isLoggedIn.js');



router.get('/', function(req, res) {
  res.send('Nothing here...');
});
router.post('/', function(req, res) {
  res.send('');
});

router.post('/login', function(req, res) {
    passport.authenticate('local-login', function(err, user) {

        if (err) { return res.json({success:false, error: 'unknown'}) }
        if (!user) { return res.json({success:false, error : 'userpassword'}); }

        req.login(user, {}, function(err) {
            if (err) { return res.json({error:err}); }

            //=="true" because .rememberMe is a string
            if (req.body.rememberMe == "true" ) {
                req.session.cookie.maxAge = 31536000000000; // 10 years
            }

            return res.json({success: true});

        });

    })(req, res);
});

router.post('/signup', function(req, res, next) {

    passport.authenticate('local-signup', function(err, user, info) {
        if(err) {
            return res.json({success: false, error: 'unknown'});
        }
        if(!user) {
            return res.json({success: false, error: info});
        }
        //log the user in
        req.logIn(user, function(err) {
            if(err) { console.log('Error after registration: ' + err); return res.json({error: 'unknown'}); }
            return res.json({success: true});
        });
    })(req, res, next);

});

router.post('/password/checktoken', function(req, res) {
    var token = req.body.token;
    if(!token) { return res.json({success: false}); }
    require('../apps/passport/checkToken.js')(req, res, token);
});

router.post('/password/forget', function(req, res) {

    if (!req.body.email) {  return res.json({ error: 'Please enter an email' }) };

    db
    .User
    .find({ where: { email: req.body.email }})
    .then(function(user) {
        if (!user) { return res.status(404).json({ error: 'Email not found.'}); };

        user
        .generatePasswordResetToken()
        .save()
        .success(function(user){
            var host = req.protocol + '://' + req.get('host');

            user.deliver(host);
            return res.status(200).json({ success: true });
        });
    }).catch(function(err){
        return res.status(500).json({ error: 'Sorry, an error has ocurred.' });
    });

});

router.post('/password/changepassword', function(req, res) {
    require('../apps/passport/changePassword.js')(req, res);
});

/*INSTAGRAMS*/
router.post('/instagram/getuser', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success:false}); }
    require('../apps/instagramLink.js')(req, res, "getuser");

});

router.post('/instagram/link', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success:false}); }
    //do the instagram stuff here.
    require('../apps/instagramLink.js')(req, res, "link");
});

router.post('/instagram/unlink', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success:false}); }
    //do the instagram stuff here.
    require('../apps/instagramLink.js')(req, res, "unlink");
});

router.get('/instagram/engine', function(req, res) {
    console.log(igg);
    res.json({
        lastRunCompleted: igg.lastRunCompleted,
        busy: igg.busy,
        nextRun: igg.nextTimeout.time,
        hasErrored: igg.hasErrored
    });
});

router.get('/instagram/grab', function(req,res) {
    if(igg.busy) { return res.send('grabber is busy. try again later...'); }
    clearTimeout(igg._timeout);
    igg.run();
    res.send('overwritten instagram grab schedule, check your console...');
});

//edit profile
router.post('/updateprofile', function(req, res) {

    require('../apps/updateProfile.js')(req, res);

});

router.post('/post', function(req, res) {
    // createPost
    var socketId = global.ioSockets[req.header('sioId')];
    require('../apps/post/posting.js')(req, res, socketId);
});

router.post('/post/delete', function(req, res) {
    require('../apps/post/deletePost.js')(req, res);
});

router.post('/post/mark', function(req, res) {
    require('../apps/post/markPost.js')(req, res);
});

router.post('/post/edit', function(req,res) {
    require('../apps/post/editPost.js')(req, res);
}); 

router.post('/post/starapprove', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success: false}); }

    db.Post.find({
        where: {
            postId: req.body.postId
        }
    }).then(function(post) {
        if(post.User_userId_attributed !== req.user.userId) { return res.json({success: false}); }

        if(post.isAttributionApproved) { return res.json({success: true}); }

        post.isAttributionApproved = true;
        return post.save();
    }).then(function(post) {
        if(post) { return res.json({success:true}); }
    }).catch(function(err) {
        console.log('star approve db error: ' + err);
        return res.json({success: false});
    });

});

router.post('/search', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success: false}); }
    if(typeof req.body.query === 'undefined' || req.body.query === '') { return res.json({success: false}); }

    require('../apps/search.js')(req, res);
});

router.post('/follow', function(req, res) {
    var follow = require('../apps/follow/follow.js');
    follow(req, res);
});

router.post('/followings', function(req, res) {
    //we now allow users not logged in to see other's follower/following
    //if(!req.isAuthenticated()) { res.json({success:true, results: false }); }
    require('../apps/follow/follower.js')(req, res, 'following');
});

router.post('/followers', function(req, res) {
    //if(!req.isAuthenticated()) { res.json({success:true, results: false }); }
    require('../apps/follow/follower.js')(req, res, 'followers');
});

router.post('/comment', function(req, res) {

    //console.log("****: " + JSON.stringify(res) );

    if (req.xhr) {

        require('../apps/addComment.js')(req, res);

    } else {
        res.redirect('/');
    }

});

router.post('/like', function(req, res) {
    require('../apps/addRemoveLike.js')(req, res);
});

router.post('/notification', function(req, res) {

    var dataObj = {};

    if (req.xhr) {

        var notification = require('../apps/notification.js')(req, res, dataObj);

    } else {

        res.redirect('/');

    }

});

router.post('/getimage', function(req, res) {

    if(req.body.userid) {
        return getImage({userId: req.body.userid});
    }

    if(req.body.username) {
        return getImage({userName: req.body.username});
    }

    function getImage(param) {
        db.User.find({
            where: param,
            attributes: ['profilePicture']
        }, {raw: true}).then(function(user) {
            if(!user) { return res.sendStatus(404); }
            return res.json({success: true, imgUUID: user.profilePicture});
        }).catch(function(err) {
            console.log('"/api/getimage" error: ' + err);
            return res.sendStatus(500);
        });
    }

});

router.post('/remakeimg', function(req, res) {

    require('../apps/post/remakeImg.js')(req, res);

});

router.get('/local/update', function(req, res) {
     require('../apps/streamUpdate.js')(req, res);
});

router.post('/post/starreject', function(req, res) {

    if(!req.isAuthenticated()) { return res.json({success: false}); }

    db.Post.find({
        where: {
            postId: req.body.postId
        }
    }).then(function(post) {
        if(post.User_userId_attributed !== req.user.userId) { return res.json({success: false}); }

        post.isAttributionApproved = false;
        post.User_userId_attributed = null;
        return post.save();
    }).then(function(post) {
        if(post) { return res.json({success:true}); }
    }).catch(function(err) {
        console.log('star reject db error: ' + err);
        return res.json({success: false});
    });
    
});

router.post('/getstream/:showtype/:lastpostid?', function(req, res) {

    var params = {
        showType: req.params.showtype,
        lastPostId: req.params.lastpostid
    }

    function render(renderJSON) {
        res.json(renderJSON);
    }

    if (params.showType.indexOf('product') > -1) {
        return require('../apps/stream/productJSON.js')(req, render, params);
    }
    
    require('../apps/stream/streamJSON.js')(req, render, params);

});

router.post('/getrecommend', function(req, res) {
    require('../apps/stream/getRecommend.js')(req, res);
});


router.post('/errorreceiver', function(req, res) {

    var user = false;
    if(req.isAuthenticated()) { user = req.user; }

    var uap = require('ua-parser').parseUA(req.headers['user-agent']);

    var userAndUA = {
        user: user,
        ua: uap
    }
    userAndUA = JSON.stringify(userAndUA);

    var hash = {
        where: req.body.where,
        type: req.body.errType,
        data: req.body.errData,
        userAndUA: userAndUA,
        req: JSON.stringify(req.headers)
    }

    db.ErrorReceiver.create(hash)
    .then(function() {
        return res.send('end');
    }).catch(function(err) {
        console.log(JSON.stringify(hash));
        console.log(err);
        console.log('Our error receiver is having errors! Oh my!!');
        return res.send('end');
    });

});

module.exports = router;
