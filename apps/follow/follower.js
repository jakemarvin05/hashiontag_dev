var db = require('../../models');

module.exports = function followJSON(req, eventEmitter, followType) {

    var following = false,
        followers = false;

    if(followType == "following") {

        following = true;

    } else if(followType == "followers") {

        followers = true;

    } else {

        console.log('followJSON: something is wrong with the uri.')

        return eventEmitter.emit('followJSONDone', false);
    }


    var throwErr = function(error) {

        console.log(error);

        return function () {
            //streamJSON = false;
            eventEmitter.emit('followJSONDone', false);
        }();
    }

    console.log('followJSON: authenticating');

    if(req.isAuthenticated()) {
        console.log('followJSON: user is authenticated.. finding posts...');
        if(following) {
            console.log('followJSON: getFollow');

            req.user.getFollows({
                
                //where: {UserId: req.user.userId}

                //define attributes, or just take everything
                attributes: [
                    'userId',
                    'userNameDisp'
                ]

            }).success(function(users) {

                console.log( JSON.stringify(users) );

                    return eventEmitter.emit( 'followJSONDone', JSON.stringify(users) );

            }).error(throwErr);



        } else if(followers) {

            console.log('followJSON: getFollowers');

            req.user.getFollowers({
                
                //where: {FollowId: req.user.userId}

                //define attributes, or just take everything
                attributes: [
                    'userId',
                    'userNameDisp'
                ]

            }).success(function(users) {

                console.log( JSON.stringify(users) );

                    return eventEmitter.emit( 'followJSONDone', JSON.stringify(users) );

            }).error(throwErr);            


        }

    } else {

        console.log('followJSON: not logged it. return')

        return eventEmitter.emit('followJSONDone', false);

    }
}