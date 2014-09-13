var db = require('../../models');

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
                    
                    return res.json({success:false, msg:'You are already following him/her!'});
                }


            }).catch(throwErr);


        }


        if(req.body.action === 'unfollow') {


            req.user.hasFollow(userIdToAction).then(function(user) {

                console.log(user);
                if(user) {

                    console.log('remove');

                    //parent.removeChild(childID) to be used once implemented.
                    //return req.user.removeFollow(userIdToAction);

                    return db.User.find({where:{userId: userIdToAction}, attributes:['userId']});

                } else {

                    console.log('Error: User is trying to unfollow someone who he or she is not following.');
                    
                    return res.json({success:false, msg:'You have already unfollowed him/her.'});
                    
                }


            }).then(function(userToUnfollow) {

                return req.user.removeFollow(userToUnfollow);

            }).then(function() {

                return res.json({success:true});

            }).catch(throwErr);

        }        

  
    } else {

        //either never login, or is yourself.
        return res.json({success:false});
    }

}