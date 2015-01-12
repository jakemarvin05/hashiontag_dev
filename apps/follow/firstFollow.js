var db = global.db;
var fname = "firstFollow.js ";

/* This file instantly add posts to users' stream when they first follow another user */

module.exports = function(req, userIdToAction) {

    //if user hasn't start following anyone
    if(req.user.hasNoFollow) { 

        db.Post.findAll({
            where: {
                User_userId: userIdToAction
            },
            attributes: ['postId', 'createdAt'],
            limit: 3,
            order: [ ['createdAt', 'DESC'] ]
        }).then(function(posts) {

            if(!posts) {
                return console.log(fname + ' Unexpected error occur where userIdToAction posts didnt fetch any results.');
            }

            if(posts.length === 0) { return [false, false]; }

            var lastestPostDate = posts[0].createdAt;
            var bulkOfPosts = [];
            for(var i=0; i<posts.length; i++) {
                var create = {
                    Post_postId: posts[i].postId,
                    User_userId: req.user.userId
                }
                bulkOfPosts.push(create);
            }

            return [
                db.User.update({
                    lastStreamUpdate: lastestPostDate,
                    hasNoFollow: false
                }, {
                    where: { userId: req.user.userId}
                }),
                db.Stream.bulkCreate(bulkOfPosts)
            ]
        }).spread(function() {
            console.log(fname + 'has completed firstFollow actions for userId: ' + req.user.userId);
        }).catch(function(err) {
            console.log(fname + 'error in db catch handler, error: ' + err);
        });
    } else {
        //user has started following people. Only attempt to add 1 post.

        /*
        1) Get the user instance.
        2) Get the latest stream update.
        3) Find a post from target user (the user being followed) with createdAt < streamupdate.
        4) Check if post ID exist on user's stream.
        5) If not, push it in.
        */ 
        var POST_TO_ADD;
        db.User.find({
            where: {
                userId: req.user.userId
            },
            attributes: ['lastStreamUpdate']
        }).then(function(user) {

            //rare exception handling. lastStreamUpdate in this branch cannot possibly be null
            //under normal ops. Throw error.
            if(!user.lastStreamUpdate) { 
                throw new Error(fname + 'Rare error where user lastStreamUpdate is null with firstFollow false'); 
            }

            return db.Post.find({
                where: {
                    User_userId: userIdToAction,
                    createdAt: {
                        lte: user.lastStreamUpdate
                    }
                },
                attributes: ['postId'],
                order: [[ 'createdAt', 'DESC' ]]
            });

        }).then(function(post) {

            POST_TO_ADD = post;

            return db.Stream.find({
                where: db.Sequelize.and({
                    Post_postId: post.postId
                }, {
                    User_userId: req.user.userId
                })
            });

        }).then(function(post) {
            if(!post) {
                return db.Stream.create({
                    Post_postId: POST_TO_ADD.postId,
                    User_userId: req.user.userId
                });
            }
            console.log('post exist not adding....');
            return false;
        }).catch(function(err) {
            console.log(fname + 'firstFollow false branch. Error: ' + err);
        });

    }
}