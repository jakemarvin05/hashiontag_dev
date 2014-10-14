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
    routeTempFiles = require('./routeTempFiles.js');

var fname = 'posting';

var pSuffix = '--p',
    cropSize = 640,
    storeDir = './public/uploads/',
    uploadLimit = 3145728; //this represent 3MB max.


module.exports = function posting(req, res, socket) {

    console.log(fname + '...');

    var throwErr = function(error) {
        console.log(error);
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
        if(fields['desc'].length > 400) { 
            console.log('post rejected becasue description > 400');
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

            var newPath = storeDir + newUUID + '.jpg';

            fs.rename(img.path, newPath, function() {
                
                addPost(req, newUUID, newPath, fields, null, throwErr, function(post) {
                    res.json({
                        success: true,
                        actionCompleted: 'stored',
                        postId: post.postId
                    });
                });
            });
        } //if 'store'



        /* "raw" is where client-rendering is disabled
        * and client is sending the initial image for step 1 manipulation.
        * Thie returns the client with a rotated and downsized image. */
        else if(fields['action'] === 'raw') {

            console.log('Parsing: raw...');

            var img = files['imgData'];
            // Check if image has a valid MIME type
            if(checkImg(img) === 'false') { return res.json({success:false}); }

            var rawPath = img.path;
            var rawImg = gm(rawPath);
            console.log('initial img.path: ' + img.path);

            //preview picture
            var intPathToImg = rawPath + pSuffix + '.jpg';
            var pathToImg = '';

            //now resize
            rawImg.noProfile().autoOrient()
            //parse the stream for async saving.
            .stream(function(err, stdout, stderr) {

                if(err) {
                    console.log('Stream error...');
                    console.log(err);
                    return res.json({success: false});
                }

                var stream = gm(stdout);
                //save 2 instances and also delete stock image.
                async.parallel([

                    function(callback) {
                        stream.write(rawPath+'temp', function(err) {
                            console.log('Writing resized raw...');
                            if(err) {
                                console.log(fname + ' Err: Error in creating resized raw image.');
                                console.log(err);
                                return callback(err);
                            }
                            return callback();
                        })
                    },
                    function(callback) {
                        stream
                        .size({bufferStream: true}, function(err, value) {

                            //setting the resizing
                            if(value.height > value.width) {
                                var resizeHeight = null;
                                var resizeWidth = cropSize;
                            } else {
                                var resizeWidth = null;
                                var resizeHeight = cropSize;
                            }

                            this
                            .resize(resizeWidth, resizeHeight)
                            .setFormat('JPEG')
                            .quality(50)
                            .write(intPathToImg, function(err) {
                                console.log('Writing preview...');
                                
                                if(err) {
                                    console.log(fname + ' Err: Error in creating preview')
                                    console.log(err);
                                    return callback(err);
                                } else {
                                    pathToImg = intPathToImg.substring("public".length); 
                                }
                                return callback();
                            });
                        });
                    }

                ], function(err) {
                    if(err) {
                        return res.json({success: false});
                    }

                    //respond to user 
                    res.json({
                        success: true,
                        pathToImg: pathToImg,
                        actionCompleted: 'rawReturned'
                    });

                    //delete away the raw image
                    fs.unlink(rawPath, function(err) {
                        if(err) {
                            console.log(fname + ' Err: Error deleting old raw image');
                            console.log(err);

                        }

                    });

                }); //async.parallel
            }); // stream() 

        } //if raw



        /* 'process' is where client-rendering is disabled. This is step 2 to "raw".
        * Client sends back data for server to manipulate the raw file.
        * Server returns link to the processed image and postId. */
        else if(fields['action'] === 'process') {
            console.log('Parsing: processing...');

            /* VARIABLES AND FUNCTIONS */
            var processData = JSON.parse(fields['processData']);
            console.log(processData);

            //retrieve just the temp file name without suffixes.
            var rawUpl = fields['imgData'],
                rawName = rawUpl.substring(rawUpl.lastIndexOf('/') + 1);

                rawUpl = rawUpl.substring(rawUpl.lastIndexOf(upl_temp_prefix));
                rawUpl = rawUpl.substring(0, rawUpl.lastIndexOf(pSuffix));

            var prevPath = 'public/' + rawUpl + pSuffix + '.jpg';
            var rawPath = 'public/' + rawUpl + 'temp';
            console.log('reconstructed rawPath: ' + rawPath);
            
            var finalPath = 'public/uploads/' + rawName + '.jpg';

            /* compress and write function */
            var compressWrite = function(file, rawName) {

                var newUUID = uuid();
                var finalPath = storeDir + newUUID + '.jpg';
                //var writeStream = fs.createWriteStream(finalPath);

                gm(file).setFormat('JPEG').quality(75)
                .write(finalPath, function(err) {
                    
                    if(err) {
                        console.log(fname + ': error in compressWrite: ' + err);
                        return res.json({success: false});
                    } else {

                        var pathToImg = finalPath.substring("public".length); 

                        var deleteTemp = function() {

                            fs.unlink(rawPath, function(err) {
                                console.log(fname + ' ' + err);
                            });

                            fs.unlink(prevPath, function(err) {
                                console.log(fname + ' ' + err);
                            });
                        }

                        return addPost(req, newUUID, finalPath, fields, deleteTemp, throwErr, function(post) {
                            return res.json({
                                success: true,
                                actionCompleted: 'stored',
                                postId: post.postId
                            });
                        });
                        // return addPost(req, newUUID, finalPath, fields, deleteTemp, throwErr, function(post) {
                        //     return res.redirect('/p/' + post.postId);
                        // });
                    }

                }); // write()
            }
            /* END VARIABLES AND FUNCTIONS */

            gm(rawPath).size({bufferStream: true}, function(err, value) {

                if(err) {
                    console.log(err);
                    return res.json({success: false});
                }

                var userCropPort = parseFloat(processData.crop.cp);

                if(!userCropPort) {
                    console.log(fname + ': cropPort not defined.');
                    return res.json({success: false});
                }

                if(value.height > value.width) {
                    var m = value.width / (userCropPort*processData.crop.scale);
                } else {
                    var m = value.height / (userCropPort*processData.crop.scale);
                }

                //setting the resizing
                if(value.height > value.width) {
                    var resizeHeight = null;
                    var resizeWidth = cropSize;
                } else {
                    var resizeWidth = null;
                    var resizeHeight = cropSize;
                }

                //crop & resize first.
                if(processData.crop) {

                    var x = parseFloat(processData.crop.x),
                        y = parseFloat(processData.crop.y)

                    if(x !== 0 || y !== 0) {
                        console.log('crop: ');
                        console.log(-x*m, -y*m);
                        this
                        .crop(userCropPort*m, userCropPort*m, -x*m, -y*m)
                        .stream(function(err, stdout, stderr) {
                            if(err) { return res.json({success: false});}

                            gm(stdout).resize(resizeWidth, resizeHeight)
                            .stream(function(err, stdout, stderr) {
                                if (err) {
                                    console.log(fname + 'Error in process-crop: ' + err);
                                    return res.json({success: false});
                                }
                                //apply filters here.
                                compressWrite(stdout, rawName);
                            });
                        });
                    } else {

                        this.resize(resizeWidth, resizeHeight)
                        .stream(function(err, stdout, stderr) {
                            if (err) {
                                console.log(fname + 'Error in process-crop: ' + err);
                                return res.json({success: false});
                            }
                            //apply filters
                            compressWrite(stdout, rawName);

                        });

                    }

                } else {
                    console.log(fname + 'not cropping');
                    //apply filters
                    compressWrite(this, rawName);
                }

            }); //.size()

        } //else if 'process'

        else {
            console.log(fname + ': AJAX invalid "action" in attrs');
        }

    }); // form parse

    // form.on('error', function(){
    //     form.pause();
    //     throwErr(fname + ': form error');
    // });    

}