var fname = "iggMain.js ";
var moment = require('moment');

module.exports = function iggMain() {

    if(typeof global.igg === "undefined") {
        global.igg = {
            run: iggMain,
            stopArray: [],
            newStopArray: []
        }
    }
    global.igg.busy = true;

    console.log(fname + 'instagram-grabber is running...');

    //engine will query the for hashtags.

    //after the first query, it will store the id of the first 3 posts.
    //this will act as a pagination stop.

    //on the next cycle, it will check the query for ids stored in the "stop"
    //roll back using next_max_id, for 9 more times, or until there is a match.

    //after that, loop each "page" to find hashtagh #vogueandverve.
    //if found, query the db to see if it is linked
    //if linked, make a post.

    var pages = [],
        postToCheck = [],
        stopArray = igg.stopArray,
        newStopArray = [];

    var toGrabFull = false,
        grabCount = 9; // 10 pages, when inclusive of the 1st one.

    if(stopArray.length === 0) {
        //this means that there was a server restart, we will have to do full search.
        toGrabFull = true;
    }

    //clear the timeouts
    igg.nextTimeout = {}

    //duration

    var duration;
    duration = 900000; //15minutes
    var retryDuration = 300000; //5 minutes

    //first query
    var masterQueryTime = Date.now();
    instaNode.tag_media_recent('lovebonito', function(err, medias, pagination, remaining, limit) {
        if(err) { 
            console.log(fname + 'first query encountered error: ' + err + ' . Retrying in ' + retryDuration/1000/60 + 'mins'); 
            return setNextTimeout(retryDuration); 
        }
        console.log(fname + 'first query completed...');
        if(medias.length < 20) { return completionCallback(); }

        var maxId = pagination.next_max_id;

        //looping through them
        checkTillOverlap(medias, maxId, completionCallback);

    });


    function checkTillOverlap(medias, maxId, callback) {
        console.log(maxId);
        console.log('checkTillOverlap count number ' + grabCount);
        var len = medias.length;

        if(len < 20) { 
            console.log(fname + 'ending prematurely as we reached the end of posts'); 
            return completionCallback(); 
        }

        for(var i = 0; i < len; i++) {
            var media = medias[i],
                id = media.id;

            console.log(i + '\'th run, checking media id' + id);

            //for the first 3 media, push into the newStopArray
            if(i < 3 && grabCount === 9) { console.log('stopArray push'); newStopArray.push(id); }

            //if it is full search, break out and conduct full grab
            if(toGrabFull) {
                //stop the loop here and continue for 2 more to get the stopArray ids.
                if(i < 3) { continue; }
                console.log('fullsearch, break and grab all'); 
                grabFull(medias, id, callback); 
                break; 
            }

            //its not a full grab so we need to find the overlap.
            //if found, stop.
            if(stopArray.indexOf(id) > -1) { 
                console.log('at overlap, splicing post and trigger callback');
                //splice aways the pages that we ran through before
                //then push it into pages.
                medias.splice(i, len-i); 
                pages.push(medias);

                return completionCallback();
                break; 
            }

            //finally when it reaches the last one
            //we want to trigger the next query.
            if(i === len-1) {

                //push all into my page array
                pages.push(medias);

                //check if we have hit the grab count limit
                if(grabCount === 0) { 
                    console.log('grab has hit the limit'); 
                    return callback();
                }
                //it has not, we decrement the count and continue
                grabCount -= 1;
                nextQuery(maxId, checkTillOverlap, callback);
            }
        }
    }

    function nextQuery(maxId, callback, finalCallback) {
        instaNode.tag_media_recent('lovebonito', {next_max_id: maxId}, function(err, medias, pagination, remaining, limit) {        
            if(err) {
                console.log(fname + 'encountered error in nextQuery. Error: ' + err + ' .Retrying in' + retryDuration/1000/60 + 'mins'); 
                return setTimeout(function() { 
                    igg.run();
                }, retryDuration);
            }
            if(medias.length < 20) { 
                console.log(fname + 'ending prematurely as we reached the end of posts'); 
                return completionCallback(); 
            }
            console.log(fname + remaining + ' out of ' + limit + ' instagram calls remaming.');
            return callback(medias, pagination.next_max_id, finalCallback);
        });
    }

    var fullGrabTimer;
    function grabFull(medias, maxId, callback) {
        pages.push(medias);
        if(grabCount === 9) { console.log(fname + 'starting full grab'); fullGrabTimer = Date.now(); }
        if(grabCount === 0) { 
            var t = Date.now() - fullGrabTimer;
            console.log(fname + ' full grab has completed in ' + t + 'ms');
            return callback();
        }

        grabCount -= 1;
        console.log(fname + 'full grab run ' + grabCount + ' more to go..');
        nextQuery(maxId, grabFull, callback);
    }


    function setNextTimeout(duration) {
        var timeout = setTimeout(function() {
            igg.run();
        }, duration);

        var nextRun = moment().add(duration, 'milliseconds');
        console.log(fname + 'next run is at' + nextRun.format());

        //set the global object
        igg.nextTimeout = {
            time: nextRun,
            _timeout: timeout
        }
    }

    function completionCallback() {

        console.log(fname + 'instagram process has completed in ' + (Date.now()-masterQueryTime) + 'ms');
        
        //after everything has completed, we update the stop array.
        igg.stopArray = newStopArray;
        igg.pages = pages;
        igg.busy = false;
        setNextTimeout(duration);

        console.log(pages.length);
        console.log(igg.stopArray);

    }


}