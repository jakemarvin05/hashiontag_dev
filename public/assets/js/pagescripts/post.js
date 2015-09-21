
/*******************
* Image processing *
*******************/

/* Functional schema
    
    $("#img_field").change()
        !--> reader.readAsDataURL()
                !--> reader.onload()
                        !--> VV.img.STOCK_IMG.onload()
                                !--> ends.
*/

var $img_field = $('img_field');
var el_img_field = document.getElementById('img_field');

VV.img.STOCK_IMG.onload = function() {
    var self = this;

    //480x480
    if (this.height < 480 || this.width < 480 ) {
        loaderStuds.kill();
        return aF.protoAlert({
                text:'Please select an image with at least 480px by 480px resolution', 
                title:'Resolution too small'
        });
    }

    VV.img.STOCK_IMG_MP = this.height*this.width/1000000;
    if(VV.img.STOCK_IMG_MP > VV.img.RESIZE_MP_LIMIT) {
        loaderStuds.kill();
        return aF.protoAlert({
                text:'Please resize your image before uploading.', 
                title:'Resolution too high'
        });
    }

    //ok clear to proceed...

    //store the heights for use later.
    VV.img.STOCK_IMG_W = this.width;
    VV.img.STOCK_IMG_H = this.height;

    //get EXIF first, returns a hasEXIF flag.
    //callback the subsequent steps
    VV.img.getEXIF(el_img_field.files[0], function(exif) {

        //set resizer
        //the picture don't have to be larger than what we allow users to scale.
        //our base size is 640x640, which means the smaller of the width of height
        //is 1280(if scale limit is 2), which essentially allows users to 2x their image.
        //scaleTo indicates the smaller of the dimension when image is downsized proportionally.
        var scaleTo = VV.img.CROP_SIZE*VV.img.SCALE_LIMIT;

        //prepare the canvas size.
        var canvas = VV.img.canvasrise(self, scaleTo);

        //everything passes through to canvasResize for resizing/rotating.
        //if you want to rotate, pass in the EXIF information.
        //if the canvas comes with image, set 2nd argument to FALSE.
        //it takes argument:
        //1.[the prepared canvas], 2.[desired scale], 3.[img or FALSE], 4.[exif or FALSE], 5.[callback]
        //canvasResize returns a resized canvas with image drawn.
        //it is synchronous, as at 14Oct14. But a callback is provided anyway.
        VV.img.canvasResize(canvas, scaleTo, self, exif, function(canvas) {
            //iOS mobile might fail at this point. but we can proceed and check later.
            VV.img.dispTmp('canvas', canvas);  
        });  
    });

    //TRANSITIONS
    $("#browseCont").velocity("transition.slideLeftOut", 200);
    $("#cropPort").css('cursor', 'move');  
}; //img onload

var reader = new FileReader();
reader.onload = function(e) {
    VV.img.STOCK_IMG.src = '';
    VV.img.STOCK_IMG.src = e.target.result;
};

//File Input onchange
$("#img_field").change(function(){
    var self = this;
    if (!this.files && !this.files[0]) { return false; }

    //file is not an image
    if ( (this.files[0].type).indexOf('image') === -1 ) { 
        VV.utils.resetFormElement($('#img_field'));
        return aF.protoAlert({
                text:'It seems that your file is not an image or corrupted.', 
                title:'File type error.'
            });
    }
    //limit 5mb for mobile
    if ( printHead.userHeaders.isMobile && this.files[0].size > 5242880 ) { return _tooBig('5mb'); }
    //limit 10mb for the rest
    else if (this.files[0].size > 10485760) { return _tooBig('10mb'); }

    //start the loading.
    loaderStuds.run();
    reader.readAsDataURL(this.files[0]);

    //reset all globals
    VV.img.resetGlobal();
    scaleSlider.reset($('#scaleSliderBut'));

    function _tooBig(size) {
        aF.protoAlert({
            text:'Your image file is too large. Please resize your image to below ' + size, 
            title:'Max filesize exceeded.'
        });
    }
});

