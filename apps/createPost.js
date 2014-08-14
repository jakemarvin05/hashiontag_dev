/****************************************************
TODO:                                                  
What if a file is uploaded NOT using the field "img"?
****************************************************/
var db = require('../models'),
    fs = require('fs'),
    formidable = require('formidable');

module.exports = function createPost(req, res) {
    console.log('Creating Post...');
    var throwErr = function(error) {
        console.log(error);
        return function () {
            res.redirect('/error');
        }();
    }
    // console.log('Authenticating User...');
    if(req.isAuthenticated()) {
        // console.log('User Authenticated.');
        // console.log('Creating Formidable Form...');
        var form = new formidable.IncomingForm();
        form.uploadDir = "./public/uploads";
        form.keepExtensions = true;
        // console.log('Formidable Form Created.');
        form.parse(req, function(err, fields, files) {
            console.log('Parsing Formidable Form...');
            // Log errors if any
            if(err){
                console.log(err, fields, files);
            }
            var img=files['img'];
            // Check if image has a valid extension
            console.log("Checking file extension...");
            var idx=img.path.lastIndexOf(".");
            if (idx===-1){
                console.log("File has no extension!");
                res.redirect('/error');
            } else {
                var ext=img.path.slice(idx+1).toLowerCase();
                if (ext!=="jpg"){ // Invalid Extensions
                    console.log("File extension "+ext+" is invalid!");
                    console.log('Removing File Extension...');
                    // console.log(img.path,img.path.slice(0,img.path.lastIndexOf(".")),img.path.lastIndexOf("."));
                    fs.rename(img.path,img.path.slice(0,img.path.lastIndexOf(".")));
                    console.log('File Extension Removed.');
                    res.redirect('/error');
                } else {
                    console.log("File extension "+ext+" is valid.");
                    console.log('Inserting Fields...');
                    db.Post.create({ 
                        desc: fields['desc'],
                        User_userId: req.user.userId
                    }).success(function(post) {
                        console.log('Fields inserted.');
                        // console.log(post);
                        console.log("Renaming "+img.path+" to "+form.uploadDir+"/"+post.dataValues.postId+"."+ext);
                        console.log(img.path,form.uploadDir,post.dataValues.postId,ext);
                        fs.rename(img.path,form.uploadDir+"/"+post.dataValues.postId+"."+ext);
                        console.log("File renamed");
                        // console.log('Formidable Form Parsed.');
                        // console.log('Redirecting to '+'/me');
                        res.redirect('/me');
                    }).error(throwErr);
                }
            }
        });
    } else {
        res.redirect('/');
    }
}