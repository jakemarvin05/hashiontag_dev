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
        


            // var fstream;
            // req.pipe(req.busboy);

            // req.busboy.on('file', function (fieldname, file, filename) {
            //     console.log(fieldname, file, filename);
            //     console.log("Uploading: " + filename); 
            //     fstream = fs.createWriteStream('./public/uploads/' + filename);
            //     file.pipe(fstream);
                
            //     fstream.on('end', function () {
            //         console.log('uploading has completed');
                    
            //         req.busboy.on('field', function(key, value){

            //             console.log(key + ' ' + value);
                
                        db.Post.create({ 
                            desc: req.param('desc'),
                            User_userId: req.user.userId
                        }).success(function(post) {          
                        

                            res.redirect('/me');

                        }).error(throwErr);

                //     });


                    
                // });
            // });

    } else {
        res.redirect('/');
    }

}