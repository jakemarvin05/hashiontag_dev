/* checkSizesAndStock.js
 *
 *     checkSizesAndStock({
 *         req: req,
 *         res: [res or null]
 *         sizeData: [data],
 *         showStock: [true/false]
 *     }, callback);
 * 
 *
 *
 * Receives 'req' obj and optional 'res', 'sizeData' and 'callback'
 * Produces result:
 *  When errored: [ false, [statusCode], [msg (optional)] ] 
 *  When successful: [ [sizeKey (fresize or other sizes), [ true (or positive int if 'showStock: true', 'oos' or negative int ] ]
 *      * true: there is enough stock to fulfill
 *      * 'oos': item is out of stock
 *      * [negative int]: item is stocked but not sufficient to fulfil requested quantity
 * 
 * 
 * Note: returning true instead of stock number is to protect stock confidentiality.
 *       however, in the case of request quantity > than stock, return a negative number
 *       so that actions can be taken, such as recommend new quantity.
 * 
 * USE CASES:
 *
 * 1. Called from route
 *      Route will call:
 *
 *          checkSizesAndStock({req: req, res: res});
 *
 *      Responses will be handled automatically.
 *
 * 2. Called internally without sizeData.
 *      For normal use case, function should call:
 *
 *          checkSizesAndStock({
 *              req: req,
 *              showStock: [true/false]
 *          }, callback);
 *
 *      Callback will be called and passed the array.
 *      Function can call and receive similar effects as (1).
 *      IMPORTANT: Only when res is not passed in, callback will be called.
 *
 * 3. Called internally with sizeData (by a function that already has gotten data.)
 *      Function will call:
 *
 *          checkSizesAndStock({
 *              req: req,
 *              res: [res or null] (most likely to be null cause internal function would handle res itself
 *              sizeData: [data],
 *              showStock: [true/false]
 *          }, callback);
 *
 *      This will return the result array, to callback if provided.
 */


var D = require('dottie');

module.exports = function checkSizesAndStock(opts, callback) {

    var req = opts.req,
        res = opts.res,
        sizeData = opts.sizeData,
        showStock = opts.showStock;

    function response(array) {

        //if array contains result (!== false)
        if (array[0] !== false) {

            //with response object passed in, handle the response.
            if (res) {
                return res.json(array);
            } else {

                //else, try to put it inside the callback
                if (typeof callback === "function") {
                    callback(array);
                }

                //else just return the array;
                return array;
            }

        } else {

            if (res) {
                // array should contain 1. status code, 2. msg [optional]
                return res.status(array[1]).send(array[2] ? array[2] : '')
            } else {
                if(typeof callback === "function") {
                    callback(array);
                }
                return array;
            }
        }

    } //response

    if (!req.body.qty || req.body.qty === 0) { return response([false, 400, 'Did not provide qty.']); }
    try {
        var qty = parseInt(req.body.qty);
        if (qty === 0 || !qty) {
            return response([false, 400, 'Did not provide qty.']);
        }
    } catch(err) {
        return response([false, 500, err]);
    }
    req.body.qty = qty;

    //if sizeData exist, run the function without db call
    //routes should not pass in sizeData
    if (sizeData) {
        if (typeof sizeData !== "object") { return false; }
        return checkAbstract(req, null, sizeData, showStock);
    } else {

        //no sizeData, check for postId
        if (!req.body.postId) { return response([false, 400, 'No PostId Provided']); }
        return findProduct(req, res, showStock);

    }

    function findProduct(req, res, showStock) {
        
        return db.Post.find({
            where: db.Sequelize.and(
                    { postId: req.body.postId },
                    { isProduct: true },

                    //select a post where it has not been softDeleted (or softDeleted != true)
                    //GOTCHA sequelize rc8 {ne: true} cannot pick up null values.
                    db.Sequelize.or(
                        {softDeleted: {ne: true} },
                        {softDeleted: null}
                    )
            ),
            attributes: ['dataProduct']
        }).then(function(data) {

            var dataProduct = data.dataProduct;

            //not found
            if (!dataProduct) { 
                return response([false, 404, 'Product not found']);
            }
            var sizeType = D.get(dataProduct, 'size.sizeType');
            if (!sizeType) { return response([false, 500, 'Record is not reliable (1)']); }

            return checkAbstract(req, res, dataProduct.size, showStock);  
        });
    }


    function checkAbstract(req, res, sizeData, showStock) {
        
        var sizeType = D.get(sizeData, 'sizeType');
        if (!sizeType) { return response([false, 500, 'Record is not reliable (2)']); }

        //if there is sizeType, but did not receive size, reject.
        if (sizeType === "hassize" && !req.body.size) { return response([false, 400, 'Did not provide size']); }
        //vice versa
        else if (sizeType === "nosize" && req.body.size) { return response([false, 400, 'Item is freesize but provided size']); }

        var stockCheck;
        if (sizeType === "hassize") {
            return _hasSizeCheck(req, sizeData, showStock); 
        } else if (sizeType === "nosize") {
            return _noSizeCheck(req.body.qty, sizeData, showStock);
        } else {
            //something is wrong
            return response([false, 400, 'Record is not reliable. (3)']);
        }

        /* ====== private functions */
        function _hasSizeCheck(req, sizeData, showStock) {
            //if there is no size data, something is wrong
            var storedSizes = D.get(sizeData, 'sizes');
            if (!storedSizes) { return response([false, 400, 'Record is not reliable. (4)']); }

            var size = req.body.size, qty = req.body.qty;

            try {
                //parse the sizes keys
                var key, keys = Object.keys(storedSizes);
                var n = keys.length;

                //turn everything to lowercase;
                var newObj = [];
                for(var i = 0; i < n; i ++) {
                    key = keys[i];
                    newObj.push(key.toUpperCase());
                }

                //compare lowercasing. newObj contains all lowercased keys.
                var index = newObj.indexOf(size.toUpperCase());

                //if there is a match
                if (index > -1) {
                    var stock = _checkStock(sizeData, 'sizes.' + keys[index], qty, showStock);
                    if (!stock && stock !== 0) { return response([false, 400, 'Record is not reliable. (5)']); }
                    var result = [ keys[index], stock ];
                    return response(result);
                } else {
                    //no match, return false.
                    return response([false, 400, 'Requested size does not exist.']);
                }

            } catch(err) {
                return response([false, 500, err]);
            }
        }

        function _noSizeCheck(qty, sizeData, showStock) {
            var stock = _checkStock(sizeData, 'nosizeQty', qty, showStock);
            if (!stock && stock !== 0) { return response([false, 400, 'Record is not reliable. (6)']); }
            var result = [ 'freesize', stock ];
            return response(result);
        }

        function _checkStock(sizeData, key, qty, showStock) {

            //get the stock count
            var stock = parseInt(D.get(sizeData, key));

            //qty can be 0, using !0 will produce undesired results
            //added && criteria to preclude.
            if(!stock && stock !== 0) { return false; }

            //set the stock status
            //if there is stock but not enough, return the negative number
            if (stock === 0 || stock < 0) { stock = 'oos'; }
            else if (stock - qty < 0) { stock = stock - qty; }
            else if (showStock) { stock = stock - qty; }
            else { stock = 'hasStock'; }
            return stock;
        }
    }
};