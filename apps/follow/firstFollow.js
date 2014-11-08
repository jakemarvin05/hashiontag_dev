var db = global.db;
var fname = "firstFollow.js ";

module.exports = function(req, userIdToAction) {

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
                userId: req.user.userId

            }),
            db.Stream.bulkCreate(bulkOfPosts)
        ]
    }).spread(function() {
        console.log(fname + 'has completed firstFollow actions for userId: ' + req.user.userId);
    }).catch(function(err) {
        console.log(fname + 'error in db catch handler, error: ' + err);
    });
}