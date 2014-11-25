/* Dependents:
   addPost.js
   iggPost.js
*/

var db = global.db;
var fname = 'addHashtags.js ';

module.exports = function addHashTags(hashTags, post) {
    //asynchronous hashtag adding. non-critical process so we don't really care.
    console.log(fname + ' creating hashTags...');
    if(hashTags) {
        var postId = post.postId;
        var splicedHashtags = hashTags.slice();
        
        db.Hashtag
            .findAll({
                where: {
                    hashtagId: hashTags
                }
            }).then(function(existings) {
                console.log(existings);
  
                var j = 0;
                while(existings[j]) {
                    var existing = existings[j].hashtagId;

                    var index = splicedHashtags.indexOf(existing);
                    if(index > -1) {
                        splicedHashtags.splice(index, 1);
                    }
                    j++;
                }

                var bulk = [];
                var i = 0;
                while(splicedHashtags[i]) {
                    bulk.push({hashtagId: splicedHashtags[i]});
                    i++;
                }

                return db.Hashtag.bulkCreate(bulk);

            }).then(function() {
                console.log(fname + ' ' + 'hashtags: ' + hashTags + ' added for post id ' + postId);
                return post.addHashtags(hashTags);

            }).catch(function(err) {
                console.log(fname + ' db.Hashtag catch handler. Error: ' + err);

            });
    }
}