var targetHashtag = ["vogueverve", "vogueandverve"],
    iggPost = require('./iggPost.js'),
    fname = "iggCheckForHashtag.js ";

module.exports = function iggCheckForHashtag(insta, completionCallback) {

    //for each instance, loop through the pages.
    var pagesLength = insta.pages.length;
    for(var i=0; i<pagesLength; i++) {



        //for each page, loop through its posts
        var page = insta.pages[i],
            pageLength = page.length;
        for(var k=0; k<pageLength; k++) {
            var post = page[k],
                tags = post.tags;



            //for each post, loop through tags
            var tagsLength = tags.length;
            for(var j=0; j<tagsLength; j++) {
                var tag = tags[j].toLowerCase();
                if(targetHashtag.indexOf(tag) > -1) {
                    console.log(fname + 'fired a repost');
                    iggPost(insta, post);
                    break;
                }
            }


            //looped through all the hashtags
            //this post is done.
            postComplete(insta);


        }

    }

    function postComplete(insta) {
        insta.postCount -= 1;
        if(insta.postCount === 0) {
            return completionCallback("repost");
        }
        console.log(fname + insta.postCount + ' more posts to go for userid: ' + insta.User_userId);
    }


}