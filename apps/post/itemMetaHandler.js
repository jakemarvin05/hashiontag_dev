var fname = 'itemMeta.js ';
var S = require('string');
var V = require('../utils.js');

module.exports = function(itemMeta) {

    if (typeof itemMeta !== "object") { return {}; }

    //check for nullity first before invoking HTML tags stripping.
    //by default null should occur very frequently, so don't incur strip tags overheads unneccessarily
    var name = itemMeta.name;
    name = V.nullIfEmpty(name);
    if(name) { 
        name = S(name).stripTags().s; // strip HTML tags
        itemMeta.name = S(name).strip('\'','"').s; //strip quotation marks.
    } else {
        delete itemMeta.name;
    }

    var link = itemMeta.link;
    link = V.nullIfEmpty(link);
    if(link) { 
        link = S(link).stripTags().s; // strip HTML tags
        itemMeta.link = S(link).strip('\'','"').s;
    } else {
        delete itemMeta.link;
    }

    var add = itemMeta.userName
    add = V.nullIfEmpty(add);
    if(add) { 
        add = S(add).stripTags().s;
        //strip away the '@'
        if(add.indexOf('@') === 0) {
            add = add.substring(1);
        }
        itemMeta.userName = add;
    } else {
        delete itemMeta.userName;
    }

    var price = itemMeta.price;
    price = V.nullIfEmpty(price);
    if(price) { 
        price = S(price).stripTags().s; 
        itemMeta.price = S(price).strip('\'','"').s; 
    } else {
        delete itemMeta.price;
    }

    return itemMeta;   
}