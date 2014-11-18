/****************************************************
TODO:                                                  
What if a file is uploaded NOT using the field "img"?
****************************************************/
var fs = require('fs'),
    formidable = require('formidable'),
    async = require('async'),

    intformat = require('biguint-format'),
    flakeId = require('flake-idgen'),
    flakeIdGen = new flakeId(),
    uuid = function() {
        return intformat(flakeIdGen.next(), 'hex', { prefix: 'img' });
    },

    gm = require('gm').subClass({ imageMagick: true }),

    checkImg = require('./checkImg.js'),
    addPost = require('./addPost.js'),

    //routeTempFiles will alternate temp files to be stored in 2 folders.
    //so that one can be clear when the other is in use.
    //they should usually be empty
    routeTempFiles = require('./routeTempFiles.js');

var fname = 'posting.js ';

var pSuffix = '--p',
    cropSize = 640,
    storeDir = './public/uploads/',
    uploadLimit = 3145728; //this represent 3MB max.


module.exports = function posting(req, res, socket) {

    console.log(fname + '...');

    var throwErr = function(error) {
        console.log(fname + 'Error occured: ' + error);
        return res.json({success: false });
    }

    console.log('Authenticating User...');
    if(!req.isAuthenticated()) { return res.json({success: false}); }
    
    console.log('User Authenticated.');
    console.log('Creating Formidable Form...');
    var form = new formidable.IncomingForm();


    form.on('error', function(err) {
        console.log(err);
        return res.json({success: false});
    });

    form.on('progress', function(bytesReceived, bytesExpected, maxFieldsSize) {
        if(bytesReceived > uploadLimit){//file size <= 2Mb
            console.log("Bytes Received exceed 3MB");
            req.connection.destroy();
            return new Error("Data file exceed 3MB");

        } else{
            socket.emit('uploadProgress', {
                bytesReceived:bytesReceived,
                bytesExpected:bytesExpected
            });
               
        }
        
    });

    //set temp directory
    var upl_temp_prefix = "upl_temp";
    form.uploadDir = routeTempFiles(upl_temp_prefix);

    //resize, rotate, return the image.
    form.parse(req, function(err, fields, files) {

        if(err) {
            console.log(err, fields, files);
            return res.json({success: false});
        }

        //reject if desc > 400 characters.
        if(fields['desc'].length > 1000) { 
            console.log('post rejected becasue description > 1000');
            return res.json({success:false}); 
        }

        /* "store" is the default scenario. Client-side rendering is enabled.
        * Client sends image data. Server returns link to stored image and postId. */
        if(fields['action'] === 'store') {
            console.log(fname + ' store.');
            var img = files['imgData'];

            if(checkImg(img) === 'false') { 
                console.log('img check failed');
                return res.json({success: false}); 
            }

            var newUUID = uuid();

            var newPath = storeDir + newUUID;
            var newPathWithExt = newPath + '.jpg';

            fs.rename(img.path, newPathWithExt, function() {

                var img = gm(newPathWithExt);

                //sizes
                var half = 320,
                    small = 160,
                    thumb = 70,
                    quality = 70;

                var POST = {};

                var tasks = 4; //count used to fire my callback when all 4 task complete.

                //task 1 - create half size
                img
                    .resize(half, half)
                    .quality(quality)
                    .write(newPath + '-half.jpg', function(err) {
                        if(err) { 
                            console.log(fname + "error in creating half sized img. Error: " + err);
                        }
                        console.log(fname + 'half-size created');
                        callback();
                    });

                //task 2 - create small size
                img
                    .resize(small, small)
                    .quality(quality)
                    .write(newPath + '-small.jpg', function(err) {
                        if(err) { 
                            console.log(fname + "error in creating half sized img. Error: " + err);
                        }
                        console.log(fname + 'small-size created.');
                        callback();
                    });

                //task 3 - create thumb size
                img
                    .resize(thumb, thumb)
                    .quality(quality)
                        .write(newPath + '-thumb.jpg', function(err) {
                        if(err) { 
                            console.log(fname + "error in creating half sized img. Error: " + err);
                        }
                        console.log(fname + 'thumb-size created.');
                        callback();
                    });
                
                //task 4 - add the post.
                addPost(req, res, newUUID, newPath, fields, callback);

                function callback(post) {
                    if(post) { POST = post }
                    tasks--;
                    if(tasks > 0) { return false; }
                        
                    return res.json({
                        success: true,
                        actionCompleted: 'stored',
                        postId: POST.postId
                    });

                }
            });
        } //if 'store'


        else {
            console.log(fname + ': AJAX invalid "action" in attrs');
        }

    }); // form parse

}