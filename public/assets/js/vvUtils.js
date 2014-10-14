if((typeof VV) === 'undefined') { var VV = {} }

VV.utils = {}

VV.utils.Flasher = {
    state: false,
    elType: false,
    $el: false,
    speed: 500,
    run: function($el, type) {
        console.log(this);
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
            if(typeof callback === 'function') return callback($el);
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
VV.utils.trim = function(string, length, dontStrip) {
    var string = string;
    if(!dontStrip) { 
        var string = this.stripHTML(string);
    }
    string = string.substring(0,length);
    var i = length - 1;
    var run = true;
    while(run) {
        if(string[i] == " ") {
            run = false;
        }
        i--;
    }
    return string.substring(0, i+1) + "...";
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
        console.log(msg.text);
        $.fancybox.open([{
            href : '#error' + uid,
            title : title
        }], {
            padding : 40,
            maxWidth: 400  
        });     
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

    //modify commenting when fully implemented
    //var sizes = ['full','half','small','thumb'];
    //if(sizes.indexOf(type) < 0) { console.log('imageGetter error. not such image size'); return imgUUID;}
    //options:
    var includePath = true;
    if(opts) {
        if(opts.includePath === false) {
            includePath = false;
        }
    }

    var imgFileName = imgUUID;
    // if(type === 'full') {
    //     //do nothing
    // } else {
    //     imgFileName += '-' + type;
    // }
    var imgPath = '';
    if(includePath) {
        imgPath = printHead.p.mediaDir + '/' + imgFileName;
    }
    imgPath += '.jpg';
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


