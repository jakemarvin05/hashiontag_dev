var express = require('express');
var router = express.Router();
var meta = require('../apps/meta.js');
var D = require('dottie');

//passport
var passport = require('passport');
require('../apps/passport/passport_cfg.js')(passport);
var isLoggedIn = require('../apps/passport/isLoggedIn.js');

// globalJSON
var globalJSON = require('../apps/globalJSON.js');

router.get('/addproduct', function(req, res) {

    if (!req.isAuthenticated() || req.user.shopStatus === null || req.user.shopStatus === "false") { 
        res.statusCode = 403;
        return res.redirect('/'); 
    }

    var gJSON = globalJSON(req);

    //override
    //currently we are experimenting pure clientside render.
    CSRender = 30;

    if (req.user.shopStatus === "active") {
        db.User.find({
            where: {
                userId: req.user.userId
            },
            attributes: ['shopStatus', 'dataMeta']
        }).then(function(user) {
            if (!user || user.shopStatus.indexOf('active') === -1) { res.statusCode = 403; res.send(); }

            return thenRender(user);

        }).catch(function(err) {
            console.log('Route: /shop/addproduct error: ' + err);
            res.statusCode = 500;
            res.send();
        });
    } else {
        thenRender(false);
    }

    function thenRender(renderJSON) {
        res.render('shop/addProduct', {
            title: meta(),
            isLoggedIn: req.isAuthenticated(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            page: 'addproduct',

            timestamp: Date.now(),
            dataShop: D.get(renderJSON, 'dataMeta.dataShop'),
            isShopSettingsComplete: (function() { if (renderJSON.shopStatus === "active") { return true; } return false; })()
        });
    }

});

router.get('/settings', function(req, res) {

    if (!req.isAuthenticated() || req.user.shopStatus === null || req.user.shopStatus === "false") { 
        res.statusCode = 404;
        return res.send(); 
    }

    var gJSON = globalJSON(req);

    db.User.find({
        where: {
            userId: req.user.userId
        },
        attributes: ['dataMeta', 'shopStatus']
    }).then(function(user) {

        if (!user) { res.statusCode = 404; return res.send(); }

        return res.render('shop/shopSettings', {
            title: meta(),
            isLoggedIn: req.isAuthenticated(),
            gJSON: gJSON,
            p: gJSON.pathsJSON.paths,
            f: gJSON.pathsJSON.files,
            printHead: JSON.stringify(gJSON.printHead),
            page: 'shopSettings',

            shopStatus: user.shopStatus,
            dataShop: D.get(user, 'dataMeta.dataShop')
        });

    }).catch(function(err) {
        console.log(err);
        res.statusCode = 500;
        res.send();
    });
});

module.exports = router;