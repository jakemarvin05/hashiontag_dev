var db = require('../../models');

module.exports = function streamJSON(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return eventEmitter.emit('streamJSONDone', false);
    }

    console.log('streamJSON: authenticating');

    if(req.isAuthenticated()) {
        console.log('streamJSON: user is authenticated.. finding posts...');

        var idArray = [];

        req.user.getFollows().then(function(users) {

            for(var i in users) {
                idArray.push(users[i].values['userId']);
            }
            console.log('streamJSON: got the follows...getting posts');

            return [

                db.Post.findAll({
                    where: {
                        User_userId: idArray
                    }, 
                    include: [{   
                        model: db.User,
                        attributes: [ 'userNameDisp', 'userId' ],
                        include: [{
                            model: db.Post,
                            as: 'ProfilePicture',
                            attributes:['imgUUID']
                        }]
                    }, { 
                        model: db.Comment,
                        attributes: [ 'comment', 'createdAt'],
                        include: [{
                            model: db.User,
                            attributes: [ 'userNameDisp' ]
                        }]
                    }, {
                        model: db.Like,
                        attributes: [ 'User_userId' ],
                        include: [{
                            model: db.User,
                            attributes: [ 'userNameDisp' ]
                        }]
                    }], 
                    order: [
                        ['createdAt', 'DESC'], 
                        [db.Comment, 'createdAt', 'ASC'] 
                    ]
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

        }).spread(function(posts, notifications) {

            console.log('streamJSON: db retrieval complete, likes splicing...');

            //console.log(idArray);
            //console.log(posts);
            //unDAO'ify the results.
            var posts = JSON.parse(JSON.stringify(posts));
            
            var count1 = Object.keys(posts).length;
            //var count1 = posts.length;


            for(j=0;j<count1;j++) {

                var targets = posts[j].likes,
                    count2 = Object.keys(targets).length;
                    //count2 = targets.length;

                posts[j].hasLiked = false;
                posts[j].totalLikes = count2;


                var l = 0;
                //console.time('while');
                while(targets[l]) {

                    var theUser = targets[l].User_userId;

                    if(theUser === req.user.userId) {
                        posts[j].hasLiked = true;
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


            //join notifications and posts
            var renderJSON = {};

            renderJSON.posts = posts;
            renderJSON.notifications = notifications;

            //console.log(JSON.stringify(posts));

            return eventEmitter.emit( 'streamJSONDone', JSON.stringify(renderJSON) );

            
        }).catch(throwErr);

    } else {

        ////DEV for the time being, return everything.

        db.Post.findAll(
            {
                include: [
                    {   
                        model: db.User,
                        attributes: [ 'userNameDisp' ]
                    }
                    , { 
                        model: db.Comment,
                        attributes: [ 'comment', 'createdAt'],
                        include: [
                            {
                                model: db.User,
                                attributes: [ 'userNameDisp' ]
                            }
                        ]
                    }
                ]

                , order: [

                    ['createdAt', 'DESC'], 
                    [db.Comment, 'createdAt', 'ASC'] 
                ]
            }
        ).success(function(posts) {

            console.log('streamJSON: db retrieval complete, returning the array...');

            console.log(JSON.stringify(posts));

            return function () {
                eventEmitter.emit( 'streamJSONDone', JSON.stringify(posts) );
            }();

        }).error(throwErr);



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

    return false;
    }
}