/* merchant Factory function and merchantSearch */
merchantFactory = Object.create(streamFactory);
merchantFactory.append = Object.create(streamFactory.append);
merchantFactory.streamContClass = 'merchantCont .resultCont';
merchantFactory.streamPrefix = 'merchant_';
merchantFactory.layoutClass = 'merchantLayout';
merchantFactory.noObj = function() {
    this.$cont.append(this.layoutHTML);
    this.$cont.find('.blockTop').html('<h2 class="htext">No results...</h2>');
};
merchantFactory.buildBlocks = function(resultCount) {

    for(var i=0; i<resultCount; i++) {
        var result = this.posts[i];
        var streamId = this.streamPrefix + result.userId;

        //create the block
        var newBlock = this.layoutHTML.replace('layoutId', streamId);
        this.$cont.append(newBlock);
        var $stream = $('#' + streamId);
        $stream.attr('data-uid', result.userId);
        this.append.init($stream, result);
    }//for loop

    for(var i in this.append.callbacks) {
        this.append.callbacks[i].call(this.append);
    }
};

merchantFactory.append.names = function($stream, result) {
    var dispName = result.userNameDisp,
        fullName = result.name;
    var anchor = '<a href="' + printHead.p.absPath + '/' + dispName + '" target="_blank">@' + dispName + '</a>';
    $stream.find('.merchantUsername')
        .html(anchor)
        .attr('data-key', 'userName')
        .attr('data-value', dispName);

    $stream.find('.merchantName')
        .html(fullName)
        .attr('data-key', 'name')
        .attr('data-value', fullName);

    return true;
};
merchantFactory.append.profilePicture = function($stream, result) {
    var imgHref = VV.utils.imageGetter(result.profilePicture, 'thumb');
    var img = new Image();
    img.src = imgHref;
    $stream.find('.merchantThumb')
        .append(img)
        .attr('data-key', 'profilePicture')
        .attr('data-value', result.profilePicture);
};
merchantFactory.append.scrolling = function() {

    var html  = '<div class="scrollDown" style="display:none;">';
        html += 'Scroll <span class="glyphicon glyphicon-arrow-down"></span>';
        html += '</div>';

    $('.' + this.parent.streamContClass)
        .wrapInner('<div class="resultScroll"></div>')
        .append(html)
};
merchantFactory.append.serializeButtons = function($stream, result) {
    $stream.find('.merchantAction')
        .attr('data-uid', result.userId)
        .attr('data-currency', D.get(result, 'dataMeta.dataShop.currency'));
};
merchantFactory.append.callbacks = [];
merchantFactory.append.callbacks.push(merchantFactory.append.scrolling);
merchantFactory.append.init = function($stream, result) {

    this.profilePicture($stream, result);
    this.names($stream, result);
    this.serializeButtons($stream, result);
};
merchantFactory.init();
var merchantSearch = Object.create(VV.search);
merchantSearch.init({
    uri: '/api/shop/search/merchant',
    $searchInput: $('input[name="merchant"]'),
    $resultCont: $('.merchantCont .resultCont'),
    ajaxCallback: function(results, cacheCallback) {
        var self = this;
        merchantFactory.init(results);
        this.$resultCont.velocity('transition.slideRightIn', 200, function(el) {
            
            //set the height. Will shorten the container if there is 1 result
            //no effect for 2 or more.
            var newHeight = $(el).find('.resultScroll').get(0).scrollHeight;
            $(el).css('height', newHeight + 'px');

            //a callback parameter cacheCallback is provided suppose `ajaxCallback` is async.
            //this will allow the cache to clone the later DOM after any changes are applied.
            return cacheCallback();
        });
    }
});
/* END merchant Factory function and merchantSearch */

