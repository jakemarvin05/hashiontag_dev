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
                //where: {UserId: req.user.userId}
                //attributes: ['userId']
            // , include: [{
            //     model: db.Posts
            // }]


            //TODO: fix this ascending thing
            //, order:[ 'Posts.createdAt ASC' ]


            //define attributes, or just take everything
            // , attributes: [
            //     'postId',
            //     'User_userId',
            //     'desc' 
            // ]

        ).success(function(users) {

            var idArray = [];

            for(var i in users) {
                idArray.push(users[i].values['userId']);
            }
            
            console.log('streamJSON: got the follows...getting posts');

            db.Post.findAll({ 
                where: {
                    User_userId: idArray
                }
                , include: [{
                    model: db.User,
                    attributes: [
                        'userName'
                    ] 
                }]
            }).success(function(posts) {

                console.log('streamJSON: db retrieval complete, returning the array...');

                console.log(JSON.stringify(posts));

                return function () {
                    eventEmitter.emit( 'streamJSONDone', JSON.stringify(posts) );
                }();

            }).error(throwErr);

            



        }).error(throwErr);
    } else {

        console.log('streamJSON: not logged it. return')

        
        return function() {
            console.log('streamJSON: user not authenticated...');
            eventEmitter.emit('streamJSONDone', false);
        }();
    }
}