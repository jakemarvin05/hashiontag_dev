var express = require('express');
var app = require('../app.js');
var router = express.Router();
//var async = require('async');
//var sys = require('sys');
var meta = require('../apps/meta.js');

//passport
var passport = require('passport');
require('../apps/passport/passport_cfg.js')(passport);
var isLoggedIn = require('../apps/passport/isLoggedIn.js');

// sequelize
var db = require('../models/');

// globalJSON
var globalJSON = require('../apps/globalJSON.js');

//instagram
var ig = require('instagram-node').instagram();

module.exports = router;

/* Every page has a generic set of res.render variables:

    title:          (self explanatory)

    gJSON:          the full gJSON

    p:              this is the global path file that allows in-template use of universal
                    paths like this: <img src="{p.img}/image.jpg">

    f:              global file paths. Points to commonly used files. Like the error img:
                    {p.errorImg} will give you the path yourdefaultdomain.com/images/errorImg.jpg

    printHead:      the generic javascript variables you want to print on every header.

    renderJSON:     this is the JSON that you want to pass to the client side if there is
                    client-side rendering going on.

    renderJSONraw:  (optional) unstringified renderJSON for dust use.

    page:           give each page a unique name so that you can use it as a condition inside the templates.

*/

// Homepage
router.get('/', function(req, res) {
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);

    function renderTheStream(renderJSON) {
        res.render('index', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "index",

            /* specifics */
            showStream: true,
        });
    }

    //do something about the "preview"
    if(req.isAuthenticated()) {
        require('../apps/stream/streamJSON.js')(req, renderTheStream, null);
    } else {
        res.render('index', {
            title: meta(),
            gJSON: gJSON,
        p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            page: "login",

            showStream: false,
            showNav: "continue"
        });
    }
});

router.get('/preview', function(req, res) {
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);

    function thenRender(renderJSON) {
        res.render('index', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "preview",

            /* specifics */
            showStream: true,
            showNav: "login",

            //isPreview is used to block like buttons and comment box from
            //being generated in the view.
            isPreview: true

        });
    }

    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: "preview"});
});


router.get('/latest', function(req, res) {
    //sys.puts(sys.inspect(req));
    if(!req.isAuthenticated()) { return res.redirect('/'); }
    var gJSON = globalJSON(req);

    function thenRender(renderJSON) {
        res.render('index', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
        p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "latest",

            /* specifics */
            showStream: true

        });
    }

    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: "preview"});
});


router.get('/startag', function(req, res) {
    var gJSON = globalJSON(req);

    function thenRender(renderJSON) {
        res.render('startag', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "startag",

        });
    }
    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: "startag"});
});

router.post('/api/post/starapprove', function(req, res) {
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

router.post('/api/post/starreject', function(req, res) {

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

router.post('/api/getstream/:showtype/:lastpostid', function(req, res) {

    var params = {
        showType: req.params.showtype,
        lastPostId: req.params.lastpostid
    }

    function render(renderJSON) {
        res.json(renderJSON);
    }

    require('../apps/stream/streamJSON.js')(req, render, params);

});

router.post('/api/getrecommend', function(req, res) {
    require('../apps/stream/getRecommend.js')(req, res);
});

router.get('/login', function(req, res) {
    res.redirect('/');
});

router.post('/api/login', function(req, res) {
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

router.get('/signup', function(req, res) {
    var gJSON = globalJSON(req);

    res.render('index', {
        /* generics */
        title: meta(),
        gJSON: gJSON,
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        printHead: JSON.stringify(gJSON.printHead),
        page: "signup",

        showNav: "login"
    });
});

router.post('/api/signup', function(req, res, next) {

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

router.get('/passwordtokenreset', function(req, res) {
    var gJSON = globalJSON(req);
    if(req.query.token) {
        var token = req.query.token;
    } else {
        var token = false;
    }

    res.render('resetPassword', {
        /* generics */
        title: meta(),
        gJSON: gJSON,
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        printHead: JSON.stringify(gJSON.printHead),
        page: "resetPassword",
        showNav: "login",
        token: token
    });


});

router.post('/api/password/checktoken', function(req, res) {
    var token = req.body.token;
    if(!token) { return res.json({success: false}); }
    require('../apps/passport/checkToken.js')(req, res, token);
});

router.post('/api/password/forget', function(req, res) {

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

//ME
router.get('/me', function(req, res) {

    if(!req.isAuthenticated()) { return res.redirect('/'); }
    var gJSON = globalJSON(req);

    var profileJSON = require('../apps/stream/profileJSON.js')(req, thenRender, true);

    function thenRender(renderJSON) {

        if(renderJSON === 'redirect') { return res.redirect('/'); }

        if(renderJSON === 'userNotFound') { return res.send(404); }

        res.render('me', {
            title: meta(renderJSON, 'profile'),
            isLoggedIn: isLoggedIn(req),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: 'me'
        });

    }

});
//Settings
router.get('/settings', function(req, res) {
    if(!req.isAuthenticated()) { return res.redirect('/'); }
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);


    require('../apps/settings.js')(req, res, "render", gJSON, thenRender);

    //bind the final callback first
    function thenRender(renderJSON) {
        res.render('settings', {
            title: meta(),
            isLoggedIn: isLoggedIn(req),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            //renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: 'settings'
        });

    }
});
router.post('/api/password/changepassword', function(req, res) {
    require('../apps/passport/changePassword.js')(req, res);
});

/*INSTAGRAMS*/
router.post('/api/instagram/getuser', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success:false}); }
    //do the instagram stuff here.
    console.log(req.body.screenName);
    require('../apps/instagramLink.js')(req, res, "getuser");

});

router.post('/api/instagram/link', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success:false}); }
    //do the instagram stuff here.
    require('../apps/instagramLink.js')(req, res, "link");
});

router.post('/api/instagram/unlink', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success:false}); }
    //do the instagram stuff here.
    require('../apps/instagramLink.js')(req, res, "unlink");
});

