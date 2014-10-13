
/* 
This is being extended by profile page 

Profile page re-writes:

(Fill in here....)

*/
var streamFactoryCopy = {
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
streamFactoryCopy.getLayoutHTML = function() {
    //console.log('streamFactoryCopy.getLayoutHTML');
    $layout = $('.' + this.layoutClass);
    //$layout.css('display', 'none');
    $layout.wrap('<div></div>');
    this.layoutHTML = $layout.parent('div').html();
    $layout.unwrap();
    $layout.remove();
}
streamFactoryCopy.noObj = function() {
    //console.log('streamFactoryCopy.noObj');
}
streamFactoryCopy.init = function(posts, options) {
    if(!this.layoutHTML) { this.getLayoutHTML(); }
    if(!posts) { return false; }

    //console.log('streamFactoryCopy.init');
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
streamFactoryCopy.buildBlocks = function(postCount) {
    //console.log('streamFactoryCopy.buildBlocks');
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

    for(var i in this.append.callbacks) {
        this.append.callbacks[i].call(this.append);
    }

}

streamFactoryCopy.append = {}
streamFactoryCopy.append.callbacks = [];

streamFactoryCopy.append.init = function($stream, i) {
    //console.log('streamFactoryCopy.append.init');
    var post = this.parent.posts[i];
    //set the data attributes
    console.log(post);
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
    * More info
    */
    var moreInfo = this.moreInfoBlock($stream, post);
    if(moreInfo) { 
        $stream.find('.blockMoreInfo').append(moreInfo.html);
        this.moreInfoImg($stream, post, moreInfo);
    }
    //run once
    if(i===0) { this.callbacks.push(this.moreInfoBindButton) }

    /*
    * Comments
    */
    var $commentButton = $stream.find('.sendComment');
    this.identifier($commentButton, post);
    this.commentBlock($stream, post);
    //bind the button, push it to callback.
    if(i===0) { this.callbacks.push(this.commentBlockMoreButton) }

    //likes
    var likeText = this.parent.append.likeText(post);
    $stream.find('.blockLikeText' ).prepend(likeText);
}

/* not enabled yet */
streamFactoryCopy.append.loadAnimate = function($stream) {
    var $blockImgH = $stream.find('.blockImgHolder');
    return $blockImgH.children('img').velocity({opacity: 0.6}, { duration: 400, delay: 300, loop: true });
}

streamFactoryCopy.append.profileThumb = function(user) {
    //console.log('streamFactoryCopy.append.profileThumb');
    var theParent = this.parent;

    var pp = (user.profilePicture) ? theParent.mediaDir + '/' + user.profilePicture + '.jpg' : theParent.errorImg;

    var blockProfileThumbHTML  = '<a href="/' + user.userNameDisp + '">';
        blockProfileThumbHTML += '<img src="' + pp + '"></a>';

    return blockProfileThumbHTML;
}

streamFactoryCopy.append.userName = function(user) {
    var blockUserNameHTML  = '<a href="/' + user.userNameDisp + '">';
        blockUserNameHTML += user.userNameDisp + '</a>';
    return blockUserNameHTML;
}

streamFactoryCopy.append.identifier = function($el, post) {
    //console.log('streamFactoryCopy.append.identifier');
    return $el.attr('data-uid', post.user.userId).attr('data-pid', post.postId);
}
streamFactoryCopy.append.effect = function($el, callback) {
    //console.log('streamFactoryCopy.append.effect');

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
streamFactoryCopy.append.imageBurst = function ($stream, i) {
    //console.log('streamFactoryCopy.append.imageBurst');
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
streamFactoryCopy.append.imageBurstCount = false;
streamFactoryCopy.append.imageBurstComplete = false;
streamFactoryCopy.append.imageDeferredArray = [];
streamFactoryCopy.append.imageLink = function($stream, img, imgURL) {
    //console.log('imageLink');
    $stream.find('.blockImgHolder').append('<a class="fancybox" alt="' + img.alt + '" href="' + imgURL + '"></a>');
}
streamFactoryCopy.append.imageOnLoad = function($stream, img) {
    var $imgHolder = $stream.find('.imgLoaderHolder');
    var $blockHolder = $stream.find('.blockImgHolder');
    //get the container to hold the height cause we are gonna switch out.
    $blockHolder.css('height', $imgHolder.height() + 'px');
    $imgHolder.remove();
    $blockHolder.find('.fancybox').prepend(img);
    //reset the height attr.
    $blockHolder.css('height', 'auto');
    this.effect($(img));
}
streamFactoryCopy.append.image = function($stream, i, burst) {
    //console.log('streamFactoryCopy.append.image' + i);
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
        img.dataset.imgid = post.imgUUID;
        img.alt = VV.utils.stripHTML(post.desc);
    }
    img.src = imgURL;
    this.imageLink($stream, img, imgURL);
}
streamFactoryCopy.append.likeText = function(post) {
    //console.log('streamFactoryCopy.append.likeText');
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
    //console.log(toPrepend);
    return toPrepend;
}
streamFactoryCopy.append.commentBlock = function($stream, post) {
    //console.log('streamFactoryCopy.append.commentBlock');
    var comments = post.comments,
        commentCount = VV.utils.objCount(comments),
        showComments = 3;

    if(commentCount > 0) {
        if(commentCount > showComments) {
            var c = commentCount-showComments;
            $stream.find('.blockLoadMoreCommentsCount')
                .attr('data-count', c)
                .html(c);
            var $cont = $stream.find('.blockLoadMoreCommentsCont');
            var $but = $cont.find('.blockLoadMoreCommentsBut');
            $cont.show();
            this.identifier($but, post)

            //set up the list
            this.commentList[post.postId] = [];

        }
        var j = commentCount;
        var runs = 0;
        var toShow = true;
        while(j--) {
            if(runs === 3) { toShow = false; }
            this.eachComment($stream, comments[j], toShow, post.postId);
            runs++;
        }
    }
}
streamFactoryCopy.append.commentList = {}
streamFactoryCopy.append.commentBlockMoreButton = function() {
    var contClass = this.parent.streamContClass;
    var $buts = $('.' + contClass).find('.blockLoadMoreCommentsBut'),
        n = 2, //base
        commentList = this.commentList;

        /* the latest comment in commentJSON is of a higher [number].
         * commentBlock is set to run decrementing to 0 so that the
         * latest comments gets inserted. "eachComment" will PREPEND
         * subseqent comments.
         * This also means that the commentList is in "natural order",
         * i.e., [0] is the first to show.
         */

        $buts.click(function() {
            var p = parseFloat($(this).attr('data-power')),
                $count = $(this).find('.blockLoadMoreCommentsCount'),
                postId = $(this).attr('data-pid'),
                theList = commentList[postId];
            //doesn't exist implies the first power
            if(isNaN(p) || p === 0) { p = 1; }

            //calculate and splice
            var spliceN = Math.pow(n, p);
            var $targets = theList.splice(0, spliceN);

            //show the targets
            for(var i in $targets) { $targets[i].show(); }

            //change the count number
            var count = $targets.length;
            var currCount = parseFloat($count.attr('data-count'));
            var newCount = currCount - count;
            if(newCount === 0) { $(this).velocity('fadeOut', 200); }

            //update data attrs
            $count.attr('data-count', newCount).html(newCount);
            $(this).attr('data-power', p+1);
        });
}
streamFactoryCopy.append.eachComment = function($stream, comment, toShow, postId, append) {
    //console.log('streamFactoryCopy.append.eachComment');
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

    var $comment = $stream.find('#' + commentId);
    //push those hidden ones into the array list.
    if(!toShow) { this.commentList[postId].push($comment); }

    return $comment;
}
streamFactoryCopy.append.moreInfoBlock = function($stream, post) {
    //console.log('moreInfoblock'); 
    /*
        -- name has to be somehow factored in... maybe we will search the
           desc for hashtags --
    <h2 class="itemName" itemprop="item"></h2>
    <h2 class="shopName" itemprop="shop"></h2>
    <h3 class="price" itemprop="price"></h3>
    */
    var meta = post.postMeta,
        count;
 
    //item metas:
    if(meta) {
        count = VV.utils.objCount(meta);
        if(VV.utils.objCount(meta) === 0) {
            $stream.find('.moreInfo').remove()
            return false;
        }
    } else { $stream.find('.moreInfo').remove(); return false; }

    var itemAddTagDiv = '',
        itemLinkDiv = '',
        itemPriceDiv = '',
        itemAddTagImgDiv = '';

    var data = {}
    var container = '';

    //decrease the count because its 1 base.
    count -= 1;
    while(meta[count]) {
        var m = meta[count];
        //console.log(m);
        if(m.key === 'itemAddTag') {
            data.hasAddTag = true;
            data.addTag = m.value.toLowerCase();

            //create a img div and just give it a class
            itemAddTagImgDiv = '<div class="postItemAddTagImg"></div>';

            //username
            itemAddTagDiv  = '<div class="postItemAddTag" itemprop="shop">';
            itemAddTagDiv += '<a href="' + printHead.p.absPath + '/' + data.addTag + '">';
            itemAddTagDiv += '@' + m.value + '</a></div>';
        }
        if(m.key === 'itemLink') {
            var itemLink = m.value;
            var workingLink = '';
            var showLink = '';
            if(m.value.indexOf('http') < 0 ) { 
                //suspect it starts with "www", so add // so make it work
                workingLink = '//' + itemLink;
            } else {
                workingLink = itemLink;
            }
            showLink = (itemLink.length > 25) ? itemLink.substring(0,25) + '...': itemLink;
            itemLinkDiv  = '<div class="postItemLink">';
            itemLinkDiv += '<span class="glyphicon glyphicon-link"></span>';
            itemLinkDiv += '<a rel="nofollow" href="' + workingLink + '" target="_blank">' + showLink + '</a>';
            itemLinkDiv += '</div>'; 
        }
        if(m.key === 'itemPrice') {
            itemPriceDiv  = '<div class="postItemPrice" itemprop="price">';
            itemPriceDiv += '<span class="glyphicon glyphicon-usd"></span>';
            itemPriceDiv += m.value + '</div>';
        }
        count--;
    }
    container  = itemAddTagImgDiv;
    container += itemAddTagDiv;
    container += itemLinkDiv;
    container += itemPriceDiv;
    data.html = container;
    return data;
}
streamFactoryCopy.append.moreInfoBindButton = function($custButton) {
    var $buttons;
    if(custButton) { 
        buttons = $custButton
    } else {
        $buttons = $('.' + this.parent.streamContClass).find('.moreInfo');
    }
    $buttons.click(function() {
        //find its parent the find the button. more resistant to layout changes.
        var $moreInfo = $(this).closest('article').find('.blockMoreInfo');

        //button is depressed, and moreInfo yet to be hidden
        if($(this).hasClass('blockInteractActive') && $moreInfo.attr('data-shown') === 'yes') {
            //remove the class first.
            $(this).removeClass('blockInteractActive');
            $moreInfo.velocity('transition.slideUpOut', 200, function(el) {
                //now toggle to hide.
                $(el).attr('data-shown', 'no');
            });
        }

        //button is not depressed, and moreInfo not shown
        if(!$(this).hasClass('blockInteractActive') && $moreInfo.attr('data-shown') === 'no') {
            //add the class first.
            $(this).addClass('blockInteractActive');
            $moreInfo.velocity('transition.slideDownIn', 200, function(el) {
                //now toggle to hide.
                $(el).attr('data-shown', 'yes');
            });
        }

        //intermediate cases where button is depressed/undepressed, but animation is not complete.
        //will fall through.
        return false;
    });
}
streamFactoryCopy.append.moreInfoImg = function($stream, post, moreInfo) {
    if(!moreInfo.hasAddTag) { return false; }

    var $imgCont = $stream.find('.postItemAddTagImg');

    var ajaxGetImg = $.post(printHead.p.absPath + '/api/getimage', {username: moreInfo.addTag});
    ajaxGetImg.done(function(data) {
        if(!data.success) { return $imgCont.remove(); }
        //console.log(data.imgUUID)
        //console.log(VV.utils.imageGetter(data.imgUUID, "thumb"));
        var src = VV.utils.imageGetter(data.imgUUID, "thumb");
        var html;
        html  = '<a href="' + printHead.p.absPath + '/' + moreInfo.addTag + '">';
        html += '<img src="' + src + '"></a>';
        return $imgCont.append(html);
    });
    ajaxGetImg.fail(function() { return $imgCont.remove(); });
}