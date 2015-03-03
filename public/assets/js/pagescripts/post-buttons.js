'use strict';
/* MAIN BUTTONS */
VV.extend('buttonTasks', {
    postBrowse: function($el) {
        $('#img_field').focus().trigger('click');
    },
    backToBrowse: function($el) {
        $el.attr('disabled', 'disabled');
        setTimeout(function() {
            $el.removeAttr('disabled');
        }, 500);

        //reset mouse cursor
        $("#cropPort").css('cursor', 'default');  
        //fade and remove the uploaded picture.
        $('#cropPortBg img').velocity('fadeOut', 200, function(el) {
            $(el).remove();
        });
        $('#img_preview').velocity('fadeOut', 200, function(el) {
            $(el).remove();
        });
        $('#scaleCont').velocity('transition.slideRightOut', 200, function() {
            $("#browseCont").velocity("transition.slideLeftIn", 200);
        });
        VV.utils.resetFormElement($('#img_field'));
    },
    backToScale: function($el, e) {
        $el.attr('disabled', 'disabled');
        setTimeout(function() { $el.removeAttr('disabled'); }, 500);

        var $c = $('#cropPort'),
            cH = $c.attr('data-h'),
            cW = $c.attr('data-w');

        $('#cropPort').velocity({height: cH, width: cW}, function() {

            //fade in the bg image.
            $('#cropPortBg img').show().velocity({opacity:0.4}, 200, function() {
                //remove the cropped image
                $('#img_preview2').remove();
                $('#img_preview').show();
                dragShifting.init();
                $c.css('cursor', 'move');
            });

            $('#postCont').velocity('transition.slideRightOut', 200, function(el){
                //reset all the fields
                $(el).find('input').each(function(i, elem) {
                    $(elem).val('');
                });
                $(el).find('textarea').each(function(i, elem) {
                    $(elem).val('');
                });

                $('#scaleCont').velocity('transition.slideLeftIn', 200);
                //if the where fields are open, reset them
                $('#postWhereFields').hide().attr('data-show','false');
                $('.glyphicon-chevron-right').css({"transform": "rotateZ(0deg)"});

            });
        });
    },
    doneScaling: function($el) {
        //unbind dragShifting
        var $cP = $('#cropPort');
        dragShifting.kill($cP);
        loaderStuds.run();
        $cP.css('cursor', 'default');

        //slideout scale container
        $('#scaleCont').velocity('transition.slideLeftOut', {duration: 200});

        //1. crop and resize VV.img.TEMP_IMG.
        //2. re-apply filters. (not implemented)

        //draw up the tempCanvas we want to resize.
        //keeping the original one so that user can revert back.
        var tempCanvas = document.createElement('canvas');
        var tempCanvasCtx = tempCanvas.getContext('2d');
        tempCanvas.height = VV.img.TEMP_IMG_H;
        tempCanvas.width = VV.img.TEMP_IMG_W;
        tempCanvasCtx.drawImage(VV.img.TEMP_IMG, 0, 0);

        //m tells you how much bigger the image used for processing is.
        //this is used to multiply the drag shifted offsets IMG_X and IMG_Y
        if(tempCanvas.height > tempCanvas.width) {
            var m = VV.img.TEMP_IMG_W / (VV.img.CROP_PORT*VV.img.SCALE);
        } else {
            var m = VV.img.TEMP_IMG_H / (VV.img.CROP_PORT*VV.img.SCALE);
        }
        //canvasCrop takes in a drawn canvas and returns
        VV.img.canvasCrop('canvas', tempCanvas, m, VV.img.SCALE, function(cropped) {
            VV.img.canvasResize(cropped, VV.img.CROP_SIZE, false, false, function(canvas) {
                //in future, apply filters here.
                canvas.style['height'] = '100%';
                canvas.style['width'] = '100%';
                canvas.id = 'img_preview2';
                canvas.className = 'img_previews';
                
                //transitions
                loaderStuds.kill();
                $('#cropPortBg img').velocity({opacity:0}, 200, function(el) {
                    $(el).hide();
                    $('#img_preview').hide();
                    var h = $('#cropPort').height(),
                        w = $('#cropPort').width(),
                        reduction = 4;
                    $('#cropPort')
                        .append(canvas)
                        .attr('data-h', h).attr('data-w', w)
                        .velocity({height: h/4, width: w/4});

                    //safari sometimes don't respond to the first call.
                    //so we try again when it is less busy.
                    setTimeout(function() {
                        loaderStuds.kill();
                    }, 50);

                    $('#postCont').velocity('transition.slideRightIn', 200);
                }); 
            });
        });
    }, //doneScaling
    postButton: function($el, e) {
        e.preventDefault();

        $("#postCont").velocity("transition.slideLeftOut", 200);
        $("#progressBarCont").velocity("transition.slideRightIn", 200);
        var el_finalCanvas = document.getElementById('img_preview2');
        var data = el_finalCanvas.toDataURL('image/jpeg', VV.img.QUALITY);
        var file = VV.utils.imgToBin(data);

        var attrs = {
            imgData: file,
            processData: false,
            desc: $('#desc').val(),
            dataMeta: {
                itemMeta: [], //items are stuff that is not on VV
                productMeta: [] //stuff on VV
            },
            postType: 'post'
        };
        //get the product values
        var $productsCont = $('.VVItemsCont');
        var $products = $productsCont.find('.itemCont');

        $products.each(function(i, el) {
            var $merchantCont = $(el).find('.merchantLayout');
            var $productCont = $(el).find('.productLayout');

            //there can be several products in an itemCont.
            $productCont.each(function(i, el) {
                var product = {
                    merchant: {}
                };
                //append the merchant header
                product.merchant.userId = $merchantCont.attr('data-uid');
                $merchantCont.find('div').each(function(i, el) {
                    var key = $(el).attr('data-key');
                    if (key) { product.merchant[key] = $(el).attr('data-value'); }
                });
                //append the product details from this container.
                var $thisProductCont = $(el);
                product.postId = $thisProductCont.attr('data-pid');
                $(el).find('div').each(function(i, el) {
                    var key = $(el).attr('data-key');
                    if (key) { product[key] = $(el).attr('data-value'); }
                });
                attrs.dataMeta.productMeta.push(product);
            });
            
        });
        //get the items values
        var $itemsCont = $('.URLItemsCont');
        var $items = $itemsCont.find('.URLLayout');

        $items.each(function(i, el) {
            var item = {};
            $(el).find('div').each(function(i, el) {
                var key = $(el).attr('data-key');
                if (key) { item[key] = $(el).attr('data-value'); }
            });
            attrs.dataMeta.itemMeta.push(item);
        });

        // //get the meta values
        // var $whereFields = $('#postWhereFields'),
        //     itemLink = $whereFields.find('input#itemlink').val(),
        //     itemAddTag = $whereFields.find('input#itemaddtag').val(),
        //     itemPrice = $whereFields.find('input#itemprice').val();

        // if ($whereFields.attr('data-show') === "true" && (itemLink||itemAddTag||itemPrice) ) {
        //     //data-show is true, and either some or all inputs have values -> get values
        //     attrs.dataMeta.itemMeta = {
        //         "itemLink": itemLink,
        //         "itemAddTag": itemAddTag,
        //         "itemPrice": itemPrice
        //     };
        // }

        VV.img.upload(attrs, '/api/post', function(data) {
            //redirect to post
            window.location.href = '/p/' + data.postId;  
        });
    }
});

