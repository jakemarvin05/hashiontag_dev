var db = require('../models'),
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

            var dataObj = {
                notificationSetter: req.user,
                action: 'addComment'
            }
            notification(req,res,dataObj);

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
                


/***** TODO: Make transactions work! */

                // return sequelize.transaction().then(function(t) {
    //     console.log(t);

    //     console.log('addComment: transaction started');
    //     return db.Comment.create({

    //       comment: req.body.comment

    //     }, {

    //       transaction: t

    //     }).then(function(comment) {

                //      console.log('addComment: comment created, saving it.');

                //      comment.save();

                //  }).then(function(comment) {

                //      console.log('addComment: setting user and post..');
                //      comment.setUser(req.user, {transaction: t});
                //      comment.setPost(req.body.postId, {transaction: t});

                //  }).then(t.commit.bind(t), t.rollback.bind(t));
        
    //   });


    } else {
        return throwErr('not authenticated');
    }
}