var fname = "iggMain.js ";
var moment = require('moment');
var iggCheckForHashtag = require('./iggCheckForHashtag.js');

module.exports = function iggMain(duration) {

    //general settings/params
    var grabCount = 0; // 0 means 1 instagram "page" -- 20 posts

    if(typeof global.igg === "undefined") {
        global.igg = {
            run: iggMain,
            instaRunCount: 0,
            dbRepostCount: 0,
            instagrams: {},
            lastRunCompleted: '',
            errorToken: 0,
            hasErrored: [],
            recoverFromError: false
        }
    }
    global.igg.busy = true;

    //clear the timeouts
    global.igg.nextTimeout = {}

    //DURATION
    var DURATION = duration*1000*60*60 || 300000;
    var retryDuration = 60000; //1 min

    //set the error recovery in place. Error checking everying DURATION * 3.
    if(!igg.recoverFromError) { 
        igg.recoverFromError = setInterval(function() {
            recoverFromError();
        }, DURATION*3)
    }

    //first query
    var masterQueryTime = Date.now();


    console.log(fname + 'instagram-grabber is running...');


    //get the accounts:
    var INSTAGRAMS = {}
    db.Instagram.findAndCountAll().then(function(instagrams) {
        var count = instagrams.count
        if(count < 1) { 
            //WARNING: do not call "kill" in asynchronous processes.
            console.log(fname + 'db.Instagram: nothing to update...'); 
            return completionCallback("kill");
        }

        global.igg.instaRunCount = count;
        INSTAGRAMS = instagrams.rows;
        console.log(fname + 'got the instagram instances, running loop.');

        for(var i=0; i<count; i++) {
            var insta = INSTAGRAMS[i];
            initQuery(insta, eachInstagramCallback);
        }

    }).catch(function(err) {
        console.log(fname + ' Error occured at db.Instagram call. Error: ' + err + '. Retrying in ' + retryDuration/1000/60 + 'mins');
        return completionCallback("kill", retryDuration);
    });

    function initQuery(insta) {
        //attach my custom stuff to the insta instance
        insta.grabCount = grabCount;
        insta.pages = [];
        insta.postCount = 0;
        insta.grabStartTime = Date.now();

        //parse the existing array
        insta.newStopArray = JSON.parse(insta.stopArray);

        //ig module requires userId to be passed in a string... so weird.
        instaNode.user_media_recent(insta.instaId.toString(), function(err, medias, pagination, remaining, limit) {
            console.log(fname + remaining + ' of ' + limit + ' instagram calls remaining');
            if(err) { 
                console.log(fname + 'userId: ' + insta.User_userId + ' first query encountered error: ' + err); 
                return eachInstagramCallback(insta, false); 
            }

            if(medias.length === 0) {
                console.log(fname + 'userId: ' + insta.User_userId + ' has no medias.'); 
                return eachInstagramCallback(insta, false); 
            }

            var maxId = pagination.next_max_id;

            //looping through them
            checkWithStored(insta, medias, maxId);

        });
    }


    function checkWithStored(insta, medias, maxId) {

        /* Note: "stopArray" was originally named so because it was first formulated to
         * create a "stopPoint" in the instagram scanning, which meant that this module
         * knows which was the post that it had checked until, and hence won't go beyond.
         *
         * Now is it modified to store an array of Instagram post ids that had already
         * been grabbed so that no duplicates occur. All other posts will always be re-checked
         * for new hashtags. This is because hashtagging can occur after posting, so posts
         * that were not grabbed, had to be assumed to be "fresh" everytime.
         */

        console.log(fname + 'checkWithStored, userid: ' + insta.User_userId + ' count number ' + insta.grabCount);
        var len = medias.length,
            last = false,
            stopArray = insta.stopArray;

        //set stopArray to false when it is empty. this will trigger full scan.
        if(stopArray === "[]") { stopArray = false; }

        //if this is the last page. set the flags such that the loop doesn't continue after this.
        if(len < 20) { last = true; }

        for(var i=0; i<len; i++) {
            var media = medias[i],
                id = media.id;

            //if stopArray is not empty, apply the stopArray filter.
            //if found, stop.
            if(stopArray && stopArray.indexOf(id) > -1) { 
                console.log(fname + 'userId:' + insta.User_userId + ' has posts that are grabbed.');

                //setting to false is easier to handle
                medias[i] = false;
            }

            //finally when it reaches the last one, we want to trigger the next query.
            if(i === len-1) {

                //push all into my page array
                insta.pages.push(medias);
                insta.postCount += medias.length;
                //console.log(fname + insta.postCount);

                //if this media contains less than 20, it means we reached the end
                //so we call for completion
                if(last) { 
                    console.log(fname + 'ending prematurely as we reached the end of posts'); 
                    eachInstagramCallback(insta); 
                    break;
                }

                //check if we have hit the grab count limit
                if(insta.grabCount === 0) { 
                    console.log(fname + 'userId: ' + insta.User_userId + ' grab has hit the limit'); 
                    eachInstagramCallback(insta);
                    break;
                }

                //it has not, we decrement the count and continue
                insta.grabCount -= 1;
                performQuery(insta, maxId, checkWithStored, eachInstagramCallback);
            }
        }
    }



    //performQuery can accept 2 callbacks. 2 callbacks is supplied when looping is required.
    //finalCallback is compulsory for looping situations! Else the loop will never end.
    function performQuery(insta, maxId, callback, finalCallback) {

        var options = {}
        if(typeof maxId !== "undefined") { options.max_id = maxId; }

        instaNode.user_media_recent(insta.instaId.toString(), options, function(err, medias, pagination, remaining, limit) {        
            if(err) {
                console.log(fname + 'encountered error in performQuery for userId' + insta.User_userId + '. Error: ' + err); 
                if(finalCallback) { return finalCallback(insta); }
                if(callback) { return callback(insta); }
                return { medias: medias, pagination: pagination }
            }
            console.log(fname + remaining + ' out of ' + limit + ' instagram calls remaining.');
            if(callback) { return callback(insta, medias, pagination.next_max_id); }
            return { medias: medias, pagination: pagination }
        });
    }



    function eachInstagramCallback(insta, runCheck) {
        //assume when no runCheck param is given, to runCheck is true.
        if(typeof runCheck === "undefined") { var runCheck = true; }

        if(runCheck) { 

            console.log(fname + 'instagram for userId: ' + insta.User_userId + ' has pages: ' + insta.pages.length);
            var hasPages = insta.pages.length > 0;
            if(hasPages) {
                global.igg.dbRepostCount += 1;
                iggCheckForHashtag(insta, completionCallback);
                
            } 
            return completionCallback("insta");
        } else {
            console.log(fname + 'UserId: ' + insta.User_userId + ' , screenName: ' + insta.screenName + ' , for instaId: ' + insta.instaId + ' completed WITHOUT update to stopArray');
            return completionCallback("insta");
        }

    }


    function completionCallback(typeOfRun, custDuration) {

        if(typeOfRun === "insta") { global.igg.instaRunCount -= 1; }
        if(typeOfRun === "repost") { global.igg.dbRepostCount -= 1; }
        //TODO, add && repostRunCount === 0 to completionCallback criteria
        

        if(typeOfRun !== "kill" && (global.igg.instaRunCount > 0 || global.igg.dbRepostCount > 0) ) { 
            console.log(fname + 'completionCallback: dbRepost runcount, ' + global.igg.dbRepostCount + ' runs remaining.'); 
            return console.log(fname + 'completionCallback: instagram runcount, ' + global.igg.instaRunCount + ' runs remaining.'); 
        }

        console.log(fname + 'instagram process has completed in ' + (Date.now()-masterQueryTime) + 'ms');
        //after everything has completed...
        igg.busy = false;
        if(typeOfRun !== "kill" ) { 
            return setNextTimeout(DURATION); 
        } else {
            //for kill process, error must happened somewhere, so we will retry.
            //WARNING: do not call "kill" in asynchronous processes.
            if(typeof custDuration !== "undefined" ) { return setNextTimeout(custDuration); }
            return setNextTimeout(DURATION);
        }

    }


    function setNextTimeout(DURATION) {
        var runCompleted = Date.now();
        igg.lastRunCompleted = moment(runCompleted).format();
        
        var timeout = setTimeout(function() {
            igg.run(DURATION);
        }, DURATION);

        var nextRun = moment().add(DURATION, 'milliseconds');
        console.log(fname + 'next run is at ' + nextRun.format());

        //set the global object
        igg.nextTimeout = {
            time: nextRun,
            _timeout: timeout
        }
        igg.errorToken = 0;
    }

    //error recovery
    function recoverFromError() {
        //check if igg is busy.
        //for every time we find we add to the token.
        var tolerance = 1
        if(igg.busy === true) { 
            //if we find that it is busy, add to the token.
            igg.errorToken += 1;

            //having error tokens doesn't mean something is wrong. but accumulated tokens
            //mean the function hasn't been running for quite some time.
            //so we jumpstart it again.
            if(igg.errorToken > tolerance) {
                igg.hasErrored.push(moment().format());
                return igg.run();
            }
        }
    }

}