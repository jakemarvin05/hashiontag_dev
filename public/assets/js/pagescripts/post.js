
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
} //img onload

var reader = new FileReader();
reader.onload = function(e) {
    VV.img.STOCK_IMG.src = '';
    VV.img.STOCK_IMG.src = e.target.result;
}

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
            action: 'store',
            imgData: file,
            processData: false,
            desc: $('#desc').val(),
            dataMeta: {},
            itemMeta: {},
            postType: 'post'
        };

        //get the meta values
        var $whereFields = $('#postWhereFields'),
            itemLink = $whereFields.find('input#itemlink').val(),
            itemAddTag = $whereFields.find('input#itemaddtag').val(),
            itemPrice = $whereFields.find('input#itemprice').val();

        if ($whereFields.attr('data-show') === "true" && (itemLink||itemAddTag||itemPrice) ) {
            //data-show is true, and either some or all inputs have values -> get values
            attrs.itemMeta = {
                "itemLink": itemLink,
                "itemAddTag": itemAddTag,
                "itemPrice": itemPrice
            };
        }

        VV.img.upload(attrs, '/api/post', function(data) {
            //redirect to post
            window.location.href = '/p/' + data.postId;  
        });
    }
});