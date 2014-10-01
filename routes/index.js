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

router.get('/error', function(req, res) {
    res.send('error');
});

// Homepage
router.get('/', function(req, res) {
    //sys.puts(sys.inspect(req));
    var gJSON = globalJSON(req);
    var eventEmitter = new events.EventEmitter();

    //do something about the "preview"
    if(req.query.p === 'preview' || req.isAuthenticated()) {

        //bind the final callback first
        eventEmitter.on('streamJSONDone', function thenRender(renderJSON) {
            res.render('index', { 
                title: meta.header(),
                isLoggedIn: req.isAuthenticated(),
                p: gJSON.pathsJSON.paths,
                f: gJSON.pathsJSON.files,
                print: JSON.stringify(gJSON.print),
                renderJSON: JSON.parse(JSON.stringify(renderJSON)),
                isStream: 'stream',
                page: "index"
            });

        });

        //now run callback dependents
        if(req.query.p === 'preview') { var preview = true; }
        var streamJSON = require('../apps/stream/streamJSON.js')(req, preview, eventEmitter);

    } else {
        res.render('index', { 
            title: meta.header(),
            isLoggedIn: req.isAuthenticated(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            page: "index"
        });
    }
});

router.get('/login', function(req, res) {
    res.redirect('/');
});

router.post('/api/login', function(req, res) {
        //console.log(res);
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

/* signup TEMPORARILY IN USE */
router.get('/signup', function(req, res) {
    var gJSON = globalJSON(req);
    
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

router.post('/api/signup', 
    passport.authenticate('local-signup', {
        successRedirect : '/login', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    })
);

//ME
router.get('/me', function(req, res) {
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
        console.log(renderJSON);

        res.render('profile', { 
            title: meta.header(),
            isLoggedIn: isLoggedIn(req),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            print: JSON.stringify(gJSON.print),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            reason: reason,
            page: 'me'
        });

    });

    //now run callback dependents
    var profileJSON = require('../apps/profileJSON.js')(req, eventEmitter, true);

});

//edit profile
router.get('/me/edit', function(req, res) {

    var gJSON = globalJSON(req);
    var eventEmitter = new events.EventEmitter();

    //bind the final callback first
    eventEmitter.on('editProfileDone', function thenRender(user) {

        res.render('editProfile', { 

            title: meta.header(),
            isLoggedIn: isLoggedIn(req),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            print: JSON.stringify(gJSON.print),
            user: user

        });
    });

    eventEmitter.on('editProfileError', function thenRender() {
        res.redirect('/');
    });

    require('../apps/editProfile.js')(req, eventEmitter);

});

//edit profile
router.post('/api/editProfile', function(req, res) {

    require('../apps/updateProfile.js')(req)

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
    CSRender = 30;

    return res.render('post', { 
        title: meta.header(),
        isLoggedIn: isLoggedIn(req),
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        print: JSON.stringify(gJSON.print),
        CSRender: CSRender,
        page: 'post'
    });
});

router.post('/api/post', function(req, res) {
    // createPost
    var socketId = app.ioSockets[req.header('sioId')];
    require('../apps/post/posting.js')(req, res, socketId);
});


router.get('/search', function(req, res) {

    res.send('what were you trying to do?')
    
});

    router.post('/search', function(req, res) {
        var gJSON = globalJSON(req);
        var eventEmitter = new events.EventEmitter();

        //bind the final callback first
        eventEmitter.on('searchUsersDone', function thenRender(renderJSON) {
            res.render('search', { 
                title: meta.header(),
                isLoggedIn: isLoggedIn(req),
                p: gJSON.pathsJSON.paths,
                f: gJSON.pathsJSON.files,
                print: JSON.stringify(gJSON.print),
                renderJSON: renderJSON,
                isStream: false
            });

        });

        //now run callback dependents
        var searchUsers = require('../apps/searchUsers.js')(req, eventEmitter);
    });

router.post('/api/follow', function(req, res) {
    var follow = require('../apps/follow/follow.js');
    follow(req, res);
});

router.get('/following', function(req, res) {
    var gJSON = globalJSON(req);
    var follower = require('../apps/follow/follower.js');

        var eventEmitter = new events.EventEmitter();

        //bind the final callback first
        eventEmitter.on('followJSONDone', function thenRender(renderJSON) {
            res.render('search', { 
                title: meta.header(),
                isLoggedIn: isLoggedIn(req),
                p: gJSON.pathsJSON.paths,
                f: gJSON.pathsJSON.files,
                print: JSON.stringify(gJSON.print),
                renderJSON: renderJSON,
                isStream: false
            });

        });

        //now run callback dependents
        var follower = require('../apps/follow/follower.js')(req, eventEmitter, 'following');

});

router.get('/followers', function(req, res) {
    var gJSON = globalJSON(req);
    var follower = require('../apps/follow/follower.js');

        var eventEmitter = new events.EventEmitter();

        //bind the final callback first
        eventEmitter.on('followJSONDone', function thenRender(renderJSON) {
            res.render('search', { 
                title: meta.header(),
                isLoggedIn: isLoggedIn(req),
                p: gJSON.pathsJSON.paths,
                f: gJSON.pathsJSON.files,
                print: JSON.stringify(gJSON.print),
                renderJSON: renderJSON,
                streamType: false
            });

        });

        //now run callback dependents
        var follower = require('../apps/follow/follower.js')(req, eventEmitter, 'followers');

});

router.post('/api/comment', function(req, res) {

    console.log(req);
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

//dev
router.get('/:find/:model/:where', function(req, res) {
    if(req.params.find && req.params.model) {
        console.log(req.params.model);
        if(req.params.where) {
            db[req.params.model][req.params.find](req.params.where)
                .then(function(result) {
                    res.json(result);
                })
                .catch(function() {
                    res.send('error');
                });
        } else {
            db[req.params.model][req.params.find]()
                .then(function(result) {
                    res.json(result);
                })
                .catch(function() {
                    res.send('error');
                });;
        }    
    } else {
        res.send('error');
    }  
});

//TODO: deal with Hashtags!!

// router.get(/\b#\w\w+/, function(req, res) {
//     res.send('its a hashtag');
// });
router.get('/test', function(req, res) {
    db.Following.find(
        {where: db.Sequelize.and(
            {FollowerId:2},
            {FollowId:1}
        )}
    ).then(function(user) {
        res.send(user);
    });
});

router.get('/p/:pid', function(req,res) {
    //sys.puts(sys.inspect(req));

    var gJSON = globalJSON(req);
    var eventEmitter = new events.EventEmitter();

    //bind the final callback first
    eventEmitter.on('singlePostJSONDone', function thenRender(renderJSON) {
        res.render('singlePost', { 
            title: meta.header(),
            isLoggedIn: req.isAuthenticated(),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            print: JSON.stringify(gJSON.print),
            renderJSON: JSON.parse(JSON.stringify(renderJSON)),
            isStream: 'stream',
            page: 'singlePost'
        });

    });

    //now run callback dependents
    var streamJSON = require('../apps/stream/singlePostJSON.js')(req, eventEmitter);

});

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

        res.render('profile', { 
            title: meta.header(),
            isLoggedIn: isLoggedIn(req),
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            print: JSON.stringify(gJSON.print),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            reason: reason
        });

    });

    //now run callback dependents
    var profileJSON = require('../apps/profileJSON.js')(req, eventEmitter, false);

});

// router.get('/:user', function(req, res, next) {

//     if(req.params.user === 'socket.io') {
//         return next(err);
//     }

//     //if first character is "#", 
//     if(req.params.user.substring(0,1) === '@') {
//         req.params.user = req.params.user.substring(1);
//     }

//     var eventEmitter = new events.EventEmitter();

//     //bind the final callback first
//     eventEmitter.on('profileJSONDone', function thenRender(renderJSON) {
//         res.render('profile', { 
//             title: meta.header(),
//             isLoggedIn: isLoggedIn(req),
//             gJSON: gJSON,
//             p: gJSON.paths,
//             renderJSON: renderJSON,
//             isSearch: true,
//             isProfile: true,
//             userId: ( JSON.parse(renderJSON) ).userId
//         });

//     });

//     //now run callback dependents
//     var getProfile = require('../apps/getProfile.js')(req, eventEmitter);

// });



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
// router.get('/sync', function(req, res) {
//   db.sequelize.sync({force:true}).on('success', function() {
//     res.send('sync success');
//   });
// });