var db = global.db;
var likesSplicer = require('./likesSplicer');

module.exports = function streamJSON(req, res, render, opts) {

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
        console.log(error.stack);
        return render(false);
    }

    /* DEFAULT DB calls */
    var where = {};
    var include = [{   
        model: db.User,
        attributes: [ 'userNameDisp', 'userId', 'profilePicture', 'dataMeta', 'shopStatus' ]
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
    }]
    var order = [
        ['createdAt', 'DESC'], 
        [db.Comment, 'createdAt', 'ASC'] 
    ]

    /*DEFAUT SETTINGS */
    var streamLimit = 10;

    /*DEFAULT HOLDERS TO USE*/
    var renderJSON = {
        posts: [],
        notifications: ''
    }
    var idArray = [];
    var postCount = false;

    /* Here goes... */

    if(typeof showType === 'undefined' || showType === 'stream') {

        if (!req.isAuthenticated()) { 
            res.statusCode = 403;
            return res.send();
        }

        console.log('streamJSON: no showType.. finding posts...');
         
        //If there is a lastPostId = next streamLoad
        if(lastPostId){
            console.log('streamJSON: Last post loaded is postId: ' + lastPostId);
            var streamWhere = {
                User_userId: req.user.userId,
                streamKey: {
                    lt: lastPostId
                }
            }
        }

        //If there is no lastPostId = first streamLoad
        else {
            console.log('streamJSON: New streams loading...');
            var streamWhere = {
                User_userId: req.user.userId
            }
        }

        //get the users that current user is following.
        req.user.getFollows({attributes: ['userId']}, {raw: true}).then(function(users) {
            //push it into the array for use later
            for(var i in users) { idArray.push(users[i].userId); }


            console.log('streamJSON: got the follows...getting posts');

            return [

                db.Stream.findAll({
                    where: streamWhere, 
                    include: [{
                        model: db.Post,
                        include: include
                    }], 
                    order: [
                        ['streamKey', 'DESC'], 
                        [db.Post, db.Comment, 'createdAt', 'ASC'] 
                    ],
                    limit: streamLimit + 1
                }),

                false
                // req.user.getNotifications({
                //     include: [
                //         {
                //             model: db.User,
                //             as: 'Setter',
                //             attributes:['userId','userNameDisp']
                //         }
                        
                //     ],
                //     attributes: ['Post_postId','createdAt','type'],
                //     order: [['createdAt', 'DESC']]
                // })
            ]

        }).spread(function(streams, notifications) {

            //unDAO the streams.
            //it is giving problems adding attributes.
            var streams = JSON.parse(JSON.stringify(streams));


            //join the posts into a single array
            //also, don't push in the limit + 1'th post. It is only for use to know if there is
            //load more.
            var posts = [];
            for(var i=0; i < streamLimit; i++) {
                var stream = streams[i];
                if(!stream) { break; }
                var post = stream.post;
                posts.push(post);
            }

            //assume no more posts to load
            var lastPostId = false;
            if(streams.length > streamLimit) {
                //if the limit + 1'th post exist, set last id to the limit'th post.
                lastPostId = streams[streamLimit].streamKey;
            }
  
            console.log('streamJSON: db retrieval complete, likes splicing...');

            
            posts = likesSplicer(req, posts, idArray);

            //join notifications and posts
            renderJSON.posts = posts;
            renderJSON.lastPostId = lastPostId;

            //renderJSON.notifications = notifications;

            return render(renderJSON);

        }).catch(throwErr);

    } else if(showType === 'startag') {

        var streamWhere = db.Sequelize.and(
            {User_userId_attributed: req.user.userId},
            {isAttributionApproved: false}
        );


        //If there is a lastPostId = next streamLoad
        if(lastPostId){
            console.log('streamJSON: Last post loaded is postId: ' + lastPostId);
            var streamWhere = db.Sequelize.and(
                {User_userId_attributed: req.user.userId},
                db.Seqeuelize.or(
                    {isAttributionApproved: false},
                    {isAttributionApproved: null}
                ),
                { lt: lastPostId }
            );
        }

        //get the users that current user is following.
        req.user.getFollows({attributes: ['userId']}).then(function(users) {

            //push it into the array for use later
            //var i in array loop can be used for arrays without iterating over nested values.
            for(var i in users) { idArray.push(users[i].userId); }


            console.log('streamJSON: got the follows...getting posts');

            return [

                db.Post.findAll({
                    where: streamWhere, 
                    include: include,
                    order: [
                        [ 'postId', 'DESC'], 
                        [ db.Comment, 'createdAt', 'ASC'] 
                    ],
                    limit: streamLimit + 1
                }),

                false
                // req.user.getNotifications({
                //     include: [
                //         {
                //             model: db.User,
                //             as: 'Setter',
                //             attributes:['userId','userNameDisp']
                //         }
                        
                //     ],
                //     attributes: ['Post_postId','createdAt','type'],
                //     order: [['createdAt', 'DESC']]
                // })
            ]

        }).spread(function(streams, notifications) {

            //unDAO the streams.
            //it is giving problems adding attributes.
            var streams = JSON.parse(JSON.stringify(streams));


            //assume no more posts to load
            var lastPostId = false;
            if(streams.length > streamLimit) {
                //if the limit + 1'th post exist, set last id to the limit'th post.
                lastPostId = streams[streamLimit].streamKey;
                streams.splice(streamLimit, 1);
            }
  
            console.log('streamJSON: db retrieval complete, likes splicing...');

            
            posts = likesSplicer(req, streams, idArray);

            //join notifications and posts
            renderJSON.posts = posts;
            renderJSON.lastPostId = lastPostId;

            //renderJSON.notifications = notifications;

            return render(renderJSON);

        }).catch(throwErr);

    } else if(showType === 'preview') {

        /* DEAL WITH LOAD MORE */

        db.Post.findAll({
            where: {
                isProduct: false,
                showInMainFeed: true
            },
            include: include, 
            order: order,
            limit: 20
        }).then(function(posts) {

            console.log('streamJSON: db retrieval complete, returning the array...');

            renderJSON.posts = posts;
            return render(renderJSON);

        }).catch(throwErr);

    } else if(showType === 'likes') {

        console.log('streamJSON: likes showType.. finding posts...');

        if(lastLikeId){
            console.log('streamJSON: Last like loaded is likeId: ' + lastLikeId);
            var likeWhere = {
                User_userId: req.user.userId,
                likeId: {
                    lt: lastLikeId
                }
            }
        }

        //If there is no lastPostId = first streamLoad
        else {
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
                    attributes: ['likeId', 'Post_postId'],
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

            for(var i=0; i<users.length; i++) { idArray.push(users[i].userId); }

            //modify the outcome
            //need to float posts out of the nesting.
            var i = 0;
            var posts = [];
            var lastLikeId;
            while(likePosts[i]) {
                var likePost = likePosts[i];
                posts.push(likePost.post);
                lastLikeId = likePost.likeId;
                i++;
            }

            //console.log(posts);

            posts = likesSplicer(req, posts, idArray);


            renderJSON.posts = posts;
            renderJSON.lastLikeId = lastLikeId

            console.log('streamJSON: db retrieval complete, likes splicing...');

            renderJSON.postCount = posts.length;

            return render(renderJSON);

        }).catch(throwErr);

    } else if(showType === 'hashtag') {

        if(typeof req.params.hashtag === 'undefined') { return res.redirect('/'); }

        var hashtag = req.params.hashtag.toLowerCase();
        
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

            if(follows) {
                for(var i=0; i<follows.length; i++) {
                    idArray.push(follows[i].userId);
                }
            }

            var hashtag = JSON.parse(JSON.stringify(hashtag));

            renderJSON.posts = hashtag.posts;
            renderJSON.hashtag = hashtag.hashtagId;

            console.log('streamJSON: db retrieval complete, likes splicing...');

            if(req.isAuthenticated() ) { 
                renderJSON.posts = likesSplicer(req, renderJSON.posts, idArray);
                renderJSON.postCount = renderJSON.posts.length;
            } else {
                renderJSON.postCount = renderJSON.posts.length;
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