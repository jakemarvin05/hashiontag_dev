
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
    count: false,
    pinchZoom: false,
    imageType: "full"
}
streamFactory.getLayoutHTML = function() {
    $layout = $('.' + this.layoutClass);
    $layout.wrap('<div></div>');
    this.layoutHTML = $layout.parent('div').html();
    $layout.unwrap().remove();
}
streamFactory.noObj = function() {
    //console.log('streamFactory.noObj');
}
streamFactory.init = function(renderJSON, options) {
    if(!this.layoutHTML) { this.getLayoutHTML(); }
    if(!renderJSON) { return false; }
    var posts = renderJSON.posts || renderJSON.results;
    if(!posts) { return false; }

    this.uid = renderJSON.userId;

    if(options) {
        if(options.burst !== 'undefined') { this.burst = options.burst; }
        if(options.streamContClass) { this.streamContClass = options.streamContClass; }
        if(options.streamType) { this.streamType = options.streamType; }
        if(options.pinchZoom) { this.pinchZoom = true; }
        if(options.imageType) { this.imageType = options.imageType; }
    }

    //running streamFactory.init after instantiating the whole factory function
    //will set the "parent" pseudo property of .append back to the parent branch
    //this allows .append to access its parent.
    this.append.parent = this;

    this.posts = posts;
    var postCount = VV.utils.objCount(this.posts);
    this.postCount = postCount;

    this.$cont = $('.' + this.streamContClass);
    if(postCount < 1) { return this.noObj(); }
    this.buildBlocks(postCount);
}
streamFactory.buildBlocks = function(postCount) {
    //cache the burst count to the append method
    if(this.burst>0) { this.append.imageBurstCount = this.burst; }

    for(var i=0; i<postCount; i++) {

        var post = this.posts[i];
        var streamId = this.streamPrefix + post.postId;

        //make stream factory resistant to duplicates
        var $stream = $('#' + streamId);
        if($stream.length > 0) { continue; }

        //else create the block
        var newBlock = this.layoutHTML.replace('layoutId', streamId);
        this.$cont.append(newBlock);
        var $stream = $('#' + streamId);
        this.append.init($stream, i);

    }//for loop

    for(var i in this.append.callbacks) {
        this.append.callbacks[i].call(this.append);
    }

}

streamFactory.append = {}
streamFactory.append.callbacks = [];

streamFactory.append.init = function($stream, i) {
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
    var $desc = $stream.find('.description');
    $desc
        .html(post.descHTML)
        .attr('data-raw', encodeURIComponent(post.desc));


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
    //bind the button, push it to callback.
    if(i===0) { this.callbacks.push(this.commentBlockMoreButton) }

    //likes
    var likeText = this.parent.append.likeText(post);
    $stream.find('.blockLikeText' ).prepend(likeText);

    /* Settings button */
    this.settingsButton($stream, post);


    /* All POST META stuff comes under here */

    //convert the metas into .value chain
    var digestedPostMeta = this.digestPostMeta(post);
    //update the parent and re-reference post
    this.parent.posts[i].postMeta = digestedPostMeta;
    post = this.parent.posts[i];


    /* is instagram or startag? */
    this.blockVia($stream, post);


    //if there is nothing in postMeta, return
    if(!digestedPostMeta) { $stream.find('.moreInfo').hide(); return false; }


    /*
    * More info
    */

    var moreInfo = this.moreInfoBlock($stream, post);
    if(moreInfo) { 
        $stream.find('.blockMoreInfo').append(moreInfo.html);
        this.moreInfoImg($stream, post, moreInfo);
        this.moreInfoBindButton($stream.find('.moreInfo'));
    }

}

/* not enabled yet */
streamFactory.append.loadAnimate = function($stream) {
    var $blockImgH = $stream.find('.blockImgHolder');
    return $blockImgH.children('img').velocity({opacity: 0.6}, { duration: 400, delay: 300, loop: true });
}

