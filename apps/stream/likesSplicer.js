/* Likes Splicer */
module.exports = function likesSplicer(req, posts, idArray) {
    var spliced = [];
    var count1 = posts.length;
    if (count1 === 0) { return posts; }

    for(var j=0; j<count1 ;j++) {

        var post = posts[j];

        //if post is null, skip to the next one.
        if(!post) { continue; }

        var targets = post.likes,
            count2 = targets.length;

        post.hasLiked = false;
        post.totalLikes = count2;

        if (!req.isAuthenticated()) { 
            spliced.push(post); 
            continue;
        }

        var l = 0;
        //console.time('while');
        while(targets[l]) {

            var theUser = targets[l].User_userId;

            if(theUser === req.user.userId) {
                post.hasLiked = true;
                //splice myself away
                //console.log('self spliced ' + theUser);
                targets.splice(l, 1);

            } else if(idArray.indexOf(theUser) < 0) {
                //splice away all that user is not following
                //console.log('non-following spliced ' + theUser);
                targets.splice(l, 1);
            } else {
                l++;
            }
        }
        //console.timeEnd('while');
        spliced.push(post);

    } //for loop closure
    return spliced;
}