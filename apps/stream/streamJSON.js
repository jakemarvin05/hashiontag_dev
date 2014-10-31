var db = global.db;
var likesSplicer = require('./likesSplicer');

module.exports = function streamJSON(req, render, opts, START_TIME) {

    START_TIME = START_TIME;

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
    var where = {};
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
    }]
    var order = [
        ['createdAt', 'DESC'], 
        [db.Comment, 'createdAt', 'ASC'] 
    ]

    /*DEFAULT HOLDERS TO USE*/
    var renderJSON = {
        posts: '',
        notifications: ''
    }
    var idArray = [];
    var postCount = false;

    /* Here goes... */

    if(typeof showType === 'undefined') {
            console.log('streamJSON: no showType.. finding posts...');
             
            //If there is a lastPostId = next streamLoad
            if(lastPostId){
                console.log('streamJSON: Last post loaded is postId: '+lastPostId);
                var streamWhere = {
                    User_userId: req.user.userId,
                    Post_postId: {
                        lt: lastPostId
                    }
                }
            }

            //If there is no lastPostId = first streamLoad
            else{
                console.log('streamJSON: New streams loading...');
                var streamWhere = {
                    User_userId: req.user.userId
                }
            }

            req.user.getFollows({attributes: ['userId']}).then(function(users) {

                for(var i in users) {
                    idArray.push(users[i].values['userId']);
                }

                console.log('streamJSON: got the follows...getting posts');
                var where = { User_userId : idArray};

                //curated stream implementation. awaiting complete code....
                return [

                    db.Stream.findAll({
                        where: streamWhere, 
                        include: [{
                            model: db.Post,
                            include: include
                        }], 
                        order: [
                            ['id', 'DESC'], 
                            [db.Post, db.Comment, 'createdAt', 'ASC'] 
                        ],
                        limit: 10
                    }
                            // {raw: true,
                            // nest: true}
                    ),

                    req.user.getNotifications({
                        include: [
                            {
                                model: db.User,
                                as: 'Setter',
                                attributes:['userId','userNameDisp']
                            }
                            
                        ],
                        attributes: ['Post_postId','createdAt','type'],
                        order: [['createdAt', 'DESC']]
                    })
                ]

                // return [

                //    db.Post.findAll({
                //         where: where, 
                //         include: include, 
                //         order: [
                //             ['createdAt', 'DESC'], 
                //             [db.Comment, 'createdAt', 'ASC'] 
                //         ],
                //         limit: 20
                //     }
                //             // {raw: true,
                //             // nest: true}
                //     ),

                //     req.user.getNotifications({
                //         include: [
                //             {
                //                 model: db.User,
                //                 as: 'Setter',
                //                 attributes:['userId','userNameDisp']
                //             }
                            
                //         ],
                //         attributes: ['Post_postId','createdAt','type'],
                //         order: [['createdAt', 'DESC']]
                //     })
                // ]

            }).spread(function(streams, notifications) {
                //console.log(JSON.stringify(streams));
                console.log('streamJSON: db retrieval complete, likes splicing...');
                //console.log(idArray);
                //console.log(JSON.stringify(streams));

                // //curated stream implementation
                // var i = 0;
                // var posts = {};
                // while(streams[i]) {
                //     posts[i] = streams[i].post;
                //     i++;
                // }

                //console.log(posts);

                
                //unDAO'ify the results.
                //var posts = JSON.parse(JSON.stringify(posts));

                //comment this when stream is in implementation
                var streams = JSON.parse(JSON.stringify(streams));
                var posts = {};
                var lastPostId;

                for(var i=0;i<Object.keys(streams).length;i++){
                    posts[i] = streams[i].post;
                    lastPostId = posts[i].postId;
                }
                //console.log(posts);
                //console.log(posts);
                
                posts = likesSplicer(posts);
                //console.log(posts[0]);

                //join notifications and posts
                renderJSON.posts = posts;
                renderJSON.notifications = notifications;
                console.log(streams);
                renderJSON.lastPostId = lastPostId;
                //console.log(JSON.stringify(posts));

                return render(renderJSON);

            }).catch(throwErr);

    } else if(showType === 'preview') {

        db.Post.findAll({
            include: include, 
            order: order,
            limit: 20
        }).then(function(posts) {

            console.log('streamJSON: db retrieval complete, returning the array...');
            //console.log(JSON.stringify(posts));

            //var renderJSON = {};
            renderJSON.posts = posts;

            return render(renderJSON);

        }).catch(throwErr);

    } else if(showType === 'likes') {

        console.log('streamJSON: likes showType.. finding posts...');

        if(lastLikeId){
            console.log('streamJSON: Last like loaded is likeId: '+lastLikeId);
            var likeWhere = {
                User_userId: req.user.userId,
                likeId: {
                    lt: lastLikeId
                }
            }
        }

        //If there is no lastPostId = first streamLoad
        else{
            console.log('streamJSON: New like loading...');
            var likeWhere = {
                User_userId: req.user.userId
            }
        }
        var order = [
            ['likeId', 'DESC'],
            [db.Post, db.Comment, 'createdAt', 'ASC'] 
        ];

        db.User.find().then(function() {

            return [
                //first call
                req.user.getFollows({attributes: ['userId']}, {raw: true}),
                //second call
                db.Like.findAll({
                    where: {User_userId: req.user.userId},
                    attributes: ['likeId','Post_postId'],
                    include: {
                        model: db.Post,
                        include: include
                    },
                    order: order
                })
            ]
        }).spread(function(users, likePosts) {

            if(likePosts.length === 0 ) {
                renderJSON = false;
                return render(renderJSON);
            }

            for(var i=0; i<users.length; i++) {
                idArray.push(users[i].userId);
            }

            var likePosts = JSON.parse(JSON.stringify(likePosts));
            console.log('***likePosts');
            console.log(likePosts);

            //modify the outcome
            //need to float posts out of the nesting.
            var i = 0;
            var posts = {}
            var lastLikeId;
            while(likePosts[i]) {
                var likePost = likePosts[i];
                posts[i] = likePost.post;
                lastLikeId = likePost.likeId;
                i++;
            }
            renderJSON.lastLikeId = lastLikeId

            renderJSON.posts = posts;
            console.log('***posts:');
            console.log(renderJSON.posts);

            console.log('streamJSON: db retrieval complete, likes splicing...');
            //console.log(idArray);
            //console.log(posts);

            //console.log(renderJSON.posts);

            renderJSON.posts = likesSplicer(req, renderJSON.posts, idArray);
            console.log('after splicing');
            console.log(renderJSON.posts);
            renderJSON.postCount = Object.keys(renderJSON.posts).length;
            return render(renderJSON);

        }).catch(throwErr);

    } else if(showType === 'hashtag') {

        if(typeof req.params.hashtag === 'undefined') { return res.direct('/'); }

        console.log('streamJSON: hashtags showType.. finding posts...');

        db.Hashtag.find(req.params.hashtag).then(function(hashtag) {

            if(!hashtag) { return [false,false]; }

            var order = [
                [db.Post, 'createdAt', 'DESC'],
                [db.Post, db.Comment, 'createdAt', 'ASC'] 
            ];

            return [
                db.Hashtag.find({
                    where: {hashtagId: req.params.hashtag },
                    attributes: ['hashtagId'],
                    include: {
                        model: db.Post,
                        include: include
                    },
                    order: order
                }),

                (function() {
                    if(req.isAuthenticated()) {
                        return req.user.getFollows({attributes: ['userId']}, {raw: true});
                    }
                })()
            ]

        }).spread(function(hashtag, follows) {
            //console.log(JSON.stringify(hashtag));

            //var posts = hashtag.posts
            //console.log(posts);

            //if(!posts || posts.length === 0) { return render(false); }

            if(follows) {
                for(var i=0; i<follows.length; i++) {
                    idArray.push(follows[i].userId);
                }
            }

            var hashtag = JSON.parse(JSON.stringify(hashtag));

            //modify the outcome
            //need to float posts out of the nesting.
            // var i = 0;
            // var posts = {}
            // var lastLikeId;
            // while(likePosts[i]) {
            //     var likePost = likePosts[i];
            //     posts[i] = likePost.post;
            //     lastLikeId = likePost.likeId;
            //     i++;
            // }
            //renderJSON.lastLikeId = lastLikeId

            renderJSON.posts = hashtag.posts;
            renderJSON.hashtag = hashtag.hashtagId;

            console.log('streamJSON: db retrieval complete, likes splicing...');

            if(req.isAuthenticated() ) { 
                renderJSON.posts = likesSplicer(req, renderJSON.posts, idArray);
                renderJSON.postCount = Object.keys(renderJSON.posts).length;
            } else {
                renderJSON.postCount = Object.keys(renderJSON.posts).length;
            }
            return render(renderJSON);

        }).catch(throwErr);
    }
}

//some archived code

// sequelize.query('
//     SELECT *
//     FROM "Posts"
//     JOIN
//     (SELECT "PostId", "1" as "liked"
//     FROM "Liking"
//     JOIN "Post"
//     WHERE "Liking"."User_userId" = ' + req.user.userId + ') "PostArray"
//     ON "Posts"."postId" = "PostArray"."postId"

// ').success(function(posts) {

//     console.log('streamJSON: db retrieval complete, returning the array...');

//     console.log(JSON.stringify(posts));

//     return function () {
//         eventEmitter.emit( 'streamJSONDone', JSON.stringify(posts) );
//     }();

// }).error(throwErr);