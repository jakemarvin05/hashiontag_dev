var fname = "shippingCalc.js ";
var D = require('dottie');

module.exports = function(cartJSON) {
    if (!cartJSON.ownAddress) { return cartJSON; }
    for(var i in cartJSON) {
        var group = cartJSON[i];
        var currency = D.get(group, 'seller.dataMeta.dataShop.currency');
        var stepQty = D.get(group, 'seller.dataMeta.dataShop.shipping.stepQty');
    }
};




/*** I think with every cart refresh, we need to persist a new db record.

the record will have a expiry duration. 12 hours?

if expired, alert the shopping that exchange rate or shipping cost may have changed.
please check and check out again.