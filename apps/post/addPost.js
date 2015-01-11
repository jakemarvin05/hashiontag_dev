/* Dependents:
   post.js
*/


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
            itemMeta.itemAddTag = itemMeta.itemAddTag.substring(1);
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
            return metaAddTag(itemMeta.itemAddTag);
        }).then(function(foundAddTag) {

            if (!foundAddTag) { delete itemMeta.itemAddTag; }

            var postHash = { 
                desc: descJSON.desc,
                descHTML: descJSON.descHTML,
                tags: JSON.stringify(descJSON.descTags),
                User_userId: req.user.userId,
                imgUUID: uuid,
                dataMeta: { itemMeta: itemMeta }
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

            return db.Post.create(postHash);

        }).then(function(post) {

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