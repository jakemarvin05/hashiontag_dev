var db = global.db,
    notification = require('./notification.js');


module.exports = function addComment(req, res) {

    var throwErr = function(error) {

            console.log(error);

            return res.json({ success: false });
    }

    var commentJSON = '',
        dataObj = '';


    console.log('addComment: authenticating');

    if(req.isAuthenticated()) {

        console.log('addComment: saving comment....');
        // var customUtils = require('./customUtils.js');
        // var stripped = appUtils.stripScriptTags(req.body.comment);
    
        db.Comment.create({
            comment: req.body.comment
        }).then(function(comment) {

            commentJSON = {
                    id: comment.commentId,
                    comment: comment.comment,
                    userNameDisp: req.user.userNameDisp,
                    timestamp: comment.createdAt
            }

            return comment.save();

        }).then(function(comment) {

            console.log('addComment: comment saved... setting user');
            //console.log(comment);

            //incrementing score by 1
            addCommentIncrementScores(db, req);


            var dataObj = {
                notificationSetter: req.user,
                action: 'addComment'
            }
            notification(req,res,dataObj);

            //Analyze Comments to identify tag case.
            findTaggedUserName(req, res);

            //asynchronous ops
            return [
                comment.setUser(req.user),
                comment.setPost(req.body.postId)
            ];

        }).spread(function(setUser, setPost) {

            console.log(commentJSON);

            return res.json({
                success: true,
                commentJSON: commentJSON
            });

        }).catch(throwErr);
                
    } else {
        return throwErr('not authenticated');
    }
}

function addCommentIncrementScores(db, req){
    db.Post.find(req.body.postId).success(function(post) {

        //Incrementing post score
        post.increment('postScore', {by: 1}).success(function(post){
            post.save();
            console.log('Incremented post scores...\n');
        });

        //Incrementing affinity
        //console.log('USER_USERID is as followed: '+post.getDataValue('User_userId')+'\n');

        // console.log("----------------------------------------------------------------");
        // console.log("Content of userId:" + req.user['userId']);
        // console.log("----------------------------------------------------------------");

        db.Following.find({
            where: {
                FollowerId: req.user['userId'],
                FollowId: post.getDataValue('User_userId')
            }

        }).success(function(following){
            //console.log(following);
            following.increment('affinity', {by: 1}).success(function(following){
                following.save();
                console.log('Incremented affinity...\n');
            });
        });
     
                
    });
}

function findTaggedUserName(req, res){
    var matchedUserName = req.body.comment.match(/@\w+/g); //Array of result including the tag "@"

    //if there are tagged user, create notification for them
    if(matchedUserName){
        //Remove the '@' symbol in each matchedUserName[index];
        for(var i=0;i<matchedUserName.length;i++){
           matchedUserName[i] = matchedUserName[i].replace('@','');
           console.log('Found user name: ' +matchedUserName[i]+' <------');
        }

        //Match existence of user and if they exist, obtain their userId
        db.User.findAll({
            where: {
                userName: matchedUserName.toLowerCase() //search is currently case sensitive
            },
            attributes: ['userNameDisp','userId']
        }).then(function(result){
            //if result = 0, terminate process
            var items = Object.keys(result).length;
            var userIdArray = [];
            if(items == 0){
                //terminate;
                console.log('No such users exist in database...Terminate process...')
            }
            else{
                for(var i = 0;i<items;i++){
                    console.log('User: '+result[i].values['userNameDisp']+' exist with userId: '+result[i].values['userId']+ ' <-----');
                    userIdArray.push(result[i].values['userId']);
                }
                
                //do the checking if tagged user follow the user who commented
                db.Following.findAll({ //THIS CHECK MIGHT BE DONE INSIDE NOTFICATION.JS! CHECK CALVIN!
                    where: {
                        FollowerId: userIdArray,
                        FollowId: req.user.userId
                    },
                    attributes: ['FollowerId']
                }).then(function(result){
                    var validIdArray = [];
                    var items = Object.keys(result).length;

                    if(items == 0){
                        console.log('No valid follower that follows current user...');
                    }
                    else{
                        for(var i = 0;i<items;i++){
                            console.log('UserId: '+result[i].values['FollowerId']+' follows Current user<-----');
                            validIdArray.push(result[i].values['FollowerId']);
                        }
                        //if all above condition valid, then create a notification table for them.
                        //Then create a new data Obj and pass value to notification.js
                        var dataObj = {
                            post: req.body.postId,
                            postOwner: '',
                            taggedUsers: validIdArray, //tag action assumes post owner as the person to be tagged in the form of a name
                            notificationSetter: req.user.userId,
                            action: 'tag'
                        }
                        notification(req, res, dataObj);
                        
                    }
                });
            }
        });

    }

    //else terminate process as there are no tagged user

    else {
        console.log("comment does not contain a valid regex. Terminating process...");
    }
    
}



