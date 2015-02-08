/*
Flasher: ObjectQueryString: function () {
alertFactory: ObjectcheckNested: function (obj) {
dataAppend: ObjectdeletePostAjax: function (pid, uid, isProfilePicture) {
ensureLink: function ($link) {
errorReceiver: function (hash) {
getDOMHTML: function ($dom) {
getRandom: function (arr, size) {
hideSettingsTab: function () {
htmlEntities: function (str) {
imageGetter: function (imgUUID, type, opts) {
imgToBin: function (data) {
inputsAutosize: function ($el, minsize) {
inputsRestrict: function ($el, opts) {
loadImageAndNeighbours: function ($img) {
loaderEffect: ObjectobjCount: function (obj) {
resetFormElement: function ($el) {
stripHTML: function (html) {
tooLong: function ($el, opts) {
trim: function (string, length, dontStrip) {
*/


if((typeof VV) === 'undefined') { var VV = {} }

VV.utils = {};

VV.utils.Flasher = {
    state: false,
    elType: false,
    $el: false,
    speed: 500,
    run: function($el, type) {
        this.state = true;
        this.$el = $el;
        this.elType = type;
        //'type' related triggers
        if(type) { this.runTypeSpecifics(); };

        $el.velocity("fadeOut", {
            duration: this.speed, loop: true 
        });
    },
    runTypeSpecifics: function() {
        if(this.elType === 'button') { return this.$el.attr('disabled','disabled'); }
    },
    kill: function(callback) {
        if(typeof this.$el === 'undefined') { return false; }
        var self = this;
        this.$el.velocity("stop").velocity("fadeIn", 300, function(el) {
            self.state = false;
            if(typeof callback === 'function') return callback(self.$el);
        });

        if(this.elType) { this.killTypeSpecifics(); };
    },
    killTypeSpecifics: function() {
        if(this.elType === 'button') { return this.$el.removeAttr('disabled'); }
    }
}

VV.utils.loaderEffect = {
    $sl: '',
    $studs: '',
    color: '#ef4549',
    html: '<div class="searchLoader" style="display:none;"><div class="searchLoaderStud"></div><div class="searchLoaderStud"></div><div class="searchLoaderStud"></div><div class="vaDiv"></div></div><div class="searchQueryMessage" style="display:none;"></div>',
    run: function() {
        var speed = 200,
            self = this;
        this.$sl.velocity('stop').velocity('fadeIn', speed);
        this.$studs.each(function(i, el) {
            $(el).delay(i*speed).velocity({'backgroundColor': self.color}, {duration: speed, delay: speed, loop: true})
        });
    },
    kill: function(callback) {
        this.$sl.hide();
        this.$studs
            .velocity('stop')
            .css('background-color', '#ccc');
        if(callback) return callback();
    },
    init: function($cont) {
        $cont.html(this.html);
        this.$sl = $cont.find('.searchLoader');
        this.$studs = $cont.find('.searchLoaderStud');
    }
}

VV.utils.objCount = function(obj) {
    if( (typeof obj != undefined) && obj ) {
        return Object.keys(obj).length;
    } else {
        return 0;
    }
}

VV.utils.getRandom = function(arr, size) {
    var shuffled = arr.slice(0), i = arr.length, temp, index;
    while (i--) {
        index = Math.floor((i + 1) * Math.random());
        temp = shuffled[index];
        shuffled[index] = shuffled[i];
        shuffled[i] = temp;
    }
    return shuffled.slice(0, size);
}

VV.utils.stripHTML = function(html) {
   var tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}
