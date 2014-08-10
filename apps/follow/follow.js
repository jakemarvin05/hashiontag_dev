var db = require('../../models');

module.exports = function follow(req, res) {


    var throwErr = function(error) {

        console.log(error);

        return function () {
            res.redirect('/error');
        }();
    }


    if(req.isAuthenticated()) {
        console.log('user is authenticated.. following...');

        req.user.getFollow({
            where: {FollowId: req.param('userId'), UserId: req.user.userId},
        }).success(function(user) {


            //bug: empty user returning object literal [] which passes the !null test.

            var follow = false;

            if(user == 'null') {
                follow = true;
            } else if( user.length == 0 ) {
                follow = true;
            } else {
                follow = false;
            }

            console.log(JSON.stringify(user));
            if(follow) {

                db.User.find({
                    where: {userId: req.param('userId')}
                }).success(function(user) {

                    req.user.addFollow(user)
                        .success(function(){
                            res.send('followed!');
                    }).error(throwErr);

                }).error(throwErr)

                
            } else {
                
                if( user.length > 0 ) {
                    res.send('already followed!');
                }
            }


        }).error(throwErr);
        

    } else {
        res.redirect('/');
    }

}