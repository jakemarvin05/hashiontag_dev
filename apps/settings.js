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
                var link = instagramLink.screenName;
                renderJSON.instagramLink = link;
                return render(renderJSON);
            }

            renderJSON.instagramLink = false;
            console.log(renderJSON);
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