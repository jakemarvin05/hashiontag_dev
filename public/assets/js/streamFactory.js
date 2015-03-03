"use strict";
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
    imageType: "full",
    renderJSON: false
};
streamFactory.getLayoutHTML = function() {
    var selector = this.streamContClass + ' .' + this.layoutClass;
    if (this.streamContClass.indexOf('#') === 0) { var $layout = $(selector); }
    else { var $layout = $('.' + selector); }
    if ($layout.length > 0) {
        this.layoutHTML = $layout[0].outerHTML;
        $layout.remove();
    }
}
streamFactory.noObjMsg = false;
streamFactory.noObj = function() {
    if (!this.noObjMsg) { return; }
    if (this.noObjMsg === true) {
        var msg = 'No posts to show :(';
    } else {
        var msg = this.noObjMsg;
    }

    var html  = '<div class="' + this.layoutClass + '">';
        html += '<h2>' + msg + '</h2>';
        html += '</div>';

    this.$cont.append(html);
}
streamFactory.init = function(renderJSON, options) {
    /* callback and function call arrays */
    if (!this.append.hasOwnProperty('callbacks')) { this.append.callbacks = []; }
    if (!this.append.hasOwnProperty('custom')) { this.append.custom = []; }

    if (!this.layoutHTML) { this.getLayoutHTML(); }
    if (!renderJSON) { return false; }
    
    var posts = renderJSON.posts || renderJSON.results;
    if (!posts) { return false; }

    this.uid = renderJSON.userId || printHead.userHeaders.userId;

    if (options) {
        if (options.burst !== 'undefined') { this.burst = options.burst; }
        if (options.streamContClass) { this.streamContClass = options.streamContClass; }
        if (options.streamType) { this.streamType = options.streamType; }
        if (options.pinchZoom) { this.pinchZoom = true; }
        if (options.imageType) { this.imageType = options.imageType; }
    }

    //running streamFactory.init after instantiating the whole factory function
    //will set the "parent" pseudo property of .append back to the parent branch
    //this allows .append to access its parent.
    this.append.parent = this;

    this.posts = posts;
    this.renderJSON = renderJSON;
    var postCount = VV.utils.objCount(this.posts);
    this.postCount = postCount;

    //allow streamContClass to use id `#` selector
    if (this.streamContClass.indexOf('#') === 0 ) { this.$cont = $(this.streamContClass); }
    else { this.$cont = $('.' + this.streamContClass); }

    if(postCount < 1) { 
        this.noObj();
        return this.$cont;
    }
    this.buildBlocks(postCount);
    return this.$cont;
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

    /* is instagram or startag? */
    this.blockVia($stream, post);

    this.moreInfoBlock($stream, post);
    if(i===0) { this.callbacks.push(this.moreInfoButton) }

    /* Product-type post */
    if (post.isProduct) {
        try {
            if (Object.keys(post.dataProduct).length > 0) {
                this.productAbstract($stream, post);
            }
        } catch(err) { console.log(err); }
    }

    /* any other custom appending functions */
    for(var i = 0; i < this.custom.length; i++) {
        this.custom[i].call(this, $stream, post);
    }
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
        if (!this.hasOwnProperty('imageDeferredArray')) { this.imageDeferredArray = []; }
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
        theParent = this.parent,
        post = theParent.posts[i],
        burst = burst;

        //set it to transparent for fading.
        img.style.opacity = 0;
        img.style.display = "block"

    img.onload = (function(theParent, $stream, post) {
        return function() {

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

            theParent.append.imageOnLoad($stream, this);
        }
    })(theParent, $stream, post);

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

            for(var k=0;k<loopRuns;k++) {
                var name = likersDisp[k].user.userNameDisp;
                if(k>0) {
                    if(k<show-1) {
                        //put commas after the first case, stop at last case.
                        likersDispHTML += ', ';
                    } else {
                        //for last case put "+"
                        likersDispHTML += ' + ';
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
                andLikes  = ' + ';
                andLikes += '<span class="postLikesCount" data-likescount="' + offsetCount + '">';
                andLikes += offsetCount;
                andLikes += '</span>';

                if(offsetCount === 1 && post.totalLikes === 1) {
                    andLikes += ' like'; 
                } else {
                    andLikes += ' likes';   
                }
            } else {
                if(post.totalLikes > 0 ) {
                    if(post.totalLikes === 1) {
                        andLikes += ' like this.';
                    } else {
                        andLikes += ' likes this.';
                    }
                } 
            }
        } else if(post.totalLikes > 1) {
            // 2-99 people like this.
            var offsetCount = post.totalLikes;
            andLikes  = '<span class="postLikesCount" data-likescount="' + offsetCount + '">';
            andLikes += offsetCount;
            andLikes += '</span>';
            andLikes += ' likes';

        } else if(post.totalLikes === 1) {
            // 1 person likes this.
            var offsetCount = post.totalLikes;
            andLikes  = '<span class="postLikesCount" data-likescount="' + offsetCount + '">';
            andLikes += offsetCount;
            andLikes += '</span>';
            andLikes += ' like';
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

    var $buts = this.parent.$cont.find('.blockLoadMoreCommentsBut');

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
            $('.commentsCountForPID' + postId).attr('data-count', newCount).html(newCount);
            $(this).attr('data-power', p+1);
        });
}
streamFactory.append.eachComment = function($stream, comment, toShow, postId, append) {
    //console.log('streamFactory.append.eachComment');
    var hide = '',
        user = comment.user,
        commentText = VV.utils.htmlEntities(comment.comment);

    var commentId = 'commentId' + comment.commentId;

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

streamFactory.append.moreInfoBlock = function($stream, post) { 
    /*
    <h2 class="itemName" itemprop="item"></h2>
    <h2 class="shopName" itemprop="shop"></h2>
    <h3 class="price" itemprop="price"></h3>
    */
    var itemMeta = D.get(post, 'dataMeta.itemMeta');
    var productMeta = D.get(post, 'dataMeta.productMeta');
    var $cont = $stream.find('.blockMoreInfo');
    var $moreButton = $stream.find('.moreInfo');

    //if both undefined
    if (!itemMeta && !productMeta) { return false; }

    var itemMetaLength = false;
    var productMetaLength = false;

    //try to get the length
    try { itemMetaLength = itemMeta.length; } catch(err) {}
    try { productMetaLength = productMeta.length; } catch(err) {}

    //if both tries fails, or if both have nothing.
    if (!itemMetaLength && !productMetaLength) { return false; }
    if (itemMetaLength === 0 && productMetaLength === 0) { return false; }

    var template = $cont.html();
    $cont.html('');

    for(var i in productMeta) {
        var meta = productMeta[i];
        var $newBlock = $(template);
        _abstract($newBlock, meta, 'product');
        $cont.append($newBlock.clone());
    }

    for(var i in itemMeta) {
        var meta = itemMeta[i];
        var $newBlock = $(template);
        _abstract($newBlock, meta, 'item');
        $cont.append($newBlock.clone());
    }

    function _abstract($template, meta, type) {

        if (type === 'item') {
            //profilePicture
            if (meta.profilePicture) {
                _picture($template, meta.profilePicture);
            }

            //name (is compulsory)
            var $nameAndAnchor = _nameHTML($template, meta, type);

            //userName 
            if (meta.userName) {
                _userNameHTML($template, meta);
            } else {
                //if there is no userName, append the link.
                var $showLink = $nameAndAnchor[1].clone();
                $showLink.html($showLink.attr('data-showlink'));
                $template.find('.postItemUserNameSpan').html($showLink);
            }

            //price
            if (meta.price) {
                _priceHTML($template, meta.price, type);
            }
        } else if (type === 'product') {
            _picture($template, meta.imgUUID); //picture
            var $nameAndAnchor = _nameHTML($template, meta, type); //name 
            $template.find('.postItemImg a').attr('href', $nameAndAnchor[1].attr('href'));
            _userNameHTML($template, meta.merchant); //userName 
            _priceHTML($template, meta.price, type); //price
        }
        return $template;
    }

    function _picture($template, imgUUID) {
        var uniqueClass = 'proditem' + imgUUID;
        $template.find('.postItemImg').addClass(uniqueClass);
        var img = new Image();
        img.onload = (function() {
            return function() {
                var $targetConts = $('.' + uniqueClass);
                $targetConts.find('img').attr('src', img.src)
                $targetConts.show();
            }
        })(uniqueClass, img);
        img.src = VV.utils.imageGetter(imgUUID, 'thumb');
    }

    function _nameHTML($template, meta, type) {
        if (!meta.name) { return false; }
        var $nameDiv = $template.find('.postItemName');
        $nameDiv.html(meta.name);
        var $anchor = _linkHTML($template, meta, type);
        if ($anchor) { $nameDiv.wrapInner($anchor); }
        return [ $nameDiv, $anchor ];
    }

    function _linkHTML($template, meta, type) {
        var anchor = document.createElement('a');
        if (type === 'item') {
            if (!meta.link) { return false; }
            var itemLink = meta.link;
            var workingLink = '';
            var showLink = '';
            if (itemLink.indexOf('http') < 0 ) { 
                //suspect it starts with "www", so add // so make it work
                workingLink = '//' + itemLink;
            } else {
                workingLink = itemLink;
            }
            var parsed = VV.utils.parseUri(itemLink)
            showLink = (parsed.host.length > 10) ? parsed.host.substring(0,10) + '...' : parsed.host;
            //no follow
            anchor.rel = 'nofollow';
        } else if (type === 'product') {
            var workingLink = printHead.p.absPath + '/p/' + meta.postId;
        }
        anchor.href = workingLink;
        anchor.target = '_blank';
        //transform to jQuery object before adding 'data'. IE8 support
        var $anchor = $(anchor);
        if (showLink) { $anchor.attr('data-showlink', showLink); }

        //link up the 2 buttons
        var $postGoto = $template.find('.postGoTo'),
            $postBuy = $template.find('.postBuy');

        if (type === 'product') {
            $postGoto.remove();
            $postBuy.wrapInner($anchor).show();
        } else if (type === 'item') {
            $postBuy.remove();
            $postGoto.wrapInner($anchor).show();
        }

        return $anchor;
    }
    function _userNameHTML($template, meta, type) {
        var userName = meta.userName;
        if (!userName) { return false; }

        //update the hidden itemprop brand
        var name;
        if (type === 'product') { name = meta.name; }
        else if (type === 'item') { name = userName; }
        if (name) { $template.find('.postProductBrand').html(name) }

        var $userName = $template.find('.postItemUserNameDiv');
        var html  = '<a href="' + printHead.p.absPath + '/' + userName + '">';
            html += '@' + userName + '</a></div>';

        $userName.html(html);
        return $userName;
    }
    function _priceHTML($template, price, type) {
        if (type === 'item') {
            var signs = ['$','¥','£','€', '฿'], hasSign = false;
            for(var i in signs) { 
                if (price.indexOf(signs[i]) > -1) hasSign = true; break;
            }
            price = '$' + price;
        }
        return $template.find('.postPrice').html(price);
    }
    $moreButton.show();
}
streamFactory.append.moreInfoButton = function() {
    VV.extend('buttonTasks', {
        moreInfo: function($el, e) {
            VV.utils.hideSettingsTab();
            //find its parent the find the button. more resistant to layout changes.
            var $moreInfo = $el.closest('article').find('.blockMoreInfo');

            //button is depressed, and moreInfo yet to be hidden
            if($el.hasClass('blockInteractActive') && $moreInfo.attr('data-shown') === 'yes') {
                //remove the class first.
                $el.removeClass('blockInteractActive');
                $moreInfo.velocity('transition.slideUpOut', 200, function(el) {
                    //now toggle to hide.
                    $moreInfo.attr('data-shown', 'no');
                });
            }

            //button is not depressed, and moreInfo not shown
            if(!$el.hasClass('blockInteractActive') && $moreInfo.attr('data-shown') === 'no') {
                //add the class first.
                $el.addClass('blockInteractActive');
                $moreInfo.velocity('transition.slideDownIn', 200, function(el) {
                    //now toggle to hide.
                    $moreInfo.attr('data-shown', 'yes');
                });
            }
            //intermediate cases where button is depressed/undepressed, but animation is not complete.
            //will fall through.
            return false;
        }
    });
};
streamFactory.append.blockVia = function($stream, post) {
    var link = D.get(post, 'dataMeta.isInstagram');
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

/* Product appends */
streamFactory.append.productAbstract = function($stream, post) {
    var self = this;
    var viewer = printHead.userHeaders.userId;
    var postOwner = post.User_userId;
    var showInfo = true;
    if (viewer !== postOwner) {
        if (post.user.shopStatus !== 'active') {
            showInfo = false;
            $stream
                .find('.blockProductInfo')
                .append('<h1 class="productInfoHeading" style="color: #ef4549;"><i>Seller do not have complete shipping or purchase settings.</i></h1>');
        }
    } else {
        if (post.user.shopStatus !== 'active') {
            $stream
                .find('.blockProductInfo')
                .append('<h1 class="productInfoHeading" style="color: #ef4549;"><i>Your shop settings are incomplete. User will not be able to add item to cart.</i></h1>');
        }
    }

    if (showInfo) {
        this.productInfoShipping($stream, post);
        this.productInfoSize($stream, post);
    }
    this.productImageThumbs($stream, post);
    this.productName($stream, post);
    this.productPrice($stream, post);
    this.productLikes($stream, post);
    $stream.find('.blockProductInfo').show();
};
streamFactory.append.productName = function($stream, post) {
    var $nameFull = $stream.find('.blockProductNameFull');
    var $name = $stream.find('.blockProductName');
    var data = post.dataProduct;
    if (data.name) {
        $nameFull.html(data.name);
        var trimmed = VV.utils.trim(data.name, 23, { trimLastWord: false});
        $name.html(trimmed);
    } else {
        var str = 'No Product Name';
        $nameFull.html('No Product Name');
        $name.html('No Product Name');
    }
};

streamFactory.append.productPrice = function($stream, post) {
    var $price = $stream.find('.spanPrice');
    var currency = D.get(this.parent.renderJSON, 'dataShop.currency') || D.get(post, 'user.dataMeta.dataShop.currency');
    var currHTML = '<span class="priceUpperCase">' + currency + '</span>'; //get currency from user details;
    $price.html(currHTML + ' ' + post.dataProduct.price);
};
streamFactory.append.productLikes = function($stream, post) {
    var $productLikes = $stream.find('.spanLikes'),
        $likesCount = $productLikes.find('.spanLikesCount');

    var like = 'like';

    if (typeof post.totalLikes === "undefined" || post.totalLikes < 1) { 
        $productLikes.hide(); 
        $likesCount.html('0 ' + like);
        $likesCount.attr('data-count', 0);
    } else {
        if (post.totalLikes > 1) { like += 's'; }
        $likesCount.html(post.totalLikes + ' ' + like);
        $likesCount.attr('data-count', post.totalLikes);
    }

};

streamFactory.append.productInfoShipping = function($stream, post) {
    var self = this;
    var currency = D.get(self.parent.renderJSON, 'dataShop.currency') || D.get(post, 'user.dataMeta.dataShop.currency');
    var currencyHTML = '<span style="text-transform: uppercase">' + currency + '</span>';

    var $info = $stream.find('.blockProductInfo');
    var html = '';

    html += '<h1 class="productInfoHeading">Delivery Info ';

    if (D.get(post, 'dataProduct.shipping.shippingType') === "light") {
        var shippingMeta = D.get(self.parent, 'renderJSON.dataShop.shipping') || D.get(post, 'user.dataMeta.dataShop.shipping');
        if (!shippingMeta || shippingMeta === 'undefined') return;


        html += '(up to ' + D.get(shippingMeta, 'stepQty') + ' items/order):</h1>';

        var shipping = D.get(shippingMeta, 'light');
        var shippingDay = shipping;

        var keys = this.productTryGetKeys(shipping);
        if (!keys) { return false; }

        for(var i in keys) {
            var key = keys[i],
               cost = D.get(shipping, key + '.cost'),
               day = D.get(shippingDay, key + '.day');

            if (cost && day) {
               html += _formatHTML({key: key, cost: cost, day: day});
            }
        }

    } else {
        //HEAVY SHIPPING
        html += '(PER ITEM):</h1>';

        var shipping = D.get(post, 'dataProduct.shipping.list');
        //estimated number of shipping days is in dataShop shipping details.
        //gotcha: although it is accessing .light, its the same for heavy.
        var shippingDay = D.get(self.parent, 'renderJSON.dataShop.shipping.light') || D.get(post, 'user.dataMeta.dataShop.shipping.light');

        var keys = this.productTryGetKeys(shipping);
        if (!keys) { return false; }

        for(var i in keys) {
            var key = keys[i],
                cost = D.get(shipping, key),
                day = D.get(shippingDay, key + '.day');

            if (cost && day) {
                html += _formatHTML({key: key, cost: cost, day: day});
            }
        }
    }

    $info.append(html);


    /* ===== private functions */
    function _regionName(code) {
        if (!code) { return ''; }

        var name = VV.g.regionNames;

        if (name[code]) {
            return name[code];
        }
        return code;
    }

    function _formatHTML(values) {
        if (!values) { return values; }
        var key = values.key,
            cost = values.cost,
            day = values.day,
            _html = '';

        _html += '<p class="productInfoDelivery">';
        _html += '<span class="productInfoDeliveryRegion">' + _regionName(key) + "</span>";
        _html += '<span class="productInfoDeliveryCost" data-value="' + cost + '" data-currency="' + currency + '">' + currencyHTML + cost + "</span> &nbsp;";
        _html += '<span class="productInfoDeliveryDay" data-value="' + day + '">(ships in ' + day + " days)</span>";
        _html += '</p>';

        return _html;
    }

};

streamFactory.append.productInfoSize = function($stream, post) {
    var size = D.get(post, 'dataProduct.size');
    //console.log(size);
    if (!size) { return false; }
    var $info = $stream.find('.blockProductInfo');
    var html = '';

    if (D.get(size, 'sizeType') === "hassize") {

        var keys = this.productTryGetKeys(size.sizes);
        if (!keys) { return false; }

        var productHasStock = false; //product flag to toggle removal of add to cart.
        for(var i in keys) {
            var sizeKey = keys[i],
                stock = size.sizes[sizeKey];
                

            if (stock === 'hasStock') {
                stock = 'In stock';
                productHasStock = true;

                _populateSelect($stream, sizeKey);

            } else {
                stock = '<span style="color: #ef4549;">Out of stock</span>';
            }

            html += '<p class="productInfoSS">';
            html += '<span class="productInfoSSSize">' + sizeKey + '</span>';
            html += ' - <span class="productInfoSSStock"><em>' + stock + '</em></span>';
            html += '</p>';
        }

    } else {
        html += 'This item is a freesize';

        //stock
        var stock = D.get(size, 'nosizeQty');
        if (stock === "hasStock") {
            stock = 'In stock';
            productHasStock = true;

            //remove the select since there is no size selection.
            $stream.find('.articlePurchaseSize').remove();
        } else {
            stock = '<span style="color: #ef4549;">Out of stock</span>';
        }
        html += '<br />';
        html += 'Status: ';
        html += '<em>' + stock + '</em>';
        html = '<p class="productInfoSS">' + html + '</p>';

    }
    html = '<h1 class="productInfoHeading">Size and Stock Info:</h1>' + html;
    $info.append(html);

    //remove the purchase options if product has no stock at all.
    if (!productHasStock) {
        $stream.find('.articlePurchaseOptions').remove();
    } else {
        $stream.find('.articlePurchaseOptions').show();
        this.productAddToCart($stream, post);
    }

    /* ===== private functions */
    function _populateSelect($stream, size) {
        var $select = $stream.find('.articlePurchaseSize');
        $select.append('<option value="' + size + '">' + size + '</option>');
    }

};

streamFactory.append.productAddToCart = function($stream, post) {
    this.identifier($stream.find('.articleAddToCart'), post);
};
streamFactory.append.productTryGetKeys = function(keys) {
    try {
        var keys = Object.keys(keys);
        return keys;
    } catch(err) {
        console.log(err);
        return false;
    }
};
streamFactory.append.productImageThumbs = function($stream, post) {
    var $holder = $stream.find('.blockThumbHolder');
    var thumbs = D.get(post, 'dataProduct.images');
    if (!thumbs) { return false; }
    if (thumbs.length === 0) { return false; }
    //push the main picture into the thumbs array.
    thumbs.push(post.imgUUID);
    $holder.attr('data-thumbs', JSON.stringify(thumbs)); //instead of .data() because of DOM copying
    for(var i in thumbs) {
        $holder.append('<div class="productThumbs"><img src="' + printHead.f.imgLoaderHolder + '"></div>');
    }
};
streamFactory.append.imageThumbsLoad = function($article) {
    try {
        var imgsArr = JSON.parse($article.find('.blockThumbHolder').attr('data-thumbs'));
    } catch(err) { return false; }
    if (!imgsArr) { return false; }
    if (imgsArr < 2) { return false; } //if less than 2 means there is no need for thumbs.
    var $thumbBrackets = $article.find('.productThumbs');
    for(var i in imgsArr) {
        var imgUUID = imgsArr[i];
        var el_bracket = $thumbBrackets[i];
        var img = new Image();
        img.style['opacity'] = 0;
        img.style['zIndex'] = 10;
        img.onload = (function(img, el_bracket) {
            return function() {
                var $b = $(el_bracket),
                    h = $b.height(),
                    w = $b.width(),
                    $holder = $b.find('img');

                //hold the container size;
                $b.css('height', h + 'px').css('width', w + 'px');
                $holder.css({'position': 'absolute', 'z-index': '9', 'left': '0px', 'top': '0px'});

                $b.prepend(img);
                $(img)
                    .attr('data-task', 'productThumbnail')
                    .velocity('fadeIn', {
                        duration: 200,
                        display: 'block',
                        complete: function() {
                            $holder.remove();
                            $b.css('height', '').css('width', '');
                        }
                    });
            }
        })(img, el_bracket);
        img.src = VV.utils.imageGetter(imgUUID);
    }
};
