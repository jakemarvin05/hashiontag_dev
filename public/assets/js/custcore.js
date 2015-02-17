/*
pinchZoom
dragShifting
scaleSlider
vv button listener
*/

pinchZoom = {
   cachedScale: 1,
   startScale: '',
   sessionScale: '',
   delScale: '',
   appliedScale: 1.2, //start with 1.2 once user tap with 2 fingers it pops out
   maxScale: 2,
   minScale: 1,
   sensitivity: 0.6,
   scrollTop: '',
   scrolled: 0,
   scrollLimit: 350,
   translateX: 0,
   translateY: 0
}
pinchZoom.transform = function(el, scale, x, y) {
    var self = this;
    if(!scale) { var scale = this.appliedScale; }
    if(typeof x !== "number") { 
        var x = self.translateX; 
    } else {
        var x = x + 'px';
    }
    if(typeof y !== "number") { 
        var y = self.translateY; 
    } else {
        var y = y + 'px';
    }
    var transform  = "translate3d("+x+","+y+", 0)";
        transform += " scale3d("+scale+","+scale+", 1) ";

    el.style.transform = transform;
    el.style.oTransform = transform;
    el.style.msTransform = transform;
    el.style.mozTransform = transform;
    el.style.webkitTransform = transform;

}
pinchZoom.resetValues = function() {
    this.scrollTop = '';
    this.scrolled = 0;
    this.appliedScale = 1.2;
    this.translateY = 0;
    this.translateX = 0;
}
pinchZoom.startSession = function(instance, el) {
    var self = this;
    console.log('new instance?');
    if( typeof $(el).attr('data-scale') === "undefined" ) {
        console.log('yes');

        //we need to kill all other ongoing instances here
        //supposing user scaled the other image halfway and then scaled a new one.
        var $ongoing = $('img[data-scale="scaling"]');
        if($ongoing.length > 0) {

            $ongoing.each(function(i, el) {
                self.kill(null, el);
                setTimeout(function() {
                    self.init(el); 
                }, 500);
            });

        }

        //start this instance
        $(el).attr('data-scale', 'scaling');
        $(el).css('position', 'relative');
        $(el).css('z-index', 9999);
        this.resetValues();

        //cached the scroll positon
        this.scrollTop = $(window).scrollTop();

        //pop it out
        this.transform(el, this.appliedScale);

        this.bind(instance, el);

        $(el).unbind('touchstart.pz');
    } else {
        console.log('no');
        this.kill(instance, el);
    }
}
pinchZoom.bind = function(instance, el) {
    var self = this;
    var pinch = instance;
    var id = el.id;

    //bind the scroll listener
    $(window).on('scroll.pz' + el.id, function() {
        console.log('scrolled');
        self.scrolled += self.scrollTop - $(window).scrollTop();
        if(self.scrolled > self.scrollLimit || self.scrolled < -self.scrollLimit) {
            self.kill(pinch, el);           
        }

    });

    //bind the pinching
    this.bindPinch(pinch, el);

    //bind the panning
    this.bindPan(pinch, el);

}
pinchZoom.bindPinch = function(pinch, el) {
    var self = this;
    //bind the pinching.
    pinch.get('pinch').set({ enable: true });

    pinch.on('pinchstart', function(e) {
        //at pinchstart, we define the starting "scale point" of the scale session
        //this needs to be updated at every end of each "pinchmove" cycle.
        self.startScale = e.scale;
        //console.log('startScale: ' + self.startScale);
    });

    pinch.on('pinchmove', function(e) {
        console.log('pinchmoving');

        //record the current scale
        self.sessionScale = e.scale;
        //console.log('sessionScale: ' + self.sessionScale);


        //compare against the previous value
        self.delScale = self.sessionScale - self.startScale;

        //sensitivity correction for scaling down.
        if(self.sessionScale < 1) {
            self.delScale = self.delScale * 3;
        }

        //apply sensitivity
        self.delScale = self.delScale * self.sensitivity;

        //console.log('delScale: ' + self.delScale);

        //add to the applied scale.
        self.appliedScale += self.delScale;
        //console.log('appliedScale: ' + self.appliedScale);

        //we let the user scale till smaller l
        var bufferredMin = self.minScale * 0.8;

        if(self.appliedScale > self.maxScale) {
            self.appliedScale = 2;
        } else if(self.appliedScale < bufferredMin) {
            self.appliedScale = bufferredMin;
        }
        self.transform(el, self.appliedScale);

        //now "shift" the starting point.
        self.startScale = self.sessionScale;

    });

    pinch.on('pinchend', function(e) {
        console.log('pinchend');
        self.cachedScale = self.appliedScale;
        //killed the pinch session when criterias are met
        self.killIfScaledBack(pinch, el, self.appliedScale);
    });
}
pinchZoom.bindPan = function(instance, el) {
    var self = this;

    var cX = 0, cY = 0, //current X,Y
        tX, tY,
        imgW = el.width,
        imgH = el.height,
        winW = $(window).width(),
        buffer = 1.2;

    //if width is large, we assume its a large screen.
    //don't need the panning...
    if(winW > 640) { return false; }

    instance.on('panmove', function(e) {
        console.log('panmove: ' + e.deltaX + ' ' + e.deltaY);
        var edX = e.deltaX,
            edY = e.deltaY;

        tX = cX + edX;
        tY = cY + edY;

        //limits
        var mX = ((imgW * self.appliedScale) - winW) * buffer / 2;

        //when mX is negative, adverse effects occur.
        //so set to zero.
        if(mX < 0) { mX = 0; }
        if(tX > mX || tX < -mX) {
            tX = (tX > 0) ? mX : -mX;
        }
        var mY = imgH/2;
        if(tY > mY || tY < -mY) {
            tY = (tY > 0) ? mY : -mY;
        }
        console.log(tX, tY);

        self.transform(el, null, tX, tY);

    });
    instance.on('panend', function() {
        cX = tX; cY = tY;
        //update the panning params.
        self.translateX = cX + 'px'; self.translateY = cY + 'px';
    });
}
pinchZoom.killIfScaledBack = function(instance, el, scale) {
    //kill pinchZoom if user scaled it back to 1.
    //if scale is less than 1, we assume that user will to restore
    console.log('kill if');
    if(scale <= 1) {
        return this.kill(instance, el);
    }
}
pinchZoom.kill = function(instance, el) {
    var self = this;
    console.log('kill it');
    //unbind all the pinch events.
    if(instance) { 
        instance.get('pinch').set({ enable: false });
        instance.destroy(); 
        $(el).off('tap', 'pinch', 'pan');
    }
    
    //re-initialize the elment
    //setTimeout to avoid ghostclick
    
    setTimeout(function() {
        self.init(el);
    }, 500);
    

    //restore the element back to clean state
    $(el)
        .removeAttr('data-scale')
        .css('position', 'static').css('z-index', 'auto')
        .css('-webkit-transition', '0.3s')
        .css('transition', '0.3s');

    setTimeout(function() {
        $(el)
            .css('-webkit-transition', '0s')
            .css('transition', '0s');
    }, 300);

    this.transform(el, 1, 0, 0);

    //reset values
    this.resetValues();

    //unbind the window event, don't overkill
    var id = el.id;
    $(window).unbind('scroll.pz' + el.id);
    console.log('killed');
}
pinchZoom.init = function(el) {

    var self = this;

    //console.log('initialized');
    var pinch = new Hammer(el);

    //just disable the pinch first, in case instance is dirty.
    //else the element will block natural touch actions.
    pinch.get('pinch').set({ enable: false });

    pinch.on('tap', function(e) {
        console.log('tap');
        self.startSession(pinch, el);
    });

    //we also want start on detect 2 touch
    $(el).on('touchstart.pz', function(e) {
        if(e.originalEvent.touches.length === 2) {
            console.log('2 touches!');
            self.startSession(pinch, el);
        }
    });
}

