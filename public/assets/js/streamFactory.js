
/* 
This is being extended by profile page 

Profile page re-writes:

(Fill in here....)

*/
var streamFactory = {
    streamContClass: 'mainColBlock',
    $cont: '',
    streamPrefix: 'mainStream_',
    layoutClass: 'streamLayout',
    layoutHTML: false,
    stream: '',
    mediaDir: printHead.p.mediaDir,
    errorImg: printHead.p.img + '/image404.jpg',
    burst: 5, // this dictates how many pictures you want to load first.
    posts: false,
    count: false

}
streamFactory.getLayoutHTML = function() {
    //console.log('streamFactory.getLayoutHTML');
    $layout = $('.' + this.layoutClass);
    //$layout.css('display', 'none');
    $layout.wrap('<div></div>');
    this.layoutHTML = $layout.parent('div').html();
    $layout.unwrap();
    $layout.remove();
}
streamFactory.noObj = function() {
    //console.log('streamFactory.noObj');
}
streamFactory.init = function(posts, options) {
    if(!this.layoutHTML) { this.getLayoutHTML(); }
    if(!posts) { return false; }

    //console.log('streamFactory.init');
    if(options) {
        if(options.burst !== 'undefined') { this.burst = options.burst; }
        if(options.streamContClass) { this.streamContClass = options.streamContClass; }
        if(options.streamType) { this.streamType = options.streamType; }
    }

    this.append.parent = this;
    this.posts = posts;
    var postCount = VV.utils.objCount(this.posts);
    this.postCount = postCount;

    this.$cont = $('.' + this.streamContClass);
    if(postCount < 1) { return this.noObj(); }
    this.buildBlocks(postCount);
}
streamFactory.buildBlocks = function(postCount) {
    //console.log('streamFactory.buildBlocks');
    //cache the burst count to the append method
    if(this.burst>0) { this.append.imageBurstCount = this.burst; }

    for(var i=0; i<postCount; i++) {
        //if(this.posts[i].postId > 55) {
            var post = this.posts[i];
            var streamId = this.streamPrefix + post.postId;

            //create the block
            var newBlock = this.layoutHTML.replace('layoutId', streamId);
            this.$cont.append(newBlock);
            var $stream = $('#' + streamId);
            this.append.init($stream, i);
        //}
    }//for loop
}

streamFactory.append = {}

streamFactory.append.init = function($stream, i) {
    //console.log('streamFactory.append.init');
    var post = this.parent.posts[i];
    //set the data attributes
    this.identifier($stream, post);

    /*
    * Image. Also triggers chain fading.
    */

    //burst > 0 means we are in burst mode. we only want to load the burst images first. 
    if(this.parent.burst > 0) {
        this.imageBurst($stream, i);
    } else {
        //burst set to 0 means no burst. so we load all.
        this.image($stream, i);
    }

    


    /*
    * top left block: profile picture, name, timelapse
    */

    //profile thumb
    var blockProfileThumbHTML  = this.profileThumb(post.user);
    $stream.find('.blockProfileThumb').html(blockProfileThumbHTML);

    //display name
    var blockUserNameHTML  = this.userName(post.user);
    $stream.find('.blockUsername').html(blockUserNameHTML);

    //time lapse
    $stream.find('.blockTimelapse').html(post.timeLapse);

    /*
    * description
    */
    $stream.find('.description').html(post.desc);


    /*
    * Like Button
    */
    var $likeButton = $stream.find('.likeButton');
    if(post.hasLiked) {
        $likeButton.attr('data-action', 'unlike');
        //$likeButton.find('span').html('unlike');
    }
    //all action related buttons are tagged with identifiers.
    this.identifier($likeButton, post);

    /*
    * Comments
    */
    var $commentButton = $stream.find('.sendComment');
    this.identifier($commentButton, post);
    this.commentBlock($stream, post);

    //likes
    var likeText = this.parent.append.likeText(post);
    $stream.find('.blockLikeText' ).prepend(likeText);
}

/* not enabled yet */
streamFactory.append.loadAnimate = function($stream) {
    var $blockImgH = $stream.find('.blockImgHolder');
    return $blockImgH.children('img').velocity({opacity: 0.6}, { duration: 400, delay: 300, loop: true });
}

streamFactory.append.profileThumb = function(user) {
    //console.log('streamFactory.append.profileThumb');
    var theParent = this.parent;

    var pp = (user.profilePicture) ? theParent.mediaDir + '/' + user.profilePicture + '.jpg' : theParent.errorImg;

    var blockProfileThumbHTML  = '<a href="/' + user.userNameDisp + '">';
        blockProfileThumbHTML += '<img src="' + pp + '"></a>';

    return blockProfileThumbHTML;
}

