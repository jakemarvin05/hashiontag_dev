var db = global.db;

module.exports = function follow(req, res) {


    var throwErr = function(error) {

        console.log(error);

        return res.json({success:false});

    }

    var userIdToAction = req.body.userId;

    //authenticated and not yourself
    if(req.isAuthenticated() && !(req.user.userId === userIdToAction) ) {
        console.log('user is authenticated.. following or unfollowing...');


        if(req.body.action === 'follow') {

            
            req.user.hasFollow(userIdToAction).then(function(user) {

                console.log(user);
                if(!user) {

                    return req.user.addFollow(userIdToAction)
                        .then(function(){
                            res.json({success:true});
                        });

                } else {

                    console.log('Error: User trying to follow someone he/she is already following.')
                    //but we don't care
                    return res.json({success:true});
                }


            }).catch(throwErr);


        }


        if(req.body.action === 'unfollow') {

            req.user.hasFollow(userIdToAction).then(function(user) {

                console.log(user);
                if(user) {

                    console.log('remove');

                    return req.user.removeFollow(userIdToAction);

                    // // destroy + db.Sequelize.and doesn't work.....
                    // return db.Following.destroy({
                    //     where: db.Sequelize.and(
                    //         {FollowerId: req.user.userId}, 
                    //         {FollowId: userIdToAction}
                    //     )
                    // });

                } else {

                    console.log('Error: User is trying to unfollow someone who he or she is not following.');
                    //but we don't care
                    return res.json({success:true});
                    
                }


            }).then(function() {

                return res.json({success:true});

            }).catch(throwErr);

        }        
    } else {

        //either never login, or is yourself.
        return res.json({success:false});
    }

}