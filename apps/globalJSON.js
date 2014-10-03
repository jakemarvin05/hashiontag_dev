//statics
var pathsJSON = require('../apps/pathsJSON.js');

module.exports = function gJSON(req, options) {

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

        var uap = require('ua-parser').parseUA(req.headers['user-agent']);
        var family = uap.family.toLowerCase();
            ua.family = family;
            //console.log(family);
        var major = parseFloat(uap.major);
            ua.major = major;
            //console.log(major);

        if(family.indexOf('mobile') > -1 ) {
            ua.isMobile = true;
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