streamFactory.append.userName = function(user) {
    var blockUserNameHTML  = '<a href="/' + user.userNameDisp + '">';
        blockUserNameHTML += user.userNameDisp + '</a>';
    return blockUserNameHTML;
}

streamFactory.append.identifier = function($el, post) {
    //console.log('streamFactory.append.identifier');
    return $el.attr('data-uid', post.user.userId).attr('data-pid', post.postId);
}
streamFactory.append.effect = function($el, callback) {
    //console.log('streamFactory.append.effect');

    var hasUA = VV.utils.checkNested(printHead, "userHeader", "ua");

    //exception handling base on User agent.
    if(hasUA) {
        //for mobile, no effects :(
        if(printHead.userHeader.ua.isMobile) {
            if(callback) { callback(); }
            return $el.css('opacity', 1);
        }
    }

    //default
    var speed = 300;
    if(callback) {
        return $el.velocity('fadeIn', { duration: speed, display: "block" }, callback);
    } else {
        $el.velocity('fadeIn', { duration: speed, display: "block" });
    }
}
streamFactory.append.imageBurst = function ($stream, i) {
    //console.log('streamFactory.append.imageBurst');
    //if it so happens that the burst overtook the DOM building (very very unlikely...)
    //we simply load append sequentially as per normal.
    if(this.imageBurstComplete) {
        this.image($stream, i);
    }

    //check if i is within the burst range, after which we stopping the appending and push all the deferred
    //loading into the caching array.
    //Trigger to load the rest of the images with tied to the onload listener for each of these burst images.
    if(i<this.parent.burst) {
        this.image($stream, i, true);
    } else {
        var literal = { $str: $stream, n: i }
        this.imageDeferredArray.push(literal);
    }
}
streamFactory.append.imageBurstCount = false;
streamFactory.append.imageBurstComplete = false;
streamFactory.append.imageDeferredArray = [];
streamFactory.append.imageLink = function($stream, img, imgURL) {
    console.log('imageLink');
    $stream.find('.blockImgHolder').append('<a class="fancybox" alt="' + img.alt + '" href="' + imgURL + '"></a>');
}
streamFactory.append.imageOnLoad = function($stream, img) {
    var $imgHolder = $stream.find('.imgLoaderHolder');
    var $blockHolder = $stream.find('.blockImgHolder');
    //get the container to hold the height cause we are gonna switch out.
    $blockHolder.css('height', $imgHolder.height() + 'px');
    $imgHolder.remove();
    $blockHolder.find('.fancybox').append(img);
    //reset the height attr.
    $blockHolder.css('height', 'auto');
    this.effect($(img));
}
streamFactory.append.image = function($stream, i, burst) {
    //console.log('streamFactory.append.image' + i);
    //image
    var imgURL = '',
        img = new Image(),
        x = i,
        theParent = this.parent,
        post = theParent.posts[x],
        burst = burst;

        //set it to transparent for fading.
        img.style.opacity = 0;
        img.style.display = "block"

    //console.log('appending ' + i);

    img.onload = function() {
        //console.log('img.onload');
        //cache the i. not too sure if not doing this will cause a bug
        var i = x,
            $theStream = $stream;
        //if this is a burst image, decrement the count
        if(burst) {
            //console.log('bursting and loaded: this is the ' + i);
            theParent.append.imageBurstCount -= 1;
            if(theParent.append.imageBurstCount === 0) {
                //console.log('burst count has decremented to 0....');
                //set the status to complete
                theParent.append.imageBurstComplete = true;

                //time to append all deferred images.
                var defItem = 0;
                while(theParent.append.imageDeferredArray[defItem]) {
                    var item = theParent.append.imageDeferredArray[defItem];
                    theParent.append.image(item.$str, item.n);
                    defItem++;
                }
            }
        }

        theParent.append.imageOnLoad($theStream, this);
    }

    if(!post.imgUUID || post.imgUUID === null) {
        imgURL = theParent.errorImg;
    } else {
        //bind the error handling
        img.onerror = function() {
            //console.log('img.onerror');
            this.onerror = function() {return false;};
            //console.log('this.onerror2');
            this.src = theParent.errorImg;
        }
        imgURL = theParent.mediaDir + '/' + post.imgUUID + '.jpg';
        img.id = post.imgUUID;
        img.alt = VV.utils.stripHTML(post.desc);
    }
    img.src = imgURL;
    this.imageLink($stream, img, imgURL);
}
streamFactory.append.likeText = function(post) {
    //console.log('streamFactory.append.likeText');
        var theParent = this.parent;
        var toPrepend = '';

        if(post.totalLikes > 0) {
            var likersFollowed = post.likes,
                likersFollowedCount = VV.utils.objCount(likersFollowed),
                show = 3, //show how many related likers
                loopRuns = 0,
                likersDispHTML = '',
                likersDisp = {};

            if(likersFollowedCount > 0) {
                if(likersFollowedCount > show) {
                    likersDisp = VV.utils.getRandom(likersFollowed, show);
                    loopRuns = show;
                } else {
                    likersDisp = likersFollowed;
                    loopRuns = likersFollowedCount;
                }

                for(k=0;k<loopRuns;k++) {
                    var name = likersDisp[k].user.userNameDisp;
                    if(k>0) {
                        likersDispHTML += ', ';
                    }
                    likersDispHTML += '<a href="' + printHead.p.absPath + '/' + name + '">' + name +'</a>';
                }
            }

            //TODO: Do away with text-based like description....
            var andLikes = '';
            if(likersFollowedCount > 0) {

                //sally, mary, jane and 99 others like this.

                //Number of related likers shown is defined by "show".
                //So the offsetted number of likers is minimum of show or likersFollowed.
                var offset = Math.min(likersFollowedCount, show)
                var offsetCount = post.totalLikes - offset;

                if(offsetCount > 0) {
                    andLikes  = ' and ';
                    andLikes += '<span class="postLikesCount" data-likescount="' + offsetCount + '">';
                    andLikes += offsetCount;
                    andLikes += '</span>';
                    if(offsetCount === 1) {
                        andLikes += ' other'; 
                    } else {
                        andLikes += ' others';   
                    }
                }

                if(post.totalLikes > 0 ) {
                    if(post.totalLikes === 1) {
                        andLikes += ' likes this.';
                    } else {
                        andLikes += ' like this.';
                    }
                } 

            } else if(post.totalLikes > 1) {

                // 2-99 people like this.
                var offsetCount = post.totalLikes;

                andLikes  = '<span class="postLikesCount" data-likescount="' + offsetCount + '">';
                andLikes += offsetCount;
                andLikes += '</span>';
                andLikes += ' people like this.';

            } else if(post.totalLikes === 1 && !post.hasLiked) {

                // 1 person likes this.
                var offsetCount = post.totalLikes;

                andLikes  = '<span class="postLikesCount" data-likescount="' + offsetCount + '">';
                andLikes += offsetCount;
                andLikes += '</span>';
                andLikes += ' person likes this.';
            }

            toPrepend = likersDispHTML + '<span class="postAndLikes">' + andLikes + '</span>';

        } else {
            toPrepend = '';
        }
        return toPrepend;
}
streamFactory.append.commentBlock = function($stream, post) {
    //console.log('streamFactory.append.commentBlock');
    var comments = post.comments,
        commentCount = VV.utils.objCount(comments),
        showComments = 3;

    if(commentCount > 0) {
        if(commentCount > showComments) {
            $stream.find('.blockLoadMoreCommentsCount').html(commentCount);
            $stream.find('.blockLoadMoreCommentsCont').show();
        }
        var j = commentCount;
        var runs = 0;
        var toShow = true;
        while(j--) {
            if(runs === 3) { toShow = false; }
            this.eachComment($stream, comments[j], toShow);
            runs++;
        }
    }
}
streamFactory.append.eachComment = function($stream, comment, toShow, append) {
    //console.log('streamFactory.append.eachComment');
    var hide = '',
        user = comment.user,
        commentText = VV.utils.htmlEntities(comment.comment);

    commentId = 'commentId' + comment.commentId;

    if(!toShow) { hide = ' style="display:none" ';}
    //in append, we want to trigger the effect. So hide it first.
    if(append) { hide = ' style="display:none" '; }

    var timestampAgo = '';
    if(comment.createdAt) {
        timestampAgo = moment(comment.createdAt).fromNow();
        timestampAgo = '&nbsp;<span class="commentTimeStamp" data-ts="' + comment.createdAt + '">(' + timestampAgo + ')</span>';
    }

    var pp = (user.profilePicture) ? printHead.p.mediaDir + '/' + user.profilePicture + '.jpg' : printHead.p.img + '/noprofilepicture.jpg';

    var commentUserPP = '<a href="/' + user.userNameDisp + '"><img class="profileThumb" src="' + pp + '"></a>';

    var commentUser = '<a href="/' + user.userNameDisp + '">' + user.userNameDisp + '</a>';

    var html = '<div class="postCommentWrap"' + hide + ' id="' + commentId + '">';
        html += commentUserPP;
        html += '<div class="postComment">' + commentUser;
        html += timestampAgo;
        html += '&nbsp;' + commentText + '</div></div>';

    if(append) {
        $stream.find('.postCommentCont').append(html);
    } else {
        $stream.find('.postCommentCont').prepend(html);
    }
    return $('#' + commentId);
}