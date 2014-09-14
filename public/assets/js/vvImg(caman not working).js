/*
uploading function

send data.

tell the server whether:

condition 1: image needs resize and rotation (raw image)

condition 2: this is just data attrs to resize/rotate/crop/add filters and compress the raw image

             sent in condition 1

condition 3: this image is processed, just store it.


condition 1 and 3 can be merged, with server return the path to the image. in condition 1 image

is in temp folder.

condition 2 requires the path information sent to server to apply the attrs.
*/



/*******************
* Global Variables *
*******************/
var VV = {
    img: {}
};

//sticky globals
VV.img.CROP_PORT = 320;
VV.img.CROP_SIZE = 640;
VV.img.QUALITY = 0.75;

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
}




VV.img.TEMP_IMG = new Image();

VV.img.upload = {};

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

VV.img.tallOrWide = function(img) {
    //img is a normal image
    console.log(img);
    console.log('height: ' + img.height);
    console.log('width: ' + img.width);
    if(img.height>img.width) {
        return 'tall';
    } else {
        return 'wide';
    }
}


VV.img.maxWH = function($img, tallOrWide) {

    //$img is a jQuery selector
    if(tallOrWide === 'tall') {
        $img.css('max-width', VV.img.CROP_PORT);
    } else if(tallOrWide === 'wide') {
        $img.css('max-height', VV.img.CROP_PORT);
    } else {
        return console.log('tallOrWide not properly specified');
    }

}

VV.img.center = function($img, tallOrWide) {

    var AR = $img.width() / $img.height();
    if(tallOrWide === 'tall') {
        VV.img.IMG_Y = -( (VV.img.CROP_PORT/AR) - VV.img.CROP_PORT ) / 2;
        $img.css('margin-top', VV.img.IMG_Y);
        return true;
    } else if(tallOrWide === 'wide') {
        VV.img.IMG_X = -( (VV.img.CROP_PORT*AR) - VV.img.CROP_PORT ) / 2;
        $img.css('margin-left', VV.img.IMG_X);
        return true;
    } else {
        return console.log('tallOrWide not properly specified');
    }

}

VV.img.canvasResize = function(img, rotate, callback) {

    //img is a complete img element

    var destWidth, destHeight, 
        srcWidth = img.width, 
        srcHeight = img.height, 
        last = false,
        timeStart = Date.now(),
        determinant = ''; //determinant is the dimension that will reach the destination first in down scaling.

    var tmp = new Image();
        tmp.src = img.src;

    var canvas = document.createElement('canvas');

    canvas.height = srcHeight;
    canvas.width = srcWidth;
    canvas.getContext('2d').drawImage(tmp, 0, 0);

    var scaledPx = VV.img.CROP_SIZE;

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

    var resizeLimit = 3; //5120px!!
    var steps = 0;
    var stepsParam = {};

    stepsParam[0] = {
        width: img.width,
        height: img.height
    }

    // 0, 1, 2
    //i will get 1, 2, 3 in stepsParam
    for(var i = 0; i < 5; i++) {
        var width = Math.round(stepsParam[i].width / 2);
        var height = Math.round(stepsParam[i].height / 2);
        stepsParam[i+1] = {};

        if(determinant === 'width') {

            if( width < destWidth ) {
                stepsParam[i+1].width = destWidth;
                stepsParam[i+1].height = destHeight;
                break;
            } else {
                stepsParam[i+1].width = width;
                stepsParam[i+1].height = height;
            }

        } else {

            if( height < destHeight ) {
                stepsParam[i+1].width = destWidth;
                stepsParam[i+1].height = destHeight;
                break;
            } else {
                stepsParam[i+1].width = width;
                stepsParam[i+1].height = height;
            }

        }
        if(i === 3) {
            console.log('error: attempting to resize too many steps');
            return false;
        }
        steps += 1;
        
    }

    console.log(steps);
    console.log(stepsParam);

    var counter = 0;

    Caman(canvas, function() {
        for(var j = 0; j < steps+1; j++) {
            var dim = stepsParam[j+1][determinant];
            console.log(dim);
            this.resize(dim);
        }

        this.render(function() {

            if(rotate) {
                return VV.img.canvasRotate(canvas, callback);
            }

            //no rotaton required
            var data = canvas.toDataURL();
            delete canvas;
            return callback(data);
        });
        
    });

}

VV.img.getEXIF = function(data64) {

    if( typeof atob === 'function' && typeof BinaryFile === 'function') {

        var base64 = data64.replace(/^.*?,/,''),
            binary = atob(base64),
            exif = EXIF.readFromBinaryFile(new BinaryFile(binary));

        console.log(exif);
        if(exif) {
            VV.img.STOCK_IMG_EXIF = exif;
            return true;
        } else {
            return false;
        }
    } else {
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
        var data = canvas.toDataURL();
        delete canvas;

        return callback(data);
    }

    else {
        var data = canvas.toDataURL();
        delete canvas;
        return callback(data);
    }
}

VV.img.canvasCrop = function(img, callback) {
    var canvas = document.createElement('canvas');
    canvas.height = VV.img.CROP_SIZE;
    canvas.width = VV.img.CROP_SIZE;

    var ctx = canvas.getContext('2d');

    var m = VV.img.CROP_SIZE/VV.img.CROP_PORT;

    ctx.drawImage(img, VV.img.IMG_X*m, VV.img.IMG_Y*m);

    var data = canvas.toDataURL('image/jpeg', VV.img.QUALITY);
    delete canvas;
    return callback(data);
}

VV.img.dispTmp = function(imgData) {

    VV.img.TEMP_IMG = new Image();
    VV.img.TEMP_IMG.src = imgData;

    VV.img.TEMP_IMG.onload = function() {

        VV.img.TEMP_IMG.id = 'img_preview2';
        VV.img.TEMP_IMG.style['display'] = 'none';

        document.getElementById('img_background').appendChild(VV.img.TEMP_IMG);

        var tallOrWide = VV.img.tallOrWide(VV.img.TEMP_IMG);

        var $img = $('#img_preview2');

        VV.img.maxWH($img, tallOrWide);
        VV.img.center($img, tallOrWide);


        //transitions
        if($('#img_preview').length > 0) {
            $('#img_preview').slideUp('slow', function() {
                
                
                $('#img_preview2').slideDown('slow', function() {
                    $('#img_preview').remove();
                    $(this).attr('id', 'img_preview');
                });

            });
        } else {

            $('#img_preview2').slideDown('slow', function() {
                $(this).attr('id', 'img_preview');
            });

        }


    }
}
