var fname = "shippingCalc.js ";
var D = require('dottie');

/* This module expects dataShop to contain valid data */

module.exports = function(cartJSON) {
    if (!cartJSON.ownAddress) { return cartJSON; }

    var cartGroups = cartJSON.inStock;

    var stepQtyCounter = 0;
    for(var i in cartGroups) {
        var group = cartGroups[i];
        var currency = D.get(group, 'seller.dataMeta.dataShop.currency');
        var stepQty = D.get(group, 'seller.dataMeta.dataShop.shipping.stepQty');

        for(var j in items) {
            var item = items[j];
            var shippingType = D.get(item, 'dataProduct.size.sizeType');
            if (shippingType === 'light') {
                //charge shipping for the first of a batch of "step quantiy"
                if (stepQtyCounter === 0) {
                    /**** YOU STOPPED HERE!!! shipping regions probme */
                    //D.set(item, 'dataProduct.shipping.')
                }
            }
        }

    }
};




/*** I think with every cart refresh, we need to persist a new db record.

the record will have a expiry duration. 12 hours?

if expired, alert the shopping that exchange rate or shipping cost may have changed.
please check and check out again.