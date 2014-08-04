var db = require('../models');

module.exports = function createPost(req, res) {


    var throwErr = function(error) {

        console.log(error);

        return function () {
            res.redirect('/error');
        }();
    }


    if(req.isAuthenticated()) {
        console.log('user is authenticated.. running db.User.createPost...');
        db.Post.create({ desc: req.param('desc') }).success(function(post) {
            console.log('post created, running req.user.addPost(post)...')
            //child.setParent(parent)
            post.setUser(req.user).success(function(){
                res.redirect('/me');
            });
        }).error(throwErr);;

    } else {
        res.redirect('/');
    }

}