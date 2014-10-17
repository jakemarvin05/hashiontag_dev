var express = require('express');
var app = require('../app.js');
var router = express.Router();
//var async = require('async');
var events = require('events');
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

module.exports = router;

router.get('/test', function(req,res) {
    db.Following.findAndCountAll({
                        where: {FollowerId: 1},
                        attributes: ['affinityId']
                    }, { raw: true }).then(function(x) { return res.json(x);
    });
});

router.get('/error', function(req, res) {
    res.send('error');
});

router.get('/test2', function(req, res) {
    var gJSON = globalJSON(req);
    res.render('test2', { 
        title: meta.header(),
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        page: "index",

        showStream: false,
        showNav: "continue"
    });
});

/* Every page has a generic set of res.render variables:

    title:          (self explanatory)

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
    var START_TIME = Date.now();

    function renderTheStream(renderJSON) {
            console.log('rendering');
            console.log(Date.now() - START_TIME);
        res.render('index', { 
            /* generics */
            title: meta.header(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "index",

            /* specifics */
            showStream: true,
        });
        console.log('end render');
        console.log(Date.now() - START_TIME);
    }

    //do something about the "preview"
    if(req.isAuthenticated()) {
        require('../apps/stream/streamJSON.js')(req, renderTheStream, null, START_TIME);
    } else {
        res.render('index', { 
            title: meta.header(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            page: "login",

            showStream: false,
            showNav: "continue"
        });
    }
});

