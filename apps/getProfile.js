var db = require('../models');


module.exports = function profileJSON(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return function () {
            //profileJSON = false;
            eventEmitter.emit('profileJSONDone', false);
        }();
    }

    console.log('profileJSON: authenticating');

    if(req.isAuthenticated()) {
        console.log('profileJSON: user is authenticated.. finding profile...');
        db.User.find({
                where: {userName: req.params.user.toLowerCase()}
                , attributes: [ 'userId', 'userNameDisp', 'createdAt' ]
        }).success(function(users) {

            console.log('profileJSON: db retrieval complete, returning the array...');

            console.log(JSON.stringify(users));

            return function () {
                eventEmitter.emit( 'profileJSONDone', JSON.stringify(users) );
            }();

        }).error(throwErr);

        // db.User.getFollow({
        //         where: {UserId: req.user.userId}
        //         , attributes: [ 'FollowId' ]
        // }).success(function(ids) {

        //     console.log('profileJSON: db retrieval complete, returning the array...');

        //     var idArray = [];

        //     for(var i in ids) {
        //         idArray.push(ids[i].values['userId']);
        //     }

        //     return function () {
        //         eventEmitter.emit( 'profileFollowIdJSONDone', JSON.stringify(idArray) );
        //     }();

        // }).error(throwErr);

    } else {

        console.log('profileJSON: not logged it. return')

        
        return function() {
            console.log('profileJSON: user not authenticated...');
            eventEmitter.emit('profileJSONDone', false);
        }();
    }
}