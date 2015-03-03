"use strict";

/* VV.globals */
if (typeof VV === "undefined") { var VV = {}; }

VV.extend = function(extension, props) {
    var theTypeof = typeof props;
    if (!(theTypeof === "function" || theTypeof === "object")) { return false; }

    //if is function
    if (theTypeof === "function") { return VV[extension] = props; }

    //if is object
    if (typeof VV[extension] === "undefined") { VV[extension] = {}; }
    var obj = VV[extension];

    for(var prop in props) {
        if(props.hasOwnProperty(prop)) {
            obj[prop] = props[prop];
        }
    }
};

VV.extend('globals', {
    regionNames: {
        usc: 'US & Canada',
        sea: 'SE Asia',
        asiaeu: 'North Asia & Eur',
        oceania: 'Oceania',
        me: 'Middle East',
        row: 'Rest of the World'
    }
});
//shorthand
VV.g = VV.globals;

