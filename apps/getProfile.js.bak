var db = global.db;
var fn = 'profileJSON: ';

module.exports = function profileJSON(req, eventEmitter) {

    //if first character is "@", cut it away before use.
    if(req.params.user.substring(0,1) === '@') {
        req.params.user = req.params.user.substring(1);
    }
    //if :user is "me"
    var isSelf = false;
    if(req.params.user === 'me') {
        isSelf = true;
    }

    var throwErr = function(error) {
        console.log(error);
        return eventEmitter.emit('profileJSONDone', false);
    }
    //to store the returned results
    var returnedUser = {};

    //generics
    var attributes = [ 'userId', 'userNameDisp', 'email', 'name', 'about', 'profilePicture', 'isPrivate' ];
    var include = [{
        //the user's posts
        model: db.Post,
        include: [{
            //the posts' comments
            model: db.Comment,
            attributes: ['comment','createdAt'],
            include: [{
                model: db.User,
                attributes: ['userNameDisp','profilePicture']
            }]
        }]//db.Comment include closure
    }];// db.Post include closure
    var order = order: [ [db.Post, 'createdAt', 'DESC'], [db.Post, db.Comment, 'createdAt','ASC'] ];





    /* Process flow:
    1) Check if the profile user is "/me". Authenticate and
        return results.

    2) In requesting for other users, we first retrieve "isPrivate". If profile is public,
        return results. (Note: no authentication required. Also note that is user is not
        logged in and is requesting himself or herself through "/myusername", it would appear
        as per public profile.)

    3) If profile is not public, we need to check 1 condition and 2 sub-conditions:
        a) Requestor is authenticated and
            i) Either the profile is her/his own, or
            ii) User being requested is following the requestor.
    */

    // 1) Check if the profile user is "/me".
    if(isSelf) {
        console.log(fn+'Authenticating and getting own profile...');
        if(req.isAuthenticated) {
            return getProfile(user.userId, true);
        }
    }
    function getProfile(userId, ownProfile) {
        db.User.find({
            where: {userId: userId},
            attributes: attributes,
            include: include,
            order: order
        }).then(function(user) {

            //remove the DAO and store the JSON
            returnedUser = JSON.parse(JSON.stringify(returnedUser));

            //get relationships
            if(!ownProfile) {
                return[ 
                    req.user.hasFollow(user.userId),
                    req.user.hasFollower(user.userId)
                ];
            }
            //is own profile, s
            eventEmitter.emit( 'profileJSONDone', JSON.stringify(returnedUser) );
            return cancel();

        }).spread(function(hasFollow, hasFollower) {

            returnedUser.isFollowing = hasFollow;
            returnedUser.isBeingFollowed = hasFollower;
            return eventEmitter.emit( 'profileJSONDone', JSON.stringify(returnedUser) );

        }).cancellbable()
        .catch(function(error) {
            return throwErr(error);
        })
    }



    // 2) In requesting for other users, we first retrieve "isPrivate".
    db.User.find({
        where: { userName: req.params.user.toLowerCase() },
        attributes: ['userId', 'isPrivate']
    }).then(function(user) {
        //user don't exist
        if(!user) {
            return eventEmitter.emit('profileJSONDone', 'userNotFound');
        } else {
            // 3) If profile is not public... check authentication and 2 sub-conditions
            if(user.isPrivate) {
                if(req.isAuthenticated()) {
                    // a) Requestor is authenticated
                    if(req.user.userId === user.userId) {
                        //i) The profile is her/his own
                        return getOwnProfile(user.userId, true);
                    } else {


                        //ii) User being requested is following the requestor.
                        //NOTE: this branch cannot return to the main branch.
                        var targetUser = user;
                        req.user.hasFollower(user.userId)
                            .then(function(isOkay) {
                                if(isOkay) {
                                    getProfile(targetUser.userId, false);
                                }
                            })
                            .catch(function(error) {
                                return throwErr(error);
                            });


                    }
                }
                //request is not authenticated.
                return eventEmitter.emit('profileJSONDone', 'reqNotAuthUserIsPrivate');
            } 
            //user exist and is public. Get the full monty.
            return getProfile(user.userId);
        }

    }).catch(function(err) {
        throwErr(err);
    });
}