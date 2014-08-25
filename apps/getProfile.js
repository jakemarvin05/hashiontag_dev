var db = require('../models');


module.exports = function profileJSON(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return function () {
            
            eventEmitter.emit('profileJSONDone', false);
        }();
    }

    var returnedUser = {};

    console.log('profileJSON: authenticating');

    if(req.isAuthenticated()) {
        console.log('profileJSON: user is authenticated.. finding profile...');
        db.User.find({
            where: {userName: req.params.user.toLowerCase()},
            attributes: [ 'userId', 'userNameDisp', 'createdAt' ],
            include: [{
                model: db.Post,
                include: [{
                    model: db.Comment,
                    attributes: ['comment','createdAt'],
            
                    include: [{
                        model: db.User,
                        attributes: ['userNameDisp']
                    }]


                }]//db.Comment include closure
            }],// db.Post include closure

            order: [ [db.Post, 'createdAt', 'DESC'], [db.Post, db.Comment, 'createdAt','ASC'] ]

        }).then(function(user) {

            returnedUser = user;

            return[ 
                req.user.hasFollow(user.userId),
                req.user.hasFollower(user.userId)
            ];
        }).spread(function(hasFollow, hasFollower) {

            returnedUser = JSON.parse(JSON.stringify(returnedUser));

            returnedUser.isFollowing = hasFollow;
            returnedUser.isBeingFollowed = hasFollower;

        

            return eventEmitter.emit( 'profileJSONDone', JSON.stringify(returnedUser) );

            //CHAINER (below) is replaced by PROMISE CHAIN (above) 

            // var chainer = new db.Sequelize.Utils.QueryChainer

            // chainer.add(
            //     req.user.hasFollow(user.userId)
            // ).add(
            //     req.user.hasFollower(user.userId)
            // );

            // chainer.run().then(function(results) {

            //     user = JSON.parse(JSON.stringify(user));

            //     user.isFollowing = results[0];
            //     user.isBeingFollowed = results[1];

            // }).then(function() {

            //     console.log('profileJSON: db retrieval complete, returning the array...');
            //     console.log(JSON.stringify(user));

            //     return function () {
            //         eventEmitter.emit( 'profileJSONDone', JSON.stringify(user) );
            //     }();

            // });


        }).catch(throwErr);

    } else {

        console.log('profileJSON: not logged it. return')

        
        return function() {
            console.log('profileJSON: user not authenticated...');
            eventEmitter.emit('profileJSONDone', false);
        }();
    }
}