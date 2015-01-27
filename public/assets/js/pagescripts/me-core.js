
/* POST FACTORY */

var profilePostFactory = Object.create(streamFactory);
profilePostFactory.append = Object.create(streamFactory.append);

profilePostFactory.streamContClass = '#postsBlock';
profilePostFactory.noObjMsg = true;

profilePostFactory.append.identifier = function($el, post) {
    return $el.attr('data-uid', post.User_userId).attr('data-pid', post.postId);
}

profilePostFactory.append.effect = function($el) {
    return $el.velocity('fadeIn', {
        duration: 300,
        display: 'block'
    });
}

profilePostFactory.append.imageLink = function($stream, img) {
    var id = $stream.attr('id');
    var pid = $stream.attr('data-pid');
    var strId = '#' + id;
    var self = this;
    img.onclick = function() {

        //get the stream's html and put it into the "fancybox cont"
        $('#fancyboxCont article')
            .html($(strId).html())
            .attr('data-articleid', id);

        //load high quality
        VV.utils.loadImageAndNeighbours($(img));

        //iOS FancyBox bug. may displace the background.
        //store the scrollTop and restore scroll position
        //later.
        VVGLOBAL.scrollTop = $(window).scrollTop();

        if(!$.fancybox.isOpen) {
            //then make fancybox open it.
            $.fancybox.open([{
                href : '#fancyboxCont',
                title : ''
            }], {
                padding : 10,
                enableNav: true,
                maxWidth: 640,
                afterClose: function() {
                    $('html').velocity("scroll", { duration: 500, offset: VVGLOBAL.scrollTop })  ;
                    try { 
                        window.history.pushState(null, null, window.location.href.substring(0, window.location.href.lastIndexOf('?')));
                    } catch(err) {}
                }
            });
        }


        try { 
            window.history.pushState(null, null, window.location.href.substring(0, window.location.href.lastIndexOf('?')) + '?show=' + pid);
        } catch(err) {}

        //bind back all the buttons
        //comment, like, settings
        buttonsInitStack();

        //load more button
        self.commentBlockMoreButton($('#fancyboxCont article'));
        //moreInfo
        $('#fancyboxCont .blockMoreInfoTop').remove();
        self.__proto__.moreInfoBindButton($('#fancyboxCont .moreInfo'));

        var el = $('.fancyArticle .blockImgHolder')[0];

        var hammer = new Hammer(el);
        hammer.get('pan').set({ threshold: 150 });
        hammer.on('panleft', function() {
            $.fancybox.next();
        });
        hammer.on('panright', function() {
            $.fancybox.prev();
        });
    }

}
profilePostFactory.append.imageOnLoad = function($stream, img) {
    var $imgHolder = $stream.find('.imgLoaderHolder');
    var $blockHolder = $stream.find('.blockImgHolder');
    //get the container to hold the height cause we are gonna switch out.
    $blockHolder.css('height', $imgHolder.height() + 'px');
    $imgHolder.remove();
    $blockHolder.prepend(img);
    //reset the height attr.
    $blockHolder.css('height', 'auto');
    this.effect($(img));
}
profilePostFactory.append.moreInfoBindButton = function($custBut) {
    var $buttons = this.parent.$cont.find('.moreInfo');
    if($custBut) { $buttons = $custBut; }
    $buttons.click(function() {
        //find its parent the find the button. more resistant to layout changes.
        var $moreInfo = $(this).closest('article').find('.blockMoreInfoTop');

        //button is depressed, and moreInfo yet to be hidden
        if($(this).hasClass('blockInteractActive') && $moreInfo.attr('data-shown') === 'yes') {
            //remove the class first.
            $(this).removeClass('blockInteractActive');
            $moreInfo.velocity({opacity:0}, 200, function(el) {
                //now toggle to hide.
                $(el).css('display', 'none').attr('data-shown', 'no');

            });
        }

        //button is not depressed, and moreInfo not shown
        if(!$(this).hasClass('blockInteractActive') && $moreInfo.attr('data-shown') === 'no') {
            //add the class first.
            $(this).addClass('blockInteractActive');
            $moreInfo
                .css('display', 'block')
                .velocity({opacity:0.9}, 200, function(el) {
                    //now toggle to hide.
                    $(el).attr('data-shown', 'yes');
                });
        }

        //intermediate cases where button is depressed/undepressed, but animation is not complete.
        //will fall through.
        return false;
    });
}
profilePostFactory.append.settingsButton = function($stream, post) {

    var $settingsButtonsWrap = $stream.find('.blockInteractSettingsWrap');
    var $settingsButtons = $settingsButtonsWrap.find('.blockInteractSettingsOptions');


    if(post.User_userId !== printHead.userHeaders.userId) {
        //not the owner

        //check if user has been attributed
        if(post.User_userId_attributed === printHead.userHeaders.userId) {

            //attributed posts can't be edited
            $settingsButtonsWrap.find('.settingsEdit').remove();
            $stream.find('.editDesc').remove();
            $stream.find('.editDescTextArea').remove();
            $settingsButtonsWrap.find('.settingsMark').remove();

        } else {
            //not the owner and post not attributed. disallow all functions less marking.
            $settingsButtonsWrap.find('.settingsDelete').remove();
            $settingsButtonsWrap.find('.settingsEdit').remove();
            $stream.find('.editDesc').remove();
            $stream.find('.editDescTextArea').remove();      
        }
  


    } else {
        //is own post.

        //but if viewing it in other's account, don't allow authoring
        if(this.parent.uid !== printHead.userHeaders.userId) {
            $settingsButtonsWrap.find('.settingsDelete').remove();
            $settingsButtonsWrap.find('.settingsEdit').remove();
            $stream.find('.editDesc').remove();
            $stream.find('.editDescTextArea').remove();    
        } else {

            //viewing post in your own page. allow authoring.
            $settingsButtonsWrap.find('.settingsMark').remove();
            $settingsButtonsWrap.find('.settingsDelete').attr('data-isprofile', post.isProfilePicture);
        }

    }
    
    var $openPage = $settingsButtonsWrap.find('.settingsOpen');
    $openPage.wrapInner('<a href="/p/' + post.postId + '" target="_blank"></a>');

    this.identifier($settingsButtons, post);
    this.identifier($stream.find('.editDesc'), post);
}

