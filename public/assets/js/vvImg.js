/* This file requires alertFactory 'aF' */

var VV = {
    img: {}
};

/*******************
* Global Variables *
*******************/

//sticky globals
VV.img.CROP_PORT = 280; //default
VV.img.CROP_SIZE = 640;
VV.img.QUALITY = 0.75;
VV.img.SCALE_LIMIT = 2;

//resettable globals
VV.img.IMG_X = 0, // margin-left of preview image (i.e. $("#img_preview"))
VV.img.IMG_Y = 0, // margin-top of preview image
VV.img.STOCK_IMG = new Image(), // user uploaded stock image.
VV.img.STOCK_IMG_EXIF = {},
VV.img.STOCK_IMG_ROTATE = 0,
VV.img.STOCK_IMG_W = 0,
VV.img.STOCK_IMG_H = 0,
VV.img.LEFT_OFFSET = -2,
VV.img.TOP_OFFSET = -2;
VV.img.TEMP_IMG = false;
VV.img.SCALE = 1;
VV.img.AR = false;

VV.img.resetGlobal = function() {
    VV.img.IMG_X = 0;
    VV.img.IMG_Y = 0;
    VV.img.STOCK_IMG_EXIF = {};
    VV.img.STOCK_IMG_ROTATE = 0;
    VV.img.STOCK_IMG_W = 0,
    VV.img.STOCK_IMG_H = 0,
    VV.img.LEFT_OFFSET = -2;
    VV.img.TOP_OFFSET = -2;
    VV.img.TEMP_IMG = false;
    VV.img.SCALE = 1;
    VV.img.AR = false;
}

VV.img.TEMP_IMG = new Image();

/*******************
* Methods *
*******************/

VV.img.upload = function(attrs, callback) {

    /* 
     attrs = {
        action: [raw, process, store],
        imgData: [dataURL] (optional),  //imgData accepts input type file or Blob.
        processData: [ array ] (optional)
     }

     receving data:

     data = {
        success: [true, false],
        pathToImg: [imgURL],
        actionCompleted: ['rawReturned', 'stored'] //rawReturned happens when user send raw image.
                                               //still need user to crop and add filters.
     }
    */


    if(!attrs) {
        console.log('upload attributes are undefined');
        return false;
    }

    var data = new FormData();
    data.append("action", attrs.action);
    data.append("processData", JSON.stringify(attrs.processData) );
    data.append("imgData", attrs.imgData);
    data.append("desc", attrs.desc);


    var sioId = '';
    if(socketId) {
        sioId = socketId;
    }

    var posting = $.ajax({
        url: '/api/post',
        data: data,
        cache: false,
        mimeType: "multipart/form-data",
        contentType: false,
        processData: false,
        dataType: 'json',
        type: 'POST',
        headers: {'sioId': sioId}

    });

    posting.done(function(data) {

        if(!data.success) {
            return aF.protoAlert({
                text:'Oops... something has gone wrong. Please refresh and try again.', 
                title:'Oops...'
            });
        } else {
            console.log('upload ajax returned');
            
            if(data.actionCompleted === 'rawReturned') {
                console.log('appendimage');
                return callback(data);
            }

            if(data.actionCompleted === 'stored') {
                console.log('post is complete. redirect user to /me');
                return callback(data);
            }

            //fell through all cases
            console.log('data.actionCompleted returned wrong values');
            return aF.protoAlert({
                text:'Oops... something has gone wrong. Please refresh and try again.', 
                title:'Oops...'
            });


        }

    }); //posting.done


    //fail
    posting.fail(function() {
        return aF.protoAlert({
            text:'Oops... something has gone wrong. Please refresh and try again.', 
            title:'Oops...'
        });
    }); //posting.fail

} //VV.img.upload

