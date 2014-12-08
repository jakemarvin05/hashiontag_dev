var db = global.db;
var likesSplicer = require('./likesSplicer.js');

module.exports = function singlePostJSON(req, thenRender) {

    var throwErr = function(error) {
        console.log(error);
        return thenRender(false);
    }
    var storedPost;
    var isAuth = req.isAuthenticated();

    //hackish way to start a sequelize promise chain
    db.User.find().then(function() {
        return [
            db.Post.find({
                where: {
                    postId: req.params.pid
                }, 
                include: [{   
                    model: db.User,
                    attributes: [ 'userNameDisp', 'userId', 'profilePicture' ]
                }, { 
                    model: db.Comment,
                    attributes: ['commentId', 'comment', 'createdAt'],
                    include: [{
                        model: db.User,
                        attributes: [ 'userNameDisp','profilePicture' ]
                    }]
                }, {
                    model: db.Like,
                    attributes: [ 'User_userId' ],
                    include: [{
                        model: db.User,
                        attributes: [ 'userNameDisp' ]
                    }]
                }, {
                    model: db.PostMeta,
                    attributes: ['key', 'value'],
                    where: db.Sequelize.or(
                        {'key': 'itemLink'}, 
                        {'key': 'itemAddTag'}, 
                        {'key': 'itemPrice'},
                        {'key': 'isInstagram'}
                    ),
                    required: false
                }], 
                order: [
                    [db.Comment, 'createdAt', 'ASC'] 
                ]
            }),

            (function(isAuth) {
                if(isAuth) {
                    return db.Following.findAll({ 
                        where: {FollowerId: req.user.userId},
                        attributes: ['FollowId']
                    }, {raw: true});
                }
                return false;
            })(isAuth)
        ]
    }).spread(function(post, ids) {

        if(!post) { return thenRender(false); }

        if(ids) {
            var idArray = [];
            var idrun = 0;
            while(ids[idrun]) {
                idArray.push(ids[idrun].FollowId);
                idrun++;
            }
        }
        var post = JSON.parse(JSON.stringify(post));

        //streamFactory is programmed to handle posts array.
        //we trick streamFactory into processing by giving it an array of posts with 1 post.
        //provide better solution when able.
        var renderJSON = {}
        renderJSON.posts = []
        renderJSON.posts.push(post);

        if(isAuth) {
            renderJSON.posts = likesSplicer(req, renderJSON.posts, idArray);
        }

        return thenRender(renderJSON);

    }).catch(throwErr);
}