profilePostFactory.init(renderJSON, {
    burst: 0, 
    imageType: 'half'
});


/* SHOPFACTORY */
/* extend the profilePostFactory for shopPost use */
var shopPostFactory = Object.create(profilePostFactory);
shopPostFactory.append = Object.create(profilePostFactory.append);
shopPostFactory.streamContClass = "shopBlockCont";
shopPostFactory.layoutClass = "streamLayout";
shopPostFactory.streamPrefix = "productStream_";
//clear the layout inherited from profilePost
shopPostFactory.layoutHTML = '';

shopPostFactory.noObj = function() {
    var html  = '<div class="' + this.layoutClass + '">';
        html += '<h2>No products to show :(</h2>';
        html += '<h3>Upload to start selling!</h3>';
        html += '</div>';

    this.$cont.append(html);
}
shopPostFactory.init();

//setting up search vectors
shopPostFactory.append.vector = function($stream, post) {
    var vector  = post.dataProduct.name;
    $.each((JSON.parse(post.tags)).hash, function(i, el) {
        vector += ' ' + el;
    });
    $stream.prepend('<div class="vector" style="display:none;">' + vector + '</div>');
};
shopPostFactory.append.custom.push(shopPostFactory.append.vector);

var shopPostList = function() {
    initList('shopBlock', {
        valueNames: [ 'vector' ],
        listClass: 'shopBlockCont'
    });
}
shopPostFactory.append.callbacks.push(shopPostList);