VV.utils.trim = function(string, length, opts, dontStrip) {
    if (typeof length === "undefined" || typeof string === "undefined") { return string; }

    //default opts.
    var defaults = {
        trimLastWord: true //suppose the truncation cuts off the middle of the last word, trim it. 
    }

    if (typeof opts !== "object") {
        var opts = Object.create(defaults);
    } else {
        opts.__proto__ = defaults;
    }


    if(!dontStrip) { 
        var string = this.stripHTML(string);
    }

    if (string.length <= length) { return string; }

    var newString = string.substring(0,length+1);

    //check if the last word is cut-off
    if (opts.trimLastWord && string[length+2]) { 

        if (string[length+2].match(/[a-z]/i)) {
            //the character succeeding the end of the truncation is a character
            //means that a word has been cut off. trim it.
            var i = length - 1;
            var run = true;
            while(run && i > -1) {
                if(!newString[i].match(/[a-z]/i)) {
                    run = false;
                }
                i--;
            }
            newString = newString.substring(0, i+1);
        }
    }


    return newString + "...";
}

VV.utils.htmlEntities = function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


VV.utils.checkNested = function(obj) {
  var args = Array.prototype.slice.call(arguments),
      obj = args.shift();
  for (var i = 0; i < args.length; i++) {
    if (!obj || !obj.hasOwnProperty(args[i])) {
      return false;
    }
    obj = obj[args[i]];
  }
  return true;
}


VV.utils.alertFactory = {
    protoAlert: function(msg) {
        if(typeof msg !== 'string') {
            var text = msg.text,
            title = msg.title;
        } else {
            var text = msg,
            title = "Alert" //default title
        }
        var uid = new Date().getTime();
        $('body').append('<div id="error' + uid + '" style="display:none;">' + text + '</div>');

        var defaults = {
            padding : 40,
            maxWidth: 400  
        };
        
        $.fancybox.open([{
            href : '#error' + uid,
            title : title
        }], defaults);     
    },
    commentError: function() {
        var msg = {
            text: 'Error: Please either login or check your internet connection',
            title: 'Error'
        }
        
        this.protoAlert(msg);
    }
}
var aF = VV.utils.alertFactory;
//for backward compatibility
var alertFactory = VV.utils.alertFactory;

VV.utils.imageGetter = function(imgUUID, type, opts) {

    //half 320x320
    //small 160x160
    //thumb 70x70

    //console.log('req for ' + imgUUID + ' ' + type);
    var sizes = ['full','half','small','thumb'];
    if(sizes.indexOf(type) < 0) { var type = "full" }
    //options:
    var includePath = true;
    if(opts) {
        if(opts.includePath === false) {
            includePath = false;
        }
    }

    var imgFileName = imgUUID;
    if(type !== 'full') { imgFileName += '-' + type; }
    var imgPath = '';
    var fullPath = printHead.p.mediaDir + '/' + imgFileName + '.jpg';
    if(includePath) { 
        imgPath = fullPath; 
    } else {
        imgPath = imgUUID + '.jpg';
    }

    //we also attempt to load the "children sizes" to see if there
    //are any errors.
    //console.log(imgUUID + ' ' + type);
    if(type !== "full") {

        var img = new Image();
        //if we have a loading error, just work the remakeImg api.
        img.onerror = function() {
            //make an AJAX to get server to create the file
            $.post(printHead.p.absPath + '/api/remakeImg', {imgid: imgUUID, size: type});
        }
        img.src = fullPath;
    }
    return imgPath;
}
VV.utils.resetFormElement = function($el) {
  $el.wrap('<form>').closest('form').get(0).reset();
  $el.unwrap();
}

VV.utils.errorReceiver = function(hash) {
    /* the hash takes the form of
        {where: "vvImg.js",
        errType: "iOS resizing problem",
        errData: data}
    */

    $.post(printHead.p.absPath + '/api/errorreceiver', hash);
}

VV.utils.deletePostAjax = function(pid, uid, isProfilePicture) {
    var ajax = $.post('/api/post/delete', {pid:pid});
    if(printHead.page === "singlePost") {
        return window.location.href = printHead.p.absPath + '/';
    }

    $.fancybox.close();
    var $articleToDel = $('article[data-pid="' + pid + '"]')
    if(uid === printHead.userHeaders.userId) {
        if(isProfilePicture) {
            ajax.done(function() {
                window.location.href = window.location.href;
            });
        }
    }
    $articleToDel.velocity('fadeOut', 200, function(el) {
        $(el).remove();
    });
}

