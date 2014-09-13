var db = require('../models'),
    notification = require('./notification.js');


module.exports = function addRemoveLike(req, res) {

    var throwErr = function(error) {

        console.log(error);

        return res.json({ success: false, error:error });

    }

    var dataObj = '';

    console.log('addRemoveLike: authenticating');

    if(req.isAuthenticated()) {


        if(req.body.action === 'like') {

            db.Like.find({
                where: db.Sequelize.and(
                    {Post_postId: req.body.postId},
                    {User_userId: req.user.userId}
                )
            }).then(function(like) {

                if(like) {

                    console.log('attempt to like a post already liked');
                    throw new Error('attempt to like a post already liked');

                }

                return db.Post.find({ where:{ postId:req.body.postId } });

            }).then(function(post) {

                if(!post) {

                    console.log('attempt to like a post then doesn\'t exist');
                    throw new Error('attempt to like a post then doesn\'t exist');
                }                    

                console.log('addRemoveLike: like and post check passed, creating like..');

                dataObj = {
                    post: post,
                    postOwner: req.body.postOwnerId,
                    notificationSetter: req.user,
                    action: 'like'
                }

                return db.Like.build().save();


            }).then(function(like) {

                return like.updateAttributes({
                    Post_postId: req.body.postId,
                    User_userId: req.user.userId
                });

                //asynchronous ops
                // return [
                //     like.setUser(req.user),
                //     like.setPost(req.body.postId),
                // ];

            }).then(function() {

                console.log('addRemoveLike: like created, setting user and post');

                //asynchronous notification setting
                //if error occurs in notification setting it will be logged. but user doesn't need to know.
                notification(req,res,dataObj);
                
                return res.json({success: true});
                
            }).catch(throwErr);

        }

        if(req.body.action === 'unlike') {

            db.Like.findAll({
                where: db.Sequelize.and(
                    {Post_postId: req.body.postId},
                    {User_userId: req.user.userId}
                )
            }).then(function(likes) {

                //console.log(likes);
                //console.log(likes.length);
                //if(likes.length > 0) {

                var idArray = [];
                for(var i in likes) {
                    idArray.push(likes[i].values['likeId']);
                }

                return [
                    db.Like.destroy({likeId: idArray}),
                    db.Post.find({ where:{postId:req.body.postId}, attributes: ['postId'] })
                ]
                    
            }).spread(function(destroy, post){

                if(post) {

                    var dataObj = {
                        post: post,
                        postOwner: req.body.postOwnerId,
                        notificationSetter: req.user,
                        action: 'unlike'
                    }

                    notification(req,res,dataObj);

                } 
                // else {
                    //should we write a findAll notifications associated to the post and destroy?
                    //time will tell.
                // }

                return res.json({success: true});

            }).catch(throwErr);

        }

    } else {
        console.log('not authenticated');
        return res.json({ success: false });
    }

                


/***** TODO: Make transactions work! */

                // return sequelize.transaction().then(function(t) {
    //     console.log(t);

    //     console.log('addRemoveLike: transaction started');
    //     return db.Comment.create({

    //       comment: req.body.comment

    //     }, {

    //       transaction: t

    //     }).then(function(comment) {

                //      console.log('addRemoveLike: comment created, saving it.');

                //      comment.save();

                //  }).then(function(comment) {

                //      console.log('addRemoveLike: setting user and post..');
                //      comment.setUser(req.user, {transaction: t});
                //      comment.setPost(req.body.postId, {transaction: t});

                //  }).then(t.commit.bind(t), t.rollback.bind(t));
        
    //   });

    //     }
}