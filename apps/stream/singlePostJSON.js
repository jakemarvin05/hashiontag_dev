var db = global.db;

module.exports = function singlePostJSON(req, eventEmitter) {

    var throwErr = function(error) {
        console.log(error);
        return eventEmitter.emit('singlePostJSONDone', false);
    }

    db.Post.find({
        where: {
            postId: req.params.pid
        }, 
        include: [{   
            model: db.User,
            attributes: [ 'userNameDisp', 'userId', 'profilePicture' ]
        }, { 
            model: db.Comment,
            attributes: ['commentId', 'comment', 'createdAt'],
            include: [{
                model: db.User,
                attributes: [ 'userNameDisp','profilePicture' ]
            }]
        }, {
            model: db.Like,
            attributes: [ 'User_userId' ],
            include: [{
                model: db.User,
                attributes: [ 'userNameDisp' ]
            }]
        }], 
        order: [
            [db.Comment, 'createdAt', 'ASC'] 
        ]
    }).then(function(post) {

        console.log('singlePostJSON: db retrieval complete, likes splicing...');

        //console.log(idArray);
        //console.log(posts);
        //unDAO'ify the results.
        var post = JSON.parse(JSON.stringify(post));
        

        

        var targets = post.likes,
            count2 = Object.keys(targets).length;
            //count2 = targets.length;

        post.hasLiked = false;
        post.totalLikes = count2;


        var l = 0;
        //console.time('while');
        while(targets[l]) {

            var theUser = targets[l].User_userId;

            if(theUser === req.user.userId) {
                post[j].hasLiked = true;
                //splice myself away
                //console.log('self spliced ' + theUser);
                targets.splice(l, 1);

            } else if(idArray.indexOf(theUser) < 0) {
                //splice away all that user is not following
                //console.log('non-following spliced ' + theUser);
                targets.splice(l, 1);
            } else {
                l++;
            }
        }
        //console.timeEnd('while');

        //streamFactory is programmed to handle posts array.
        //we trick streamFactory into processing by giving it an array of posts with 1 post.
        //provide better solution when able.
        var renderJSON = {}
        renderJSON.posts = {}
        renderJSON.posts[0] = post;

        //console.log(JSON.stringify(posts));

        return eventEmitter.emit( 'singlePostJSONDone', JSON.stringify(renderJSON) );

    }).catch(throwErr);
}