var db = global.db;

module.exports = function streamJSON(req, eventEmitter, opts) {

    /* OPTIONS */
    if(opts) {
        if(opts.showType) {
            var showType = opts.showType;
        }
    }

    /* Error handling */
    var throwErr = function(error) {
        console.log(error);
        return eventEmitter.emit('streamJSONDone', false);
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
    }];
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
    var postCounts = false;

    /* Likes Splicer */
    function likesSplicer(posts) {
        var count1 = Object.keys(posts).length;
        if(count1 === 0) { return posts; }
        postCounts = count1;

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


        } //for loop closure
        return posts;
    }



    /* Here goes... */

    if(typeof showType === 'undefined') {
        console.log('streamJSON: no showType.. finding posts...');

        req.user.getFollows({attributes: ['userId']}).then(function(users) {

            for(var i in users) {
                idArray.push(users[i].values['userId']);
            }

            console.log('streamJSON: got the follows...getting posts');
            var where = { User_userId : idArray};
            return [

                db.Stream.findAll({
                    where: {User_userId: req.user.userId}, 
                    include: [{
                        model: db.Post,
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
                        }]
                    }], 
                    order: [
                        [db.Post, 'createdAt', 'DESC'], 
                        [db.Post, db.Comment, 'createdAt', 'ASC'] 
                    ],
                    limit: 20
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

        }).spread(function(streams, notifications) {

            console.log('streamJSON: db retrieval complete, likes splicing...');
            //console.log(idArray);
            //console.log(streams);

            var i = 0;
            var posts = {};
            while(streams[i]) {
                posts[i] = streams[i].post;
                i++;
            }

            console.log(posts);


            //unDAO'ify the results.
            //var posts = JSON.parse(JSON.stringify(posts));

            var posts = likesSplicer(posts);

            //join notifications and posts
            renderJSON.posts = posts;
            renderJSON.notifications = notifications;

            //console.log(JSON.stringify(posts));

            return eventEmitter.emit('streamJSONDone', renderJSON);

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

            return function () {
                eventEmitter.emit('streamJSONDone', renderJSON);
            }();

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
                req.user.getFollows({attributes: ['userId']}),
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

            for(var i in users) {
                idArray.push(users[i].values['userId']);
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
            renderJSON.postCounts = postCounts + 1;
            return eventEmitter.emit( 'streamJSONDone', renderJSON);

        }).catch(throwErr);
    } else if(showType === 'hashtag') {

        if(typeof req.params.hashtag === 'undefined') { return res.direct('/'); }

        console.log('streamJSON: hashtags showType.. finding posts...');

        db.Hashtag.find(req.params.hashtag).then(function(hashtag) {

            //console.log(include);
            hashtag.getPosts({
                limit: 20,
                include: [{
                    model: db.Post
                }],
                order: order
            })


            // if(req.isAuthenticated()) {
            //     return [
            //         //first call
            //         req.user.getFollows({attributes: ['userId']}),
            //         //second call
            //         hashtag.getPosts({
            //             limit: 20,
            //             include: include,
            //             order: order
            //         })
            //     ]
            // }

            // return [
            //     //first call
            //     false,
            //     //second call
            //     hashtag.getPosts({
            //         limit: 20,
            //         include: include,
            //         order: order
            //     })
            // ]


        }).spread(function(users, posts) {

            if(users) {
                for(var i in users) {
                    idArray.push(users[i].values['userId']);
                }
            }

            var posts = JSON.parse(JSON.stringify(posts));

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

            renderJSON.posts = posts;

            console.log('streamJSON: db retrieval complete, likes splicing...');
            //console.log(idArray);
            //console.log(posts);

            //console.log(renderJSON.posts);


            if(users) { renderJSON.posts = likesSplicer(renderJSON.posts); }
            //renderJSON.postCounts = postCounts + 1;
            return eventEmitter.emit( 'streamJSONDone', renderJSON);

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