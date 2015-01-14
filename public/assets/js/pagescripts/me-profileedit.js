function editProfile() {
    var $header = $('.profileHeader'),
        $editBtn = $('#editProfileButton'),
        $updateBtn = $('#updateProfileButton'),
        $cancelBtn = $('#cancelButton'),
        $normalD = $('div[data-vel="normalDisplay"]'),
        $editD = $('div[data-vel="editDisplay"]'),
        $profilePic = $('.profilePictureCont'),
        $profileEditPicButtons = $('.profileEditPicButtons'),
        $profileEditPicOk = $('#profileEditPicOk'),
        $profileEditPicCancel = $('#profileEditPicCancel'),
        $profileEditPicText = $('#profileEditPicText'),
        hasNoPosts = false;
        hasAppendedThumb = false; //reset this when the user load more post!

    $editBtn.click(function () {
        //set height temporarily to prevent container from collapsing.
        $header.css('height', $header.height());

        $normalD.velocity('transition.slideLeftOut', {
            duration: 200,
            complete: function() {

                $editD.velocity('transition.slideRightIn', 200, function() {
                    $header.css('height', 'auto');
                });
                
            }
        });
        if(!hasAppendedThumb) { thumbNailer(); }
        //bind the profile picture with the editing, provided user has posts
        if(hasNoPosts) { 
            profilePicBinder.noPost();
        } else {
            profilePicBinder.bind();
        }

    });
    $updateBtn.click(function() {
        //if the profilePicture is still enlarged, skrink it.
        if($profilePic.attr('data-enlarged')) {
            $profilePic.velocity({width: $profilePic.attr('data-width')}, 200);
            keepThumnailer();
        }
    });

    $cancelBtn.click(function(e) {
        e.preventDefault();

        document.removeEventListener('backbutton.edit');

        $('#profileInputs input').each(function(i, elem) {
            var o = $(elem).attr('data-orgin');
            $(elem).val(o);
        });
        $('#profileInputs select').each(function(i, elem) {
            var o = $(elem).attr('data-orgin');
            if(o) {
                $(elem).val(o);                
            } else {
                $(elem).val('');
            }

        });
        $('#profileInputs textarea').each(function(i, elem) {
            var o = $(elem).attr('data-orgin');
            $(elem).val(o);
        });

        //change back and reduce back the picture size.
        var imgid = renderJSON.profilePicture;
        $('.profilePictureCont img').attr('src', printHead.p.mediaDir + '/' + imgid + '.jpg');
        var width = $profilePic.attr('data-width');

        //if the profilePicture is still enlarged, skrink it.
        if($profilePic.attr('data-enlarged')) {
            $profilePic.velocity({width: $profilePic.attr('data-width')}, 200);
            keepThumnailer();
        }

        //transit back
        $header.css('height', $header.height());
        $editD.velocity('transition.slideLeftOut', {
            duration: 200, 
            complete: function() {
                $normalD.velocity('transition.slideRightIn', 200, function() {
                    $header.css('height', 'auto');
                });
            }
        });

        keepThumnailer();
        profilePicBinder.unbind();
    });

    var profilePictureCacheWidth = function(pic) {
        if(typeof $(pic).attr('data-width') === 'undefined') { 
            var width = $(pic).css('width') || $(pic).width() + 'px';
            $(pic).attr('data-width', width);
        }
    }
    var keepThumnailer = function() {
        $('#thumbnailScrollerWrap').velocity('transition.slideUpOut', 200);
    }

    var profileEditPic = {
        flag: false,
        ok: function() {
            var self = this;
            $profileEditPicOk.bind('click.picOk', function() {
                //return so that it can't be doubletapped.
                if(self.flag) { return false; }
                
                self.flag = true;
                setTimeout(function() {
                    self.flag = false;
                }, 200)

                //change out
                $profileEditPicButtons.velocity('fadeOut', 200, function() {
                    $profileEditPicText.velocity('fadeIn', 200);
                });

                //reduce back the picture size.
                var width = $profilePic.attr('data-width');
                $profilePic.velocity({width: width}, 200);

                //change out the imgId
                $('.profilePictureCont img').attr('data-imgid', $('.profilePictureCont img').attr('data-temp'));

                keepThumnailer();
                profilePicBinder.bind();

            });
        },
        cancel: function() {
            var self = this;
            $profileEditPicCancel.bind('click.picCan', function() {
                //return so that it can't be doubletapped.
                if(self.flag) { return false; }
                
                self.flag = true;
                setTimeout(function() {
                    self.flag = false;
                }, 200)

                //change out
                $profileEditPicButtons.velocity('fadeOut', 200, function() {
                    $profileEditPicText.velocity('fadeIn', 200);
                });

                //if picture is still enlarged, skrink and keep thumbnailer.
                if($profilePic.attr('data-enlarged')) {
                    $profilePic.velocity({width: $profilePic.attr('data-width')}, 200);
                    keepThumnailer();
                }

                //if already selected a picture, put the original picture back.
                var imgid = $('.profilePictureCont img').attr('data-imgid');
                $('.profilePictureCont img').attr('src', printHead.p.mediaDir + '/' + imgid + '.jpg');

                profilePicBinder.bind();
            });
        },
        init: function() {
            this.ok();
            this.cancel();
        }
    }
    profileEditPic.init();

    var profilePicBinder = {
        noPost: function() {

            console.log('nopost');
            var div = document.createElement('div');
            div.id = "noPostsAlert";
            div.style.display = "none";
            div.style.textAlign = "center";
            div.innerHTML  = '<p>You do not have any post to set as profile picture. Do you want to create a new post?</p>';
            div.innerHTML += '<a href="' + printHead.p.absPath + '/post">Yes, bring me there.</a> | ';
            div.innerHTML += '<a href="javascript:$.fancybox.close();"> No Thanks</a>';
            if($('#noPostsAlert').length === 0) { console.log('append');$('body').append(div); }

            $profilePic
                .css('cursor', 'pointer')
                .on('click.edit', function() {
                    $.fancybox.open([{
                        href : '#noPostsAlert',
                        title : ''
                    }], {
                        padding : 10
                    });
                });
        },
        bind: function() {
            var self = this;
            //bind the profile picture with the editing.
            $profilePic
                .css('cursor', 'pointer')
                .on('click.edit', function() {
                    //unbind yourself
                    self.unbind();

                    //cache the width and make it larger
                    profilePictureCacheWidth(this);
                    $(this).attr('data-enlarged','true').velocity({width:"320px"}, 200);

                    //slide the thumbnailer out
                    $('#thumbnailScrollerWrap').velocity('transition.slideDownIn', 200);

                    //change out the text below
                    $profileEditPicText.velocity('fadeOut', 200, function() {
                        $profileEditPicButtons.velocity('fadeIn', 200);
                    });

                });

        },
        unbind: function() {
            $profilePic.css('cursor', 'default').unbind('click.edit');
        }
    }
    $profileEditPicText.on('click.edit', function() {
        if(hasNoPosts) { return profilePicBinder.noPost(); }
        profilePicBinder.unbind();

        //cache the width and make it larger
        profilePictureCacheWidth($profilePic);
        $profilePic.attr('data-enlarged','true').velocity({width:"320px"}, 200);

        //slide the thumbnailer out
        $('#thumbnailScrollerWrap').velocity('transition.slideDownIn', 200);

        //change out yourself
        $(this).velocity('fadeOut', 200, function() {
            $profileEditPicButtons.velocity('fadeIn', 200);
        });
    });


    var thumbNailer = function() {
        //prepare the thumbnails
        var thumbCount = 0,
            thumbWidth = false,
            $profileImg = $('.profilePictureCont img')
            profileImgId = $profileImg.attr('data-imgid'),
            profileImgSrc = $profileImg.attr('src');

        //append the first image with the current profile image.
        //provided its not the empty one.
        if(profileImgId) {
            var img = new Image();
             img.src = profileImgSrc; 
            //IE10 has no support for .dataset.
            //img.dataset.imgid = profileImgId;
            $('#thumbnailScroller').append(img);
            $(img).attr('data-imgid', profileImgId);
        }

        //then append the rest
        var $posts = $('article .blockImgHolder img');
        if($posts.length === 0) { return hasNoPosts = true; }
        $posts.each(function(i, elem) {
            var imgid = $(elem).attr('data-imgid');
            var uid = parseFloat($(elem).closest('article').attr('data-uid'));
            if(imgid) {

                //don't append if this is the profile picture, cause its in the first position alr.
                var isNotProfileImg = (imgid !== profileImgId);
                //and don't append if it is attributed post.
                var isNotAttr = (uid === printHead.userHeaders.userId);
                //don't append if it is error img.
                var isNotErr = (elem.className !== "errorImg" && elem.src.indexOf('image404') === -1);

                if(isNotProfileImg && isNotAttr && isNotErr) {

                    //else continue.
                    var img = new Image();
                    img.src = $(elem).attr('src');
                    img.dataset.imgid = $(elem).attr('data-imgid');
                    $('#thumbnailScroller').append(img);

                    //cached the thumbWidth on the first one.
                    if(!thumbWidth) { thumbWidth = parseFloat($(img).css('width')); }

                }
            thumbCount++;
            }     
        });

        //bind all thumbnails to change the profile picture.
        $('#thumbnailScroller img').click(function() {
            var imgid = $(this).attr('data-imgid');
            $('.profilePictureCont img')
                .attr('src', printHead.p.mediaDir + '/' + imgid + '.jpg')
                .attr('data-temp', imgid);
        });

        //determine the thumbscroll width so that it can be scrolled.
        var offset = 0;
        var scrollerWidth = (thumbWidth*thumbCount)+offset;
        $('#thumbnailScroller').css('width', scrollerWidth +'px');

        hasAppendedThumb = true;
    }
}
editProfile();


