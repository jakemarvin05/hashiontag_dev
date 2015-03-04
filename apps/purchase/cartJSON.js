var db = global.db;
var D = require('dottie');
var checkSizesAndStock = require('./checkSizesAndStock.js');
var shippingCalc = require('../shipping/shippingCalc.js');

module.exports = function cartJSON(req, res, opts, render) {

    /* Error handling */
    var throwErr = function(error) {
        console.log(error);
        return render(false, error);
    };

    /*
    1. Find all "carted" products of the user. Also Find user's dataMeta.
    2. Re-arrange all the cart items by sellers. 
    3. Recheck all the stock against DB.
    4. Push those that are Out of Stock, or if seller has not completed their settings, to OOS array.
    5. Calculate shipping.
    */

    Promise.resolve().then(function() {

        return [
            db.Purchase.findAll({
                where: {
                    User_userId: req.user.userId,
                    stage: 'cart'
                },
                include:[{
                    model: db.User,
                    as: 'Seller',
                    attributes: ['userId', 'userNameDisp', 'profilePicture', 'dataMeta']
                }, {
                    model: db.Post,
                    attributes: ['dataProduct']
                }],
                order: [ ['updatedAt', 'DESC'] ],
                raw: true
            }),
            db.User.find({
                where: {
                    userId: req.user.userId
                },
                attributes: ['dataMeta']
            })
        ];
    }).spread(function(cartItems, user) {
        //seller is nested inside of each cart item.
        //we want to group the cart items by sellers.
        //loop through and re-arrange.
        var rearranged = {
            inStock: [],
            oos: []
        };

        var address = D.get(user, 'dataMeta.address');
        rearranged.ownAddress = address ? address : false;

        if (cartItems.length === 0) { return render(rearranged); }

        cartItems = JSON.parse(JSON.stringify(cartItems));

        //array to keep track of seller IDs to do grouping
        var sellerIds = [];
        var incompleteSellers = [];

        for(var i in cartItems) {
            var item = cartItems[i];


            /*check the seller data. if data is incomplete, push things to oos. */
            /*also update the incompleteSellers array*/
            var seller = D.get(item, 'Seller.userId');
            if (incompleteSellers.indexOf(seller) > -1) {
                rearranged.oos.push(item);
                continue;
            }

            //TODO: check selller complete data or not.

            /*check size and stock*/
            var sizeData = D.get(item, 'post.dataProduct.size');
            if (!sizeData) {
                //record is not reliable, assume out-of-stock
                //TODO: is it a valid assumption to do this? Or is there a better way?

                rearranged.oos.push(item);
                continue;

            } else {
                var stock = checkSizesAndStock({
                    req: {
                        body: {
                            qty: item.qty,
                            size: item.size
                        }
                    },
                    sizeData: sizeData,
                    showStock: true
                });

                if (!stock[0] && stock[0] !== 0) {
                    //stock = false indicated either unreliable data some other unknown error
                    //assume out-of-stock
                    rearranged.oos.push(item);
                    continue;

                } else {

                    if (stock[1] === 'oos') {
                        rearranged.oos.push(item);
                        continue;
                    } else if (stock[1] < 0) {
                        //under this branch, stock can only be negative numbers.
                        //when stock is a negative number, there is stock, but not enough to fulfil
                        //REDUCE the user qty and also APPEND message.
                        var newQty = item.qty + stock[1];

                        item.message = 'Remaining stock is not enough. Quantity reduced from <b>';
                        item.message += item.qty + '</b> to <b>' + newQty + '</b>.';
                        item.qty = newQty;

                        //make the db call to reduce the qty.
                        //this is async

                        //!!!!! RE ENABLE THIS ONCE DEV IS COMPLETE
                        //_updateQty(item);
                    } else {
                        //do nothing to items that pass all criterias
                    }
                }
            }

            //compare with the array to see if the branch exist.
            var idx = sellerIds.indexOf(seller);

            if (idx < 0) {
                //record the new id first
                sellerIds.push(seller);

                //branch has not been created. create it.
                idx = rearranged.inStock.push({seller: item.Seller}) - 1;
                rearranged.inStock[idx].items = [];
            }
            delete item.Seller;

            rearranged.inStock[idx].items.push(item);

        } //for(var i in cartItems) loop

        var completeCartJSON = shippingCalc(rearranged);
        render(completeCartJSON);

    }).catch(function(err) { 
        console.log(err);
        return render(false);
    });

    
    /* ===== private functions */
    function _updateQty(item) {
        db.Purchase.update({
            qty: item.qty
        }, {
            where: { purchaseId: item.purchaseId }
        }).catch(function(err){
            console.log(fname + ' neqQty update error: ' + err);
        });
    }
}