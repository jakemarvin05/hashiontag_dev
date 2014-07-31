var db = require('../models');

module.exports = function createPost(req, res) {
    if(req.isAuthenticated()) {
        db.Post.create({ desc: req.param('desc') }).success(function(post) {
            req.user.addPost(post).success(function(){
                res.redirect('/');
            });
        });

    }

}