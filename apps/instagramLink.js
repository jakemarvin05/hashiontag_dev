var fname = "instagramLink.js ";

module.exports = function instagramLink(req, res, action) {

    //GET USER
    if(action === "getuser") {
        instaNode.user_search(req.body.screenName, {count: 1}, function(err, users, remaining, limit) {
            if(err) { console.log(err); return res.json({success:false}); }

            var results = {
                users: users,
                remaining: remaining,
                limit: limit
            }
            console.log(results);
            console.log(remaining + ' out of ' + limit + ' instagram api hits available');

            return res.json({
                success: true, 
                user: users[0]
            });
        });
    }

    //UPDATE MY INSTAGRAM LINK
    if(action === "link") {

        var instagram = {
            instaId: req.body.instaId,
            screenName: req.body.screenName,
            User_userId: req.user.userId
        }

        db.Instagram.find({
            where: {
                User_userId: req.user.userId 
            }
        }).then(function(insta) {
            if(insta) {
                if(insta.instaId === req.body.instaId && screenName === req.body.screenName) {
                    //the details have not changed, don't do anything
                    return res.json({success: true});
                } else {

                    //details have changed.
                    return insta.updateAttributes(instagram);
                }
            }
            return db.Instagram.create(instagram);
        }).then(function() {
            return res.json({success: true})
        }).catch(throwErr);
    }


    function throwErr(err) {
        console.log(fname + "threw error: " + err);
        return res.json({success: false});
    }
} 


