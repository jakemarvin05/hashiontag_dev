/* This file requires alertFactory 'aF' */
if(typeof VV === 'undefined') { var VV = {} }

VV.img = {}

/*******************
* Global Variables *
*******************/

//sticky globals
VV.img.CROP_PORT = 280; //default
VV.img.CROP_SIZE = 640;
VV.img.QUALITY = 0.75;
VV.img.SCALE_LIMIT = 2;
VV.img.RESIZE_MP_LIMIT = 30; //30MP

//resettable globals
VV.img.IMG_X = 0, // margin-left of preview image (i.e. $("#img_preview"))
VV.img.IMG_Y = 0, // margin-top of preview image
VV.img.STOCK_IMG = new Image(), // user uploaded stock image.
VV.img.STOCK_IMG_EXIF = {},
VV.img.STOCK_IMG_ROTATE = 0,
VV.img.STOCK_IMG_W = 0,
VV.img.STOCK_IMG_H = 0,
VV.img.STOCK_IMG_MP = false,
VV.img.LEFT_OFFSET = -2,
VV.img.TOP_OFFSET = -2;
VV.img.TEMP_IMG = false;
VV.img.TEMP_IMG_W = 0,
VV.img.TEMP_IMG_H = 0,
VV.img.PROC_IMG = false;
VV.img.SCALE = 1;
VV.img.AR = false;

VV.img.resetGlobal = function() {
    VV.img.IMG_X = 0;
    VV.img.IMG_Y = 0;
    VV.img.STOCK_IMG_EXIF = {};
    VV.img.STOCK_IMG_ROTATE = 0;
    VV.img.STOCK_IMG_W = 0,
    VV.img.STOCK_IMG_H = 0,
    VV.img.STOCK_IMG_MP = false,
    VV.img.LEFT_OFFSET = -2;
    VV.img.TOP_OFFSET = -2;
    VV.img.TEMP_IMG = false;
    VV.img.TEMP_IMG_W = 0,
    VV.img.TEMP_IMG_H = 0,
    VV.img.PROC_IMG = false;
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
    data.append("itemMeta", JSON.stringify(attrs.itemMeta));

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
    //var ctx = canvas.getContext('2d')
    //ctx.drawImage(img, 0, 0);
    return canvas;
}

VV.img.canvasResize = function(canvas, scaledPx, img, exif, callback) {
    //do i need to rotate?
    //canvasRotate only returns a transformed canvas.
    if(exif) { 
        console.log('exif, rotate');
        var canvas = VV.img.canvasRotate(canvas, exif); 
    }

    //if img is present, this is where we draw it before passing to the 
    //hermite resizer.
    var ctx = canvas.getContext('2d');
    if(img) { ctx.drawImage(img, 0, 0); }

    //skip canvasResize if scaling is not required.
    //this means if one of the parameter is already at desired px.
    //canvasResize cannot be used to dictate which dimension is to be scaled.
    if(canvas.height === scaledPx || canvas.height === scaledPx) { 
        if(callback) { return callback(canvas); }
        return canvas;
    }

    //start scaling
    var scaledPx = Math.round(scaledPx);
    var destWidth, destHeight, 
        srcWidth = canvas.width,
        srcHeight = canvas.height,
        timeStart = Date.now(),
        determinant = ''; //determinant is the dimension that will reach the destination first in down scaling.

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

    resample_hermite(canvas, destWidth, destHeight, function(canvas) {
        if(callback) { return callback(canvas); }
        return canvas;
    });

    function resample_hermite(canvas, W2, H2, callbackHermite){
        var time1 = Date.now();
        var W = canvas.width;
        var H = canvas.height;
        var img = canvas.getContext("2d").getImageData(0, 0, W, H);
        var img2 = canvas.getContext("2d").getImageData(0, 0, W2, H2);
        canvas.getContext("2d").clearRect(0, 0, W, H);

        var my_worker = new Worker(printHead.p.absPath + "/assets/js/worker-hermite.js");
        my_worker.onmessage = function(event){

            img2 = event.data.data;    
            console.log("hermite resize completed in "+(Math.round(Date.now() - time1)/1000)+" s");   
            canvas.getContext("2d").clearRect(0, 0, W, H);
            canvas.height = H2;
            canvas.width = W2;
            canvas.getContext("2d").putImageData(img2, 0, 0);
            return callbackHermite(canvas);
            
        };
        my_worker.postMessage([img, W, H, W2, H2, img2]);

    }
}

