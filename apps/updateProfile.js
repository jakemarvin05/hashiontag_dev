var db = global.db;
var Promise = require('bluebird');
module.exports = function editProfile(req,res) {

    /* this function will receive:
    { name: 'Calvin Tan',
      gender: 'female',
      email: 'calvin14@gmail.com',
      web: 'hjjjjj',
      country: 'Andorra',
      about: 'I built this thing.',
      picture: 'img5232848d40000000' }

    */

    if(!req.isAuthenticated()){ return res.redirect('/'); }

    //console.log(req.body);

    db.Post.find().then(function() {
        function getUser() {
            return db.User.find(req.user.userId);
        }

        //3 conditions:
        //1) user picture input is valid
        //2) picture is not the same as the current profile picture
        //3) user has already set a profile picture.
        if(req.body.picture !== 'undefined' && req.body.picture && req.body.picture !== req.user.profilePicture) {

            //force strict rule to find picture that belongs to the user.
            return [
                db.Post.find({
                    where: {
                        imgUUID: req.body.picture,
                        User_userId: req.user.userId
                    }
                }),

                getUser()
            ]
        }

        //else, we don't get the pre-existing post of the profile picture
        return [false, getUser()];
    }).spread(function(post, user) {

        var updateHash = {
            name: req.body.name,
            gender: req.body.gender,
            email: req.body.email,
            web: req.body.web,
            country: req.body.country,
            about: req.body.about
        }

        //if we get a valid post value, it means the picture has changed.
        //the relationship between Post and User as profile picture has no constraint.
        //we have to remove the previous Post set as user profile pic.
        if(post) {
            console.log('new profile picture post is found')
            //asynchronous
            db.Post.find({
                where:{imgUUID: req.user.profilePicture}
            }).then(function(post) {
                console.log('old one found... removing it');
                if(post) {
                    return post.updateAttributes({
                        isProfilePicture: false
                    });
                }
                return false;
            }).catch(function(err) {
                console.log(err);
            });

            updateHash.profilePicture = post.imgUUID;
            updateHash.Post_postId_profilePicture = post.postId;

        }


        return [
            (function() { if(post) { return post.updateAttributes({ isProfilePicture: true }); } })(),
            user.updateAttributes(updateHash)
        ]
    }).spread(function() {
        return res.json({ success: true});
    }).catch(function(err) {
        console.log(err);
        return res.json({success:false});
    });

    db.Sequelize.Promise.onPossiblyUnhandledRejection(function(err) {
        console.log(err);
    });


}



