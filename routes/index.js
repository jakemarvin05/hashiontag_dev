var express = require('express');
var router = express.Router();
var meta = require('../apps/meta.js');

//passport
var passport = require('passport');
require('../apps/passport/passport_cfg.js')(passport);
var isLoggedIn = require('../apps/passport/isLoggedIn.js');

// globalJSON
var globalJSON = require('../apps/globalJSON.js');

//instagram
//var ig = require('instagram-node').instagram();

router.get('/seeddatameta', function(req, res) {

    var D = require('dottie');

    db.Post.findAll({
        include: [
            { model: db.PostMeta }
        ]
    }).then(function(posts) {
        for(var i=0; i<posts.length; i++ ) {

            var post = posts[i];

            if (post.postMeta.length > 0) {
                var metas = post.postMeta;

                for(var j=0; j<metas.length; j++) {
                    var meta = metas[j];
                    var newMeta = {};
                    if (meta.key !== 'isInstagram') {
                        if (typeof newMeta.itemMeta === "undefined") { newMeta.itemMeta = {}; }
                        newMeta.itemMeta[meta.key] = meta.value;
                    } else {
                        newMeta.isInstagram = meta.value;
                    }
                    post.dataMeta = {};
                    post.dataMeta = newMeta;
                }

            } else {
                post.dataMeta = null;
            }


            post.save({fields: (post.changed() || []).concat(['dataMeta'])});
        
        }

        res.send('done');
    });
});

router.get('/json', function(req, res) {
    db.Post.find({
        where: db.sequelize.json("\"dataMeta\"#>>'{itemMeta,itemLink}'",'xxhk')
    }).then(function(results) {
        return res.json(results);
    });
});

router.get('/inventory', function(req, res) {

    if (!req.isAuthenticated()) { res.redirect('/'); }
    
    var gJSON = globalJSON(req);

    function thenRender(renderJSON) {
        res.render('inventory', {
            /* generics */
            title: meta(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            renderJSON: JSON.stringify(renderJSON),
            renderJSONraw: renderJSON,
            page: "inventory",

        });
    }
    require('../apps/stream/streamJSON.js')(req, thenRender, {showType: "startag"});


});
/* to be moved to shop.js routing */

router.get('/shop/addproduct', function(req, res) {

    var gJSON = globalJSON(req);

    //override
    //currently we are experimenting pure clientside render.
    CSRender = 30;

    return res.render('shop/addProduct', {
        title: meta(),
        isLoggedIn: req.isAuthenticated(),
        gJSON: gJSON,
        p: gJSON.pathsJSON.paths,
        f: gJSON.pathsJSON.files,
        printHead: JSON.stringify(gJSON.printHead),
        page: 'addproduct',

        timestamp: Date.now()
    });

});

router.get('/shop/settings', function(req, res) {

    if (!req.isAuthenticated()) { return res.redirect('/'); }

    var gJSON = globalJSON(req);

    db.User.find({
        where: {
            userId: req.user.userId
        },
        attributes: ['dataMeta']
    }).then(function(user) {
        console.log(user.dataMeta.dataShop);

        if (!user) { res.statusCode = 404; return res.send(); }

        return res.render('shop/shopSettings', {
            title: meta(),
            isLoggedIn: req.isAuthenticated(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            page: 'shopSettings',

            dataShop: user.dataMeta.dataShop
        });

    }).catch(function() {
        res.statusCode = 500;
        res.send();
    });


});

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

    if (!req.isAuthenticated()) { res.redirect('/'); }

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

router.get('/login', function(req, res) {
    res.redirect('/');
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