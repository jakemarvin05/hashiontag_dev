var db = require('../models');
var fname = "settings.js ";

module.exports = function settings(req, res, action, gJSON, render) {

    var renderJSON = {}

    if(!req.isAuthenticated()) { return res.redirect('/'); }

    if(action === "render") {
        db.Instagram.find({
            where: { User_userId: req.user.userId },
            attributes: ['screenName']
        }).then(function(instagramLink) {

            if(instagramLink) {
                renderJSON.instagramLink = instagramLink.screenName;
            } else {
                renderJSON.instagramLink = false;
            }

            renderJSON.userNameDisp = req.user.userNameDisp;
            return render(renderJSON);

        }).catch(throwErr);
    }

    if(action === "changePassword") {

    }

    if(action === "instagramLink") {
        
    }

    function throwErr(err) {
        console.log(fname + err);
        return render(false);
    }

}