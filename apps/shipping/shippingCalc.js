var fname = "shippingCalc.js ";
var D = require('dottie');
var countryList = require('../../public/assets/js/commons/countryList.js');
var stockFilter = require('../stream/product/stockFilter.js');

/* This module expects dataShop to contain valid data */

module.exports = function(cartJSON) {
    if (!cartJSON.ownAddress) { return cartJSON; }

    var shipToCountry = D.get(cartJSON, 'ownAddress.active.country');
    var shipToRegion = countryList.getRegion(shipToCountry);

    var cartGroups = cartJSON.inStock;

    var stepQtyCounter = 0;
    for(var i in cartGroups) {
        var group = cartGroups[i];
        var currency = D.get(group, 'seller.dataMeta.dataShop.currency');
        var stepQty = D.get(group, 'seller.dataMeta.dataShop.shipping.stepQty');
        var lightShipping = D.get(group, 'seller.dataMeta.dataShop.shipping.light.' + shipToRegion);
        //handle cases where the seller do not ship to that region.

        //set the relevantShipping branch for semantic access.
        D.set(group, 'seller.relevantShipping', lightShipping);
        D.set(group, 'seller.relevantShipping.region', shipToRegion);

        for(var j in group.items) {
            var item = group.items[j];
            var shippingType = D.get(item, 'post.dataProduct.shipping.shippingType');
            if (shippingType === 'light') {
                //charge shipping for the first of a batch of "step quantiy"
                if (stepQtyCounter === 0) {
                    D.set(item, 'shippingCharge', lightShipping.cost);
                    stepQtyCounter += 1;
                } else if (stepQtyCounter < stepQty) {
                    D.set(item, 'shippingCharge', 'waived');
                    stepQtyCounter += 1;
                } else {
                    D.set(item, 'shippingCharge', 'waived');
                    stepQtyCounter = 0;
                }
            } else {
                //heavy shipping
                var relevantShipping = D.get(item, 'post.dataProduct.shipping.list.' + shipToRegion);
                D.set(item, 'shippingCharge', relevantShipping);
            }
            //conceal the stock
            item.post = stockFilter(item.post);
        }

    }
    return cartJSON;
};




/*** I think with every cart refresh, we need to persist a new db record.

the record will have a expiry duration. 12 hours?

if expired, alert the shopping that exchange rate or shipping cost may have changed.
please check and check out again. */