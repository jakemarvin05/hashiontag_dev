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

    for(var i in cartGroups) {
        var group = cartGroups[i];
        var currency = D.get(group, 'seller.dataMeta.dataShop.currency');
        var stepQty = D.get(group, 'seller.dataMeta.dataShop.shipping.stepQty');
        var lightShipping = D.get(group, 'seller.dataMeta.dataShop.shipping.light.' + shipToRegion);
        //TODO: handle cases where the seller do not ship to that region.

        //set the relevantShipping branch for semantic access.
        D.set(group, 'seller.relevantShipping', lightShipping);
        D.set(group, 'seller.relevantShipping.region', shipToRegion);

        var waivedShippingCounter = 0; //update this counter for every shipping waived.
        for(var j in group.items) {
            var item = group.items[j];
            var shippingType = D.get(item, 'post.dataProduct.shipping.shippingType');

            if (shippingType === 'light') {

                var qty = item.qty;
                var lightShippingCost = lightShipping.cost;
                var chargeableQty, waivedShippingCounter, multiplier, remainder, shippingCharge;

                if (lightShippingCost === 0) {
                    D.set(item, 'shippingCharge', 'free');
                } else if (waivedShippingCounter === 0 ) {

                    /* charge shipping and reset counter. */
                    chargeableQty = qty;

                    //apply shipping part thereof.
                    multiplier = Math.ceil(chargeableQty / stepQty);
                    remainder = chargeableQty % stepQty;

                    D.set(item, 'shippingCharge', lightShippingCost * multiplier);

                    //set the remaining waived shipping counts.
                    waivedShippingCounter = stepQty - remainder;

                } else {

                    //chargeableQty is the quantity offsetted with "free/waived rollover quantity"
                    chargeableQty = qty - waivedShippingCounter;

                    if (chargeableQty <= 0) {
                        //if it is < 0, we have more waived shipping left after using it on this.
                        D.set(item, 'shippingCharge', 'waived');
                        waivedShippingCounter = Math.abs(chargeableQty);

                    } else {
                        //apply shipping part thereof
                        multiplier = Math.ceil(chargeableQty / stepQty);
                        remainder = chargeableQty % stepQty;

                        D.set(item, 'shippingCharge', lightShippingCost * multiplier);
                        waivedShippingCounter = stepQty - remainder;
                    }
                    
                }

                
            } else {
                //heavy shipping
                var relevantShipping = D.get(item, 'post.dataProduct.shipping.list.' + shipToRegion);
                D.set(item, 'shippingCharge', relevantShipping * item.qty);
            }
            //conceal the stock
            item.post = stockFilter(item.post)[0];
        }

    }
    return cartJSON;
};




/*** I think with every cart refresh, we need to persist a new db record.

the record will have a expiry duration. 12 hours?

if expired, alert the shopping that exchange rate or shipping cost may have changed.
please check and check out again. */