var db = require('../models');


module.exports = function profileJSON(req, eventEmitter) {

  var throwErr = function(error) {

    console.log(error);

    return function () {
      //profileJSON = false;
      eventEmitter.emit('profileJSONDone', false);
    }();
  }

  console.log('profileJSON: authenticating');

  if(req.isAuthenticated()) {
    console.log('profileJSON: user is authenticated.. finding profile...');
    db.User.find({
      where: {userName: req.params.user.toLowerCase()},
      attributes: [ 'userId', 'userNameDisp', 'createdAt' ],
      include: [{
        model: db.Post,
        include: [{
          model: db.Comment,
          attributes: ['comment','createdAt'],
      
          include: [{
            model: db.User,
            attributes: ['userNameDisp']
          }]


        }]//db.Comment include closure
      }],// db.Post include closure

      order: [ [db.Post, 'createdAt', 'DESC'], [db.Post, db.Comment, 'createdAt','ASC'] ]
    }).success(function(users) {

      console.log('profileJSON: db retrieval complete, returning the array...');

      console.log(JSON.stringify(users));

      return function () {
        eventEmitter.emit( 'profileJSONDone', JSON.stringify(users) );
      }();

    }).error(throwErr);

  } else {

    console.log('profileJSON: not logged it. return')

    
    return function() {
      console.log('profileJSON: user not authenticated...');
      eventEmitter.emit('profileJSONDone', false);
    }();
  }
}