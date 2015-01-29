if(typeof VV === 'undefined') { VV = {} }
VV.search = {
    timeout: [],
    timeoutDuration: 1200,
    proceed: false,
    ajaxFired: false,
    ajaxedQuery: false,
    enterBlock: false,
    ajax: '',
    $sqm: '',
    getSQM: function() {
        return this.$sqm = $('.searchQueryMessage');
    },
    // $sl: '',
    // getSL: function() {
    //     return this.$sl = $('.searchLoader');
    // },
    // $studs: '',
    // getStuds: function() {
    //     return this.$studs = $('.searchLoader .searchLoaderStud');
    // },
    $resultCont: '',
    getResultCont: function() {
        return this.$resultCont = $('.mainColBlock');
    }
}
VV.search.cachedQuery = {}
VV.search.cacheManager = function(query) {
    var query = query.toLowerCase()
    if(this.ajaxedQuery) {
        if(query === this.ajaxedQuery) { 
            //console.log('same query, returning');

            //check if the results is hidden. if yes, show it.
            if(this.$resultCont.css('display') === 'none') {
                this.$resultCont.velocity('stop').velocity('transition.slideRightIn', 200);
                return true;
            }
        } else {
            //query is not the same, but check if it has been cached.
            if(this.cachedQuery[query]) {
                //console.log('cached query, returning the cache');
                this.ajaxedQuery = query;
                if(this.$resultCont.css('display') === 'none') {
                    this.$resultCont.html(this.cachedQuery[query]);
                    this.$resultCont.velocity('stop').velocity('transition.slideRightIn', 200);
                    return true;
                } else {
                    this.$resultCont.velocity('stop').hide();
                    this.$resultCont.html(this.cachedQuery[query]).velocity('transition.slideRightIn', 200);
                    return true;
                }
            }
        }
    }
}
VV.search.searchAjax = function(query) {
    //just to be safe, we abort ajax and clear all timeouts.
    if(typeof this.ajax.abort === "function") { this.ajax.abort();}
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
    this.ajax = $.post( printHead.p.absPath + "/api/search", {query: query});

    //done
    this.ajax.done(function(data) {   
        //console.log(data);
        if(data.success) {
            //console.log('append results');
            self.ajaxedQuery = query;
            if(data.resultType === 'hashtag') { userFactory.init(data, {streamType: "hashtag"}); }
            if(data.resultType === 'user') { userFactory.init(data, {streamType: "user"}); }
            //cache the query... for the fickled minded...
            if(self.ajaxedQuery) { self.cachedQuery[self.ajaxedQuery.toLowerCase()] = self.$resultCont.html(); }
        } else {
            //console.log('error');
            return self.loaderEffect.kill(function() {
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
            self.$sqm
                .html('An error has occured. Please refresh and try again.')
                .velocity('fadeIn', 200);
        });

    });

}
VV.search.queryTooShort = function() {
    this.$sqm
        .html('Your search query is too short...')
        .velocity('stop').velocity('fadeIn', 200);
}

VV.search.loaderEffect = Object.create(VV.utils.loaderEffect);
VV.search.reset = function() {
    //console.log('resetting');
    //console.log(this.timeout);
    for(var i in this.timeout) {
        clearTimeout(this.timeout[i]);
    }
    this.timeout = [];
    if(this.ajaxFired) { this.ajax.abort(); }
    this.$sqm.velocity('stop').hide();
    this.loaderEffect.kill();
    //hide the results. but don't clear it yet.
    this.$resultCont.velocity('stop').hide();  
}
VV.search.init = function() {
    this.getSQM();
    // this.getSL();
    // this.getStuds();
    this.getResultCont();
    this.loaderEffect.init($('.searchLoaderWrap'));
    this.loaderEffect.parent = this;
    

    var self = this;

    $('input[name="search"]').keyup(function(e) {

        var charCode = e.which || e.keyCode;

        self.entered = false;

        if(charCode != '13') {
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
        if(self.entered) {
            self.enterBlock = true;
            //console.log('enter is blocked');
            setTimeout(function() {
                self.enterBlock = false;
                //console.log('enter is unblocked');
            }, 2000);
        }

        //enter was not blocked, or key is something else.
        //now we want to start the function...

        //resetting actions
        // 1) clear the previous timeout function, 2) abort the ajax if fired.

        self.reset();

        var query = $(this).val(),
            qLength = query.length;

        if(qLength === 0) { return false; }

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
}