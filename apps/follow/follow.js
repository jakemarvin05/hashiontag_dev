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

        var userIdToFollow = req.param('userId');

        // db.User.find({
        //     where: {userId: userIdToFollow}
        // }).success(function(user) {
        //     req.user.hasFollow(user).success
        // });

        req.user.addFollow(userIdToFollow).success(function(user) {


            //bug: empty user returning object literal [] which passes the !null test.

            // var follow = false;

            // if(user == 'null') {
            //     follow = true;
            // } else if( user.length == 0 ) {
            //     follow = true;
            // } else {
            //     follow = false;
            // }

            // console.log(user);
            // if(!user) {

            //     db.User.find({
            //          where: {userId: userIdToFollow}
            //     }).success(function(user) {
            //         //console.log(user);
            //         req.user.addFollow(user, {FollowId :userIdToFollow })
            //             .success(function(){
                            res.send('followed!');
            //        }).error(throwErr);

                }).error(throwErr)

                
        //     } else {
                
        //         //if( user.length > 0 ) {
        //             res.send('already followed!');
        //         //}
        //     }


        // }).error(throwErr);
        

    } else {
        res.redirect('/');
    }

}