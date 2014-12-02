var targetHashtag = ["vogueverve", "vogueandverve"],
    targetAddtag = "@vogueverve",
    iggPost = require('./iggPost.js'),
    fname = "iggCheckForHashtag.js ";

/* Settings
 *  
 * Check iggMain to make sure that grabCount is the same
 * This 2 settings is to determine the practical size of the stopArray.
*/
var grabCount = 0,
    postsInEachInsta = 20;

module.exports = function iggCheckForHashtag(insta, completionCallback) {

    var hasChangedArray = false;

    //for each instance, loop through the pages.
    //in reverse seqeuence.
    var pagesLength = insta.pages.length;
    for(var i=pagesLength-1; i>-1; i--) {



        //for each page, loop through its posts
        var page = insta.pages[i],
            pageLength = page.length;
        for(var k=pageLength-1; k>-1; k--) {
            var post = page[k];
            if(!post) { continue; }
            var postId = post.id,
                caption = post.caption,
                tags = post.tags;

            //instagram caption can be null
            if(caption) {
                caption = post.caption.text.toLowerCase();

                //check the caption for @vogueverve.
                if(caption.indexOf(targetAddtag) > -1) {
                    (function(insta, post) { return iggPost(insta, post); })(insta, post);
                    insta.newStopArray.unshift(post.id);
                    hasChangedArray = true;
                    continue;
                }
            }

            //for each post, loop through tags
            var tagsLength = tags.length;
            for(var j=0; j<tagsLength; j++) {
                var tag = tags[j].toLowerCase();
                if(targetHashtag.indexOf(tag) > -1) {
                    console.log(fname + 'fired a repost');
                    (function(insta, post) { return iggPost(insta, post); })(insta, post);
                    insta.newStopArray.unshift(post.id);
                    hasChangedArray = true;
                    break;
                }
            }

            //finally just loop through the first 3 comments to find @vogueverve
            var comments = post.comments;
            var owner = post.user.username;
            if(comments.count > 0) {
                for(var m=0; m<3; m++) {
                    var comment = comments.data[m];
                    if(comment) {
                        if(comment.from.username === owner) {

                            //exercising caution...
                            try {
                                if(comment.text.toLowerCase().indexOf(targetAddtag) > -1 ) {
                                    console.log(fname + 'fired a repost');
                                    (function(insta, post) { return iggPost(insta, post); })(insta, post);
                                    insta.newStopArray.unshift(post.id);
                                    hasChangedArray = true;
                                    break;
                                }
                            } catch(err) {
                                console.log(fname + 'has error in instagram comment checking. Error: ' + err);
                            }
                        }
                    }
                }
            }


            postComplete(insta);

        }

    }

    if(hasChangedArray) {
        //resize the array to the pratical length. And then stringify it
        insta.newStopArray.splice((grabCount+1)*postsInEachInsta);
        insta.newStopArray = JSON.stringify(insta.newStopArray);

        //db tasks.
        insta.updateAttributes({
            stopArray: insta.newStopArray
        }).then(function(insta) {
            console.log(fname + 'UserId: ' + insta.User_userId + ' , screenName: ' + insta.screenName + ' , for instaId: ' + insta.instaId + ' completed WITH update to stopArray');
        }).catch(function(err) {
            console.log(fname + ' error occured for User_usderId' + insta.User_userId + ' , instaId: ' + insta.instaId + '. Error: ' + err);
        });
    }

    return completionCallback("repost");

}


function postComplete(insta) {
    insta.postCount -= 1;
    console.log(fname + insta.postCount + ' more posts to go for userid: ' + insta.User_userId);
}