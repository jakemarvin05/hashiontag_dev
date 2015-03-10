var fname = 'removeFromCart.js ';
var D = require('dottie');
var cartJSON = require('./cartJSON.js');

module.exports = function(req, res, opts) {
    
    return db.Purchase.destroy({
        where: {
            purchaseId: req.body.purchaseId,
            User_userId: req.user.userId
        }
    }).then(function() {

        return cartJSON(req, res, null, function(results, error) {
            if (!results) {
                return res.status(500).send(error ? error : '');
            }
            return res.json(results);
        });

    }).catch(function(err) {
        return res.status(500).send('Error has occurred');
    });
};