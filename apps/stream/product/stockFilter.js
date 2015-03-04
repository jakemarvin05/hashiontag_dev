/* stockFilter.js conceals the actual quantities of the stock. This is used when data is
 * transmitted to a normal user, in which shops may not want to reveal remaining stock.
 * 
 * Modifies the dataProduct in streams by setting "flags" depending on the quantity
 * of the stock. 
 *
 */

/*
Use:

   stockFilter([Array or Object])

*/


var D = require('dottie');

module.exports = function stockFilter(streams) {

    if (Array.isArray(streams)) {
        if (streams.length === 0) { return streams; }
    } else {
        //if object passed in is a single item, wrap it in array.
        var streams = [streams];
    }

    for(var i=0; i<streams.length; i++) {
        var stream = streams[i];
        var dataProduct = D.get(stream, 'dataProduct');
        if (!dataProduct) { continue; }

        var sizeType = D.get(dataProduct, 'size.sizeType');

        if (!sizeType) { continue; }

        if (sizeType === "hassize") {
            var sizes = D.get(dataProduct, 'size.sizes');

            try {
                var sizeKeys = Object.keys(sizes);
                if (sizeKeys.length === 0) { continue; }
            } catch(err) {
                continue;
            }

            for(var j=0; j<sizeKeys.length; j++) {
                var sizeKey = sizeKeys[j];
                streams[i].dataProduct.size.sizes[sizeKeys[j]] = stockStatus(sizes[sizeKey]);
            }
        } else if (sizeType === "nosize") {
            var qty = D.get(dataProduct, 'size.nosizeQty');
            if (!qty) { continue; }

            streams[i].dataProduct.size.nosizeQty = stockStatus(qty);
        }
    }
    return streams;
}

function stockStatus(qty) {
    //declare variables
    var statuses = ["hasStock", "oos"];
    if (parseFloat(qty) > 0) { return statuses[0]; } else { return statuses[1]; } 
}