/*****************
* Drag shifting *
*****************/
var dragShifting = {}
dragShifting.$target = '';
dragShifting.getTarget = function() { dragShifting.$target = $('#img_preview'); return this.$target; }
dragShifting.mousedown = function(self, e) {
    //console.log("Mousedown Event");
    if(self.getTarget().length === 0) { console.log(1); return false; }
    if(e.button === 0 || e.type === "touchstart") {
        if(e.type==="touchstart") {
            if(e.originalEvent.touches.length === 2) {
                return false;
            }
            e.stopPropagation(); e.preventDefault();
            e=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];
        }
        var imgW = self.$target.width(),
            imgH = self.$target.height();

        self.startX = e.pageX;
        self.startY = e.pageY;    
        self.minX = VV.img.CROP_PORT - imgW;
        self.minY = VV.img.CROP_PORT - imgH;
        self.maxX = 0;
        self.maxY = 0;

        $('#cropPort').on("mousemove.ds touchmove.ds", function (e) {
            self.mousemove(self, e)
        });
    }
}
dragShifting.mousemove = function(self, e) {
    //console.log('mousemove');
    e.stopPropagation(); e.preventDefault();
    if (e.type==='touchmove') e=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];

    self.endX = e.pageX;
    self.endY = e.pageY;
    return self.shifter(self);
}
dragShifting.shifter = function (self) {
    VV.img.IMG_X += self.endX - self.startX;
    VV.img.IMG_Y += self.endY - self.startY;
    // Update image position based on Boundary
    if (VV.img.IMG_X < self.minX) {
        VV.img.IMG_X = self.minX;
    } else if (VV.img.IMG_X > self.maxX) {
        VV.img.IMG_X = self.maxX;
    }
    if (VV.img.IMG_Y < self.minY) {
        VV.img.IMG_Y = self.minY;
    } else if (VV.img.IMG_Y > self.maxY) {
        VV.img.IMG_Y = self.maxY;
    }
    // Reset starting offsets
    self.startX = self.endX; self.startY = self.endY;
    // Render image
    self.$target.css({
        'margin-top': VV.img.IMG_Y.toString() + "px",
        'margin-left': VV.img.IMG_X.toString() + "px"
    });  
    $('#cropPortBg img').css({
        'top': VV.img.IMG_Y.toString() + "px",
        'left': VV.img.IMG_X.toString() + "px"
    });  
}
dragShifting.kill = function($el) {
    $el.unbind('mousedown.ds touchstart.ds mousemove.ds touchmove.ds');
}
dragShifting.init = function() {
    var self = dragShifting;

    // Bind drag event to mousedown/touchdown at image container
    $('#cropPort').on('mousedown.ds touchstart.ds', function (e) {
        self.mousedown(self, e);
    });

    // Unbind drag event to mouseup/touchend at window
    $(window).on("mouseup touchend", function () {
        //console.log("Mouseup Event");
        $('#cropPort').unbind('mousemove.ds touchmove.ds');
    });
}

