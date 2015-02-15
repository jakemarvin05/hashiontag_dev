var fs = require('fs'),
    formidable = require('formidable'),
    async = require('async'),


    /* intformant and flake is for generating UUID-like filenames for images */
    intformat = require('biguint-format'),
    flakeId = require('flake-idgen'),
    flakeIdGen = new flakeId(),
    uuid = function() {
        return intformat(flakeIdGen.next(), 'hex', { prefix: 'img' });
    },

    /* imageMagick & gm */
    gm = require('gm').subClass({ imageMagick: true }),

    checkImg = require('./checkImg.js'),
    addPost = require('./addPost.js'),

    /* DEPRECATED */
    //routeTempFiles will alternate temp files to be stored in 2 folders.
    //so that one can be clear when the other is in use.
    //they should usually be empty
    routeTempFiles = require('./routeTempFiles.js');

var fname = 'posting.js ';

var pSuffix = '--p',
    cropSize = 640,
    storeDir = './public/uploads/',
    uploadLimit = 3145728; //this represent 3MB max.

var TASKS = 0; //task counter


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
        console.log(files);

        if(err) {
            console.log(err, fields, files);
            return res.json({success: false});
        }

        //reject if desc > 400 characters.
        if(fields['desc'].length > 1000) { 
            console.log('post rejected because description > 1000');
            return res.json({success:false}); 
        }

        /* DEPRECATED: 'store' is not longer required. */

        /* "store" is the default scenario. Client-side rendering is enabled.
        * Client sends image data. Server returns link to stored image and postId. */
        if(fields['action'] === 'store') {
            console.log(fname + ' store.');
            var fileKeys = Object.keys(files);
            var img = [];

            //Loop through the file keys to find 'imgData'. Check for nullity then push them in.
            for(var i=0; i<fileKeys.length; i++) {
                var key = fileKeys[i];
                if (key.indexOf('imgData') > -1) {
                    var file = files[key];
                    if (file !== null) {
                        img.push(file);
                    }
                }
            }


            for(var i=0; i<img.length; i++) {
                if(checkImg(img[i]) === 'false') { 
                    console.log('img check failed');
                    return res.json({success: false}); 
                }
            }

            //sizes
            var half = 320,
                small = 160,
                thumb = 70,
                quality = 70;


            var newUUID, newPath, newPathWithExt;

            // (img.length === 1 && img[0] === null]) is a redundancy check.
            // suppose the first image is null, it is an incomplete post. don't create images.
            if (img.length === 0 || (img.length === 1 && img[0] === null) ) {

                TASKS += 1;
                addPost(req, res, newUUID, newPath, fields, callback);

            } else {

                createIds(img.length);
                console.log(newUUID, newPath, newPathWithExt);
                TASKS += 3*img.length + 1;

                for(var i=0; i<img.length; i++) {
                    createImages(img[i], newPath[i], newPathWithExt[i]);
                }

                //last task - add the post.
                addPost(req, res, newUUID, newPath, fields, callback);
            }
            
            function createIds(numberOfIds) {
                if (!newUUID) {
                    //newUUID is not initialized as array. all the rest too.
                    newUUID = []; newPath = []; newPathWithExt = [];
                }
                for(var i=0; i<numberOfIds; i++) {
                    var tempUUID = uuid();
                    newUUID.push(tempUUID);
                    newPath.push(storeDir + tempUUID);
                    newPathWithExt.push(storeDir + tempUUID + '.jpg');
                }
              
            }


            function createImages(img, newPath, newPathWithExt) {
                console.log(img, newPath,newPathWithExt);

                fs.rename(img.path, newPathWithExt, function() {

                    var img = gm(newPathWithExt);

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
                
                });
            }
            
        } //if 'store'


        else {
            console.log(fname + ': AJAX invalid "action" in attrs');
        }

    }); // form parse

    //CALLBACK FUNCTION
    function callback(post) {
        var self = this;
        if (post) { this.post = post; }
        TASKS--;

        if(TASKS > 0) { return false; }
            
        return res.json({
            success: true,
            actionCompleted: 'stored',
            postId: self.post.postId,
            post: self.post
        });

    }

}