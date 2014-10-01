//statics
var pathsJSON = require('../apps/pathsJSON.js');

module.exports = function gJSON(req) {
    var globalJSON = {}

    //things that you want to display on top of every HTML header.
    globalJSON.print = {}


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
    globalJSON.print.userHeaders = userHeaders;


    //join statics

    //pathsJSON
    globalJSON.pathsJSON = pathsJSON;

    return globalJSON;

}