/* product Factory function and productSearch */
productFactory = Object.create(streamFactory);
productFactory.append = Object.create(streamFactory.append);
productFactory.streamContClass = 'productCont .resultCont';
productFactory.streamPrefix = 'product_';
productFactory.layoutClass = 'productLayout';
productFactory.noObj = function() {
    this.$cont.append(this.layoutHTML);
    this.$cont.find('.blockTop').html('<h2 class="htext">No results...</h2>');
};
productFactory.buildBlocks = function(resultCount) {
    for(var i=0; i<resultCount; i++) {
        var result = this.posts[i];
        var streamId = this.streamPrefix + result.postId;

        //create the block
        var newBlock = this.layoutHTML.replace('layoutId', streamId);
        this.$cont.append(newBlock);
        var $stream = $('#' + streamId);
        $stream
            .attr('data-pid', result.postId)
            .attr('data-uid', this.renderJSON.userId)
            .attr('data-img', result.imgUUID);
        this.append.init($stream, result);
    }//for loop

    for(var i in this.append.callbacks) {
        this.append.callbacks[i].call(this.append);
    }
};

productFactory.append.names = function($stream, result) {
    var name = D.get(result, 'dataProduct.name');
    $stream.find('.productName')
        .html(name)
        .attr('data-key', 'name')
        .attr('data-value', name);
    return true;
};
productFactory.append.productThumb = function($stream, result) {
    var imgHref = VV.utils.imageGetter(result.imgUUID, 'thumb');
    var img = new Image();
    img.src = imgHref;
    $stream.find('.productThumb')
        .append(img)
        .attr('data-key', 'imgUUID')
        .attr('data-value', result.imgUUID)
};
productFactory.append.price = function($stream, result) {
    var currency = this.parent.renderJSON.currency || '$';
    var appendPrice = currency.toUpperCase() + D.get(result, 'dataProduct.price');
    $stream.find('.productPrice')
        .html(appendPrice)
        .attr('data-key', 'price')
        .attr('data-value', appendPrice);
}
productFactory.append.serializeButtons = function($stream, result) {
    $stream.find('.productAction')
        .attr('data-pid', result.postId)
        .attr('data-uid', this.parent.renderJSON.userId);
};
productFactory.append.vector = function($stream, result) {
    var vector = D.get(result, 'dataProduct.name') + ' ' + D.get(result, 'dataProduct.skuref') + ' ' + result.desc;
    $stream.find('.vector').html(vector);
};

productFactory.append.scrolling = function() {

    var html  = '<div class="scrollDown" style="display:none;">';
        html += 'Scroll <span class="glyphicon glyphicon-arrow-down"></span>';
        html += '</div>';

    $('.' + this.parent.streamContClass)
        .wrapInner('<div class="resultScroll"></div>')
        .append(html)
};
productFactory.append.callbacks = [];
productFactory.append.callbacks.push(productFactory.append.scrolling);
productFactory.append.mouseOver = function() {

    var $hoverCont = this.parent.$cont.find('.productPreviewHover');
    var $previewCont = $('.productPreviewDiv');
    var $previewImg = $previewCont.find('img');
    var imgGetter = VV.utils.imageGetter;

    $hoverCont.on('mouseenter', function(e) {
        var $el = $(this);

        $previewCont.show();

        var imgUUID = $el.attr('data-img');
        var onPreview = $previewCont.attr('data-img');

        if (imgUUID === onPreview) { return false; }

        //set the previewImg to a temporary 'thumbnail sized'
        $previewImg.attr('src', imgGetter(imgUUID, 'thumb'));
        $previewCont.attr('data-img-loading', imgUUID);

        //get the bigger size
        var previewImage = new Image();
        previewImage.onload = (function() {
            return function loadImg() {
                //if source result is no longer being hovered over, the 'data-img-loading' will change.
                if ($previewCont.attr('data-img-loading') !== imgUUID) { return false; }

                $previewCont.attr('data-img', imgUUID);
                $previewImg
                    .hide()
                    .attr('src', this.src)
                    .velocity('fadeIn', 1000);
            }
        })(imgUUID, $previewCont, $previewImg);

        previewImage.src = imgGetter(imgUUID, 'half');
    });

    $hoverCont.on('mouseleave', function() {
        $previewCont.hide();
    });
};
//productFactory.append.callbacks.push(productFactory.append.mouseOver);