/* TAGGING BUTTONS */
VV.extend('buttonTasks', {
    merchantAdd: function($el) {
   
        //get the article user clicked on and append it into the 'selected items'
        var $parent = $el.closest('.merchantLayout');
        var uid = $el.attr('data-uid');

        //check if already exist
        var newId = 'added' + $parent.attr('id');
        if ($('#' + newId).length < 1) {
            var clone = $parent.clone();
            clone.find('.glyphicon-ok-circle').remove();
            clone.find('.glyphicon-remove-circle').show();
            clone.attr('id', 'added' + clone.attr('id'));
            $('.VVItemsCont').append(clone);

            
            clone.wrap('<div class="itemCont" data-uid="' + uid + '"></div>');
        }

        //reset the form.
        $('input[name="merchant"]').val('');
        $('.merchantInputDiv').hide();
        $('.merchantCont .resultCont').hide();
        $('#merchantFieldWrap').hide();

        //hide the post container
        $('.postButtonCont').hide();

        //start the productsearch
        productSearch.run(uid, $el.attr('data-currency'));
    },
    merchantRemove: function($el) {
        $el.closest('.itemCont').remove();
        addAnotherDisplayLogic('merchantRemove');

        //show the post container
        $('.postButtonCont').show();
    },

    productAdd: function($el) {
        
        //get the article user clicked on and append it into the 'selected items'
        var $parent = $el.closest('.productLayout');
        var uid = $el.attr('data-uid');

        //check if already exist
        var newId = 'added' + $parent.attr('id');
        if ($('#' + newId).length < 1) {

            var clone = $parent.clone();
            clone.find('.glyphicon-ok-circle').remove();
            clone.find('.glyphicon-remove-circle').show();
            clone
                .removeClass('productPreviewHover')
                .attr('id', 'added' + clone.attr('id'))
                .addClass('countThisItem');

            $('.VVItemsCont').find('.itemCont[data-uid="' + uid + '"]').append(clone);

        }

        //reset the form.
        $('input[name="product"]').val('');

        //show the post container
        $('.postButtonCont').show();

        addAnotherDisplayLogic('productAdd');
    },
    productRemove: function($el) {
        //check the current container. If it is the only item, remove the whole container.
        //else only remove itself.
        var $itemCont = $el.closest('.itemCont');
        var $productLayouts = $itemCont.find('.productLayout');

        if ($productLayouts.length <= 1) {
            //remove everything
            $itemCont.remove();
        } else {
            //remove only the product.
            $el.closest('.productLayout').remove();
        }
        return addAnotherDisplayLogic('productRemove');
    },
    postProductAddAnother: function($el) {
        if ($el.parent().attr('data-disabled') === 'disabled') {
            return aF.protoAlert('Maximum number of tagged items reached.')
        }
        $el.parent().hide();
        $('#merchantFieldWrap').show();
    },
    postProductAddAnotherURL: function($el) {
        if ($el.parent().attr('data-disabled') === 'disabled') {
            return aF.protoAlert('Maximum number of tagged items reached.')
        }
        $el.parent().hide();
        $('.addURLForm').show();
        $('.postButtonCont').hide();
    },
    postProductURLDone : function($el) {
        return URLForm.append(function() {
            $('.addURLForm').hide();
            $('.postButtonCont').show();

            //scenario: user may be halfway through entering a VV item. Check if there is merchant but no items under it and remove.
            $('.itemCont').each(function(i, el) {
                var $merchants = $(el).find('.merchantLayout');
                var $products = $(el).find('.productLayout');
                var mLength = $merchants.length;
                var pLength = $products.length;

                //suppose an itemcont have no merchant, something wrong, remove.
                if (mLength === 0) { return $(el).remove(); }
                //suppose an itemcont have merchant but no product, remove.
                if (pLength === 0) { return $(el).remove(); }
            });

            addAnotherDisplayLogic('postProductURLDone');

        });
    },
    postProductURLCancel: function($el) {
        URLForm.reset();
        $('.addURLForm').hide();
        $('.addURL').show();
        $('.postButtonCont').show();
    },
    URLRemove: function($el) {
        $el.closest('.URLLayout').remove();
        return addAnotherDisplayLogic('URLRemove');
    }
});

