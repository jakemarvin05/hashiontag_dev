var db = global.db;
var fs = require('fs');
var fname = "deletePost ";
var uploadDir = 'public/uploads/';

module.exports = function deletePost(req, res) {
    if(!req.isAuthenticated()) { return res.json({success: false, reason: 'notAuth'}); }

    var postToDelete = req.body.pid;

    //to block unauthorised deletion by manipulated requests, we delete by
    //strick ruling of finding postId with its matching req's userid.
    //if no post exist, it is likely to be unauthorised, and automatically
    //blocked.
    db.Post.find({
        where: {
            postId: postToDelete,
            User_userId: req.user.userId
        },
        attributes: ['postId', 'imgUUID', 'isProfilePicture']
    }).then(function(post) {
        if(post) {
            var imgpath = uploadDir + post.imgUUID,
                deleteArr = [];

                deleteArr.push(imgpath + '.jpg');
                deleteArr.push(imgpath + '-half.jpg');
                deleteArr.push(imgpath + '-small.jpg');
                deleteArr.push(imgpath + '-thumb.jpg');

            for(var i=0; i<4; i++) {
                fs.unlink(deleteArr[i], function(err) {
                    if(err) {
                        console.log(fname + ' Err: Error deleting ' + deleteArr[i]);
                        console.log(err);
                    }
                });
            }
            var isProfilePicture = (req.user.profilePicture === post.imgUUID);
            return [
                post.destroy(),
                isProfilePicture
            ]
        }
    }).spread(function(destroy, isProfilePicture) {
        console.log(fname + postToDelete + ' destroyed.');
        if(!isProfilePicture) { return res.json({success:true}); }

        db.Post.findAll({
            where: {User_userId: req.user.userId},
            attributes: ['postId', 'createdAt','imgUUID', 'isProfilePicture'],
            order: [['createdAt', 'DESC']],
            limit: 1
        }).then(function(post) {
            var post = post[0];
            //if we can't find any post, we give up
            //just set the user's profilePicture to null
            if(!post) { 

                db.User.update({
                    Post_postId_profilePicture: null,
                    profilePicture: null
                }, { 
                    userId: req.user.userId
                }).then(function() {
                    //and then we refresh the user's page
                    return res.json({success:true});
                }).catch(function(err) {
                    console.log(fname + 'error setting user profile picture to null: ' + err);
                });

                return res.json({success:true}); 
            }

            //else we update the new profile picture.
            db.User.update({
                Post_postId_profilePicture: post.postId,
                profilePicture: post.imgUUID
            }, { 
                userId: req.user.userId
            }).then(function() {
                return db.Post.update({
                    isProfilePicture: true
                }, post);
            }).then(function() {
                //and then we refresh the user's page
                return res.json({success:true});
            }).catch(function(err) {
                console.log(fname + 'error setting user profile picure: ' + err);
            });
        });
    }).catch(function(err) {
        console.log(fname + postToDelete + ' not destroyed.');
        console.log(err);
        res.json({success:false});
    });
}