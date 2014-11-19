/* addPost.js is called by posting.js */

/* TODO REFACTOR THIS */

var fname = 'addPost';
var fs = require('fs');
var db = global.db;
var VVutils = require('../utils.js');
var metaAddTag = require('./metaAddTag.js');
var tagsHandler = require('./tagsHandler.js');
var S = require('string');
var addHashTags = require('./addHashTags');

module.exports = function addPost(req, res, uuid, path, fields, CALLBACK) {

    
    //flags
    var setProfileFlag = false;


    var desc = fields['desc'];
    desc = S(desc).stripTags('script').s; //absolutely need to strip the <script> tags.

    var itemMeta = JSON.parse(fields['itemMeta']);
    

    //check for nullity first before invoking HTML tags stripping.
    //by default null should occur very frequently, so don't incur strip tags overheads unneccessarily
    itemMeta.itemLink = VVutils.nullIfEmpty(itemMeta.itemLink);
    if(itemMeta.itemLink) { 
        itemMeta.itemLink = S(itemMeta.itemLink).stripTags().s; // strip HTML tags
        itemMeta.itemLink = S(itemMeta.itemLink).strip('\'','"').s;
    }

    itemMeta.itemAddTag = VVutils.nullIfEmpty(itemMeta.itemAddTag);
    if(itemMeta.itemAddTag) { 
        itemMeta.itemAddTag = S(itemMeta.itemAddTag).stripTags().s;
        //strip away the '@'
        if(itemMeta.itemAddTag.indexOf('@') === 0) {
            itemMeta.itemAddTag.substring(1);
        }
    }

    itemMeta.itemPrice = VVutils.nullIfEmpty(itemMeta.itemPrice);
    if(itemMeta.itemPrice) { 
        itemMeta.itemPrice = S(itemMeta.itemPrice).stripTags().s; 
        itemMeta.itemPrice = S(itemMeta.itemPrice).strip('\'','"').s; 
    }


    tagsHandler(desc, CALLBACK, finalCreate);

    function finalCreate(descJSON, CALLBACK) {
        //create the post
        db.User.find().then(function() {

            var postHash = { 
                desc: descJSON.desc,
                descHTML: descJSON.descHTML,
                tags: JSON.stringify(descJSON.descTags),
                User_userId: req.user.userId,
                imgUUID: uuid
            }

            var attrUserId = descJSON.descTags.star.userId;
            if(attrUserId.length > 0) {
                var id = attrUserId[0];

                //user cannot self attribute
                if(id !== req.user.userId) {
                    postHash.User_userId_attributed = id;
                }
            }

            //if user has no profile picture, set this one as profile picture.
            if(!req.user.profilePicture) {
                console.log(fname +' ' + 'user has no profile picture. This post will be set as profile picture.')
                postHash.isProfilePicture = true;
                setProfileFlag = true;
            }

            return [

                db.Post.create(postHash),
                //run metaAddTag to attempt to get back the user instance
                metaAddTag(itemMeta.itemAddTag),

            ]

        }).spread(function(post, addtag) {

            //set the profilepicture async.
            if(setProfileFlag) { 
                console.log(fname + ' setting profile picture...'); 
                db.User.update({
                    profilePicture: uuid, 
                    Post_postId_profilePicture: post.postId
                }, {
                    userId: req.user.userId
                }).catch(function(err) {
                    console.log(fname + 'Error in setting profile picture. Error: ' + err);
                });
            }

            //asynchronous hashtag adding. non-critical process so we don't really care.
            addHashTags(descJSON.descTags.hash, post);

            return [
                post,
                
                (function() {
                    if(addtag) {
                        return db.PostMeta.create({
                            key: "itemAddTag",
                            value: addtag.userNameDisp,
                            Post_postId: post.postId
                        });
                    }
                    return false;
                })(),

                (function() {
                    if(itemMeta.itemLink) {
                        console.log(fname + ' ' + 'has itemLink');
                        return db.PostMeta.create({
                            key: "itemLink",
                            value: itemMeta.itemLink,
                            Post_postId: post.postId
                        });
                    } else {
                        return false;
                    }
                })(),

                (function() {
                    if(itemMeta.itemPrice) {
                        console.log(fname + ' ' + 'has price');
                        return db.PostMeta.create({
                            key: "itemPrice",
                            value: itemMeta.itemPrice,
                            Post_postId: post.postId
                        });
                    } else {
                        return false;
                    }
                })()
            ]
        }).spread(function(post) {
            console.log(fname + ' Fields inserted.');
            return CALLBACK(post); 

        }).catch(function(err) {
            console.log(fname + ' errorFn: ' + err);
            //delete away image if error in creating post.
            fs.unlink(path, function(err) {
                if(err) {
                    console.log(fname + ' Err: Error deleting' + uuid + '.jpg');
                    console.log(fname + ' ' + err);
                }
            });
            return res.json({success: false});
        });
    }

}