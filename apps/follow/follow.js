var db = global.db;
var fname = "followjs ";


module.exports = function follow(req, res) {

    var userIdToAction = req.body.userId;

    //authenticated and not yourself
    if(req.isAuthenticated()) {
        console.log('user is authenticated.. following or unfollowing...');
        if(req.user.userId === parseFloat(userIdToAction)) { 
            console.log(fname + 'user trying to follow him/herself. blocked.');
            return res.json({success: false});
        }

        if(req.body.action === 'follow') {

            //if user hasn't start following anyone
            if(req.user.hasNoFollow) { 

                //fire actions to initialise the news stream
                require('./firstFollow.js')(req, userIdToAction); 

                //create the relationship
                return db.Following.create({
                    FollowerId: req.user.userId,
                    FollowId: userIdToAction,
                    affinity: 0 + Math.random()/1000
                }).then(function(){
                    res.json({success:true});
                });

            } else {

                req.user.hasFollow(userIdToAction).then(function(user) {
                    if(!user) {

                        require('./firstFollow.js')(req, userIdToAction); 

                        return db.Following.create({
                            FollowerId: req.user.userId,
                            FollowId: userIdToAction,
                            affinity: 0 + Math.random()/1000
                        }).then(function(){
                            res.json({success:true});
                        });

                    } else {

                        console.log('Error: User trying to follow someone he/she is already following.')
                        //but we don't care
                        return res.json({success:true});
                    }


                }).catch(throwErr);

            }

        }


        if(req.body.action === 'unfollow') {

            req.user.hasFollow(userIdToAction).then(function(user) {

                console.log(user);
                if(user) {

                    console.log('remove');

                    // destroy + db.Sequelize.and doesn't work.....
                    return db.Following.destroy({
                        where: {
                            FollowerId: req.user.userId, 
                            FollowId: userIdToAction
                        }
                    });

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


    var throwErr = function(error) {
        console.log(error);
        return res.json({success:false});
    }

}