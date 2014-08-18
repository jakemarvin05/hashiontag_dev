var db = require('../models');


module.exports = function addComment(req, eventEmitter) {

	var throwErr = function(error) {

		console.log(error);

		return function() {
			//addComment = false;
			eventEmitter.emit('addCommentDone', true); // err = true
		}();
	}

	console.log('addComment: authenticating');

	if(req.isAuthenticated()) {

    var commentJSON = {};

		db.Comment.create({
		    comment: req.body.comment
		}).then(function(comment) {
		    console.log('addComment: comment created. saving...');
			
		    return comment.save();
		}).then(function(comment) {
		    console.log('addComment: comment saved... setting user');
		    console.log(comment);

        commentJSON = {
          id: comment.commentId,
          comment: comment.comment,
          userNameDisp: req.user.userNameDisp,
          timestamp: comment.createdAt
        }

        //asynchronous setting
		    return [
          comment.setUser(req.user),
		      comment.setPost(req.body.postId)
        ];

        //var commentJSON 
		    //return eventEmitter.emit('addCommentDone');
		}).spread(function(setUser, setPost) {
      //console.log(JSON.stringify(setUser));
      //console.log(JSON.stringify(setPost));

      console.log(commentJSON);

      return eventEmitter.emit('addCommentDone', commentJSON);

    }).catch(function(err) {
      console.log('caught error:');
      console.log(err); 
      return eventEmitter.emit('addCommentDone', false);
    });
		


/***** TODO: Make transactions work! */

		// return sequelize.transaction().then(function(t) {
  //     console.log(t);

  //     console.log('addComment: transaction started');
  //     return db.Comment.create({

  //       comment: req.body.comment

  //     }, {

  //       transaction: t

  //     }).then(function(comment) {

		// 		console.log('addComment: comment created, saving it.');

		// 		comment.save();

		// 	}).then(function(comment) {

		// 		console.log('addComment: setting user and post..');
		// 		comment.setUser(req.user, {transaction: t});
		// 		comment.setPost(req.body.postId, {transaction: t});

		// 	}).then(t.commit.bind(t), t.rollback.bind(t));
	
  //   });

	}
  else {
    return eventEmitter.emit('addCommentDone', false);
  }
}