productFactory.append.init = function($stream, result) {
    this.productThumb($stream, result);
    this.names($stream, result);
    this.price($stream, result);
    this.serializeButtons($stream, result);
    this.vector($stream, result);
};
var productList = function() {
    var list = new List('productFieldWrap', {
        valueNames: [ 'vector' ],
        listClass: 'resultScroll',
        searchClass: 'productSearch',
        plugins: [ ListFuzzySearch() ]
    });
    return list;
};
productFactory.append.callbacks.push(productList);
productFactory.init();
var productSearch = {
    run: function(uid, currency) {
        var self = this;

        //clear and restore stuff
        $('.productCont .resultCont').html('');
        $('.productPreviewDiv img').attr('src', $('.productPreviewDiv img').attr('data-restore'));

        if (this.cache[uid]) { return this.restoreFromCache(uid); }

        var loader = Object.create(VV.utils.loaderEffect);
        loader.init($('.productContLoader'));
        loader.run();
        var post = $.post('/api/shop/get/product', { userId: uid});

        post.done(function(data) {
            if (data.success) {
                data.currency = currency;
                data.userId = uid;
                var $cont = productFactory.init(data);
                //set the height. Will shorten the container if there is 1 result
                //no effect for 2 or more.
                self.cache[uid] = $cont.clone();
                $('#productFieldWrap').show();

                //height sizing
                var newHeight = $cont.find('.resultScroll').get(0).scrollHeight;
                $cont.css('height', newHeight + 'px');
            }
        });

        post.fail(function(err) {
            c.l(err);
        });

        post.always(function() {
            loader.kill();
        });
    },
    restoreFromCache: function(uid) {
        var self = this;
        var $oldCont = $('.productCont .resultCont').after(self.cache[uid].clone());
        $oldCont.remove();
        productList();
        $('#productFieldWrap').show();
    },
    cache: {}
};
/*END product factory and productSearch */

$('.resultContWrapper').on('mouseenter', function() {

    //get the .scrollDown element.
    var $t = $(this);
    var $resultCont = $t.find('.resultCont');
    var $resultScroll = $t.find('.resultScroll');
    var $scrollDown = $t.find('.scrollDown');

    //toggle the "scrollDown" div visibility
    if (!$resultScroll.hasScrollBar()) { $scrollDown.fadeOut(); return false; }
    var resultContHeight = $resultCont.height();
    var scrollHeight = $resultScroll.get(0).scrollHeight;
    var scrollPlay = scrollHeight - resultContHeight;
    var tolerance = 10;
    scrollPlay -= tolerance;

    //initial hide/show.
    _scrollDownToggle($resultScroll.scrollTop(), scrollPlay, $scrollDown);

    //bind the hide/show to the scroll event
    $resultScroll.off('scroll.scrollDownToggle').on('scroll.scrollDownToggle', function() {
        return _scrollDownToggle($(this).scrollTop(), scrollPlay, $scrollDown);
    });

    //=== private function
    function _scrollDownToggle(scrollTop, scrollPlay, $scrollDown) {
        if (scrollTop > scrollPlay) {
            $scrollDown.fadeOut();
        } else {
            $scrollDown.fadeIn();
        }
    }
});


//listener for product hover preview
$(window).on('mousemove', function(e) {
    var $el = $(e.target);
    var $previewCont = $('.productPreviewDiv');
    if (!$el.hasClass('productPreviewHover')) { 
        if ($el.closest('.productPreviewHover').length < 1) {
            return $previewCont.hide();
        } else {
            $el = $el.closest('.productPreviewHover');
        }
    }
    var $previewImg = $previewCont.find('img');
    var imgGetter = VV.utils.imageGetter;
    
    $previewCont.show();

    var imgUUID = $el.attr('data-img');
    var onPreview = $previewCont.attr('data-img');

    if (imgUUID === onPreview) { return false; }

    //set the previewImg to a temporary 'thumbnail sized'
    $previewImg.attr('src', imgGetter(imgUUID, 'thumb'));
    $previewCont.attr('data-img-loading', imgUUID);

    //get the bigger size
    var previewImage = new Image();
    previewImage.onload = (function() {
        return function loadImg() {
            //if source result is no longer being hovered over, the 'data-img-loading' will change.
            if ($previewCont.attr('data-img-loading') !== imgUUID) { return false; }

            $previewCont.attr('data-img', imgUUID);
            $previewImg
                .attr('src', this.src);
        }
    })(imgUUID, $previewCont, $previewImg);

    previewImage.src = imgGetter(imgUUID, 'half');

    $el.on('mouseleave.preview', function() {
        $previewCont.hide();
        $(this).off('mouseleave.preview');
    });

});