VV.img.tallOrWide = function(obj) {
    if(obj.height>obj.width) {return 'tall'; }
    else { return 'wide'; }
}
VV.img.maxWH = function($img, $layer1img, tallOrWide) {
    var AR = VV.img.AR;
    if(!AR) {
        var AR = $img.width() / $img.height();
        VV.img.AR = AR;
    }

    //$img is a jQuery selector
    if(tallOrWide === 'tall') {
        var width = VV.img.CROP_PORT;
        var height = VV.img.CROP_PORT/VV.img.AR;
        $img.css('width', width+'px');
        $img.attr('data-tallorwide', 'tall');
        $layer1img.css('width', width+'px');
    } else if(tallOrWide === 'wide') {
        var height = VV.img.CROP_PORT;
        var width = VV.img.CROP_PORT*VV.img.AR;
        $img.css('height', height+'px');
        $img.attr('data-tallorwide', 'wide');
        $layer1img.css('height', height+'px');
    } else {
        return console.log('tallOrWide not properly specified');
    }

}

VV.img.center = function($img, $layer1img, tallOrWide) {
    var AR = VV.img.AR;
    if(!AR) {
        var AR = $img.width() / $img.height();
        VV.img.AR = AR;
    }
    
    if(tallOrWide === 'tall') {
        VV.img.IMG_Y = -( (VV.img.CROP_PORT/AR ) - VV.img.CROP_PORT ) / 2;
        $img.css('margin-top', VV.img.IMG_Y + 'px');
        $layer1img.css('top', VV.img.IMG_Y+'px');
        return true;
    } else if(tallOrWide === 'wide') {
        VV.img.IMG_X = -( (VV.img.CROP_PORT*AR) - VV.img.CROP_PORT ) / 2;
        $img.css('margin-left', VV.img.IMG_X + 'px');
        $layer1img.css('left', VV.img.IMG_X +'px');
        return true;
    } else {
        return console.log('tallOrWide not properly specified');
    }

}
VV.img.canvasrise = function(img) {
    //img is a complete img element
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0);
    return canvas;
}

VV.img.canvasResize = function(canvas, scaledPx, rotate, callback) {
    var scaledPx = Math.round(scaledPx);
    var destWidth, destHeight, 
        srcWidth = canvas.width,
        srcHeight = canvas.height,
        timeStart = Date.now(),
        determinant = ''; //determinant is the dimension that will reach the destination first in down scaling.

    //var scaledPx = VV.img.CROP_SIZE;

    if(srcHeight > srcWidth) {
        destWidth = scaledPx;
        destHeight = srcHeight / ( srcWidth / scaledPx );
        destHeight = Math.round(destHeight);
        determinant = 'width';
    } else {
        destHeight = scaledPx;
        destWidth = srcWidth / ( srcHeight / scaledPx );
        destWidth = Math.round(destWidth);
        determinant = 'height';
    }

    function resample_hermite(canvas, W2, H2, callback){
        var time1 = Date.now();
        var W = canvas.width;
        var H = canvas.height;
        var img = canvas.getContext("2d").getImageData(0, 0, W, H);
        var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
        canvas.getContext("2d").clearRect(0, 0, W, H);

        var my_worker = new Worker("assets/js/worker-hermite.js");
        my_worker.onmessage = function(event){

            img2 = event.data.data;    

            console.log("hermite resize completed in "+(Math.round(Date.now() - time1)/1000)+" s");   
            canvas.getContext("2d").clearRect(0, 0, W, H);
            canvas.height = H2;
            canvas.width = W2;
            canvas.getContext("2d").putImageData(img2, 0, 0);
            return callback(canvas);
            
        };
        my_worker.postMessage([img, W, H, W2, H2, img2]);

    };
    resample_hermite(canvas, destWidth, destHeight, function(canvas) {
        console.log(canvas.height, canvas.width);
        if(rotate) {
            return VV.img.canvasRotate(canvas, callback);
        }
        return callback(canvas);
    });
}

VV.img.getEXIF = function(file, callback) {

    if( typeof EXIF.readFromBinaryFile === 'function' && typeof BinaryFile === 'function') {

        fr = new FileReader();
        fr.onloadend = function (e) {
            var exif = EXIF.readFromBinaryFile(new BinaryFile(e.target.result));
            if(exif) {
                console.log(exif);
                VV.img.STOCK_IMG_EXIF = exif;
                return callback(true);
            } else {
                callback(false);
                return false;
            }
        }
        fr.readAsBinaryString(file);

    } else {
        console.log('Warning: EXIF and BinaryFile error...')
        return false;
    }
}

