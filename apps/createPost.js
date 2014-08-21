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

        form.on('error', function(err) {
            res.redirect('/');
        });

        form.uploadDir = "./public/uploads";
        // console.log('Formidable Form Created.');
        form.parse(req, function(err, fields, files) {
            console.log('Parsing Formidable Form...');
            // Log errors if any
            if(err){
                console.log(err, fields, files);
            }
            var img=files['img'];
            // Check if image has a valid MIME type
            console.log("Checking MIME type...");
            console.log("MIME type '"+img.type+"' detected.");
            var ext="";
            switch(img.type.toUpperCase()){
                case "IMAGE/GIF":
                    ext=".gif";
                break;
                case "IMAGE/JPEG":
                case "IMAGE/PJPEG":
                    ext=".jpg";
                break;
                case "IMAGE/PNG":
                    ext=".png";
                break;
                default:
                    console.log("Invalid MIME type detected: "+img.type);
            };
            console.log("Assigning extension: "+ext);
            if (ext===""){
                console.log("No extension assigned!");
                res.redirect('/error');
            } else {
                console.log('Inserting Fields...');
                db.Post.create({ 
                    desc: fields['desc'],
                    User_userId: req.user.userId
                }).then(function(post) {
                    console.log('Fields inserted.');
                    // console.log(post);
                    console.log("Renaming "+img.path+" to "+form.uploadDir+"/"+post.dataValues.postId+ext);
                    console.log(img.path,form.uploadDir,post.dataValues.postId,ext);
                    fs.rename(img.path,form.uploadDir+"/"+post.dataValues.postId+ext);
                    console.log("File renamed");
                    // console.log('Formidable Form Parsed.');
                    // console.log('Redirecting to '+'/me');
                    res.redirect('/me');
                }).catch(throwErr);
            }
        });

    } else {
        res.redirect('/');
    }
}