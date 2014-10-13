var db = require('../../models');

module.exports = function followJSON(req, res, followType) {

    var following = false,
        followers = false;

    if(followType == "following") {
        following = true;
    } else if(followType === "followers") {
        followers = true;
    } else {
        console.log('followJSON: something is wrong with this uri.')
        return res.json({success:false});
    }


    var throwErr = function(error) {
        console.log(error);
        return res.json({success: false});
    }

    var attributes = ['userId', 'userNameDisp', 'about', 'name', 'profilePicture'];
    var order = [['userNameDisp', 'ASC']]


    console.log('followJSON: user is authenticated.. finding posts...');
    if(following) {
        console.log('followJSON: getFollow');

        db.User.find().then(function(){
            if(req.userId === req.body.userId) {
                return "skipthis"
            } else {
                return db.User.find({
                    where: {userId: req.body.userId},
                    attributes: ['userId']
                });
            }
        }).then(function(user) {
            if(user === "skipthis") {
                return req.user.getFollows({
                    attributes: attributes,
                    order: order
                });
            } else {
                return user.getFollows({
                    attributes: attributes,
                    order: order
                });
            }
        }).then(function(users) {
            return res.json({success:true, results: users });
        }).catch(throwErr);

    } else if(followers) {

        console.log('followJSON: getFollowers');

        db.User.find().then(function(){
            if(req.userId === req.body.userId) {
                return "skipthis"
            } else {
                return db.User.find({
                    where: {userId: req.body.userId},
                    attributes: ['userId']
                });
            }
        }).then(function(user) {
            if(user === "skipthis") {
                return req.user.getFollowers({
                    attributes: attributes,
                    order: order
                });
            } else {
                return user.getFollowers({
                    attributes: attributes,
                    order: order
                });
            }
        }).then(function(users) {
            return res.json({success:true, results: users });
        }).catch(throwErr);


    }
}