router.get('/api/instagram/engine', function(req, res) {
    console.log(igg);
    res.json({
        lastRunCompleted: igg.lastRunCompleted,
        busy: igg.busy,
        nextRun: igg.nextTimeout.time,
        hasErrored: igg.hasErrored
    });
});

router.get('/api/instagram/grab', function(req,res) {
    if(igg.busy) { return res.send('grabber is busy. try again later...'); }
    clearTimeout(igg._timeout);
    igg.run();
    res.send('overwritten instagram grab schedule, check your console...');
});

//edit profile
router.post('/api/updateprofile', function(req, res) {

    require('../apps/updateProfile.js')(req, res);

});

router.get('/logout', function(req, res) {

    req.logout();
    res.redirect('/');

});

router.get('/post', function(req, res) {

    var gJSON = globalJSON(req);
    //var uap = require('ua-parser').parseUA(req.headers['user-agent']);

    // var family = uap.family.toLowerCase();
    // console.log(family);
    // var major = parseFloat(uap.major);
    // console.log(major);

    // //CSRender defines whether client should render the images and if
    // //yes, up to how many megapixels. Default setting is 8MP.
    // var CSRender = 8;

    // //limitation cases
    // if(family.indexOf('mobile') > -1 ) {
    //     CSRender = 8;
    // } else if(family.indexOf('safari') > -1) {
    //     CSRender = 23;
    // } else {
    //     //no mobile branch, check for firefox and chrome.
    //     if(family.indexOf('chrome') > -1 && major >=  37) {
    //         console.log('chrome >= 37');
    //         CSRender = 23;
    //     }
    //     if(family.indexOf('firefox') > -1 && major >=  32) {
    //         CSRender = 23;
    //     }
    // }

    //override
    //currently we are experimenting pure clientside render.
    CSRender = 30;

    return res.render('post', {
        title: meta(),
        isLoggedIn: isLoggedIn(req),
        gJSON: gJSON,
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        printHead: JSON.stringify(gJSON.printHead),
        CSRender: CSRender,
        page: 'post'
    });
});

router.post('/api/post', function(req, res) {
    // createPost
    var socketId = global.ioSockets[req.header('sioId')];
    require('../apps/post/posting.js')(req, res, socketId);
});

router.post('/api/post/delete', function(req, res) {
    require('../apps/post/deletePost.js')(req, res);
});

router.post('/api/post/mark', function(req, res) {
    require('../apps/post/markPost.js')(req, res);
});

router.post('/api/post/edit', function(req,res) {
    require('../apps/post/editPost.js')(req, res);
}); 
router.get('/likes', function(req, res) {

    var gJSON = globalJSON(req);

    //do something about the "preview"
    if(!req.isAuthenticated()) { return res.redirect('/'); }

    function thenRender(renderJSON) {
        res.render('likes', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "likes",

            /* specifics */
            showStream: true,

            //isPreview is used to block like buttons and comment box from
            //being generated in the view. We don't really need it here. It
            //default to false
            //isPreview: false

        });

    }

    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: 'likes'});
});


