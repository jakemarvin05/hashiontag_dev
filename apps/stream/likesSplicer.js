/* Likes Splicer */
module.exports = function likesSplicer(req, posts, idArray) {
    console.log('inside likesSplicer');
    //console.log(posts);
    var spliced = {}
    var count1 = Object.keys(posts).length;
    if(count1 === 0) { return posts; }

    for(var j=0;j<count1;j++) {
        var post = posts[j],
            targets = post.likes,
            count2 = Object.keys(targets).length;

        post.hasLiked = false;
        post.totalLikes = count2;

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
        spliced[j] = post;

    } //for loop closure
    return spliced;
}