var URLForm = {
    templateHTML: null,
    $container: null,
    $form: null,
    init: function(args) {
        if (!this.$container) { this.$container = args.$template.parent(); }

        if (!this.templateHTML) { 
            this.templateHTML = args.$template[0].outerHTML;
            args.$template.remove(); 
        }

        if (!this.$form) { this.$form = args.$form; }
    },
    append: function(callback) {
        var $f = this.$form;

        if (!this.check($f)) { return false };

        //check has passed, append.
        //serialize the template and append it.
        var id = (new Date()).getTime();
        var prefix = 'url';
        var newTemplate = this.templateHTML.replace('layoutId', 'url' + id);
        this.$container.append(newTemplate);
        var $newTemplate = $('#url' + id);

        //product name
        var name = $f.find('input[name="itemname"]').val();
        $newTemplate.find('.productName')
            .append(name)
            .attr('data-key', 'name')
            .attr('data-value', name);

        //link
        var link = $f.find('input[name="itemlink"]').val();
        var anchor = document.createElement('a');
        anchor.href = link;
        anchor.target = '_blank';
        anchor.innerHTML = link;
        $newTemplate.find('.productURL')
            .append(anchor)
            .attr('data-key', 'link')
            .attr('data-value', link);
        VV.utils.ensureLink($(anchor));

        //username
        var username = $f.find('input[name="itemaddtag"]').val();
        if (username.length > 0) {
            if (username.indexOf('@') === 0) { username = username.substring(1); }
            $newTemplate.find('.merchantUsername')
                .append('@' + username)
                .attr('data-key', 'userName')
                .attr('data-value', username);
            //fire the ajax function to search for the user tagged.
            this.ajax($newTemplate, username);
        } else {
            //$newTemplate.find('.merchantUsername').append('No User Defined');
            $newTemplate.find('.merchantUsername').hide();
            $newTemplate.find('.merchantName').hide();
        }

        //price
        var price = $f.find('input[name="itemprice"]').val();
        if (price.length > 0) {
            $newTemplate.find('.productPrice')
                .append(price)
                .attr('data-key', 'price')
                .attr('data-value', price);
        }

        $newTemplate.show();
        return this.reset(callback);
    },
    check: function($f) {
        //only check for itemName and itemLink
        var $name = $f.find('input[name="itemname"]');
        var $link = $f.find('input[name="itemlink"]');
        var pass = true;
        var test = VV.utils.inputsVali;

        //GOTCHA: test() returns false when failed.
        if (!test($name)) { pass = false; }
        if (!test($link)) { pass = false; }

        return pass;
    },
    ajax: function($template, username) {
        return (function() {
            var post = $.post('/api/shop/search/merchant', {
                username: username,
                shopStatus: false,
                exactMatch: true
            });

            post.done(function(results) {
                if (results.success) {
                    if (results.results.length > 0) {
                        var result = results.results[0];
                        //username
                        var userpage = '<a href="/' + result.userNameDisp + '" target="_blank">@' + result.userNameDisp + '</a>';
                        $template.find('.merchantUsername').html(userpage);

                        $template.find('.merchantName').html(result.name);

                        //profilePicture
                        var ppSrc = VV.utils.imageGetter(result.profilePicture, 'thumb');
                        $template.find('.merchantThumb img')
                            .attr('src', ppSrc)
                            .css('opacity', 1);

                    } else {
                        $template.find('.merchantName')
                            .html('User is not found. Other attributes will still be added.')
                            .css('color', '#ef4549');

                        $template.find('.merchantUsername')
                            .removeAttr('data-key'); //indicate to append function not to use this.
                    }
                }
                //fail silently
            });

            post.fail(function(err) {
                c.l(err);
                //fail silently
            });
        })($template, username);
    },
    reset: function(callback) {
        this.$form.find('input').each(function(i, el) {
            $(el).val('');
        });

        if (typeof callback === 'function') { return callback(); }
    }
};