shopPostFactory.append.productName = function($stream, post) {
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
shopPostFactory.append.custom.push(shopPostFactory.append.productName);

shopPostFactory.append.productPrice = function($stream, post) {
    var $price = $stream.find('.spanPrice');
    var curr = '<span class="priceUpperCase">' + this.parent.renderJSON.dataShop.currency + '</span>'; //get currency from user details;
    $price.html(curr + ' ' + post.dataProduct.price);
};
shopPostFactory.append.custom.push(shopPostFactory.append.productPrice);

shopPostFactory.append.productLikes = function($stream, post) {
    var $productLikes = $stream.find('.spanLikes'),
        $likesCount = $productLikes.find('.spanLikesCount');

    var like = 'like';

    if (post.totalLikes < 1) { 
        $productLikes.hide(); 
        $likesCount.html('0 ' + like);
        $likesCount.attr('data-count', 0);
    } else {
        if (post.totalLikes > 1) { like += 's'; }
        $likesCount.html(post.totalLikes + ' ' + like);
        $likesCount.attr('data-count', post.totalLikes);
    }

};
shopPostFactory.append.custom.push(shopPostFactory.append.productLikes);


/* Follow Button */
var followButton = {
    main: function($el) {

        var targetUserId = $el.attr('data-uid'),
            action = $el.attr('data-action'),
            $followButton = $el,
            $followersCount = $('#profileFollowersCount'),
            followersCount = parseFloat($followersCount.html()),
            followText = $followButton.attr('data-follow'); //this is to capture the "follow back" if it exist.

        //disallow action if user is trying to follow her/himself:
        if(printHead.userHeaders.userId === parseFloat(targetUserId)) { return false; }

        //disable the button
        $followButton.attr('disabled','disabled');
        setTimeout(function() {
            $followButton.removeAttr('disabled');
        }, 1000);

        //change the state
        function changeState() {
            if(action === 'follow') {
                $followButton.velocity('callout.pulse', 200);
                $followButton.attr('data-action','unfollow');
                $followButton.html('unfollow');
                $followersCount.html(followersCount+1);
            } else {
                $followButton.attr('data-action','follow');
                $followersCount.html(followersCount-1);
                if(followText) {
                    $followButton.html(followText);
                } else {
                    $followButton.html('follow');
                }
            }
        }
        changeState();


        // Send the data using post
        var posting = $.post( "{p.absPath}/api/follow", { 
            userId: targetUserId, 
            action: action 
        });
        
        //done
        posting.done(function(data) {
            if(data.success) {
                console.log('success');
            } else {
                console.log('error');
                changeState();
                alertFactory.protoAlert('Please either login or check your internet connection.');
            }
        });

        //fail
        posting.fail(function() {
            changeState();
            alertFactory.protoAlert('Please either login or check your internet connection.');
        });
    },
    init: function($el) {
        var self = this;
        $el.click(function(e) {
            e.preventDefault();
            return self.main($el);
        });
    }
};
followButton.init($('#profileFollowButton'));


/* Loaded */
var loader = Object.create(VV.utils.loaderEffect);
loader.init($('.loading'));

/* Page toggle */
var followBlockToggle = {
    isAnimating: false,
    $buttons: [],
    blocks: [],
    activeClass: 'followBlockActive',
    buttonClass: '',
    action: {},
    init: function(buttonClass) {
        this.buttonClass = buttonClass;
        this.$buttons = $('.' + buttonClass);

        var self = this;
        this.$buttons.each(function(i, el) {
            var bindTo = $(this).attr('data-bindto');
            self.blocks.push($('#' + bindTo));
        });

        return this.bindings();
    },
    bindings: function() {
        var self = this;

        this.$buttons.click(function() {

            var $t = $(this);

            //action hook
            var action = $t.attr('data-action');
            if ($t.attr('data-action')) {
                var actionHook = self.action[action]; 
                if (actionHook) { actionHook.call(self.action, $t); }
            }

            if ($t.hasClass(self.activeClass)) { return false; }

            //for those fastest fingers first, stop every damn thing and then slide.
            if (self.isAnimating === true) {
                $.each(self.blocks, function(i, el) {
                    $(this).velocity('stop');
                });
                self.$buttons.removeClass(self.activeClass);
            }

            self.isAnimating = true;

            //find who is the current active block.
            var $currentActive = $('.' + self.buttonClass + '.' + self.activeClass);

            //get the slide directions. [0] is for the outgoing block. [1] is for the incoming.
            var slideDirection = self.slideDirection($currentActive, $t);

            self.animateAbstract($currentActive, $t, slideDirection);

        });
    },
    slideDirection: function($current, $clicked) {

        //if there isn't any just assume index 0.
        if ($current) { 
            var currentIndex = $current.index('.' + this.buttonClass); 
            if (currentIndex < 0) {
                currentIndex = 0;
            }
        } else { 
            var currentIndex = 0; 
        }

        //compare index to determine slide motion
        var thisIndex = $clicked.index('.' + this.buttonClass);
        var currentDisplaySlide, newDisplaySlide;
        if (thisIndex > currentIndex) {
            //this means the button is on the right of current active one.
            //so slide the current display 'left' Out
            currentDisplaySlide = 'Left';

            //slide the new display from 'right' In
            newDisplaySlide = 'Right';
        } else {
            currentDisplaySlide = 'Right';
            newDisplaySlide = 'Left';
        }

        return [currentDisplaySlide, newDisplaySlide];
    },
    animateAbstract: function($current, $clicked, slideDirection) {

        var bindTo = $clicked.attr('data-bindto');
        var $clickedContentBlock = this.blocks[$clicked.index('.' + this.buttonClass)];
        var self = this;

        //if $current is undefined
        if (!$current || $current.length === 0) {
            this.toggleClasses(false, $clicked);

            //grab whichever block that is in display and slide it.
            $.each(self.blocks, function(i, el) {
                if ($(this).css('display') !== "none") { 
                    self.animate($(this), $clickedContentBlock, slideDirection);
                }
            });
            return true;
        }

        this.toggleClasses($current, $clicked);

        //if current is defined
        var $currentContentBlock = this.blocks[$current.index('.' + this.buttonClass)];

        return this.animate($currentContentBlock, $clickedContentBlock, slideDirection);

    },
    animate: function($out, $in, slideDirection, callback) {
        var outDir = slideDirection[0];
        var inDir = slideDirection[1];
        var self = this;

        $out.velocity('transition.slide' + outDir + 'Out', 100, function() {
            $in.velocity('transition.slide' + inDir + 'In', 100, function() {

                self.isAnimating = false;

                if (typeof callback === "function") {
                    return callback();
                }
            });
        });
    },
    toggleClasses: function($outButton, $inButton) {
        if ($outButton) { $outButton.removeClass(this.activeClass); }
        $inButton.addClass(this.activeClass);
    }
};

followBlockToggle.init('profileFollowBlockClickable');

/* define the pre-hook actions */
followBlockToggle.action.findFollowers = function($el, who) {
    var hasTriggered = $el.attr('data-triggered');
    if (!hasTriggered) {
        $el.attr('data-triggered', true); 
        //has not been triggered, make the ajax call.
        loader.run();
        if (!who) { followAjax("followers"); }
        else { followAjax(who); }
    } 
};
followBlockToggle.action.findFollowings = function($el) {
    return this.findFollowers($el, "followings");
};
followBlockToggle.action.shop = function($el) {
    var hasTriggered = $el.attr('data-triggered');
    if (!hasTriggered) {
        $el.attr('data-triggered', true); 
        loader.run();
        followAjax('shop');
    }
};

function initList(listId, opts) {
    if (!opts) {
        var opts = { 
            valueNames: [ 'vector' ] 
        };
    }
    var userList = new List(listId, opts);
}
function followAjax(type) {
    if (type === "followers" || type === "followings") { 
        var url = P.absPath + '/api/' + type;
    }
    if (type === "shop") {
        var url = P.absPath + '/api/getstream/productstream'; 
    }
    var ajaxFollowers = $.post(url, {userId: renderJSON.userId});

    ajaxFollowers.done(function(data) {
        console.log(data);
        loader.kill();
        if(!data.success) {
            alertFactory.protoAlert('Please either login or check your internet connection.');
        }

        if (type === "shop") { return [ shopPostFactory.init(data), buttonsInitStack() ] }

        if(type === "followers") { 
            var divId = '#followerList';
            userFactory.streamContClass = divId + " .mainColBlock";
        }
        if(type === "followings") { 
            var divId = '#followingList';
            userFactory.streamContClass =  divId + " .mainColBlock";
        }

        userFactory.streamPrefix = type + '_';
        userFactory.layoutHTML = false;
        userFactory.init(data, {streamType: "user"});
        initList(divId.substring(1));

    });

    ajaxFollowers.fail(function(err) {
        console.log(err);
        loader.kill();
        alertFactory.protoAlert('Please either login or check your internet connection.');
    });
}

/* Auto open */
$(window).load(function() {
    var qs = VV.utils.QueryString()
    if(qs.show) {
        var postId = qs.show;
        $('article[data-pid="' + postId + '"]').find('.postImage').click();
    }
});
window.onpopstate = function(e){

    //TODO: Not ideal implementation of back/foward button.
    var qs = VV.utils.QueryString()
    if(qs.show) {
        var postId = qs.show;
        $('article[data-pid="' + postId + '"]').find('.postImage').click();
    } else { 
        $.fancybox.close();
    }

};