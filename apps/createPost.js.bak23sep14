/****************************************************
TODO:                                                  
What if a file is uploaded NOT using the field "img"?
****************************************************/
var db = require('../models'),
    fs = require('fs'),
    formidable = require('formidable'),
    async = require('async'),

    intformat = require('biguint-format'),
    flakeId = require('flake-idgen'),
    flakeIdGen = new flakeId(),
    uuid = function() {
        return intformat(flakeIdGen.next(), 'hex', { prefix: 'img' });
    },

    gm = require('gm').subClass({ imageMagick: true });

var fname = 'createPost';

var pSuffix = '--p',
    cropSize = 640,
    storeDir = './public/uploads/',
    uploadLimit = 3145728; //this represent 3MB max.





module.exports = function createPost(req, res, socket) {

    /*LOCAL FUNCTIONS */

    var checkImg = function(img) {
        // Check if image has a valid MIME type
        if(!img.type) {
            console.log(fn + ': image has no .type()');
            return res.json({success:false});
        }
        console.log("MIME type '" + img.type + "' detected.");
        
        var ext = "";
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
                return res.json({success:false});
        };
    }

    var addingPost = function(uuid, path, fields, deleteTemp, errHook) {

        db.Post.create({ 
            desc: fields['desc'],
            User_userId: req.user.userId,
            imgUUID: uuid
        }).then(function(post) {
            console.log('Fields inserted.');
            return res.json({
                success: true,
                actionCompleted: 'stored',
                postId: post.postId
            })
        }).then(function() {

            if(deleteTemp) {
                deleteTemp();
            }
            return false;

        }).catch(function(err) {
            console.log(err);

            if(typeof errHook === 'function') {
                errHook();
            }

            //delete away image if error in creating post.
            fs.unlink(path, function(err) {
                if(err) {
                    console.log('Err (createPost.js): Error deleting' + uuid + '.jpg');
                    console.log(err);
                }
            });

            return throwErr(err);
        });

    }


    console.log('Creating Post...');

    var throwErr = function(error) {
        console.log(error);
        return res.json({success: false });
    }

    // console.log('Authenticating User...');
    if(req.isAuthenticated()) {
        // console.log('User Authenticated.');
        // console.log('Creating Formidable Form...');
        var form = new formidable.IncomingForm();


        form.on('error', function(err) {
            res.redirect('/');
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

        var hr = (new Date()).getHours();
        // 0300hrs to 1459hrs -> upl_temp
        // 1500hrs to 0259hrs -> upl_temp2
        var upl_temp_prefix = "upl_temp";
        if(hr >= 3 && hr < 15 ) {
            var uploadDir = "./public/" + upl_temp_prefix;
        } else {
            var uploadDir = "./public/" + upl_temp_prefix + "2";
        }
        form.uploadDir = uploadDir;

        //resize, rotate, return the image.
        form.parse(req, function(err, fields, files) {

            if(err) {
                console.log(err, fields, files);
                return res.json({success: false});
            }

            try {

                if(fields['action'] === 'raw') {

                    console.log('Parsing: raw...');

                    var img = files['imgData'];
                    // Check if image has a valid MIME type
                    checkImg(img);

                    var rawPath = img.path;
                    var rawImg = gm(rawPath);
                    console.log('initial img.path: ' + img.path);

                    //preview picture
                    var intPathToImg = rawPath + pSuffix + '.jpg';
                    var pathToImg = '';

                    //now resize
                    rawImg
                    .noProfile()
                    .autoOrient()
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
                                        console.log('Err (createPost.js): Error in creating resized raw image.');
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
                                            console.log('Err (createPost.js): Error in creating preview')
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
                                    console.log('Err (createPost.js): Error deleting old raw image');
                                    console.log(err);

                                }

                            });

                        }); //async.parallel
                    }); // stream() 

                } //if raw

                else if(fields['action'] === 'process') {

                    /* VARIABLES AND FUNCTIONS */

                    console.log('Parsing: processing...');

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

                        gm(file)
                        .setFormat('JPEG')
                        .quality(75)
                        .write(finalPath, function(err) {
                            
                            if(err) {
                                console.log(fn + ': error in compressWrite: ' + err);
                                return res.json({success: false});
                            } else {

                                var pathToImg = finalPath.substring("public".length); 

                                var deleteTemp = function() {

                                    fs.unlink(rawPath, function(err) {
                                        console.log(err);
                                    });

                                    fs.unlink(prevPath, function(err) {
                                        console.log(err);
                                    });
                                }

                                var errHook = function() {
                                    console.log('test');
                                    fs.unlink(finalPath, function(err) {
                                        console.log(err);
                                    });
                                }

                                return addingPost(newUUID, finalPath, fields, deleteTemp, errHook);
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
                            console.log(fn + ': cropPort not defined.');
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

                            console.log(x, y);

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
                                            console.log(fn + 'Error in process-crop: ' + err);
                                            return res.json({success: false});
                                        }
                                        //apply filters here.
                                        compressWrite(stdout, rawName);
                                    });
                                });
                            } else {

                                this
                                .resize(resizeWidth, resizeHeight)
                                .stream(function(err, stdout, stderr) {
                                    if (err) {
                                        console.log(fn + 'Error in process-crop: ' + err);
                                        return res.json({success: false});
                                    }
                                    //apply filters
                                    compressWrite(stdout, rawName);

                                });

                            }

                        } else {
                            console.log(fn + 'not cropping');
                            //apply filters
                            compressWrite(this, rawName);
                        }

                    }); //.size()

                } //else if 'process'

                else if(fields['action'] === 'store') {

                    var img = files['imgData'];

                    checkImg(img);

                    var newUUID = uuid();

                    var newPath = storeDir + newUUID + '.jpg';

                    fs.rename(img.path, newPath, function() {
                        //var pathToImg = newPath.substring("public".length);
                        return addingPost(newUUID, newPath, fields);
                    });
                }
                else {
                    console.log(fn + ': AJAX invalid "action" in attrs');
                }

            } catch(err) {
                console.log(err);
                return res.json({success:false});
            }

            
        }); // form parse

        form.on('error', function(){
            form.pause();
            throwErr(fn + ': form error');
        });    

    } else {
        res.redirect('/');
    }
}