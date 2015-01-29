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
var itemMetaHandler = require('./itemMetaHandler.js');

module.exports = function addPost(req, res, uuid, path, fields, CALLBACK) {

    
    //flags
    var setProfileFlag = false;

    var desc = fields['desc'];
    var postType = fields['postType'];

    if (postType === "post") {

        var itemMeta = JSON.parse(fields['itemMeta']);

        itemMeta = itemMetaHandler(itemMeta);

        uuid = uuid[0];

    } else if (postType === "product") {
        var dataProduct = JSON.parse(fields['dataProduct']);
        
        //images treatment
        //if there is no uuid, null it.
        //if there is only 1 then just set uuid to that one and destroy the array.
        //else, append image 2 onwards into dataProduct, then make var uuid point to the first one.
        if (!uuid) {
            uuid = null;
        } else {

            if (uuid.length > 1) {
                dataProduct.images = [];
                //note: var i = 1 because ignore first one.
                for(var i=1; i<uuid.length; i++) {
                    dataProduct.images.push(uuid[i]);
                }
            }

            uuid = uuid[0];
        }
    }


    tagsHandler(desc, postType, CALLBACK, finalCreate);

    function finalCreate(descJSON, CALLBACK) {
        //create the post
        db.User.find().then(function() {

            if (postType === "post") {
                return metaAddTag(itemMeta.itemAddTag);
            } else if (postType === "product") {
                return false;
            } else {
                return false;
            }
            
        }).then(function(foundAddTag) {

            if (!foundAddTag && itemMeta) { delete itemMeta.itemAddTag; }

            var postHash = { 
                desc: descJSON.desc,
                descHTML: descJSON.descHTML,
                tags: JSON.stringify(descJSON.descTags),
                User_userId: req.user.userId,
                imgUUID: uuid
            }

            if (postType === "post") {
                postHash.dataMeta = { itemMeta: itemMeta };

                //startag attribution is unique to posts only. not products
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

            } else if (postType === "product") {
                postHash.dataProduct = dataProduct;
                postHash.isProduct = true;
            }
            console.log(postHash);
            return db.Post.create(postHash);

        }).then(function(post) {

            //set the profilepicture async.
            if(setProfileFlag && postType === "post") { 
                console.log(fname + ' setting profile picture...'); 
                db.User.update({
                    profilePicture: uuid, 
                    Post_postId_profilePicture: post.postId
                }, {
                    where: { 
                        userId: req.user.userId
                    }
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
            if (path) {
                if (Array.isArray(path)) {
                    for(var i=0; i<path.length; i++) {
                        unLinkPaths(path[i]);
                    }
                } else {
                    unLinkPaths(path);
                }
            }   

            function unLinkPaths(path) {
                fs.unlink(path, function(err) {
                    if(err) {
                        console.log(fname + ' Err: Error deleting' + uuid + '.jpg');
                        console.log(fname + ' ' + err);
                    }
                });
            }


            return res.json({success: false});
        });
    }

}