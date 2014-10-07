var db = require('../models');


module.exports = function notification(req, res, dataObj) {

    /* dataObj schema:
    dataObj = {
        post: ,
        postOwner: ,
        taggedUser: ,
        notificationSetter: ,
        action: 

        [optional]
        ovr = {
            ovr: [true or undefined],
            postId:,
            postOwnerId:,
            notificationSetterId,
        }
    } 

    NOTE: The main branches of dataObj (post, postOwner) CONTAIN only DAOs. It is for 
    the previous handler to pass in retrieved DAOs to reduce DB calls.


    For instances where you only need Pri key, use the following inside "req" object.

    Post's Id => req.body.postId
    Setter's Id => req.user.userId
    Post owner's Id => req.body.postOwnerId
    */

    var postId = req.body.postId,
        postOwnerId = req.body.postOwnerId,
        notificationSetterId = req.user.userId;

    /* Overwrites: to prepare for other access scenarios */

    if( dataObj.ovr ) {

        if( dataObj.ovr.ovr ) {

            postId = dataObj.ovr.postId,
            postOwnerId = dataObj.ovr.userId;
            notificationSetterId = dataObj.ovr.notificationSetterId;
            
        }

    }


    var throwErr = function(error) {

        console.log('caught error:');
        console.log(error);

        //return res.json({ success: false, error:error });
        return false;

    }

    //abstract "ToBeNotified" layer to use postOwner Pri Key or DAO
    //To be notified criteria(s) :
    // 1) Post owner is following notification setter.

    if(Array.isArray(dataObj.postOwner)) {

        var postOwnerToBeNotified = dataObj.postOwner.hasFollow(notificationSetterId);

    } else {

        var postOwnerToBeNotified = db.User.find({

            where: {userId: postOwnerId},
            attributes: ['userId']

        }).then(function(user) {

            if(!user) {
                console.log('Notification: The post owner does not exist.');
                throw new Error('Notification: The post owner not exist.');
            }

            return user.hasFollow(notificationSetterId);

        });
    }

    var thePostOwner = ''; 


/** LIKES */

    if(dataObj.action === 'like') {

        postOwnerToBeNotified.then(function(toBeNotified) {

            if(toBeNotified) {

                return db.Notification.create({type: 'like' }).then(function(notification) {

                    return notification.updateAttributes({
                        User_userId_receiver: postOwnerId,
                        User_userId_setter: notificationSetterId,
                        Post_postId: postId
                    });

                }).then(function() {

                    return console.log('notification: notification has been set');

                }).catch(throwErr);

            }

            console.log('notification: post owner is not following the setter.');

            return false;

        }).catch(throwErr);

    }

    if(dataObj.action === 'unlike') {

        db.Notification.find({
            where: {
                type: 'like',
                Post_postId: postId,
                User_userId_setter: notificationSetterId
            },
            attributes: ['notificationId']

        }).then(function(notification){

            if(notification) {

                return notification.destroy().then(function(){

                    console.log('notification: notification destroyed.')
                    return true;

                }).catch(throwErr);
            }
            //nothing to destroy but we don't really care...
            console.log('notification: nothing to destroy');
            return false;

        }).catch(throwErr);

    }


/** Comments */

    if(dataObj.action === 'addComment') {

        postOwnerToBeNotified.then(function(toBeNotified) {

            if(toBeNotified) {

                return db.Notification.create({type: 'comment' }).then(function(notification) {

                    return notification.updateAttributes({
                        User_userId_setter: notificationSetterId,
                        User_userId_receiver: postOwnerId,
                        Post_postId: postId

                    });

                }).then(function() {

                    console.log('notification: notification has been set');

                }).catch(throwErr);

            }

            console.log('notification: post owner is not following the setter.');

            return false;

        }).catch(throwErr);

    }

/** TAG **/

    if(dataObj.action === 'tag'){
        console.log('-------------------------------------------------------------')
        console.log('These userIds: '+ dataObj.taggedUser);
        console.log('Is notified by this userId: '+ dataObj.notificationSetter);
        console.log('Through Tag in comments in postId: '+ dataObj.post);
        console.log('-------------------------------------------------------------')

        //THIS FUNCTIONALITY CAN BE REFRACTORED AS IT WAS REPEATING FOR LIKE, COMMENT and TAG
        //Create notification Instance
        for(var i=0;i<dataObj.taggedUser.length;i++){
            /*db.Notification.create({
                type: 'tag',
                User_userId_receiver: dataObj.postOwner[i],
                User_userId_setter: dataObj.notificationSetter,
                Post_postId: postId

            }).then(function(){

                return console.log('notification: notification has been set');*/
            createNotification(dataObj.action, dataObj.taggedUser[i], dataObj.notificationSetter, dataObj.post);

        }
    }

//remove comment
    // 1. Someone like your post
    // 2. someone commented on your post
    // 3. Somone tagged you in post.
    // 4. other invitation such as games, etc
    // 5. New follow request

}

function createNotification(action, receiverId, setterId, postId){
    db.Notification.create({
        type: action,
        User_userId_receiver: receiverId,
        User_userId_setter: setterId,
        Post_postId: postId

    }).then(function(){
        return console.log('userId: '+setterId+' do '+action+' to userId: '+receiverId+' on postId: '+postId);
    });
}
