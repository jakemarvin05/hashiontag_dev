                //offset function.
                function offsets(width, height, limit, rotate) {
                    console.log('offsets()');
                    //default values
                    var offset = {
                        marginLeft: 0,
                        marginTop: 0,
                        tX: '50%',
                        tY:'50%'
                    };

                    if(height>width) {

                        resizedWidth = limit;
                        resizedHeight = limit / (width/height);

                        var delta = Math.abs(resizedWidth - resizedHeight);
                        offset.marginLeft = 0;

                        // Case 1: marginTop for clockwise 90/180 rotate is negative (pull up)
                        offset.marginTop = -delta/2;

                        if(rotate === 180 || rotate === 0) {
                            return offset;
                        }

                        //Case 2: for CCW rotation marginTop position (push down)
                        if(rotate === - 90) {
                            offset.marginTop = -offset.marginTop;
                        }


                        //origin of rotation
                        offset.tX = ( limit/2/resizedHeight *100 ).toString() + '%';
                        offset.tY = '50%';


                    } else if(width === height) {
                        return offset;
                    } else {

                        resizedHeight = limit;
                        resizedWidth = limit * (width/height);

                        var delta = Math.abs(resizedWidth - resizedHeight);

                        // Case 1: marginLeft for clockwise 90/180 rotate is negative (pull left)
                        offset.marginLeft = -delta/2;
                        offset.marginTop = 0;

                        if(rotate === 180 || rotate === 0) {
                            return offset;
                        }

                        //Case 2: for CW rotation is marginLeft position (push right)
                        if(rotate === 90) {
                            offset.marginLeft = -offset.marginLeft;
                        }

                        offset.tX = '50%';
                        offset.tY = ( limit/2/resizedWidth *100 ).toString() + '%';
                    }


                    return offset;
                }



                if( typeof atob === 'function' && typeof BinaryFile === 'function') {

                    var base64 = e.target.result.replace(/^.*?,/,''),
                        binary = atob(base64),
                        exif = EXIF.readFromBinaryFile(new BinaryFile(binary));

                    console.log(exif);
                    if(exif) {
                        STOCK_IMG_EXIF = exif
                    }
                }

                if(!$.isEmptyObject(STOCK_IMG_EXIF)) {
                    if(STOCK_IMG_EXIF.Orientation) {

                        var orientation = parseFloat(STOCK_IMG_EXIF.Orientation);


                        if(orientation === 1 || orientation === 2) {

                            var offset = offsets(img.width, img.height, cropDisp, 0);

                        }

                        if(orientation === 3 || orientation === 4) {
                            STOCK_IMG_ROTATE = 180;

                            var offset = offsets(img.width, img.height, cropDisp, STOCK_IMG_ROTATE);

                        } else if(orientation === 5 || orientation === 6) {
                            STOCK_IMG_ROTATE = 90;

                            var offset = offsets(img.height, img.width, cropDisp, STOCK_IMG_ROTATE); //need to flip img.height and width around;

                        } else if(orientation === 7 || orientation === 8) {
                            STOCK_IMG_ROTATE = -90;

                            var offset = offsets(img.height, img.width, cropDisp, STOCK_IMG_ROTATE); //need to flip img.height and width around;
                        }
                        
                    }

                } else {
                    var offset = offsets(img.width, img.height, cropDisp, 0);
                }

                //set my global X-Y offsets
                IMG_X = offset.marginLeft;
                IMG_Y = offset.marginTop;

/* END STEP 2 */