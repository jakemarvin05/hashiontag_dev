var fname = 'iggPost.js ',
    fs = require('fs'),
    db = global.db,
    http = require('http'),


    intformat = require('biguint-format'),
    flakeId = require('flake-idgen'),
    flakeIdGen = new flakeId(),
    uuid = function() {
        return intformat(flakeIdGen.next(), 'hex', { prefix: 'img' });
    };

var request = require("request");
var tagsHandler = require('../post/tagsHandler.js');
var addHashTags = require('../post/addHashTags.js');


module.exports = function iggPost(insta, post) {

    var userId = insta.User_userId,
        imgUUID = uuid();

    //instagram caption can be null
    var caption = post.caption;
    if(caption) {
        var desc = caption.text;
    } else {
        var desc = caption;
    }
        

    console.log(fname + 'starting instagram re-post for userId: ' + insta.User_userId + '. imgUUID: ' + imgUUID + '. Instagram: '+ post.link);

    var myRequests = [];

    //prepare the writestreams

    var mediaDir = './public/uploads/',
        fullPath = mediaDir + imgUUID + '.jpg',
        halfPath = mediaDir + imgUUID + '-half.jpg',
        smallPath = mediaDir + imgUUID + '-small.jpg',
        thumbPath = mediaDir + imgUUID + '-thumb.jpg';

    //don't need to create writestream for full. cause not using pipe.
    //the promise returns "contents", which is written using fs.writeFile
    var full = fs.createWriteStream(fullPath),
        half = fs.createWriteStream(halfPath),
        small = fs.createWriteStream(smallPath),
        thumb = fs.createWriteStream(thumbPath);






    //instagram has 3 images to grab.

    //half size
    var halfRequest = request(post.images.low_resolution.url, function(err, res, body) {
        if(err || reqErr(res.statusCode)) { 
            return console.log(fname + 'halfRequest error for ' + imgUUID + '. Error: ' + err + '. Status code: ' + res.statusCode); 
        }
    });
    halfRequest.on('data', function(chunk) { 
        half.write(chunk); 
    });
    myRequests.push(halfRequest);

    //small size
    var smallRequest = request(post.images.thumbnail.url, function(err, res, body) {
        if(err || reqErr(res.statusCode)) { 
            return console.log(fname + 'smallRequest error for ' + imgUUID + '. Error: ' + err + '. Status code: ' + res.statusCode); 
        }
    });
    smallRequest.on('data', function(chunk) { 
        //using the small size for both small and thumb
        small.write(chunk);
        thumb.write(chunk);
    });
    myRequests.push(smallRequest);

    //FULL SIZE
    //only interested in the large image being successful.
    //because for the other sizes, we can always self generate.
    var fullRequest = request(post.images.standard_resolution.url, function(err, res, body) {
        if(err || reqErr(res.statusCode)) { 
            rollback();
            return console.log(fname + 'fullRequest error for ' + imgUUID + '. Error: ' + err + '. Status code: ' + res.statusCode); 
        }
        console.log(fname + 'response is ok. retrieved full image, instagram re-post for userId: ' + insta.User_userId + '. imgUUID: ' + imgUUID + '. Instagram: '+ post.link);

        tagsHandler(desc, null, create);

        function create(descJSON) {
            //create the post
            var postHash = {
                User_userId: userId,
                desc: descJSON.desc,
                descHTML: descJSON.descHTML,
                tags: JSON.stringify(descJSON.descTags),
                imgUUID: imgUUID,
                dataMeta: {
                    "isInstagram": post.link
                }
            }

            db.Post.create(postHash).then(function(repost) {

                //not critical
                db.PostMeta.create({
                    Post_postId: repost.postId,
                    key: "isInstagram",
                    value: post.link
                }).catch(function(err) {
                    console.log(fname + ' error in setPostMeta for postId ' + repost.postId + '. Error: ' + err);
                });

                //addhashtags
                addHashTags(descJSON.descTags.hash, repost);

                console.log(fname + 'added instagram post: ' + post.link + ' added for userId:' + userId + ' . PostId: ' + repost.postId);

            }).catch(function(err) {

                console.log(fname + ' Error in Instagram post grabbing for userId: ' + userId + ' . Instagram post: ' + post.link);
                console.log(fname + err);
                console.log(fname + ' Cancelling http myRequests and attempt to delete files..');
                rollback();

            });
        }

    });
    fullRequest.on('data', function(chunk) { 
        full.write(chunk); 
    });

    myRequests.push(fullRequest);


    function reqErr(code) {
        if(code >=400 && code <500) { return true; }
        return false;
    }

    function rollback() {
        console.log(fname + 'rollback is called');
        
        //CANCEL REQUESTS
        for(var i=0; i<myRequests.length; i++) {
            try { 
                myRequests[i].abort();
            } catch(err) {
                console.log(fname + 'non-critical error in cancelling myRequests for userId: ' + userId + ' , imgUUID: ' + imgUUID);
            }
        }

        //FILE DELETION
        fs.unlink(fullPath, function(err) {
            if(err) {
                console.log(fname + ' Err: Error deleting ' + fullPath);
                console.log(fname + ' ' + err);
            }
        });

        fs.unlink(halfPath, function(err) {
            if(err) {
                console.log(fname + ' Err: Error deleting ' + halfPath);
                console.log(fname + ' ' + err);
            }
        });

        fs.unlink(smallPath, function(err) {
            if(err) {
                console.log(fname + ' Err: Error deleting ' + smallPath);
                console.log(fname + ' ' + err);
            }
        });

        fs.unlink(thumbPath, function(err) {
            if(err) {
                console.log(fname + ' Err: Error deleting ' + thumbPath);
                console.log(fname + ' ' + err);
            }
        });
    }
}