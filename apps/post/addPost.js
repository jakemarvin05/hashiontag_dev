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
    var isNotPublished = (fields['isNotPublished'] === "true" || fields['isNotPublished'] === true) ? true : null;

    if (postType === "post") {

        var dataMeta = JSON.parse(fields['dataMeta']);

        dataMeta.itemMeta.forEach(function(el, i, arr) {
            arr[i] = itemMetaHandler(el);
        });

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
        Promise.resolve().then(function() {

            if (postType === "post") {
                //is there a better way?
                return [
                    metaAddTag(dataMeta.itemMeta[0]),
                    metaAddTag(dataMeta.itemMeta[1]),
                    metaAddTag(dataMeta.itemMeta[2]),
                    metaAddTag(dataMeta.itemMeta[4])
                ]
            } else if (postType === "product") {
                return [false, false, false, false];
            } else {
                return [false, false, false, false];
            }
            
        }).spread(function(found1, found2, found3, found4) {

            if (postType === 'post') {
                //delete those that are not found
                //else update them with the correct casing.
                var founds = [found1, found2, found3, found4];
                for(var i in founds) {
                    var found = founds[i];
                    var meta = dataMeta.itemMeta[i];

                    //if found is false and the itemMeta exist, try to delete the name.
                    if (!found && meta) { 
                        //there can be the case where item meta exist but no name
                        try { delete meta.userName; }
                        catch (err) {}
                    }
                    //found true, update the itemMeta with proper cased userName.
                    else if (meta) { 
                        meta.userName = found.userNameDisp; 
                        meta.userId = found.userId;
                        meta.profilePicture = found.profilePicture;
                    }
                }
            }

            var postHash = { 
                desc: descJSON.desc,
                descHTML: descJSON.descHTML,
                tags: JSON.stringify(descJSON.descTags),
                User_userId: req.user.userId,
                imgUUID: uuid
            };

            if (postType === "post") {
                postHash.dataMeta = dataMeta;

                //startag attribution is unique to posts only. not products
                var attrUserId = descJSON.descTags.star.userId;
                if (attrUserId.length > 0) {
                    var id = attrUserId[0];

                    //user cannot self attribute
                    if(id !== req.user.userId) {
                        postHash.User_userId_attributed = id;
                    }
                }

                //if user has no profile picture, set this one as profile picture.
                if (!req.user.profilePicture) {
                    console.log(fname +' ' + 'user has no profile picture. This post will be set as profile picture.')
                    postHash.isProfilePicture = true;
                    setProfileFlag = true;
                }

            } else if (postType === "product") {
                postHash.dataProduct = dataProduct;
                postHash.isProduct = true;
                postHash.isNotPublished = isNotPublished;
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