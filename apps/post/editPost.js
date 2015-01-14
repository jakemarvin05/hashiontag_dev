var fname = 'editPost.js ';
var db = global.db;
var VVutils = require('../utils.js');
var metaAddTag = require('./metaAddTag.js');
var tagsHandler = require('./tagsHandler.js');
var S = require('string');
var addHashTags = require('./addHashTags.js');
var itemMetaHandler = require('./itemMetaHandler.js');

module.exports = function editPost(req, res) {

    //if somehow the user was able to edit a post that wasn't hers/his
    if(req.user.userId !== parseFloat(req.body.User_userId)) { return res.json({success:false}); }
 
    var POST;
    var POSTMETA;
    var POSTMETAIDARRAY = [];
    var POSTHT;
    var DESCJSON = false;

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
            console.log('post desc is the same');
            var deleteHashtags = false;
            update();
        } else {
            console.log('post desc is not the same');
            //desc has changed. delete the previous hashtags and run the tagsHandlers again.
            var deleteHashtags = db.sequelize.query('DELETE FROM "Post_Hashtag" WHERE "Post_postId" = ' + post.postId );
            tagsHandler(req.body.desc, null, function(descJSON) {
                DESCJSON = descJSON;
                return update(descJSON);
            });
        }

        var deleteMetas = db.sequelize.query('DELETE FROM "PostMeta" WHERE "Post_postId" = ' + post.postId + ' AND ( key = \'itemLink\' OR key = \'itemPrice\' OR key = \'itemAddTag\' )');

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
    var itemMeta = JSON.parse(req.body.itemMeta);
    
    itemMeta = itemMetaHandler(itemMeta);


    var TASKS = 2;
    function update(descJSON) {
        if (descJSON) { DESCJSON = descJSON; }

        TASKS -= 1;
        if (TASKS !== 0){ return false; }

        if(POST.desc !== DESCJSON.desc) {
            POST.desc = DESCJSON.desc;
            POST.descHTML = DESCJSON.descHTML;
        }

        db.Post.find().then(function() {


            if(DESCJSON) { addHashTags(DESCJSON.descTags.hash, POST); }

            return metaAddTag(itemMeta.itemAddTag);

        }).then(function(addtag) {

            var post = POST;
            if (!addtag) { delete itemMeta.itemAddTag; }
            POST.dataMeta.itemMeta = itemMeta;

            return POST.save({fields: (POST.changed() || []).concat(['dataMeta'])});
    
        }).then(function(newPost) {
            //return res.json({success: true, post: newPost});
            //for the time being we don't want to return the whole post
            return res.json({success: true});
        }).catch(function(err) {
            console.log(fname + 'update catch handler. Error: ' + err);
        });
    }

}