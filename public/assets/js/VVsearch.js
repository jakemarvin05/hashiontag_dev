if(typeof VV === 'undefined') { VV = {} }
VV.search = {
    timeout: [],
    timeoutDuration: 1200,
    proceed: false,
    ajaxFired: false,
    ajaxedQuery: false,
    enterBlock: false,
    ajax: '',
    uri: '',
    $searchInput: undefined,
    $loaderWrap: undefined,
    $sqm: undefined,
    $resultCont: undefined,
}
VV.search.cachedQuery = {};
VV.search.cacheManager = function(query) {
    /* GOTCHA: to address keyup double firing bug */
    var query = query.toLowerCase();
    if (typeof this.QUERY === 'undefined') {
        this.QUERY = query;
    } else {
        if (this.QUERY === query) { return true; }
        else {this.QUERY = query }
    }
    /* end GOTCHA */

    if (this.ajaxedQuery) {
        if (query === this.ajaxedQuery) { 
            //console.log('same query, returning');
            //check if the results is hidden. if yes, show it.
            if(this.$resultCont.css('display') === 'none') {
                this.$resultCont.velocity('stop').velocity('transition.slideRightIn', 200);
                return true;
            }
        } else {
            var $newCont = this.cachedQuery[query];
            //query is not the same, but check if it has been cached.
            if($newCont) {
                //console.log('cached query, returning the cache');
                this.ajaxedQuery = query;
                if(this.$resultCont.css('display') === 'none') {
                    //append the new resultCont and remove the present one.
                    this.$resultCont
                        .before($newCont)
                        .remove();
                    //set the new resultCont reference. transit it in.
                    this.$resultCont = $newCont.velocity('stop').velocity('transition.slideRightIn', 200);
                    return true;
                } else {
                    this.$resultCont
                        .velocity('stop')
                        .hide()
                        .before($newCont)
                        .remove();
                    this.$resultCont = $newCont.velocity('transition.slideRightIn', 200);
                    return true;
                }
            }
        }
    };
};
VV.search.searchAjax = function(query) {
    //just to be safe, we abort ajax and clear all timeouts.
    if (typeof this.ajax.abort === "function") { this.ajax.abort(); }
    for(var i in this.timeout) {
        clearTimeout(this.timeout[i]);
    }
    //then empty the container
    this.$resultCont.html('');

    //start the new ajax.
    this.ajaxFired = true;
    //console.log('ajax fired');
    var self = this;
    // AJAX post
    this.ajax = $.post( printHead.p.absPath + this.uri, {query: query});

    //done
    this.ajax.done(function(data) {   
        if(data.success) {
            self.ajaxedQuery = query;
            //pass _cacheCallback into ajaxCallback so that it can be called again if
            //it is async
            self.ajaxCallback(data, _cacheCallback);
            //cache the query... for the fickled minded...
            _cacheCallback();
        } else {
            //console.log('error');
            return self.loaderEffect.kill(function() {
                if (!self.$sqm) { return false; }
                self.$sqm
                    .html('An error has occured. Please refresh and try again.')
                    .velocity('fadeIn', 200);
            });
        } 

        return self.loaderEffect.kill();
    });
    //fail
    this.ajax.fail(function(err) {
        console.log(err);
        if(err.statusText === 'abort') { return false; }

        //console.log('error');
        self.loaderEffect.kill(function() {
            if (!self.$sqm) { return false; }
            self.$sqm
                .html('An error has occured. Please refresh and try again.')
                .velocity('fadeIn', 200);
        });

    });

    function _cacheCallback() {
        if (query) { self.cachedQuery[query.toLowerCase()] = self.$resultCont.clone(); }
    } 

};
VV.search.ajaxCallback = function(data) {
    this.$resultCont.html(JSON.stringify(data)).velocity('transition.slideRightIn', 200);
};
VV.search.queryTooShort = function() {
    if (!this.$sqm) { return false; }
    this.$sqm
        .html('Your search query is too short...')
        .velocity('stop').velocity('fadeIn', 200);
};

