
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
        var $fancyArticle = $('#fancyboxCont article');
        $fancyArticle
            .html($(strId).html())
            .attr('data-articleid', id);

        //imageLinkHooks to toggle on/off .productArticle
        if (self.imageLinkHooks) {
            self.imageLinkHooks($fancyArticle);
        }

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
profilePostFactory.append.imageLinkHooks = function($article) {
    $article.removeClass('productArticle');
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

shopPostFactory.append.productInfo = function($stream, post) {

    this.productInfoShipping.call(this, $stream, post);
    this.productInfoSize.call(this, $stream, post);

};
shopPostFactory.append.custom.push(shopPostFactory.append.productInfo);

shopPostFactory.append.productInfoShipping = function($stream, post) {

    var self = this;
    var currency = D.get(self.parent.renderJSON, 'dataShop.currency');
    var currencyHTML = '<span style="text-transform: uppercase">' + currency + '</span>';

    if (!D.get(self.parent.renderJSON, 'dataShop.isShippingDataComplete')) { return false; }

    var $info = $stream.find('.blockProductInfo');
    var html = '';

    html += '<h1 class="productInfoHeading">Delivery Info ';

    if (D.get(post, 'dataProduct.shipping.shippingType') === "light") {

        html += '(up to ' + D.get(self.parent, 'renderJSON.dataShop.shipping.stepQty') + ' items/order):</h1>';

        var shipping = D.get(self.parent, 'renderJSON.dataShop.shipping.light');
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
        var shippingDay = D.get(self.parent, 'renderJSON.dataShop.shipping.light');

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

shopPostFactory.append.productInfoSize = function($stream, post) {
    var size = D.get(post, 'dataProduct.size');
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

            if (stock === "hasStock") {
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
        var stock = D.get(size, 'noSizeQty');
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
        this.productAddToCart($stream, post);
    }

    /* ===== private functions */
    function _populateSelect($stream, size) {
        $select = $stream.find('.articlePurchaseSize');
        $select.append('<option value="' + size + '">' + size + '</option>');
    }

};

shopPostFactory.append.productAddToCart = function($stream, post) {
    this.identifier($stream.find('.articleAddToCart'), post);
}
shopPostFactory.append.productTryGetKeys = function(keys) {
    try {
        var keys = Object.keys(keys);
        return keys;
    } catch(err) {
        console.log(err);
        return false;
    }
};


var shopPostList = function() {
    initList('shopBlock', {
        valueNames: [ 'vector' ],
        listClass: 'shopBlockCont'
    });
}
shopPostFactory.append.callbacks.push(shopPostList);

shopPostFactory.append.imageLinkHooks = function($article) {
    $article.addClass('productArticle');
}
//specify the actions for the article buttons
VV.extend('buttonTasks', {
    purchaseAddQty: function($el) {
        var self = this;
        $value = $el.closest('div').find('.articlePurchaseQty');
        var qty = parseInt($value.val());
        if (qty > 98) { return $value.val(99); }
        $value.val(parseInt($value.val()) + 1); 
    },
    purchaseMinusQty: function($el) {
        $value = $el.closest('div').find('.articlePurchaseQty');

        var qty = parseInt($value.val());

        if (qty > 1) {
            $value.val(qty - 1); 
        }
    },
    purchaseAddToCart: function($el) {
        $form = $el.closest('div').find('select, input');

        var proceed = true;
        var data = {};
        $form.each(function() {
            var $t = $(this);

            //is validation is false, set proceed flag to false;
            if (!VV.utils.inputsVali($t)) { 
                proceed = false; 
                return;
            }

            data[$t.attr('name')] = $t.val();

        });

        console.log(data);
        console.log(proceed);

        if (proceed) {
            data.postId = $el.attr('data-pid');
            _addToCartAjax(data, $el);
        }

        /* === private functions */
        function _addToCartAjax(data, $el) {
            var flasher = Object.create(VV.utils.Flasher);
            flasher.run($el, 'button');

            var ajax = $.post('/api/cart/add', data);

            ajax.done(function(result) {
                console.log(result);
                if (result.success) {
                    var $blockTextHolder = $el.closest('.blockTextHolder');
                    $el.closest('.articleAddToCart').remove();
                    
                    return _completionBlock($blockTextHolder, data, result);
                }
            });

            ajax.fail(function(err) {
                console.log(err);
            });

            ajax.always(function() {
                flasher.kill();
            });
        }

        function _completionBlock($cont, data, result) {
            var html = '';
            if (result.newAddition) {
                html += 'Item added to cart! ';
                if (result.brimmed) { 
                    html += 'Stock available was not enough. Only <b>' + result.updatedQty + '</b> placed in cart.' 
                }
            } else {
                html += 'Item was already in cart. ';
                if (result.brimmed) { 
                    html += 'Stock available was not enough. Only <b>' + result.updatedQty + '</b> placed in cart.' 
                } else {
                   html +=  'Updated quantity to <b>' + result.updatedQty + '</b>.'; 
                }
            }
            html = '<div>' + html + '</div>';
            $cont.append(html);

        }
    }
});


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
        var posting = $.post( P.absPath + "api/follow", { 
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