VV.img.canvasRotate = function(canvas, callback) {
    //rotation
    if(!$.isEmptyObject(VV.img.STOCK_IMG_EXIF)) {
        if(VV.img.STOCK_IMG_EXIF.Orientation) {
            var orientation = parseFloat(VV.img.STOCK_IMG_EXIF.Orientation);
            if(orientation === 3 || orientation === 4) {
                VV.img.STOCK_IMG_ROTATE = 180;
            } else if(orientation === 5 || orientation === 6) {
                VV.img.STOCK_IMG_ROTATE = 90;
            } else if(orientation === 7 || orientation === 9) {
                VV.img.STOCK_IMG_ROTATE = -90;
            }

        }
    }
    if(VV.img.STOCK_IMG_ROTATE) {

        var degree = VV.img.STOCK_IMG_ROTATE;
        var data = new Image();
            data.src = canvas.toDataURL();
        var cContext = canvas.getContext('2d');

        var newCW = canvas.width, 
            newCH = canvas.height,
            cy = 0,
            cx = 0;

        //   Calculate new canvas size and x/y coorditates for image
        if(degree === 90) {
            newCW = canvas.height;
            newCH = canvas.width;
            cy = canvas.height * (-1);
        } else if (degree === 180) {
            cx = canvas.width * (-1);
            cy = canvas.height * (-1);
        } else if (degree === -90) {
            newCW = canvas.height;
            newCH = canvas.width;
            cx = canvas.width * (-1);
        }

        //  Rotate image
        canvas.setAttribute('width', newCW);
        canvas.setAttribute('height', newCH);
        cContext.rotate(degree * Math.PI / 180);
        cContext.drawImage(data, cx, cy);
        return callback(canvas);
    }
    else {
        return callback(canvas);
    }
}

VV.img.canvasCrop = function(type, file, callback) {
    var m = VV.img.CROP_SIZE/VV.img.CROP_PORT,
        x = VV.img.IMG_X*m,
        y = VV.img.IMG_Y*m;
    if(type === 'image') {
        var img = file;
        var cropCanvas = document.createElement('canvas');
        cropCanvas.height = VV.img.CROP_SIZE;
        cropCanvas.width = VV.img.CROP_SIZE;
        var ctx = cropCanvas.getContext('2d');
        ctx.drawImage(img, VV.img.IMG_X*m, VV.img.IMG_Y*m);
    } else if(type === 'canvas') {
        var cropCanvas = file;
        var ctx = file.getContext('2d');
        var data = ctx.getImageData(0,0,cropCanvas.width,cropCanvas.height);
        cropCanvas.height = VV.img.CROP_SIZE;
        cropCanvas.width = VV.img.CROP_SIZE;
        ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
        ctx.putImageData(data,x,y);
    } else {
        console.log('canvasCrop type invalid');
        return aF.protoAlert({
            text: 'Something has gone wrong... Please refresh window and try again.',
            title: 'Oops..'
        })
    }
    var data = cropCanvas.toDataURL('image/jpeg', VV.img.QUALITY);
    delete cropCanvas;
    return callback(data);
}