VV.img.getEXIF = function(file, callback) {

    if( typeof EXIF.readFromBinaryFile === 'function' && typeof BinaryFile === 'function') {

        fr = new FileReader();
        fr.onloadend = function (e) {
            var exif = EXIF.readFromBinaryFile(new BinaryFile(e.target.result));
            if(exif) {
                console.log(exif);
                VV.img.STOCK_IMG_EXIF = exif;
                return callback(exif);
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

//canvasRotate only returns a transformed canvas.
//even if a canvas with image drawn is passed in, you need to call drawImage
//on the returned canvas to achieve the rotation.
VV.img.canvasRotate = function(canvas, exif) {

    if(!exif) { return canvas; }

    //console.log('start rotate ' + Date.now());
    if($.isEmptyObject(exif)) { return canvas; }

    //exif is not empty, check if there is orientation data
    //orientation may be zero, which will be falsy if we check it with if(orientation)
    //hence we check for undefined.
    if(typeof exif.Orientation === "undefined") { return canvas; }

    //exif is some value, lets see if we can use it.
    //we parseFloat the value and if it fits no case, we just return the canvas
    //as it is
    var orientation = parseFloat(exif.Orientation);

    //no rotation required.
    if(orientation === 1) { return canvas; }

    var ctx = canvas.getContext('2d'),
        height = canvas.height,
        width = canvas.width;
    //     data = new Image();
    // data.src = canvas.toDataURL();

    //now we fall the canvas through our cases.
    switch (orientation) {
        case 5:
        case 6:
        case 7:
        case 8:
            canvas.width = height;
            canvas.height = width;
            break;
    }

    switch (orientation) {
        case 2:
            // horizontal flip
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break;
        case 3:
            // 180 rotate left
            ctx.translate(width, height);
            ctx.rotate(Math.PI);
            break;
        case 4:
            // vertical flip
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break;
        case 5:
            // vertical flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;
        case 6:
            // 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -height);
            break;
        case 7:
            // horizontal flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(width, -height);
            ctx.scale(-1, 1);
            break;
        case 8:
            // 90 rotate left
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-width, 0);
            break;
    } //switch

    return canvas;
    // return data.onload = function() { 
    //     ctx.drawImage(data, 0, 0); 
    //     //console.log('end rotate' + Date.now());
    //     if(callback) { return callback(canvas); }
    //     return canvas;
    // }




//     //OLD CODE - doesn't transform flipped images
//     if(!$.isEmptyObject(VV.img.STOCK_IMG_EXIF)) {
//         if(VV.img.STOCK_IMG_EXIF.Orientation) {
//             var orientation = parseFloat(VV.img.STOCK_IMG_EXIF.Orientation);
//             if(orientation === 3 || orientation === 4) {
//                 VV.img.STOCK_IMG_ROTATE = 180;
//             } else if(orientation === 5 || orientation === 6) {
//                 VV.img.STOCK_IMG_ROTATE = 90;
//             } else if(orientation === 7 || orientation === 9) {
//                 VV.img.STOCK_IMG_ROTATE = -90;
//             }

//         }
//     }
//     if(VV.img.STOCK_IMG_ROTATE) {

//         var degree = VV.img.STOCK_IMG_ROTATE;
//         var data = new Image();
//             data.src = canvas.toDataURL();
//         var cContext = canvas.getContext('2d');

//         var newCW = canvas.width, 
//             newCH = canvas.height,
//             cy = 0,
//             cx = 0;

//         //   Calculate new canvas size and x/y coorditates for image
//         if(degree === 90) {
//             newCW = canvas.height;
//             newCH = canvas.width;
//             cy = canvas.height * (-1);
//         } else if (degree === 180) {
//             cx = canvas.width * (-1);
//             cy = canvas.height * (-1);
//         } else if (degree === -90) {
//             newCW = canvas.height;
//             newCH = canvas.width;
//             cx = canvas.width * (-1);
//         }

//         //  Rotate image
//         canvas.width = newCW;
//         canvas.height = newCH;
//         cContext.rotate(degree * Math.PI / 180);
//         data.onload = function() { 
//             cContext.drawImage(data, cx, cy); 
//             console.log('end rotate');
//             console.log(Date.now());
//             return callback(canvas);
//         }

//     }
//     else {
//         return callback(canvas);
//     }
}

VV.img.canvasCrop = function(type, file, m, scale, callback) {
    if(!m) { var m = VV.img.CROP_SIZE/VV.img.CROP_PORT; } 

    //the x and y offsets from user's shifting needs to be offset
    //by the multiplier (because their image is smaller/larger on the viewport)
    var x = VV.img.IMG_X*m,
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
        var cropSize = (VV.img.TEMP_IMG_H > VV.img.TEMP_IMG_W) ? VV.img.TEMP_IMG_W/scale : VV.img.TEMP_IMG_H/scale; 
        cropCanvas.height = cropSize;
        cropCanvas.width = cropSize;
        ctx.clearRect(0,0,cropCanvas.width,cropCanvas.height);
        ctx.putImageData(data,x,y);
    } else {
        console.log('canvasCrop type invalid');
        return aF.protoAlert({
            text: 'Something has gone wrong... Please refresh window and try again.',
            title: 'Oops..'
        })
    }
    // var data = cropCanvas.toDataURL('image/jpeg', VV.img.QUALITY);
    // delete cropCanvas;
    // return callback(data);
    //return document.body.appendChild(cropCanvas);
    return callback(cropCanvas);
}

VV.img.dispTmp = function(type, data) {
    console.log('dispTmp fired');
    console.log(Date.now());
    var el_cont = document.getElementById('cropPort');
    var el_layer1 = document.getElementById('cropPortBg');

    if(type === 'imgData') {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        VV.img.TEMP_IMG = new Image();

        VV.img.TEMP_IMG.onload = function() {
            canvas.height = VV.img.TEMP_IMG.height;
            canvas.width = VV.img.TEMP_IMG.width;
            VV.img.TEMP_IMG_H = VV.img.TEMP_IMG.height;
            VV.img.TEMP_IMG_W = VV.img.TEMP_IMG.width;
            ctx.drawImage(VV.img.TEMP_IMG, 0, 0);
            display(canvas);
        }
        VV.img.TEMP_IMG.src = data;

    } else if(type === 'canvas') {
        VV.img.TEMP_IMG = new Image();
        VV.img.TEMP_IMG.onload = function() {



            VV.img.TEMP_IMG_H = VV.img.TEMP_IMG.height;
            VV.img.TEMP_IMG_W = VV.img.TEMP_IMG.width;
            display(data);
        }
        var imgdata = data.toDataURL();
        //we run the blank image checker
        VV.img.blankImgChecker(imgdata);
        VV.img.TEMP_IMG.src = imgdata;
    }

    function display(canvas) {
        //console.log('display fired');
        //console.log(Date.now());

        //appending the main canvas
        VV.img.AR = canvas.width/canvas.height;
        canvas.id = 'img_preview';
        canvas.className = 'img_previews';
        canvas.style['display'] = 'none';
        var tallOrWide = VV.img.tallOrWide(canvas);
        el_cont.appendChild(canvas);
        //console.log('canvas appended');
        //console.log(Date.now());

        //appending the background image.
        var layer1img = VV.img.TEMP_IMG;
        layer1img.style['display'] = 'none';
        el_layer1.appendChild(layer1img);
        //console.log('bg appeneded');
        //console.log(Date.now());

        //now we position them accordingly
        var $layer1img = $('#cropPortBg img')
        var $img = $('#img_preview');
        VV.img.maxWH($img, $layer1img, tallOrWide);
        VV.img.center($img, $layer1img, tallOrWide);
        
        //transitions
        loaderStuds.kill();

        $('#cropPortBg img').velocity({opacity: 0.4}, {
            display: 'block',
            duration: 200
        });
        $('#img_preview').velocity('fadeIn', {
            duration: 200,
            complete: function(el) {
                console.log('complete');
                console.log(Date.now());
                $('#scaleCont').velocity("transition.slideRightIn", 200);
            }
        });
    }
}
VV.img.blankImgChecker = function(imgdata) {
    console.log(imgdata.length);
    var size = imgdata.length,
        threshold = 100000; //blank images on iOS typically returns 51038

    if(size > threshold) { return false; }
    //something is wrong, check headers to decide what to print.

    var msg = Object.create(aF);
    //alert(JSON.stringify(printHead.userHeaders.ua));

    if(printHead.userHeaders.ua.isMobileIOS) {
        //omg it's an iphone....

        //send out errors to server
        var data  = JSON.stringify(printHead.userHeaders);
            data += ' Size:' + (imgdata.length).toString();

        VV.utils.errorReceiver({
            where: "vvImg.js",
            errType: "iOS resizing problem",
            errData: data
        });

        //alert user
        var text  = 'We suspect that Safari is unable to resize your image correctly.';
            text += '<h2>Do you know?</h2>';
            text += 'iOS print screen is an excellent way to resize your photos. You can';
            text += ' do a printscreen before uploading the picture here. It works great!';

        return msg.protoAlert({
            title: "Resizing on iOS",
            text: text
        });
    }

    //other cases
    var data  = JSON.stringify(printHead.userHeaders);
        data += ' Size:' + (imgdata.length).toString();

    VV.utils.errorReceiver({
        where: "vvImg.js",
        errType: "iOS resizing problem",
        errData: data
    });

    var text  = 'We detected a possible resizing error. Please check if it turns out alright.';
        text += '<p> If it doesn\'t, you may wish to try other browsers to use our features.</p>';
        text += '<p>Personally we like Chrome the best.';
        text += ' You can also try to resize the image before submitting here.</p>';

    return msg.protoAlert({
        title: 'Possible image resizing error',
        text: text
    });
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
