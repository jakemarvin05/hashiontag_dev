var fname = "addToCart.js ";
var D = require('dottie');
var checkSizesAndStock = require('./checkSizesAndStock.js');

module.exports = function addToCart(req, res) {
    if (!req.isAuthenticated()) { return res.status(403).send('You are not logged in.'); }
    if (!req.body.qty || !req.body.postId) { return res.status(400).send(); }

    var qty = parseInt(req.body.qty);
    if (qty < 1) { return res.status(400).send(); }

    return checkSizesAndStock({
        req: req, 
        res: null, //handle my own response
        sizeData: null,
        showStock: true
    }, _addToCart);

    function _addToCart(result) {
        //if no result is passed in, or if result[0] is false
        if (!result) { return res.status(500).send(); }
        if (!result[0] && result[0] !== 0) { return res.status(result[1]).send(result[2]); }

        //First attempt to find if this has been added before.
        //If yes, increment the quantity
        var ENDED = false;
        var BRIMMED = false; //true if qty is brimmed

        var newQty = qty;

        if (result[1] < 0) {
            newQty = qty + result[1]; // setting the qty to available stock
            BRIMMED = true;
        }
        /*
        1. Find the post. It exist, and isProduct, and is not softDeleted.
            1b. Find the user. If shop is not active, return.
        2. Find or create "purchase" record.
        3. If created, check if adding new stock will result in more than inventory.
            a. If no, add qty and save the new qty.
            b. If yes, brim the order. save the new qty.
        4. If not created, create "purchase".
        */
        return db.Post.find({
            where: {
                postId: req.body.postId,
                isProduct: true,
                isNotPublished: {not: true},
                softDeleted: {not: true}
            },
            attributes: ['postId'],
            include: [{
                model: db.User,
                attributes: ['shopStatus']
            }]
        }).then(function(post) {
            if (!post) { 
                ENDED = true;
                res.status(400).send('Product does not exist or have been removed.'); 
                return [false, false]; //spread() needs to receive this.
            }
            if (post.user.shopStatus !== 'active') {
                ENDED = true;
                res.status(400).send('Product cannot be added because of seller issues. Please contact seller directly.');
                return [false, false];
            }

            return db.Purchase.findOrCreate({
                where: {
                    Post_postId: req.body.postId,
                    stage: "cart",
                    size: result[0]
                },
                defaults: {
                    User_userId: req.user.userId,
                    qty: newQty
                }
            });
        }).spread(function(purchase, created) {
            if(ENDED) { return; }

            //if purchase record found, increment the qty
            if (!created) {
                if (BRIMMED) { 
                    //if qty is already brimmed, there is no need to check.
                    purchase.qty = qty; 
                } else {

                    //GOTCHA: stock that is in cart is not accounted for in stock count/
                    //if remaining stock (after accounting for the new request)
                    //minus the already ordered stock is negative, brim the order
                    if (result[1] - purchase.qty < 0) {
                        newQty = result[1] + qty; // this represents all the stock there is
                        BRIMMED = true;
                    } else {
                        newQty = purchase.qty + qty;
                    }
                }

                purchase.qty = newQty
                return purchase.save();

            } else {
                // new purchase record created
                ENDED = true;
                var resValues = { success: true, newAddition: true };

                //if order numbers has been brimmed
                if (BRIMMED) { resValues.brimmed = true; resValues.updatedQty = newQty }
                return res.json(resValues);
            }

        }).then(function(purchase) {
            if (ENDED) { return; }

            //under this branch, existing record was found and updated.
            var resValues = { success: true, newAddition: false, updatedQty: purchase.qty };

            //if qty has been brimmed
            if (BRIMMED) { resValues.brimmed = true; }
            return res.json(resValues);

        }).catch(function(err) {
            console.log('ERROR - CATCH HANDLER ', fname, err);
            return res.status(500).send(err);
        });
    }
    
};