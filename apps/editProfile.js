var db = require('../models');

/*

Display
1. Username
2. Password
3. Name
4. About

*/
module.exports = function editProfile(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return [
            new Error('Error'),
            eventEmitter.emit('editProfileError')
        ]
    }


    console.log('editProfile: authenticating');


    if(req.isAuthenticated()) {
        console.log('editProfile: user is authenticated.. finding profile...');
        db.User.find(req.user.userId).then(function(user) {
            console.log(user);
            //unDAO'ify the DAO
            user = JSON.parse(JSON.stringify(user));
            //console.log(user);
            return eventEmitter.emit('editProfileDone', user);

        }).catch(throwErr);

    } else {

        console.log('editProfile: not logged it. return')

        return throwErr('Not logged in.');
    }
}