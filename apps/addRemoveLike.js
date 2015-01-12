var db = global.db,
    notification = require('./notification.js'),
    fname = "addRemoveLike ";


module.exports = function addRemoveLike(req, res) {

    var throwErr = function(error) {

        console.log(error);

        return res.json({ success: false, error:error });

    }

    var dataObj = '';

    console.log('addRemoveLike: authenticating');

    if(req.isAuthenticated()) {

        if(req.body.action === 'like') {
            //console.log(req.user.userId);

            db.Like.findOrCreate({
                where: {
                    User_userId: req.user.userId,
                    Post_postId: req.body.postId
                }
            }).spread(function(like, created) {
                
                if(created) {
                    console.log(fname + 'userId ' + req.user.userId + ' liked postId' + req.body.postId);
                    console.log('addRemoveLike: like created, setting user and post');
                    console.log('addRemoveLike: Incrementing relevant scores...\n');
                    addLikeIncrementScores(req);
                    notification(req,res,dataObj);
                    return res.json({success: true});
                }
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

                var idArray = [];
                for(var i=0; i<likes.length; i++) {
                    idArray.push(likes[i].values['likeId']);
                }
                console.log('idArray');
                console.log(idArray);

                return [
                    db.Like.destroy({
                        where: {likeId: idArray}
                    }),
                    db.Post.find({ where:{postId:req.body.postId}, attributes: ['postId'] })
                ]
                    
            }).spread(function(destroy, post){

                //find the post to destroy the notification.
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

    var affinityBonus = 2;

    db.Post.find({
        where: {postId: req.body.postId},
        attributes: ['postId', 'postScore', 'User_userId']
    }).then(function(post) {

        //if it is your own post, do nothing
        if(req.user.userId === post.User_userId) {
            return false;
        }

        
        //post score increment
        post.increment('postScore', {by: 1}).then(function() {
            console.log(fname + 'Incremented post scores....\n');
        }).catch(function(err) {
            console.log(fname + 'Error in incrementing post score for postId' + post.postId + ' . For userId ' + req.user.User_userId + '. Error: ' + err);
        });



        //affinity between post owner and user.
        return db.Following.find({
            where: {
                FollowerId: req.user.userId,
                FollowId: post.User_userId
            },
            attribute: ['affinity']
        });

    }).then(function(following) {


        //if user is not following post owner, end.
        if(!following) { return false; }

        
        console.log('Incremented affinity...\n');
        following.affinity = Math.floor(following.affinity) + affinityBonus + Math.random()/1000;
        return following.save();


    }).catch(function(err) {
        console.log(fname + 'Catch handler error: ' + err);
    })
}