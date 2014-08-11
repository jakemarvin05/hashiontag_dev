var db = require('../../models');

module.exports = function ownPostJSON(req, eventEmitter) {

    var throwErr = function(error) {

        console.log(error);

        return function () {
            //streamJSON = false;
            eventEmitter.emit('ownPostJSONDone', false);
        }();
    }

    console.log('ownPostJSON: authenticating');

    if(req.isAuthenticated()) {
        console.log('ownPostJSON: user is authenticated.. finding posts...');
        db.Post.findAll({

            where: {User_userId: req.user.userId}
            //define attributes, or just take everything
            // , attributes: [
            //     'postId',
            //     'User_userId',
            //     'desc' 
            // ]

            , order: '"Post"."createdAt" DESC'

            , include: [{
                model: db.User,
                where: {userId: req.user.userId},
                attributes: [
                    'userNameDisp'
                ] 
            }]
        }).success(function(posts) {

            console.log('ownPostJSON: db retrieval complete, returning the array...');
            //console.log(JSON.stringify(posts));

            return function () {
                eventEmitter.emit( 'ownPostJSONDone', JSON.stringify(posts) );
            }();


        }).error(throwErr);
    } else {

        console.log('ownPostJSON: not logged it. return')

        
        return function() {
            console.log('ownPostJSON: user not authenticated...');
            eventEmitter.emit('ownPostJSONDone', false);
        }();
    }
}