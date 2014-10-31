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

        var receivedInstagram = {
            instaId: req.body.instaId,
            screenName: req.body.screenName,
            User_userId: req.user.userId,
            //stopArray: "[]",
            active:true
        }



        //first attempt to find the active record.
        db.Instagram.find({
            where: {
                User_userId: req.user.userId
            }
        }).then(function(insta) {

            //if there are no existing record, create new.
            if(!insta) { return db.Instagram.create(receivedInstagram); }

            if(insta.instaId === parseFloat(req.body.instaId) && insta.User_userId === parseFloat(req.user.userId)) {

                console.log('record with matching ids found.');
                if(insta.screenName === req.body.screenName) { 
                    console.log('screenname matched');
                    //the record is exactly the same, and record is active. don't do anything
                    return true;
                }
                console.log('screenname changed');
                //screenname has changed.
                return insta.updateAttributes(receivedInstagram);
            }

            //else, replace with full records. ** stopArray = [] is important to indicate a fresh record.
            //If don't clear the existing stopArray, it is assumed that record is existing, and igg will create duplicate posts.
            receivedInstagram.stopArray = "[]";
            return insta.updateAttributes(receivedInstagram);

        }).then(function() {
            return res.json({success: true})
        }).catch(throwErr);

    }

    if(action === "unlink") {
        db.Instagram.destroy({ User_userId: req.user.userId }).then(function() {
            return res.json({success: true})
        }).catch(throwErr);
    }


    function throwErr(err) {
        console.log(fname + "threw error: " + err);
        return res.json({success: false});
    }
} 


