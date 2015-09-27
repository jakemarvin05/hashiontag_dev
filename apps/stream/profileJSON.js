var db = global.db;
var fn = 'profileJSON: ';
var likesSplicer = require('./likesSplicer');

/* TODO !!! DEAL WITH PRIVATE CASES */

module.exports = function profileJSON(req, res, thenRender, isSelf) {

    //if first character is "@", cut it away before use.
    if(req.params.user) {
        if(req.params.user.substring(0,1) === '@') {
            req.params.user = req.params.user.substring(1);
        }
    }

    var throwErr = function(error) {
        console.log(error.stack);
        return thenRender(false);
    }
    //to store the returned results
    var returnedUser = {};

    //generics
    var attributes = [ 
        'userId', 
        'userNameDisp', 
        'email', 
        'name', 
        'gender', 
        'about', 
        'web', 
        'country', 
        'profilePicture', 
        'isPrivate', 
        'shopStatus', 
        'dataMeta' 
    ];

    /* post includes */
    var include = [{
        model: db.User,
        attributes: ['userNameDisp', 'profilePicture']
    }, {
        model: db.Comment,
        attributes: ['commentId', 'comment','createdAt'],
        include: [{
            model: db.User,
            attributes: ['userNameDisp','profilePicture']
        }]
    }, {
        model: db.Like,
        attributes: [ 'User_userId' ],
        include: [{
            model: db.User,
            attributes: [ 'userNameDisp' ]
        }]
    }];// include closure

    var order = [ 
        ['createdAt', 'DESC'], 
        [ db.Comment, 'createdAt','ASC'] 
    ];

    //isAuth
    var isAuth = req.isAuthenticated();

    //for storing following
    var idArray = [];

    /* Process flow:
    1) The route "/me" will pass in isSelf = true. Authenticate and
        return results.

    2) In requesting for other users, we first retrieve "isPrivate". If profile is public:
        a) We check if user is authenticated, for the purposes to retrieving following/follower
           relationship.
        b) If not authenticated, just retrieve the profile.

    3) If profile is not public, we need to check 1 condition and 2 sub-conditions:
        a) Requestor is authenticated and
            i) Either the profile is her/his own, or
            ii) User being requested is following the requestor.
    */

    // 1) Check if the profile user is "/me".
    if(isSelf) {
        console.log(fn+'Authenticating and getting own profile...');
        if(isAuth) {
            return getProfile(req.user.userId, true);
        } else {
            return thenRender('redirect');
        }
    }


    // 2) In requesting for other users, we first retrieve "isPrivate".
    db.User.find({
        where: { userName: req.params.user.toLowerCase() },
        attributes: ['userId', 'isPrivate']
    }).then(function(user) {
        //user don't exist
        if(!user) {
            return thenRender('userNotFound');
        } 
        console.log(user.isPrivate);
        // 3) If profile is not public... check authentication and 2 sub-conditions
        if(user.isPrivate) {
            if(isAuth) {
                // a) Requestor is authenticated
                if(req.user.userId === user.userId) {
                    //i) The profile is her/his own, redirect to "/me"
                    //return getProfile(user.userId, true);
                    return getProfile(req.user.userId, true);
                } else {


                    //ii) Check if "user being requested" is following the requestor.
                    var targetUser = user;
                    req.user.hasFollower(user.userId)
                        .then(function(isOkay) {
                            if(isOkay) {
                                //passed all conditions
                                return getProfile(targetUser.userId, false);
                            }
                            //user is private and not following requestor.
                            return thenRender('userIsPrivate');
                        })
                        .catch(function(error) {
                            return throwErr(error);
                        });


                } // req.user.userId === user.userId if/else chain
            }

            //request is not authenticated.
            return thenRender('reqNotAuthUserIsPrivate');


        } //closure for user.isPrivate

        //user exist and is public. Get the full monty.
        // 2a) We check if user is authenticated, for the purposes to retrieving following/follower
        //   relationship.
        if(isAuth) {
            var isOwnProfile = false;
            if(req.user.userId === user.userId) { isOwnProfile = true; }
            return getProfile(user.userId, isOwnProfile);
        } else {
            //2b) If not authenticated, just retrieve the profile.
            //the arguments in getProfile are: 1) userid, 2) Is Own Profile, 3) is public view
            return getProfile(user.userId, false, true);
        }


    }).catch(function(err) {
        throwErr(err);
    });


    /* get profile function */
    var PRODUCTCOUNT;
    function getProfile(userId, ownProfile, isPublicView) {
        return db.User.find().then(function() {

            return [

                db.User.find({
                    where: {userId: userId},
                    attributes: attributes
                }),

                db.Post.findAll({
                    where: db.Sequelize.and(


                        db.Sequelize.or(
                            //either it's user's own post
                            {User_userId: userId}, 

                            //or it's attributed to him by someone else
                            db.Sequelize.and(
                                {User_userId_attributed: userId},
                                {isAttributionApproved: true}
                            )
                        ),

                        //and is not a product
                        //sequelize has not provide NOT comparator
                        db.Sequelize.or(
                            {isProduct: {ne: true}},
                            {isProduct: null}
                        )
                    ),
                    include: include,
                    order: order
                }),

                (function() { 
                    if(req.isAuthenticated()) {
                        return req.user.getFollows({attributes: ['userId']}, {raw: true});
                    }
                    return [];
                })()
            ]

        }).spread(function(user, posts, following) {
            //remove the DAO and store the JSON
            returnedUser = JSON.parse(JSON.stringify(user));
            
            posts = JSON.parse(JSON.stringify(posts));

            //join them
            returnedUser.posts = posts;

            if(following.length > 0) {
                for(var i=0; i<following.length; i++) {
                    idArray.push(following[i].userId);
                }
            }
            
            return [
                user,

                (function() {
                    if(user.shopStatus && user.shopStatus.indexOf('active') > -1) {
                        return db.Post.count({
                            where: {
                                User_userId: user.userId,
                                isProduct: true
                            }
                        });
                    }
                    return false;
                })()
            ];
        }).spread(function(user, productCount) {

            if(productCount > 0) { PRODUCTCOUNT = productCount; }

            //// GET relationships

            /* the returns [] correspond to:
             * 1) following count
             * 2) follower count 
             * 3) is requestor following target user
             * 4) is target user following requestor
             * 5) is this the user's own profile
            */

            /* Sequence of returns:
             * 1) isPublic view: We first return cases where user is not authenticated
             *    and profile is public.
             * 2) is not own profile: Then we deal with the cases in which user is viewing
             *    own profile.
             * 3) All cases that fall through (1) & (2) are "legit" cases.
            */


            //public profile
            if(isPublicView) {
                return [
                    //user following how many others
                    db.Following.findAndCountAll({
                        where: {FollowerId: returnedUser.userId},
                        attributes: ['affinityId']
                    }, { raw: true }),

                    db.Following.findAndCountAll({
                        where: {FollowId: returnedUser.userId},
                        attributes: ['affinityId']
                    }, { raw: true }),

                    false,
                    false,
                    false,
                    false
                ]
            }

            //user is logged in and is own profile
            if(ownProfile) {
                return [
                    //user following how many others
                    db.Following.findAndCountAll({
                        where: {FollowerId: returnedUser.userId},
                        attributes: ['affinityId']
                    }, { raw: true }),

                    //user being followed by how many
                    db.Following.findAndCountAll({
                        where: {FollowId: returnedUser.userId},
                        attributes: ['affinityId']
                    }, { raw: true }),

                    false,
                    false,
                    true,
                    db.StarTag.find({
                        where: {
                            User_userId: req.user.userId
                        }
                    })
                ]

            }
           
            
            //user is logged in and is viewing other profiles.
            return [
                //user following how many others
                db.Following.findAndCountAll({
                    where: {FollowerId: returnedUser.userId},
                    attributes: ['affinityId']
                }, { raw: true }),

                db.Following.findAndCountAll({
                    where: {FollowId: returnedUser.userId},
                    attributes: ['affinityId']
                }, { raw: true }),

                req.user.hasFollow(returnedUser.userId),
                req.user.hasFollower(returnedUser.userId),
                false,
                false
            ]

        }).spread(function(followingCount, followerCount, hasFollow, hasFollower, ownProfile, starTag) {

            // console.log('count');
            // console.log(followingCount);
            // console.log('followerCount console.log');
            // console.log(followerCount);

            returnedUser.followingCount = followingCount.count;
            returnedUser.followerCount = followerCount.count;
            if(PRODUCTCOUNT) { returnedUser.productCount = PRODUCTCOUNT; }

            //so many booleans because of damned Dust template!

            if(isPublicView) {
                returnedUser.isPublicView = true;
                returnedUser.isFollowable = false;
                return thenRender(returnedUser);
            }

            if(ownProfile) {
                returnedUser.isOwnProfile = true;
                returnedUser.isFollowable = false;
                returnedUser.hasStarTag = (starTag) ? true : false;
                returnedUser.posts = likesSplicer(req, returnedUser.posts, idArray);
                return thenRender(returnedUser);
            }

            returnedUser.viewerFollowedTarget = hasFollow;
            returnedUser.targetFollowedViewer = hasFollower;
            returnedUser.isFollowable = true;
            returnedUser.posts = likesSplicer(req, returnedUser.posts, idArray);
            return thenRender(returnedUser);

        }).catch(function(error) {
            return throwErr(error);
        });
    }

}