router.get('/search', function(req, res) {
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);

    if(req.isAuthenticated()) {

        res.render('search', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            //renderJSON: JSON.stringify(renderJSON),
            page: "search",

            /* specifics */


            //isPreview is used to block like buttons and comment box from
            //being generated in the view. We don't really need it here. It
            //default to false
            //isPreview: false

        });

    } else {
        res.redirect('/');
    }
});

router.post('/api/search', function(req, res) {
    if(!req.isAuthenticated()) { return res.json({success: false}); }
    if(typeof req.body.query === 'undefined' || req.body.query === '') { return res.json({success: false}); }

    require('../apps/search.js')(req, res);
});

router.get('/hashtag/:hashtag', function(req, res) {

    var gJSON = globalJSON(req);

    //bind the final callback first
    function thenRender(renderJSON) {

        res.render('hashtag', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "hashtag",

            /* specifics */
            hashtag: req.params.hashtag,

            //isPreview is used to block like buttons and comment box from
            //being generated in the view.
            isPreview: !req.isAuthenticated()

        });

    }

    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: 'hashtag'});

});

router.post('/api/follow', function(req, res) {
    var follow = require('../apps/follow/follow.js');
    follow(req, res);
});

router.post('/api/following', function(req, res) {
    //we now allow users not logged in to see other's follower/following
    //if(!req.isAuthenticated()) { res.json({success:true, results: false }); }
    require('../apps/follow/follower.js')(req, res, 'following');
});

router.post('/api/followers', function(req, res) {
    //if(!req.isAuthenticated()) { res.json({success:true, results: false }); }
    require('../apps/follow/follower.js')(req, res, 'followers');
});

router.post('/api/comment', function(req, res) {

    //console.log("****: " + JSON.stringify(res) );

    if (req.xhr) {

        require('../apps/addComment.js')(req, res);

    } else {
        res.redirect('/');
    }

});

router.post('/api/like', function(req, res) {
    require('../apps/addRemoveLike.js')(req, res);
});

router.post('/api/notification', function(req, res) {

    var dataObj = {};

    if (req.xhr) {

        var notification = require('../apps/notification.js')(req, res, dataObj);

    } else {

        res.redirect('/');

    }

});

router.post('/api/getimage', function(req, res) {

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

router.post('/api/remakeimg', function(req, res) {

    require('../apps/post/remakeImg.js')(req, res);

});

router.get('/api/local/update', function(req, res) {
     require('../apps/streamUpdate.js')(req, res);
});

/* POSTS and USERNAMES */
router.get('/p/:pid', function(req,res) {
    //sys.puts(sys.inspect(req));

    var gJSON = globalJSON(req),
        showNav = '',
        isAuth = req.isAuthenticated();

    if(!isAuth) {
        showNav = "login";
    }

    //insert page identity into gJSON
    gJSON.printHead.page = 'singlePost';
    
    var streamJSON = require('../apps/stream/singlePostJSON.js')(req, thenRender);

    function thenRender(renderJSON) {

        if(!renderJSON) { return res.sendStatus(404); }

        res.render('singlePost', {
            title: meta(renderJSON, 'singlePost'),
            isLoggedIn: req.isAuthenticated(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            isStream: 'stream',
            page: 'singlePost',

            //isPreview is used to block like buttons and comment box from
            //being generated in the view.
            isPreview: !req.isAuthenticated(),
            showNav: showNav
        });

    }

});

//we need an exception routing here before it goes to user

//:user
router.get('/:user', function(req, res) {

    var gJSON = globalJSON(req);

    //now run callback dependents
    var profileJSON = require('../apps/stream/profileJSON.js')(req, thenRender, false);

    function thenRender(renderJSON) {

        var reason = false;

        if(renderJSON === 'redirect') {
            return res.redirect('/');
        }

        if(renderJSON === 'userNotFound') {
            return res.send(404);
        }
        if(renderJSON === 'reqNotAuthUserIsPrivate') {
            reason = renderJSON;
            renderJSON = false;
        }

        if(!req.isAuthenticated()) { var showNav = "login";}

        res.render('me', {
            /*generic */
            title: meta(renderJSON, 'profile'),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: 'profile',

            /*specifics*/
            reason: reason,

            //isPreview is used to block like buttons and comment box from
            //being generated in the view.
            isPreview: !req.isAuthenticated(),
            showNav: showNav
        });

    }

});


router.post('/api/errorreceiver', function(req, res) {

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