VV.utils.loadImageAndNeighbours = function($img) {

    var $article = $img.closest('article'),
        $thisArtImg = $img,
        $prevArtImg = $article.prev().find('.postImage'),
        $nextArtImg = $article.next().find('.postImage');

    var images = [$thisArtImg, $nextArtImg, $prevArtImg];
    //console.log(images);

    for(var i=0; i<3; i++) {
        var $image = images[i];
        if($image.hasClass('loadingHighQuality')) { continue; }

        var imgid = $image.attr('data-imgid'),
            src = $image.attr('src');
        if(typeof src === "undefined") { continue; }
        //get only the filename
        src = src.substring(src.lastIndexOf('/')+1);

        if(src === imgid) { continue; }

        $('.fancyArticle .' + imgid).attr('src', printHead.p.absPath + '/images/imgLoaderHolder.png');

        getImage(imgid); 
    }

    function getImage(imgid) {
        //console.log('getting ' + imgid);
        $('.imgid').addClass('loadingHighQuality');

        var img = new Image();
        img.onload = function() { 
            $('.' + imgid)
                .attr('src', this.src)
                .removeClass('loadingHighQuality')
                .css('opacity', 1);
        }
        img.src = VV.utils.imageGetter(imgid);
    }

}
/* tooLong is deprecated and subsumed into inputsRestrict */
VV.utils.tooLong = function($el, opts) {
    var msg = 'Your input is too long...';
    var limit = 2000;

    if(typeof opts.msg !== "undefined") {
        msg = opts.msg;
    }
    if(typeof opts.limit !== "undefined") {
        limit = opts.limit;
    }
    $el.on('keyup', function(e) {
        var $t = $(this), len = $t.val().length;

        if(len > limit) {
            e.preventDefault();
            aF.protoAlert(msg);
            var cut = $t.val().substring(0,limit);
            $t.val(cut);
        }
    });
}
VV.utils.ensureLink = function($link) {
    var href = $link.attr('href');
    if(href.indexOf('http') === -1) {
        return $link.attr('href', '//' + href);
    }
    return false;
}

VV.utils.QueryString = function () {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
}

VV.utils.hideSettingsTab = function () {
    var $settingsBut = $('.settingsButton');
    $('.blockInteractSettingsWrap').hide();
    $settingsBut.removeClass('settingActive');
}

VV.utils.getDOMHTML = function($dom) {
    var d = $dom.wrap('<div></div>');
    var html = d.parent().html();
    d.unwrap();
    return html;
}

/* inputsRestrict */
VV.utils.inputsRestrict = function($el, opts) {
    if (!($el instanceof $)) { var $el = $(el); }
    return this[opts.type]($el, opts);
}
    /* jquerify my methods for $ chaining. */
    $.fn.extend({
        inputsRestrict: function(opts) {
            if (VV.utils.inputsRestrict[opts.type]) { 
                VV.utils.inputsRestrict[opts.type]($(this), opts); 
                if (typeof opts.limit !== "undefined" && opts.type !== "inputLength") {
                    VV.utils.inputsRestrict.inputLength($(this), opts);
                }
                return true;
            }
            return console.log('utils.inputsRestrict: check inputs restrict method type. not defined.')
        }
    });

VV.utils.inputsRestrict.price = function($el, opts) {
    $el.on("keypress keyup blur", function (event) {
        $(this).val($(this).val().replace(/[^0-9\.]/g,''));
        if ((event.which != 46 || $(this).val().indexOf('.') != -1) && (event.which < 48 || event.which > 57)) {
            event.preventDefault();
        }

        if ($(this).val().length === 0 && event.which == 48 ){
            event.preventDefault();
        }

        if ($(this).val()[0] === '0' || $(this).val()[0] === 0) { 
           $(this).val( $(this).val().substring(1) );
        }
    });

    //default price to limit of 10
    if (opts.noLimit) { return $el; }
    if (typeof opts.limit === "undefined") { opts.limit = 10; }
    return this.inputLength($el, opts);
}