function addAnotherDisplayLogic(who) {
    var noOfTaggedItems = $('.countThisItem').length;

    if (noOfTaggedItems === 4) {

        //hide every inputs
        $('.addAnother')
            .show()
            .attr('data-disabled', 'disabled');
        $('#merchantFieldWrap').hide();
        $('#productFieldWrap').hide();
        $('.addURLForm').hide();

    } else if (noOfTaggedItems === 0) {

        $('.addAnother')
            .show()
            .attr('data-disabled', '');

        if (who === 'merchantRemove' || who === 'productRemove') {
            $('.addVV').hide();
            $('#merchantFieldWrap').show();
            $('#productFieldWrap').hide();
        } else if (who === 'URLRemove') {
            $('.addURL').hide();
            $('.addURLForm').show();
        }

    } else {

        $('.addAnother')
            .show()
            .attr('data-disabled', '');

        //removing stuff
        if (who === 'merchantRemove' || who === 'productRemove') {
            $('.addVV').show();
            $('#merchantFieldWrap').hide();
            $('#productFieldWrap').hide();
        }

        //adding stuff
        if (who === 'productAdd') {
            $('.addVV').show();
            $('#merchantFieldWrap').hide();
            $('#productFieldWrap').hide();
        } else if (who === 'postProductURLDone') {
            $('.addURL').show();
        }

    }
}