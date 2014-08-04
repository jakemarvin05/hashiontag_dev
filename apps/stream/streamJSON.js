var db = require('../../models');

module.exports = function streamJSON(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return function () {
            //streamJSON = false;
            eventEmitter.emit('streamJSONDone', false);
        }();
    }

    console.log('streamJSON: authenticating');

    if(req.isAuthenticated()) {
        console.log('streamJSON: user is authenticated.. finding posts...');
        req.user.getFollow(
            // include: [{
            //     model: db.Post
            // }]


            //TODO: fix this ascending thing
            //, order:[ 'Posts.createdAt ASC' ]


            //define attributes, or just take everything
            // , attributes: [
            //     'postId',
            //     'User_userId',
            //     'desc' 
            // ]

        ).getFollowUserPost().success(function(users) {

            
            console.log(JSON.stringify(users));

                return function () {
                    eventEmitter.emit( 'streamJSONDone', JSON.stringify(users) );
                }();


            



        }).error(throwErr);
    } else {

        console.log('streamJSON: not logged it. return')

        
        return function() {
            console.log('streamJSON: user not authenticated...');
            eventEmitter.emit('streamJSONDone', false);
        }();
    }
}