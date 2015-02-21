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
    if (!req.body.query) return res.status(400).send();

    var where = {
        shopStatus: 'active'
    };

    //if shopStatus is false
    if (!req.body.shopStatus) {
        where = {};
    }

    //process the merchant string
    var merchant = req.body.query.toLowerCase();
    //there is a '@' infront, remove it.
    if ( merchant.indexOf('@') > - 1 ) merchant = merchant.substring(1);

    db.User.search(merchant, {
        attributes: ['userId', 'userNameDisp', 'name', 'profilePicture', 'dataMeta'],
        where: where
    }).then(function(merchants) {
        res.json({
            success: true,
            results: merchants
        });
    });
});

router.post('/get/product', function(req, res) {
    if (!req.isAuthenticated()) return res.status(403).send();
    if (!req.body.userId) return res.status(400).send();

    var userId = req.body.userId;
    var stockFilter = require('../apps/stream/product/stockFilter');

    /* TODO: ONCE https://github.com/sequelize/sequelize/issues/2923 is sorted out
        will be able to accept more `where` parameters */
    db.Post.findAll({
        where: db.Sequelize.and(
            { User_userId: userId },
            { isProduct: true },
            db.Sequelize.or(
                { softDeleted: { ne: true } },
                { softDeleted: null }
            )
        ),
        attributes: ['postId', 'imgUUID', 'dataProduct', 'desc', 'descHTML'],
        order: [ ['updatedAt', 'DESC'] ]
    }).then(function(products) {
        var products = stockFilter(products);
        res.json({
            success: true,
            results: products
        });
    });
});

module.exports = router;