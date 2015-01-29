var db = global.db;
var fs = require('fs');
var fname = "deletePost ";
var uploadDir = 'public/uploads/';

module.exports = function deletePost(req, res) {
    if(!req.isAuthenticated()) { return res.json({success: false, reason: 'notAuth'}); }

    var postToDelete = req.body.pid;

    var isProfilePicture = false;
    var isDisAttribution = false;
    var isRejected = false;

    db.Post.find({
        where: { postId: postToDelete }
    }).then(function(post) {
        if(!post) { return res.json({success: false}); }

        //check if the post owner is the requestor
        if(post.User_userId !== req.user.userId) {

            //owner is not the requestor, check if the post is attributed
            if(post.User_userId_attributed === req.user.userId) {
                post.User_userId_attributed = null;
                post.isAttributionApproved = false;
                return post.save();
            }

            //the requestor is not the post owner, and is not attributed. reject.
            isReject = true;
            return res.json({success: false});
        }

        //post owner is the requestor. she/he wants to delete it.
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
        isProfilePicture = (req.user.profilePicture === post.imgUUID);
        return post.destroy();
    
    }).then(function(destroyOrSave) {

        if (isRejected) { return false; }

        if (isDisAttribution) { return res.json({success: true}); }

        if (!isProfilePicture) { return res.json({success: true}); }

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
                    where: {
                        userId: req.user.userId
                    }
                }).then(function() {
                    //and then we refresh the user's page
                    return res.json({success:true});
                }).catch(function(err) {
                    console.log(fname + 'error setting user profile picture to null: ' + err);
                    res.json({success:false});
                });
            }

            //else we update the new profile picture.
            db.User.update({
                Post_postId_profilePicture: post.postId,
                profilePicture: post.imgUUID
            }, { 
                where: {
                    userId: req.user.userId
                }
            }).then(function() {
                return db.Post.update({
                    isProfilePicture: true
                }, post);
            }).then(function() {
                //and then we refresh the user's page
                return res.json({success:true});
            }).catch(function(err) {
                console.log(fname + 'error setting user profile picure: ' + err);
                res.json({success:false});
            });

        }).catch(function(err) {
            console.log(fname + 'db.User update catch handler. Error: ' + err);
            res.json({success:false});
        });

    }).catch(function(err) {
        console.log(fname + postToDelete + ' not destroyed.');
        console.log(err);
        res.json({success:false});
    });
}