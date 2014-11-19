var fname = 'editPost.js ';
var db = global.db;
var VVutils = require('../utils.js');
var metaAddTag = require('./metaAddTag.js');
var tagsHandler = require('./tagsHandler.js');
var S = require('string');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var addHashTags = require('./addHashTags.js');

module.exports = function editPost(req, res) {

    //if somehow the user was able to edit a post that wasn't hers/his
    if(req.user.userId !== parseFloat(req.body.User_userId)) { return res.json({success:false}); }
 
    var POST;
    var POSTMETA;
    var POSTMETAIDARRAY = [];
    var POSTHT;

    //get the post first
    //and its hashtag and meta array to destroy
    db.Post.find({
        where: {
            postId: req.body.postId
        }
    }).then(function(post) {
        if(!post) { return res.json({success: false}); }

        if(post.User_userId !== req.user.userId) { return res.json({success: false}); }

        POST = post;

        if(post.desc === req.body.desc) {
            var deleteHashtags = false;
        } else {
            deleteHashtags = db.sequelize.query('DELETE FROM "Post_Hashtag" WHERE "Post_postId" = ' + post.postId );
        }

        deleteMetas = db.sequelize.query('DELETE FROM "PostMeta" WHERE "Post_postId" = ' + post.postId + ' AND ( key = \'itemLink\' OR key = \'itemPrice\' OR key = \'itemAddTag\' )');

        return [
            deleteMetas,
            deleteHashtags
        ]

    }).spread(function(postMeta, hashtags) {

        return update();

    }).catch(function(err) {
        console.log(fname + 'db.Post catch handler. Error: ' + err);
        return res.json({success:false});

    });


    //while searching for post, perform some other task.
    var desc = req.body.desc;
    desc = S(desc).stripTags('script').s; //absolutely need to strip the <script> tags.

    var itemMeta = JSON.parse(req.body.itemMeta);
    
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

    //console.log(desc);
    var DESCJSON;
    tagsHandler(desc, null, function(descJSON) {
        DESCJSON = descJSON;
        return update(descJSON);
    });


    var TASKS = 2;
    function update(descJSON) {
        if (descJSON) { DESCJSON = descJSON; }

        TASKS -= 1;
        if (TASKS !== 0){ return false; }

        POST.desc = DESCJSON.desc;
        POST.descHTML = DESCJSON.descHTML;

        var NEWPOST;
        db.Post.find().then(function() {
            return [
                POST.save(),
                metaAddTag(itemMeta.itemAddTag)
            ]
        }).spread(function(post, addtag) {
            NEWPOST = post;
            addHashTags(DESCJSON.descTags.hash, post);

            return [
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
                        console.log(itemMeta.itemLink, post.postId);
                        return db.PostMeta.create({
                            key: "itemLink",
                            value: itemMeta.itemLink,
                            Post_postId: post.postId
                        }).catch(function(err) {
                            console.log('itemLink error: ' + err);
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
                        }).catch(function(err) {
                            console.log('itemLink error: ' + err);
                        });
                    } else {
                        return false;
                    }
                })()
            ]
        }).spread(function() {
            return res.json({success: true, post: NEWPOST});
        }).catch(function(err) {
            console.log(fname + 'update catch handler. Error: ' + err);
        });
    }

}