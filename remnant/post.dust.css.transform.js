                imgAppended = true; //block another img.onload from firing. Firefox bug.
                //img.src = strippedImgData; 
                img.id = 'img_preview2';
                img.style['display'] = 'none';
                document.getElementById('img_background').appendChild(img);
                console.log(STOCK_IMG_H);
                console.log(STOCK_IMG_W);
                if(STOCK_IMG_H > STOCK_IMG_W) {
                    var maxWH = 'max-width';
                } else {
                    var maxWH = 'max-height';
                }
                $('#img_preview2')
                    .css(maxWH, '320px')
                    .css('margin-left', IMG_X)
                    .css('margin-top', IMG_Y)
                    .css('position', 'absolute');

                // img.style[maxWH] = '320px';
                // img.style['margin-left'] = IMG_X + 'px';
                // img.style['margin-top'] = IMG_Y + 'px';

                if(STOCK_IMG_ROTATE) {

                    var rotate = 'rotate(' + STOCK_IMG_ROTATE.toString() + 'deg)';
                    var origin = offset.tX + ' ' + offset.tY;

                    $('#img_preview2').css({
                        '-ms-transform': rotate,
                        '-webkit-transform': rotate,
                        'transform': rotate,
                        '-ms-transform-origin': origin,
                        '-webkit-transform-origin': origin,
                        'transform-origin': origin,
                    });

                    // img.style['-ms-transform'] = rotate;
                    // img.style['-webkit-transform'] = rotate;
                    // img.style['transform'] = rotate;
                    // img.style['-ms-transform-origin'] = origin;
                    // img.style['-webkit-transform-origin'] = origin;
                    // img.style['transform-origin'] = origin;

                }

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