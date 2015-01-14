var fname = 'itemMeta.js ';
var S = require('string');
var V = require('../utils.js');

module.exports = function(itemMeta) {

    if (typeof itemMeta !== "object") { return {}; }

    //check for nullity first before invoking HTML tags stripping.
    //by default null should occur very frequently, so don't incur strip tags overheads unneccessarily
    var link = itemMeta.itemLink;
    link = V.nullIfEmpty(link);
    if(link) { 
        link = S(link).stripTags().s; // strip HTML tags
        itemMeta.itemLink = S(link).strip('\'','"').s;
    } else {
        delete itemMeta.itemLink;
    }

    var add = itemMeta.itemAddTag
    add = V.nullIfEmpty(itemMeta.itemAddTag);
    if(add) { 
        add = S(add).stripTags().s;
        //strip away the '@'
        if(add.indexOf('@') === 0) {
            add = add.substring(1);
        }
        itemMeta.itemAddTag = add;
    } else {
        delete itemMeta.itemAddTag;
    }

    var price = itemMeta.itemPrice;
    price = V.nullIfEmpty(price);
    if(price) { 
        price = S(price).stripTags().s; 
        itemMeta.itemPrice = S(price).strip('\'','"').s; 
    } else {
        delete itemMeta.itemPrice;
    }

    return itemMeta;   
}