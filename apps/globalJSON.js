//statics
var pathsJSON = require('../apps/pathsJSON.js');
var moment = require('moment');
var uaParser = require('ua-parser');

module.exports = function gJSON(req, options) {
    var parseUA;

    console.log(moment().format());
    if(req.isAuthenticated()) {
        console.log(req.user.userNameDisp + ' is surfing...');
    }

    //defaults
    var parseUA = true;

    //argument overwrites
    if(options) {
        if(options.parseUA === false) {
            parseUA = false;
        }
    }

    var globalJSON = {}

    //things that you want to display on top of every HTML header.
    globalJSON.printHead = {}


    //user headers
    var userHeaders = false;
    if(req.isAuthenticated()) {;
        userHeaders = {
            userId: req.user.userId,
            userNameDisp: req.user.userNameDisp,
            profilePicture: req.user.profilePicture
        }
    }
    globalJSON.userHeaders = userHeaders;
    globalJSON.printHead.userHeaders = userHeaders;

    //User agent
    if(parseUA) {

        var ua = {};

        var uap = uaParser.parseUA(req.headers['user-agent']);
        console.log(uap);
        var family = uap.family.toLowerCase();
            ua.family = family;
        var major = parseFloat(uap.major);
            ua.major = major;
        if(family.indexOf('mobile') > -1 ) {
            ua.isMobile = true;
            if(family.indexOf('safari') > -1) {
                ua.isMobileIOS = true;
            }
        } else {
            ua.isMobile = false;
        }

        globalJSON.userHeaders.ua = ua;
        globalJSON.printHead.userHeaders.ua = ua;
    }


    //join statics

    //print certain routes to head
    var paths = {
        absPath: pathsJSON.paths.absPath,
        img: pathsJSON.paths.img,
        mediaDir: pathsJSON.paths.mediaDir
    }

    //pathsJSON
    globalJSON.pathsJSON = pathsJSON;
    globalJSON.printHead.p = paths;


    return globalJSON;

}
