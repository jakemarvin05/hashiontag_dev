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

router.post('/settings/currency', function(req, res) {

    if (!req.isAuthenticated()) { 
        res.statusCode = 403;
        return res.json({ error: 'not authenticated'}); 
    }

    if(req.user.shopStatus === null || req.user.shopStatus === "false") { 
        res.statusCode = 403;
        return res.json({ error: 'does not have a shop'});
    }

    if(req.user.userId !== parseFloat(req.body.userId)) {
        //a possible situation where user is logged into another account
        //but trying to modify an outdated form.
        res.statusCode = 403;
        return res.json({ error: 'possibly unauthorised modification of form.'});
    }

    //don't allow user to send in empty stuff.
    if (!D.get(req, 'body.data.dataShop.currency')) {
        res.statusCode = 403;
        return res.send();
    }

    db.User.find({
        where: { userId: req.user.userId },
        attributes: [ 'userId', 'shopStatus', 'dataMeta']
    }).then(function(user) {
        if (!user) { 
            res.statusCode = 404;
            return res.json({ error: 'user not found'});
        }

        var temp = user.get({plain:true});

        //dataMeta can be null. set it to {} for dottie to work on it.
        if (!temp.dataMeta) { temp.dataMeta = {}; }

        D.set(temp, 'dataMeta.dataShop.currency', req.body.data.dataShop.currency);

        //pass the data into a module to append the flag to indicated complete shipping information
        //for them to start selling.
        user.shopStatus = require('../apps/shipping/isShippingDataComplete.js')(temp);

        return user.save({fields: (user.changed() || []).concat(['dataMeta'])});

    }).then(function(user) {
        console.log('success');
        return res.json({success: true});
    }).catch(function(err) {
        console.log(fname + 'catch handler error: ' + err);
        res.statusCode = 500;
        return res.send();
    });

});

router.post('/settings/shipping', function(req, res) {

    if (!req.isAuthenticated()) { 
        res.statusCode = 403;
        return res.json({ error: 'not authenticated'}); 
    }

    if(req.user.shopStatus === null || req.user.shopStatus === "false") { 
        res.statusCode = 403;
        return res.json({ error: 'does not have a shop'});
    }

    if(req.user.userId !== parseFloat(req.body.userId)) {
        //a possible situation where user is logged into another account
        //but trying to modify an outdated form.
        res.statusCode = 403;
        return res.json({ error: 'possibly unauthorised modification of form.'});
    }

    //don't allow user to send in empty stuff.
    if (!D.get(req, 'body.data.dataShop.shipping')) {
        res.statusCode = 403;
        return res.send();
    }

    db.User.find({
        where: { userId: req.user.userId },
        attributes: [ 'userId', 'shopStatus', 'dataMeta']
    }).then(function(user) {
        if (!user) { 
            res.statusCode = 404;
            return res.json({ error: 'user not found'});
        }

        var temp = user.get({plain:true});

        if (!temp.dataMeta) { temp.dataMeta = {}; }

        D.set(temp, 'dataMeta.dataShop.shipping', req.body.data.dataShop.shipping);

        //pass the data into a module to append the flag to indicated complete shipping information
        //for them to start selling.
        user.shopStatus = require('../apps/shipping/isShippingDataComplete.js')(temp);

        return user.save({fields: (user.changed() || []).concat(['dataMeta'])});

    }).then(function(user) {
        console.log('success');
        return res.json({success: true});
    }).catch(function(err) {
        console.log(fname + 'catch handler error: ' + err);
        res.statusCode = 500;
        return res.send();
    });

});

router.post('/search/merchant', function(req, res) {
    if (!req.isAuthenticated()) return res.status(403).send();
    if (!req.body.merchant) return res.status(400).send();

    //process the merchant string
    var merchant = req.body.merchant.toLowerCase();
    //there is a '@' infront, remove it.
    if ( merchant.indexOf('@') > - 1 ) merchant = merchant.substring(1);

    db.User.search(merchant, {
        attributes: ['userId', 'userNameDisp', 'profilePicture'],
        where: {
            shopStatus: 'active'
        }
    });

    // find({
    //     where: {
    //         userName: merchant,
    //         shopStatus: 'active'
    //     },
    //     attributes: 
    // }).then(function(user) {
    //     if (!user) return res.json(user);
    // });
});

module.exports = router;