VV.utils.inputsRestrict.numbers = function($el, opts) {
    $el.on("keypress keyup blur", function (event) {    
        $(this).val($(this).val().replace(/[^\d].+/, ""));
        if ((event.which < 48 || event.which > 57)) {
            event.preventDefault();
        }

    });
    return $el;
}
VV.utils.inputsRestrict.alphaNumeric = function($el, opts) {
    var regex = new RegExp("^[a-zA-Z0-9\-]+$");
    if (typeof opts.regex !== "undefined") { regex = opts.regex; }
    $el.on("keypress keyup blur", function (event) {   
        var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
        if (!regex.test(key)) {
           event.preventDefault();
           return false;
        }
    });
    return $el;
}
VV.utils.inputsRestrict.inputLength = function($el, opts) {

    //defaults
    var msg = 'Your input is too long...';
    var limit = 2000;
    var alert = true;

    if (typeof opts.msg !== "undefined") { msg = opts.msg; }
    if (typeof opts.limit !== "undefined") { limit = opts.limit; }
    if (typeof opts.alert !== "undefined") { alert = opts.alert; }

    $el.on('keyup', function(e) {
        var $t = $(this), len = $t.val().length;

        if(len > limit) {
            e.preventDefault();
            if (alert || alert === "true") { aF.protoAlert(msg); }
            var cut = $t.val().substring(0,limit);
            $t.val(cut);
        }

    });

    return $el;
}

VV.utils.inputsAutosize = function($el, minsize) {
    function resizeInput() {
        var len = $(this).val().length;

        if (minsize) {
            if (len < minsize) { 
                $(this).attr('size', minsize);
                return $(this); 
            }
        } 
        $(this).attr('size', len);
    }

    if (!($el instanceof $)) { var $el = $($el); }
    $el.keyup(resizeInput).each(resizeInput);
    return $el;
}

    /* jquerify my methods for $ chaining. */
    $.fn.extend({
        inputsAutosize: function(minsize) { return VV.utils.inputsAutosize($(this), minsize); }
    });

VV.utils.imgToBin = function(data) {
    var blobBin = atob( data.split(',')[1] );
    var array = [];
    for(var i = 0; i < blobBin.length; i++) {
        array.push(blobBin.charCodeAt(i));
    }
    var file = new Blob([new Uint8Array(array)], {type: 'image/jpeg'});

    return file;
}

VV.utils.dataAppend = {

    run: function($e) {
        if (typeof this.attrs === "undefined") { this.attrs = {}; }
        if ($e.hasClass('inputSingle')) { return this.simple($e); }
        if ($e.hasClass('inputSpecial')) { return this.complex($e); }
    },

    simple: function($e) {
    
        //all inputSingle fields are appended with key = name attribute, value = val()
        return this.attrs[$e.attr('name')] = $e.val();
    },

    //pass in acceptEmpty `true` to allow dataAppend to build empty value to JSON key.
    complex: function($e, acceptEmpty) {

        var self = this;

        var name = $e.attr('name');
        var val = $e.val();

        if (!val && !acceptEmpty) { return false; } //don't accept empty values.

        //branches management
        var branches = $e.attr('data-branch');

        //key value pair management
        var isKey = ($e.attr('data-type') === "key");
        var isValue = ($e.attr('data-type') === "value");

        //key value type.
        if(isKey || isValue) {

            if(isKey) {
                return false; //don't need to create anything for key
            }
            if(isValue) {
                //get the key
                var groupClass = $e.attr('data-groupedcont');
                var key = $e.closest(groupClass).find('input[data-type="key"]').val();

                // don't set value if this value is empty or if key is empty.
                if (!key || !val) {
                    //key or val is undefined or empty
                    return false;
                }
                var setVal = val;
            }

            var chain = branches + '.' + key;
            D.set(self.attrs, chain, setVal);

        } else {
            //simple branch type
            var chain = branches;
            D.set(self.attrs, chain, val)
        }
        
    }
};
