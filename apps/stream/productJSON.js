var db = global.db;
var likesSplicer = require('./likesSplicer');

module.exports = function productJSON(req, render, opts) {

    /* OPTIONS */
    if(opts) {
        if(opts.showType) {
            var showType = opts.showType;
        }
        if(opts.lastPostId){
            var lastPostId = opts.lastPostId;
        }
        if(opts.lastLikeId){
            var lastLikeId = opts.lastLikeId;
        }
    }

    /* Error handling */
    var throwErr = function(error) {
        console.log(error);
        return render(false);
    }

    /* DEFAULT DB calls */

    var where = db.Sequelize.and(
        { User_userId: req.body.userId },
        { isProduct: true }
    );
    
    var include = [{   
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
    }];

    var order = [
        ['createdAt', 'DESC'], 
        [db.Comment, 'createdAt', 'ASC'] 
    ]

    /*DEFAUT SETTINGS */
    var streamLimit = 10;

    /*DEFAULT HOLDERS TO USE*/
    var renderJSON = {
        posts: []
    }
    var idArray = [];
    var postCount = false;

    if (showType === "productstream") {

        console.log('productJSON: showType stream.. finding posts...');
         
        //If there is a lastPostId = next streamLoad
        if(lastPostId){
            console.log('productJSON: Last post loaded is postId: ' + lastPostId);
            var where = db.Sequelize.and(
                { User_userId: req.body.userId },
                { postId: {lt: lastPostId} },
                db.Sequelize.or(
                    { isProduct: {ne: true} },
                    { isProduct: null }
                )
            );
            
        }

        //get the users that current user is following.
        var isAuth = req.isAuthenticated();

        db.User.find().then(function() {
            if (isAuth) {
                return req.user.getFollows({attributes: ['userId']});
            }
            return false;
        }).then(function(users) {

            //push it into the array for use later
            if(users) { 
                for(var i in users) { idArray.push(users[i].userId); }
            }


            console.log('productJSON: got the follows...getting posts');

            return [

                db.Post.findAll({
                    where: where, 
                    include: include, 
                    order: [
                        ['updatedAt', 'DESC'], 
                        [db.Comment, 'createdAt', 'ASC'] 
                    ],
                    limit: streamLimit + 1
                }),

                db.User.find({
                    where: {
                        userId: req.body.userId
                    },
                    attributes: ['dataMeta', 'shopStatus']
                })
            ]
        }).spread(function(streams, seller) {

            if (seller.shopStatus !== "active") { return render(false); }

            //unDAO the streams.
            //it is giving problems adding attributes.
            var streams = JSON.parse(JSON.stringify(streams));

            //assume no more posts to load
            var lastPostId = false;
            if(streams.length > streamLimit) {
                //if the limit + 1'th post exist, set last id to the limit'th post.
                lastPostId = streams[streamLimit].postId;
            }
  
            console.log('productJSON: db retrieval complete, likes splicing...');

            if (idArray.length > 0) { streams = likesSplicer(req, streams, idArray); }

            renderJSON.posts = streams;
            renderJSON.lastPostId = lastPostId;
            renderJSON.success = true;
            renderJSON.dataShop = seller.dataMeta.dataShop;

            return render(renderJSON);

        }).catch(throwErr);

    }
}