streamFactory.append.profileThumb = function(user) {

    var theParent = this.parent;
    var pp = (user.profilePicture) ? VV.utils.imageGetter(user.profilePicture, "thumb") : theParent.errorImg;
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
    return $el.attr('data-uid', post.user.userId).attr('data-pid', post.postId);
}
streamFactory.append.effect = function($el, callback) {
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
    //not in use.
    return false;
    $stream.find('.blockImgHolder').append('<a class="fancybox" alt="' + img.alt + '" href="' + imgURL + '"></a>');
}
streamFactory.append.imageOnLoad = function($stream, img) {
    var $imgHolder = $stream.find('.imgLoaderHolder');
    var $blockHolder = $stream.find('.blockImgHolder');
    //get the container to hold the height cause we are gonna switch out.
    $blockHolder.css('height', $imgHolder.height() + 'px');
    $imgHolder.remove();
    $blockHolder.prepend(img);
    //reset the height attr.
    $blockHolder.css('height', 'auto');
    this.effect($(img));

    //pinchZooming
    if(this.parent.pinchZoom) { pinchZoom.init(img); }
}
streamFactory.append.image = function($stream, i, burst) {
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
        //IE10 support
        $(this).attr('data-imgid', post.imgUUID);

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
            this.className = 'postImage errorImg';
        }
        imgURL = VV.utils.imageGetter(post.imgUUID, this.parent.imageType);
        img.className = 'postImage ' + post.imgUUID;
        //IE10 no support for dataset
        //try { img.dataset.imgid = post.imgUUID; } catch(err) {}

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
                    if(k<show-1) {
                        //put commas after the first case, stop at last case.
                        likersDispHTML += ', ';
                    } else {
                        //for last case put "and"
                        likersDispHTML += ' and ';
                    } 
                } 
                likersDispHTML += '<a href="' + printHead.p.absPath + '/' + name + '">' + name +'</a>';
            }
            //if there are only 2 cases, replace the comma with 'and'.
            //mary and sally like this.
            if(loopRuns === 2) {
                likersDispHTML = likersDispHTML.replace(',', ' and');
            }
        }

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

        } else if(post.totalLikes === 1) {

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
streamFactory.append.commentBlock = function($stream, post) {
    //console.log('streamFactory.append.commentBlock');
    var comments = post.comments,
        commentCount = VV.utils.objCount(comments),
        showComments = 3;

    if(commentCount > 0) {
        if(commentCount > showComments) {
            var c = commentCount-showComments;
            $stream.find('.blockLoadMoreCommentsCount')
                .attr('data-count', c)
                .html(c)
                .addClass('commentsCountForPID' + post.postId);

            var $cont = $stream.find('.blockLoadMoreCommentsCont');
            var $but = $cont.find('.blockLoadMoreCommentsBut');
            $but.addClass('commentsButForPID' + post.postId);
            $cont.show();
            this.identifier($but, post)

            //set up the list
            this.commentList[post.postId] = [];
            /* TODO append only X number of comments to DOM, only append more when clicked */
            /* Suggestion: db request to get only X number. The rest via AJAX */
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
streamFactory.append.commentList = {}
streamFactory.append.commentBlockMoreButton = function($cont) {
    if(!$cont) {
        var contClass = this.parent.streamContClass;
        var $buts = $('.' + contClass).find('.blockLoadMoreCommentsBut');
    } else {
        var $buts = $cont.find('.blockLoadMoreCommentsBut');
    }

    var n = 2, //base
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
            var targets = theList.splice(0, spliceN);

            //show the targets
            for(var i in targets) { 
                var $target = $('body').find('div[data-cid="'+ targets[i] + '"]');
                $target.show(); 
            }

            //change the count number
            var count = targets.length;
            var currCount = parseFloat($count.attr('data-count'));
            var newCount = currCount - count;
            if(newCount === 0) { $('.commentsButForPID' + postId).velocity('fadeOut', 200); }

            //update data attrs
            $('.commentsCountForPID31').attr('data-count', newCount).html(newCount);
            $(this).attr('data-power', p+1);
        });
}
streamFactory.append.eachComment = function($stream, comment, toShow, postId, append) {
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

    var pp = (user.profilePicture) ? VV.utils.imageGetter(user.profilePicture, 'thumb') : printHead.p.img + '/noprofilepicture.jpg';

    var commentUserPP = '<a href="/' + user.userNameDisp + '"><img class="profileThumb" src="' + pp + '"></a>';

    var commentUser = '<a href="/' + user.userNameDisp + '">' + user.userNameDisp + '</a>';

    var html = '<div class="postCommentWrap"' + hide + ' data-cid="' + commentId + '">';
        html += commentUserPP;
        html += '<div class="postComment">' + commentUser;
        html += timestampAgo;
        html += '&nbsp;' + commentText + '</div></div>';

    if(append) {
        $stream.find('.postCommentCont').append(html);
    } else {
        $stream.find('.postCommentCont').prepend(html);
    }

    //push those hidden ones into the array list.
    if(!toShow) { this.commentList[postId].push(commentId); }

    var $comment = $stream.find('div[data-cid="' + commentId +'"]')

    return $comment;
}
streamFactory.append.settingsButton = function($stream, post) {

    var $settingsButtonsWrap = $stream.find('.blockInteractSettingsWrap');
    var $settingsButtons = $settingsButtonsWrap.find('.blockInteractSettingsOptions');

    if(post.User_userId !== printHead.userHeaders.userId) {
        $settingsButtonsWrap.find('.settingsDelete').remove();
        $settingsButtonsWrap.find('.settingsEdit').remove();
        $stream.find('.editDesc').remove();
        $stream.find('.editDescTextArea').remove();
    } else {
        $settingsButtonsWrap.find('.settingsMark').remove();
        $settingsButtonsWrap.find('.settingsDelete').attr('data-isprofile', post.isProfilePicture);
    }

    var $openPage = $settingsButtonsWrap.find('.settingsOpen');
    $openPage.wrapInner('<a href="/p/' + post.postId + '" target="_blank"></a>');

    this.identifier($settingsButtons, post);
    this.identifier($stream.find('.editDesc'), post);
}
streamFactory.append.digestPostMeta = function(post) {
    var metas = post.postMeta,
        len = metas.length;
    //meta is an Array. Check it for length
    if(len === 0) { return false; }
    var postMeta = {}
    for(var i=0; i<len; i++) {
        var meta = metas[i],
            key = meta.key,
            value = meta.value;

        postMeta[key] = value;
    }
    return postMeta;
}
streamFactory.append.moreInfoBlock = function($stream, post) { 
    /*
    <h2 class="itemName" itemprop="item"></h2>
    <h2 class="shopName" itemprop="shop"></h2>
    <h3 class="price" itemprop="price"></h3>
    */
    var meta = post.postMeta,
        hasMoreInfo = false;

    var itemAddTagDiv = '',
        itemLinkDiv = '',
        itemPriceDiv = '',
        itemAddTagImgDiv = '';

    var data = {}
    var container = '';

    if(meta.itemAddTag) {
        hasMoreInfo = true;
        data.hasAddTag = true;
        data.addTag = meta.itemAddTag.toLowerCase();

        //create a img div and just give it a class
        itemAddTagImgDiv = '<div class="postItemAddTagImg"></div>';

        //username
        itemAddTagDiv  = '<div class="postItemAddTag" itemprop="shop" data-attr="' + data.addTag + '">';
        itemAddTagDiv += '<a href="' + printHead.p.absPath + '/' + data.addTag + '">';
        itemAddTagDiv += '@' + meta.itemAddTag + '</a></div>';
    }
    if(meta.itemLink) {
        hasMoreInfo = true;
       
        var itemLink = meta.itemLink;
        var workingLink = '';
        var showLink = '';
        if(itemLink.indexOf('http') < 0 ) { 
            //suspect it starts with "www", so add // so make it work
            workingLink = '//' + itemLink;
        } else {
            workingLink = itemLink;
        }
        showLink = (itemLink.length > 25) ? itemLink.substring(0,25) + '...': itemLink;
        itemLinkDiv  = '<div class="postItemLink" data-attr="' + meta.itemLink + '">';
        itemLinkDiv += '<span class="glyphicon glyphicon-link"></span>';
        itemLinkDiv += '<a rel="nofollow" href="' + workingLink + '" target="_blank">' + showLink + '</a>';
        itemLinkDiv += '</div>'; 
    }
    if(meta.itemPrice) {
       
        hasMoreInfo = true;
        itemPriceDiv  = '<div class="postItemPrice" itemprop="price" data-attr="' + meta.itemPrice + '">';
        itemPriceDiv += '<span class="glyphicon glyphicon-usd"></span>';
        itemPriceDiv += meta.itemPrice + '</div>';
    }
    
    if(!hasMoreInfo) { $stream.find('.moreInfo').hide(); return false; }

    $stream.find('.moreInfo').show();
    data.html  = itemAddTagImgDiv;
    data.html += itemAddTagDiv;
    data.html += itemLinkDiv;
    data.html += itemPriceDiv;
    return data;
}
streamFactory.append.moreInfoBindButton = function($custButton) {
    var $buttons;
    if($custButton) { 
        $buttons = $custButton
    } else {
        $buttons = $('.' + this.parent.streamContClass).find('.moreInfo');
    }
    $buttons.on('click.vv', function() {
        VV.utils.hideSettingsTab();
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
streamFactory.append.moreInfoImg = function($stream, post, moreInfo) {
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
streamFactory.append.blockVia = function($stream, post) {
    var link = post.postMeta.isInstagram;
    if(link) {
        var append  = 'via <a href="' + link + '" target="_blank">';
            append += 'Instagram';
            append += '</a>'
        return $stream.find('.blockVia').append(append);
    }
    var startag = post.User_userId_attributed;
    var approved = post.isAttributionApproved;
    if(startag && approved) {

        var tags = JSON.parse(post.tags);

        var link = printHead.p.absPath + '/' + tags.star.unique[0];

        var append  = '<span class="glyphicon glyphicon-star"></span><a href="' + link + '">';
            append += tags.star.unique[0];
            append += '</a>';
        return $stream.find('.blockVia').append(append);
    }
}