VV.search.loaderEffect = Object.create(VV.utils.loaderEffect);
VV.search.reset = function() {
    //console.log(this.timeout);
    for(var i in this.timeout) {
        clearTimeout(this.timeout[i]);
    }
    this.timeout = [];
    if (this.ajaxFired) { this.ajax.abort(); }
    if (this.$sqm) { this.$sqm.velocity('stop').hide(); }
    this.loaderEffect.kill();
    //hide the results. but don't clear it yet.
    this.$resultCont.velocity('stop').hide();  
}
VV.search.bindInput = function() {
    var self = this;
    var QUERY = ''; //keyup firing twice bug. cache the query.
    this.$searchInput.keyup(function(e) {
        var charCode = e.which || e.keyCode;
        self.entered = false;

        if (charCode != '13') {
            self.enterBlock = false;
            self.entered = false;
            //console.log('enter is unblocked');
        } else {
            if(self.enterBlock && charCode == '13') {
                //console.log('blocked!');
                return false;
            }
            self.entered = true;
        }

        //console.log('keydown that went through event');

        //setting up a new enter block if is enter key
        //block future enter entries for a duration
        if (self.entered) {
            self.enterBlock = true;
            //console.log('enter is blocked');
            setTimeout(function() {
                self.enterBlock = false;
                //console.log('enter is unblocked');
            }, 2000);
        }

        //enter was not blocked, or key is something else.
        //now we want to start the function...

        var query = $(this).val(),
            qLength = query.length;

        //resetting actions
        //GOTCHA: keyup can fire twice. check if current query is the same as the previous before resetting.
        // 1) clear the previous timeout function, 2) abort the ajax if fired.
        if (query !== QUERY) { self.reset(); QUERY = query; }

        if (qLength === 0) { return false; }

        var offset = 0;
        if(query.indexOf('@') === 0) { offset = 4 };
        if(query.indexOf('#') === 0) { offset = 1 };

        //if too short, set timeout function for alert message.
        if(qLength < 3+offset) {
            if(self.entered) { 
                //console.log('immediately returning');
                return self.queryTooShort();
            }
            var timeout = setTimeout(function() {
                self.queryTooShort();
            }, self.timeoutDuration);
            return self.timeout.push(timeout);
        }

        //query is okay
        if(self.entered) {
            self.loaderEffect.run();
            return self.searchAjax(query);
        }

        //we let enter key run the search again. But block the search if the query is the same if no enter is pressed.  
        var cachedQueryShown = self.cacheManager(query);
        if(cachedQueryShown) { return true; }


        //when we reach here it means:
        //1) the user's entry is a valid key. (entered key was not blocked also)
        //2) the user didn't press enter key, which would overwrite caching.
        //3) the query is a different one from the one immediately preceding.
        //4) the cache didn't contain the user's query.

        //set the ajax call ticking....
        //console.log('setting ajax timeout');

        var timeout = setTimeout(function() {
            self.loaderEffect.run();
            return self.searchAjax(query);
        }, self.timeoutDuration);
        return self.timeout.push(timeout);

    });
};
VV.search.init = function(opts) {
    var optionKeys = ['uri', '$searchInput', '$loaderWrap', '$resultCont', '$sqm', 'ajaxCallback'];
    for(var i in optionKeys) {
        var key = optionKeys[i];
        if (typeof opts[key] !== 'undefined') { this[key] = opts[key]; }
    }

    /* build my elements if it is not passed in */
    if (!this.$loaderWrap) {
        var div = document.createElement('div');
            div.className = 'searchLoaderWrap';
        this.$loaderWrap = $(div);
        this.$searchInput.after(div);
    }
    //initialize the loader effect
    this.loaderEffect.init(this.$loaderWrap);

    //caller can pass in $sqm: false to disable messages.
    if (!this.$sqm && this.$sqm !== false) {
        var div = document.createElement('div');
            div.className = 'searchQueryMessage';
        this.$sqm = $(div);
        this.$loaderWrap.append(div);
    }
    if (!this.$resultCont) {
        var div = document.createElement('div');
            div.className = 'resultCont';
        this.$resultCont = $(div);
        if (this.$sqm) { this.$sqm.after(div) }
        else { this.$loaderWrap.after(div); }    
    }

    /* any nested value holders needs to be recreated */
    var nested = ['cachedQuery', 'timeout'];
    for(var i in nested) {
        if (!this.hasOwnProperty(nested[i])) {
            var temp = this[nested[i]].constructor();
            this[nested[i]] = temp;
        }
    }

    //set the auto-complete to off to prevent double firing
    this.$searchInput.attr('autocomplete', 'off');

    return this.bindInput();
}