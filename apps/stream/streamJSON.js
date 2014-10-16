var db = global.db;

module.exports = function streamJSON(req, render, opts, START_TIME) {

    START_TIME = START_TIME;

    /* OPTIONS */
    if(opts) {
        if(opts.showType) {
            var showType = opts.showType;
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
            {'key': 'itemPrice'}
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

    /* Likes Splicer */
    function likesSplicer(posts) {
        var spliced = {}
        var count1 = Object.keys(posts).length;
        if(count1 === 0) { return posts; }
        postCount = count1;

        for(var j=0;j<count1;j++) {
            var post = posts[j],
                targets = post.likes,
                count2 = Object.keys(targets).length;

            post.hasLiked = false;
            post.totalLikes = count2;

            var l = 0;
            //console.time('while');
            while(targets[l]) {

                var theUser = targets[l].User_userId;

                if(theUser === req.user.userId) {
                    post.hasLiked = true;
                    //splice myself away
                    //console.log('self spliced ' + theUser);
                    targets.splice(l, 1);

                } else if(idArray.indexOf(theUser) < 0) {
                    //splice away all that user is not following
                    //console.log('non-following spliced ' + theUser);
                    targets.splice(l, 1);
                } else {
                    l++;
                }
            }
            //console.timeEnd('while');
            spliced[j] = post;

        } //for loop closure
        return spliced;
    }



    /* Here goes... */

    if(typeof showType === 'undefined') {
        console.log('streamJSON: no showType.. finding posts...');
        START_TIME = Date.now();

        req.user.getFollows({attributes: ['userId']}, {raw: true}).then(function(users) {
            console.log('got follows, pushing...');
            console.log(Date.now() - START_TIME);
            for(var i=0; i<users.length; i++) {
                idArray.push(users[i].userId);
            }
            console.log('pushing complete');
            console.log(Date.now() - START_TIME);

            console.log('streamJSON: got the follows...getting posts');
            var where = { User_userId : idArray};

            //curated stream implementation. awaiting complete code....
            // return [

            //     db.Stream.findAll({
            //         where: {User_userId: req.user.userId}, 
            //         include: [{
            //             model: db.Post,
            //             include: [{   
            //                 model: db.User,
            //                 attributes: [ 'userNameDisp', 'userId', 'profilePicture' ]
            //             }, { 
            //                 model: db.Comment,
            //                 attributes: ['commentId', 'comment', 'createdAt'],
            //                 include: [{
            //                     model: db.User,
            //                     attributes: [ 'userNameDisp','profilePicture' ]
            //                 }]
            //             }, {
            //                 model: db.Like,
            //                 attributes: [ 'User_userId' ],
            //                 include: [{
            //                     model: db.User,
            //                     attributes: [ 'userNameDisp' ]
            //                 }]
            //             }]
            //         }], 
            //         order: [
            //             [db.Post, 'createdAt', 'DESC'], 
            //             [db.Post, db.Comment, 'createdAt', 'ASC'] 
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

            return [

                db.Post.findAll({
                    where: where, 
                    include: include, 
                    order: order,
                    limit: 20
                }
                        //{raw: true,
                        //nest: true}
                ),

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
            console.log('post query complete.');
            console.log(Date.now() - START_TIME);

            console.log('streamJSON: db retrieval complete, likes splicing...');
            //console.log(idArray);
            //console.log(streams);

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
            console.log('start stringify');
            console.log(Date.now() - START_TIME);
            var posts = JSON.parse(JSON.stringify(streams));
            console.log('end stringify');
            console.log(Date.now() - START_TIME);

          
            console.log('start splicer');
            console.log(Date.now() - START_TIME);  
            if(idArray.length > 0) { posts = likesSplicer(posts); }
            console.log('end splicer');
            console.log(Date.now() - START_TIME);

            //join notifications and posts
            if(posts.length === 0) { 
                renderJSON.posts = false;
            } else {
                renderJSON.posts = posts;
            }
            renderJSON.notifications = notifications;

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

            for(var i=0; i<users.length; i++) {
                idArray.push(users[i].userId);
            }

            var likePosts = JSON.parse(JSON.stringify(likePosts));

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

            console.log('streamJSON: db retrieval complete, likes splicing...');
            //console.log(idArray);
            //console.log(posts);

            //console.log(renderJSON.posts);

            renderJSON.posts = likesSplicer(renderJSON.posts);
            renderJSON.postCount = postCount;
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
                renderJSON.posts = likesSplicer(renderJSON.posts);
                renderJSON.postCount = postCount;
            } else {
                /*TO DO: Make seqeulize count work and deprecate this */
                var postCount = 0;
                while(renderJSON.posts[postCount]) {
                    postCount++;
                }
                renderJSON.postCount = postCount;
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