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

        if( !(req.user.userId == req.param('userId')) ) {

            req.user.hasFollow(userIdToFollow).success(function(user) {

                console.log(user);
                if(!user) {
                    req.user.addFollow(userIdToFollow)
                        .success(function(){
                            res.send('followed!');
                        }).error(throwErr);
                } else {
                    res.send('already followed');
                }



            }).error(throwErr);

        } else {

            //it is yourself!!
            res.redirect('/');
        }
  

    } else {
        res.redirect('/');
    }

}