/* jQuery validate options */

var profileAjax;
$('#profileInputs').validate({
    rules: {
        email: {
            required: true,
            email: true
        }
    },
    messages: {
        email: {
            required: ''
        }
    },
    errorPlacement: function(error, element) {
        element.velocity('callout.shakeShort');
    },
    submitHandler: function() {

        var $buttons = $('#profileInputs').find('button');
        $buttons.attr('disabled','disabled');

        var flasher = Object.create(VV.utils.Flasher);
        flasher.run($('#profileInputs button[type="submit"]'), 'button');
 
        // Get some values from elements on the page:
        var $form = $('#profileInputs');
        var data = $form.serialize();

        //check if profile image has changed. If not, don't add to data.
        var imgid = $('.profilePictureCont img').attr('data-imgid');
        if(imgid !== printHead.userHeaders.profilePicture) {
            data += '&picture=' + $('.profilePictureCont img').attr('data-imgid');
        }


        url = printHead.p.absPath + '/api/updateprofile',
        submitButton = $form.find('button[id="submit"]');

        // Send the data using post
        profileAjax = $.post(url, data);
        //done
        profileAjax.done(function(data) {
            console.log(data);
            if(data.success) {
                window.location.href = printHead.p.absPath + "/me";
            } else {
                alertFactory.protoAlert('Oops! An unknown error has occured! Please refresh and try again.');
                flasher.kill();
                $buttons.removeAttr('disabled');
            }
        });
        //fail
        profileAjax.fail(function(err) {
            if(err.statusText === 'abort') { return false; }
            alertFactory.protoAlert('Please either login or check your internet connection.');
            flasher.kill();
            $buttons.removeAttr('disabled');
        });
    }
});