/*******************
* Slider *
*******************/

var scaleSlider = {}

scaleSlider.lengthOf = 280;
scaleSlider.stopLimits = 10; //10px on each side.
scaleSlider.buttonWidth = 0;
scaleSlider.travel = 0;
scaleSlider.currentPosit = 0;
scaleSlider.percent = function() { return scaleSlider.currentPosit / scaleSlider.travel; }
scaleSlider.startX = 0;

scaleSlider.reset = function($el) {
    scaleSlider.currentPosit = 0;
    $el.css('marginLeft', scaleSlider.stopLimits + 'px');
}
scaleSlider.init = function($el) {
    scaleSlider.buttonWidth = $el.width();
    scaleSlider.travel = scaleSlider.lengthOf - (2 * scaleSlider.stopLimits) - scaleSlider.buttonWidth;

    $(window).on("mouseup.sl touchend.sl", function(e) {
        //console.log("mouseup event");
        $(window).unbind("mousemove.sl touchmove.sl");
    })

    $el.on("mousedown.sl touchstart.sl",function(e){
        if($('#img_preview').length === 0) { return false; }
        if (e.button === 0 || e.type === "touchstart") {
            e.stopPropagation(); e.preventDefault();
            if (e.type==="touchstart") e=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];
 
            scaleSlider.startX = e.pageX;

            $(window).on("mousemove.sl touchmove.sl", function(e){

                //console.log('mousemove');
                if (e.type=="touchmove") e=e.originalEvent.touches[0]||e.originalEvent.changedTouches[0];
                endX = e.pageX;
                var moveX = endX - scaleSlider.startX;
                var currentX = scaleSlider.currentPosit;
                var transientX = currentX + moveX;
                var minX = 0;
                var maxX = scaleSlider.travel;

                if(transientX <= minX) {
                   var currentX = minX;
                } else if(transientX >= maxX) {
                   var currentX = maxX;
                } else {
                   var currentX = transientX;
                }
                //update
                scaleSlider.currentPosit = currentX;
                var margin = currentX + scaleSlider.stopLimits;
                $el.css('margin-left', margin + 'px');
                var scale = scaleSlider.percent() + 1;
                VV.img.scaler(scale, $('#img_preview'), $('#cropPortBg img'));
                // Reset starting offsets
                scaleSlider.startX = endX;
            });
        }
    });
}
scaleSlider.pinch = {}
scaleSlider.pinch.sensitivity = 0.6;
scaleSlider.pinch.init = function(el) {

    var oScale = 0;

    pinchCropPort = new Hammer(el);
    pinchCropPort.get('pinch').set({ enable: true });

    pinchCropPort.on('pinchstart', function(e) {
        oScale = e.scale;
    });

    pinchCropPort.on('pinchmove', function(e) {
        var newScale = e.scale;
        var delScale = newScale - oScale;
        delScale = delScale * VV.img.CROP_PORT * scaleSlider.pinch.sensitivity;
        //$('#desc').val(newScale.toString() + ' ' + oScale.toString() + ' ' + delScale.toString());
        var currentX = scaleSlider.currentPosit;
        var transientX = currentX + delScale;
        var minX = 0;
        var maxX = scaleSlider.travel;

        if(transientX <= minX) {
           var currentX = minX;
        } else if(transientX >= maxX) {
           var currentX = maxX;
        } else {
           var currentX = transientX;
        }
        scaleSlider.currentPosit = currentX;
        var scale = scaleSlider.percent() + 1;
        var margin = currentX + scaleSlider.stopLimits;
        $('#scaleSliderBut').css('margin-left', margin + 'px');
        VV.img.scaler(scale, $('#img_preview'), $('#cropPortBg img'));
        oScale = newScale;  
    });
};

/* 
 ***VV.buttonListener is the new way to bind buttons.

 * All clicks are binded to the buttonListener, which checks if a click landed on a button.
 * Retrospectively added buttons will be caught by this listener, without the need to
 * initialize the buttons.

 * Specify the task for the button by appending to VV.buttonTasks
 */
VV.extend('buttonListener', function() {
    var self = this;
    $(window).on('click.buttonListener', function(e) {
        var $t = $(e.target);

        var task = $t.attr('data-task');
        if (!task) { return; }
        if (!self.buttonTasks[task]) { return; }

        return self.buttonTasks[task]($t, e);
        
    });
});
VV.buttonListener();