// Homepage
router.get('/preview', function(req, res) {
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);

    function thenRender(renderJSON) {
        res.render('index', { 
            /* generics */
            title: meta.header(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
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

// Homepage
router.get('/latest', function(req, res) {
    //sys.puts(sys.inspect(req));
    if(!req.isAuthenticated()) { return res.redirect('/'); }
    var gJSON = globalJSON(req);

    function thenRender(renderJSON) {
        res.render('index', { 
            /* generics */
            title: meta.header(),
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

router.get('/login', function(req, res) {
    res.redirect('/');
});

router.post('/api/login', function(req, res) {
    passport.authenticate('local-login', function(err, user) {

        if (err) { return res.json({ error: 'unknown'}) }
        if (!user) { return res.json({error : 'userpassword'}); }
        
        req.login(user, {}, function(err) {
            if (err) { return res.json({error:err}); }
            
            //=="true" because .rememberMe is a string
            if (req.body.rememberMe == "true" ) {

                req.session.cookie.maxAge = 315360000000; // 10 years

            } else {
                
                req.session.cookie.maxAge = 3600000; //1 hour
            }

            return res.json({success: true});

        });
        
    })(req, res);
});

router.get('/signup', function(req, res) {
    var gJSON = globalJSON(req);
    
    res.render('index', { 
        /* generics */
        title: meta.header(),
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
            return res.json({error: 'unknown'}); 
        }
        if(!user) { 
            return res.json({error: info}); 
        }
        //log the user in
        req.logIn(user, function(err) {
            if(err) { console.log('Error after registration: ' + err); return res.json({error: 'unknown'}); }
            return res.json({success: true});
        });
    })(req, res, next);

    // passport.authenticate('local-signup', {
    //     successRedirect : '/login', // redirect to the secure profile section
    //     failureRedirect : '/signup', // redirect back to the signup page if there is an error
    //     failureFlash : true // allow flash messages
    // })
});

//ME
router.get('/me', function(req, res) {
    if(!req.isAuthenticated()) { return res.redirect('/'); }
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);
    var eventEmitter = new events.EventEmitter();

    //bind the final callback first
    eventEmitter.on('profileJSONDone', function thenRender(renderJSON) {

        res.render('me', { 
            title: meta.header(),
            isLoggedIn: isLoggedIn(req),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: 'me'
        });

    });

    //now run callback dependents
    var profileJSON = require('../apps/stream/profileJSON.js')(req, eventEmitter, true);

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
    var uap = require('ua-parser').parseUA(req.headers['user-agent']);

    var family = uap.family.toLowerCase();
    console.log(family);
    var major = parseFloat(uap.major);
    console.log(major);

    //CSRender defines whether client should render the images and if
    //yes, up to how many megapixels. Default setting is 8MP.
    var CSRender = 8;

    //limitation cases
    if(family.indexOf('mobile') > -1 ) {
        CSRender = 8;
    } else if(family.indexOf('safari') > -1) {
        CSRender = 23;
    } else {
        //no mobile branch, check for firefox and chrome.
        if(family.indexOf('chrome') > -1 && major >=  37) {
            console.log('chrome >= 37');
            CSRender = 23;
        }
        if(family.indexOf('firefox') > -1 && major >=  32) {
            CSRender = 23;
        }
    }

    //override
    //currently we are experimenting pure clientside render.
    CSRender = 30;

    return res.render('post', { 
        title: meta.header(),
        isLoggedIn: isLoggedIn(req),
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        printHead: JSON.stringify(gJSON.printHead),
        CSRender: CSRender,
        page: 'post'
    });
});

router.post('/api/post', function(req, res) {
    // createPost
    var socketId = app.ioSockets[req.header('sioId')];
    require('../apps/post/posting.js')(req, res, socketId);
});
router.post('/api/post/:action', function(req, res) {
    if(req.params.action === 'delete') {
        require('../apps/post/deletePost.js')(req, res);
    }
    if(req.params.action === 'mark') {
        require('../apps/post/markPost.js')(req, res);
    }

});

router.get('/likes', function(req, res) {

    var gJSON = globalJSON(req);

    //do something about the "preview"
    if(!req.isAuthenticated()) { return res.redirect('/'); }

    function thenRender(renderJSON) {
        res.render('likes', { 
            /* generics */
            title: meta.header(),
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
            title: meta.header(),
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
            title: meta.header(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "hashtag",

            /* specifics */

            //isPreview is used to block like buttons and comment box from
            //being generated in the view.
            isPreview: !req.isAuthenticated

        });

    }

    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: 'hashtag'});

});

router.post('/api/follow', function(req, res) {
    var follow = require('../apps/follow/follow.js');
    follow(req, res);
});

router.post('/api/following', function(req, res) {
    if(!req.isAuthenticated()) { res.json({success:true, results: false }); }
    require('../apps/follow/follower.js')(req, res, 'following');
});

router.post('/api/followers', function(req, res) {
    if(!req.isAuthenticated()) { res.json({success:true, results: false }); }
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
            return res.json({success: true, imgUUID: user.profilePicture});
        }).catch(function(err) {
            console.log('"/api/getimage" error: ' + err);
            return res.json({success: false});
        });
    }

});

router.get('/api/local/update', function(req) {
     require('../apps/streamUpdate.js')();
});

/* POSTS and USERNAMES */
router.get('/p/:pid', function(req,res) {
    //sys.puts(sys.inspect(req));

    var gJSON = globalJSON(req),
        eventEmitter = new events.EventEmitter(),
        showNav = '',
        isAuth = req.isAuthenticated();

    if(!isAuth) {
        showNav = "login";
    }

    //insert page identity into gJSON
    gJSON.printHead.page = 'singlePost';

    //bind the final callback first
    eventEmitter.on('singlePostJSONDone', function thenRender(renderJSON) {
        res.render('singlePost', { 
            title: meta.header(),
            isLoggedIn: req.isAuthenticated(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.parse(JSON.stringify(renderJSON)),
            isStream: 'stream',
            page: 'singlePost',

            //isPreview is used to block like buttons and comment box from
            //being generated in the view.
            isPreview: !req.isAuthenticated(),
            showNav: showNav
        });

    });

    //now run callback dependents
    var streamJSON = require('../apps/stream/singlePostJSON.js')(req, eventEmitter);

});

//we need an exception routing here before it goes to user

//:user
router.get('/:user', function(req, res) {
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);
    var eventEmitter = new events.EventEmitter();

    //bind the final callback first
    eventEmitter.on('profileJSONDone', function thenRender(renderJSON) {
        var reason = false;

        if(renderJSON === 'redirect') {
            return res.redirect('/');
        }

        if(renderJSON === 'userNotFound') {
            reason = renderJSON;
            renderJSON = false;
        }
        if(renderJSON === 'reqNotAuthUserIsPrivate') {
            reason = renderJSON;
            renderJSON = false;
        }
        //console.log(renderJSON);
        if(!req.isAuthenticated()) { var showNav = "login";}

        res.render('me', { 
            /*generic */
            title: meta.header(),
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

    });

    //now run callback dependents
    var profileJSON = require('../apps/stream/profileJSON.js')(req, eventEmitter, false);

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


///////////////////////////////////////////////////////

//dev routes
//disable :user routes to get here.
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

//uap example
router.get('/ua-parser', function(req, res) {
    var uap = require('ua-parser').parseUA(req.headers['user-agent']);

    res.json({
        'everything': uap
    });

    var family = uap.family.toLowerCase();
    var major = parseFloat(uap.major);
    var CSRender = false;

    //reject cases
    if(family.indexOf('mobile') > -1 ) {
        //reject
    } else if(family.indexOf('safari') > -1) {
        //reject
    } else {
        //no mobile branch, check for firefox and chrome.
        if(family.indexOf('chrome') > -1 && major >=  37) {
            CSRender = true;
        }
        if(family.indexOf('firefox') > -1 && major >=  32) {
            CSRender = true;
        }
    }
});