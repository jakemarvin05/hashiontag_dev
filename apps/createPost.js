var db = require('../models')
    , fs = require('fs');

module.exports = function createPost(req, res) {


    var throwErr = function(error) {

        console.log(error);

        return function () {
            res.redirect('/error');
        }();
    }


    if(req.isAuthenticated()) {
        console.log('user is authenticated.. running db.User.createPost...');
        

        var fstream;
        req.pipe(req.busboy);
        req.busboy.on('file', function (fieldname, file, filename) {
            console.log(fieldname, file, filename);
            console.log("Uploading: " + filename); 
            fstream = fs.createWriteStream('./public/uploads/' + filename);
            file.pipe(fstream);
            /*
            fstream.on('close', function () {
                res.redirect('back');
            });*/
        });


        // Handle text...
        db.Post.create({ 
            desc: req.param('desc'),
            User_userId: req.user.userId
        }).success(function(post) {
            //modified to cut down 1 db call.
            //console.log('post created, running req.user.addPost(post)...')
            //child.setParent(parent)
            // post.setUser(req.user).success(function(){
                res.redirect('/me');
            // });
        }).error(throwErr);;

    } else {
        res.redirect('/');
    }

}