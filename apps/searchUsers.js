var db = require('../models');

module.exports = function searchUsers(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return function () {
            //searchUsers = false;
            eventEmitter.emit('searchUsersDone', false);
        }();
    }//end throwErr

    var parseUsers = function(users){

        console.log('searchUsers: db retrieval complete');

        var userArray = {};

        for(var i in users) {
            //exclude yourself from results
            console.log(users[i].userId);
            if( !(users[i].userId === req.user.userId) ) {

                userArray[i] = {};

                userArray[i] = {
                    userId: users[i].values['userId'],
                    userNameDisp: users[i].values['userNameDisp']
                }
            }  
        }
    
        console.log('returning the array...');
        console.log(userArray);

        return function() {
            eventEmitter.emit( 'searchUsersDone', JSON.stringify(userArray) );
        }();

    }//end parseUsers

    console.log('searchUsers: authenticating');

    if(req.isAuthenticated()) {
        console.log('searchUsers: user is authenticated.. finding users...');

        var input = req.param('navSearchInput')
        , hasAdd = input.indexOf('@') > -0.5
        , hasAddFirstPosit = input.indexOf('@') === 1
        , hasDot = input.indexOf('.') > -0.5;

        console.log(input);
        if(hasAdd && hasDot) {
            //email
            //var searchParam = 'email: ' + input;

            db.User.findAll({
                where: {email: input}
                , attributes: ['userId', 'userNameDisp']
            }).success(parseUsers(users, req)).error(throwErr);

            //email search ends here.

        } else if(hasAddFirstPosit) {

                //username trying to key a @screenname, trim it
                var searchParam = input.replace('@', '');

        } else {
            
            var searchParam = input;

        }

        db.User.search(searchParam)
            .success(parseUsers)
            .error(throwErr);

    } else {

        console.log('searchUsers: not logged it. return')

        return function() {
            console.log('searchUsers: user not authenticated...');
            eventEmitter.emit('searchUsersDone', false);
        }();
    }
}