VV.img.dispTmp = function(type, data) {
    var $cont = $('#cropPort');
    var $layer1 = $('#cropPortBg');

    function display(canvas) {
        VV.img.AR = canvas.width/canvas.height;
        canvas.id = 'img_preview2';
        canvas.style['display'] = 'none';
        var tallOrWide = VV.img.tallOrWide(canvas);
        $cont.append(canvas);
        var layer1img = new Image();
        layer1img.src = VV.img.TEMP_IMG.src;
        layer1img.style['display'] = 'none'
        $layer1.append(layer1img);
        var $layer1img = $('#cropPortBg img')
        var $img = $('#img_preview2');
        VV.img.maxWH($img, $layer1img, tallOrWide);
        VV.img.center($img, $layer1img, tallOrWide);
        //transitions
        if($('#loading').length > 0) {
            $('#loading').velocity("stop").velocity("fadeOut", {
                duration: 300,
                complete: function(el) {
                    $(el).remove();
                    $('#cropPortBg img').velocity({opacity: 0.4}, {
                        display: 'block',
                        duration:300
                    });
                    $('#img_preview2').velocity('fadeIn', {
                        duration: 300,
                        complete: function(el) {
                            $(el).attr('id', 'img_preview');
                        }
                    });
                }
            });
        } else {
            $('#cropPortBg img').velocity({opacity: 0.4}, {
                display: 'block',
                duration: 300
            });
            $('#img_preview2').velocity('fadeIn', {
                duration: 300,
                complete: function(el) {
                    $(el).attr('id', 'img_preview');
                }
            });
        }
        $('#scaleSliderCont').velocity('fadeIn', { duration: 300 });
    }

    if(type === 'imgData') {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        console.log('here1');

        VV.img.TEMP_IMG = new Image();

        VV.img.TEMP_IMG.onload = function() {
            console.log('here2');
            canvas.height = VV.img.TEMP_IMG.height;
            canvas.width = VV.img.TEMP_IMG.width;
            ctx.drawImage(VV.img.TEMP_IMG, 0, 0);
            display(canvas);
        }
        VV.img.TEMP_IMG.src = data;

    } else if(type === 'canvas') {
        VV.img.TEMP_IMG = new Image();
        VV.img.TEMP_IMG.src = data.toDataURL();
        display(data);
    }
}

VV.img.scaler = function(scale, $el, $el2) {
    var delta = scale - VV.img.SCALE;
    var tallOrWide = $el.attr('data-tallorwide');
    if(tallOrWide === 'tall') {
        var width = VV.img.CROP_PORT*scale;
        var height = VV.img.CROP_PORT*scale/VV.img.AR;
        $el.css('width', width + 'px');
        $el2.css('width', width + 'px');
        VV.img.scaleCenter($el, $el2, tallOrWide, delta);
        VV.img.SCALE = scale;
    } else if(tallOrWide === 'wide') {
        var height = VV.img.CROP_PORT*scale;
        var width = VV.img.CROP_PORT*scale*VV.img.AR;
        $el.css('height', height + 'px');
        $el2.css('height', height + 'px');
        VV.img.scaleCenter($el, $el2, tallOrWide, delta);
        VV.img.SCALE = scale;
    }
}

VV.img.scaleCenter = function($img, $bg, tallOrWide, delta) {

    var AR = $img.width() / $img.height(),
        minX = VV.img.CROP_PORT - $img.width(),
        minY = VV.img.CROP_PORT - $img.height();
    if(tallOrWide === 'tall') {
        VV.img.IMG_Y += -(VV.img.CROP_PORT/AR * delta) / 2;
        VV.img.IMG_X += -(VV.img.CROP_PORT * delta) / 2;
    } else if(tallOrWide === 'wide') {
        VV.img.IMG_X += -(VV.img.CROP_PORT * AR * delta) / 2;
        VV.img.IMG_Y += -(VV.img.CROP_PORT * delta) / 2;
    } else {
        return console.log('tallOrWide not properly specified');
    }
    if(VV.img.IMG_X > 0) { VV.img.IMG_X = 0; }
    if(VV.img.IMG_Y > 0) { VV.img.IMG_Y = 0; }
    if(VV.img.IMG_X < minX) { VV.img.IMG_X = minX; }
    if(VV.img.IMG_Y < minY) { VV.img.IMG_Y = minY; }
    $img.css('margin-top', VV.img.IMG_Y + 'px');
    $img.css('margin-left', VV.img.IMG_X + 'px');
    $bg.css('top', VV.img.IMG_Y + 'px');
    $bg.css('left', VV.img.IMG_X + 'px');
}
VV.img.cloneCanvas = function(oldCanvas) {
    var newCanvas = document.createElement('canvas');
    var context = newCanvas.getContext('2d');
    newCanvas.width = oldCanvas.width;
    newCanvas.height = oldCanvas.height;
    context.drawImage(oldCanvas, 0, 0);
    return newCanvas;
}
