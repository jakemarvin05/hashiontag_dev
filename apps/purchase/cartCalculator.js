var fname = 'cartCalculator.js ';
var D = require('dottie');

module.exports = function(cartJSON) {
    /* TODO: deal with conversion */
    var hasAddress = (cartJSON.ownAddress) ? true : false;

    //currency: if user does not have currency, default to SGD.
    var currency = cartJSON.ownCurrency || 'SGD';

    var merchantGroups = cartJSON.inStock;

    var total = 0;

    for(var i in merchantGroups) {
        merchant = merchantGroups[i];

        var conversion = 1;
        
        // /* TODO: implement conversion */
        // var merchantCurrency = D.get(merchant, 'seller.dataMeta.dataShop.currency');
        // if (currency.toLowerCase() !== merchantCurrency.toLowerCase()) {
        //     //get currency conversion
        //     conversion = ???
        // }

        var items = merchant.items;
        var subtotal = 0; //subtotal and total is always in the requestor's currency
        for(var i in items) {
            var item = items[i];
            var price = D.get(item, 'post.dataProduct.price');
            item.convertedUnitPrice = (parseFloat(price) * conversion).toFixed(2);

            var cost = parseFloat(item.convertedUnitPrice) * parseFloat(item.qty);
            subtotal += cost;
            if (hasAddress) {
                var shipping = parseFloat(item.shippingCharge) || 0;
                if (shipping > 0) {
                    //not free or waived
                    shipping = (shipping * conversion).toFixed(2);
                    subtotal += parseFloat(shipping);
                    item.convertedShippingCharge = shipping;
                } else {
                    //free or waived
                    item.convertedShippingCharge = item.shippingCharge;
                }
                
            }
        }
        merchant.subtotal = subtotal.toFixed(2); //subtotal is always in the requestor's currency
        total += subtotal;
    }  
    cartJSON.total = total.toFixed(2);
    console.log(cartJSON.total); //subtotal and total is always in the requestor's currency
    return cartJSON
};