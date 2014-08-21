var db = require('../models');


module.exports = function addRemoveLike(req, eventEmitter) {

        var throwErr = function(error) {

                console.log(error);

                return function() {
                        //addRemoveLike = false;
                        eventEmitter.emit('addRemoveLikeDone', true); // err = true
                }();
        }

        console.log('addRemoveLike: authenticating');

        if(req.isAuthenticated()) {

            if(req.body.action == 'like') {

                db.Like.find({
                    where: db.Sequelize.and(
                        {Post_postId: req.body.postId},
                        {User_userId: req.user.userId}
                    )
                }).then(function(like) {

                    if(!like) {

                        db.Like.build().save().then(function(like) {
                        console.log('addRemoveLike: like created, setting user and post');
                        //console.log(like);


                        //asynchronous setting
                        return [
                                like.setUser(req.user),
                                like.setPost(req.body.postId)
                        ];

                        }).spread(function(setUser, setPost) {
                            //console.log(JSON.stringify(setUser));
                            //console.log(JSON.stringify(setPost));

                            //console.log(commentJSON);

                            return eventEmitter.emit('addRemoveLikeDone', true);

                        });

                    } else {

                        console.log('attempt to like a post already liked');
                        return eventEmitter.emit('addRemoveLikeDone', false);

                    }
                        

                }).catch(function(err) {
                    console.log('caught error:');
                    console.log(err); 
                    return eventEmitter.emit('addRemoveLikeDone', false);
                });

            }

            if(req.body.action == 'unlike') {

                //using find a
                db.Like.findAll({
                    where: db.Sequelize.and(
                        {Post_postId: req.body.postId},
                        {User_userId: req.user.userId}
                    )
                }).then(function(likes) {
                     console.log(likes);
                    // console.log(likes.length);
                    if(likes.length > 0) {

                        var idArray = [];

                        for(var i in likes) {
                            idArray.push(likes[i].values['likeId']);
                        }

                        db.Like.destroy({likeId: idArray}).then(function(){

                            return eventEmitter.emit('addRemoveLikeDone', true);

                        });

                            


                    } else {

                        console.log('attempt to unlike a post has not been liked');
                        return eventEmitter.emit('addRemoveLikeDone', false);

                    }
                        

                }).catch(function(err) {
                    console.log('caught error:');
                    console.log(err); 
                    return eventEmitter.emit('addRemoveLikeDone', false);
                });

            }

        } else {
            console.log('not authenticated');
            return eventEmitter.emit('addRemoveLikeDone', false);
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