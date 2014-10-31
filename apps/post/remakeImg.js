var fs = require('fs'),
    gm = require('gm').subClass({ imageMagick: true }),
    fname = "remakeImg.js ";

module.exports = function remakeImg(req, res) {
    //check if the main file exist
    var path = 'public/uploads/',
        imgid = req.body.imgid,
        size = req.body.size.toLowerCase(),
        requestedSize = imgid + '-' + size + '.jpg',
        originalFile = imgid + '.jpg';

    var sizeArray = ["half", "small", "thumb"];

    if(sizeArray.indexOf(size) < 0) {
        console.log(fname + "AJAX request for size \"" + size + "\" not valid!");
        return res.json({success: false});
    }
    
    //first we check if the requested size already exist
    //which means the AJAX request was an erroneous one.
    fs.exists(path + requestedSize, function(exists) {
        
        if (exists) {
            //then stop here. probably some other error.
            console.log(fname + 'File that user requested to remake already exist.');
            return res.json({success: false})
        }
    

        //file doesn't exist, let's go find the original file to remake

        fs.exists(path + originalFile, function(exists) {
            if(!exists) {
                //original file is missing. nothing we can do.
                console.log(fname + 'Original file is missing.');
                console.log("filename: " + originalFile);
                return res.json({success: false});
            }

            //sizes
            var sizes = {
                half: 320,
                small: 160,
                thumb: 70,
                quality: 70
            }

            //we have the file, lets remake it.
            gm(path + originalFile)
                .resize(sizes[size], sizes[size])
                .quality(sizes.quality)
                .write(path + imgid + '-' + size + '.jpg', function(err) {
                    if(err) { 
                        console.log(fname + "error in creating" + size + " sized img. Error: " + err);
                    }
                    console.log(fname + imgid + '-' + size + '.jpg created');
                    return res.json({success: true});
                });

        });
      
    });

    //main file doesn't exist, end of story

    //main file exist, make the correct size.

}