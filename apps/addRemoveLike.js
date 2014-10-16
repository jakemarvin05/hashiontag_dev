var db = global.db,
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
                    return false;

                }

                return db.Post.find({ where:{ postId:req.body.postId } });

            }).then(function(post) {

                if(!post) {

                    return false;
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

                console.log('addRemoveLike: Incrementing relevant scores...\n');
                addLikeIncrementScores(req);

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

                console.log('addRemoveLike: Decrementing relevant scores...\n');
                removeLikeDecrementScores(req);


                var idArray = [];
                for(var i=0; i<idArray.length; i++) {
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

}

function addLikeIncrementScores(req){

    db.Post.find({
        where: {postId: req.body.postId},
        attributes: ['postId', 'postScore', 'User_userId']
    }).then(function(post) {
        post
        .increment('postScore', {by: 1})
        .catch(function(err) {
            console.log(err);
        });
        console.log('Incremented post scores....\n');

        return db.Following.find({
            where: {
                FollowerId: req.user['userId'],
                FollowId: post.getDataValue('User_userId')
            },
            attribute: ['affinity']
        });
    }).then(function(following) {

        return following.increment('affinity', {by: 1});

    }).then(function(following) {
        return following.save();
            console.log('Incremented affinity...\n');
    }).catch(function(err) {
        console.log(err);
    })
}

function removeLikeDecrementScores(req){
    db.Post.find(req.body.postId).success(function(post) {
        post.decrement('postScore', {by: 1}).success(function(post){
            post.save();
            console.log('Decremented post scores....\n');
        });
        
        db.Following.find({
            where: {
                FollowerId: req.user['userId'],
                FollowId: post.getDataValue('User_userId')
            }

        }).success(function(following){
            //console.log(following);
            following.decrement('affinity', {by: 1}).success(function(following){
                following.save();
                console.log('Decremented affinity...\n');
            });
        });
    })
}
