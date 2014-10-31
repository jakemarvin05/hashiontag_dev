
VV = { utils: {} }
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
            if(typeof callback === 'function') return callback($el);
        });

        if(this.elType) { this.killTypeSpecifics(); };
    },
    killTypeSpecifics: function() {
        if(this.elType === 'button') { return this.$el.removeAttr('disabled'); }
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

VV.utils.htmlEntities = function(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
VV.utils.escape = function(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
VV.utils.stripScriptTags = function(str) {
    return String(str).replace('<script>', '').replace('</script>', '');
}
VV.utils.nullIfEmpty = function(str) {
    if(str === '') { return null; }
    return str;
}

module.exports = VV.utils;