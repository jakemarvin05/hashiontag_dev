var fname = "iggMain.js ";
var moment = require('moment');
var iggCheckForHashtag = require('./iggCheckForHashtag.js');

module.exports = function iggMain() {

    //general settings/params
    var grabCount = 2; // 3 pages = 60 posts

    if(typeof global.igg === "undefined") {
        global.igg = {
            run: iggMain,
            instaRunCount: 0,
            dbRepostCount: 0,
            instagrams: {},
            lastRunCompleted: ''
        }
    }
    global.igg.busy = true;

    //clear the timeouts
    global.igg.nextTimeout = {}

    //DURATION
    var DURATION;
    DURATION = 900000; //15minutes
    var retryDuration = 300000; //5 minutes

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
        insta.newStopArray = [];
        insta.isFirstGrab = false;
        insta.pages = [];
        insta.postCount = 0;
        insta.grabStartTime = Date.now();

        //JSON.parse will cause errors if the stopArray parameter is empty, which shouldn't be the case.
        try {

            //if there is nothing in the stopArray, means either, this instagram link is
            //newly established.
            //OR the account had no posts previously.
            //So we need to initiate a "first grab"
            var stopArrayLength = JSON.parse(insta.stopArray).length;
            if(stopArrayLength === 0) { insta.isFirstGrab = true; }

        } catch(err) {
            console.log(fname + 'FATAL ERROR with JSON.parse on stop array. Terminating process for userid: ' + insta.User_userId + ' , instaId ' + insta.instaId );
            console.log(err);
            console.log(fname + 'updating empty square brackets into instance: ' + insta.runningKey + ' for userid: ' + insta.User_userId);
            
            //we try to recover the error for the next update by overwritting stopArray with "[]"
            return insta.updateAttributes({
                stopArray: "[]"
            }).then(function() {
                return eachInstagramCallback(insta, false);
            }).catch(function(err) {
                console.log(fname + 'error in updating empty square brackets for instance:' + insta.runningKey + ', userId: ' + insta.User_userId);
                return eachInstagramCallback(insta, false);
            });  
        }
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
            checkTillOverlap(insta, medias, maxId);

        });
    }



    function checkTillOverlap(insta, medias, maxId) {

        console.log(fname + 'checkTillOverlap, userid: ' + insta.User_userId + ' count number ' + insta.grabCount);
        var len = medias.length,
            last = false,
            stopArray = insta.stopArray;

        //if this is the last page. set the flags such that the loop doesn't continue after this.
        if(len < 20) { last = true; }

        for(var i=0; i<len; i++) {
            var media = medias[i],
                id = media.id;

            console.log(fname + '' + i + '\'th run, checking media id' + id);

            //for the first 3 media, push into the newStopArray
            if(i === 0 && insta.grabCount === grabCount) { 
                console.log('stopArray push');
                insta.newStopArray.push(id);
                if(medias[i+1]) { insta.newStopArray.push(medias[i+1].id); }
                if(medias[i+2]) { insta.newStopArray.push(medias[i+2].id); }
            }

            //if is first grab, just grab 3 and push it into the array.
            if(insta.isFirstGrab) {
                //push the next 2 ids into stopArray
                //stop the loop here 
                console.log(fname + 'userid: ' + insta.User_userId + ' isFirstGrab. Store ids only, no medias.'); 
                if(medias[i+1]) { insta.newStopArray.push(medias[i+1].id); }
                if(medias[i+2]) { insta.newStopArray.push(medias[i+2].id); }
                eachInstagramCallback(insta);
                break;
            }

            //its not a first grab so we need to find the overlap.
            //if found, stop.
            if(stopArray.indexOf(id) > -1) { 
                console.log(fname + 'userId:' + insta.User_userId + ' at overlap, splicing post and trigger callback');
                //splice away the pages that we ran through before
                //then push it into pages.
                medias.splice(i, len-i); 
                insta.pages.push(medias);
                insta.postCount += medias.length;

                eachInstagramCallback(insta);
                break; 
            }

            //finally when it reaches the last one, we want to trigger the next query.
            if(i === len-1) {

                //push all into my page array
                insta.pages.push(medias);
                insta.postCount += medias.length;
                console.log(fname + insta.postCount);

                //if this media contains last than 20, it means we reached the end
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
                performQuery(insta, maxId, checkTillOverlap, eachInstagramCallback);
            }
        }
    }



    //performQuery can accept 2 callbacks. 2 callbacks is supplied when looping is required.
    //finalCallback is compulsory for looping situations! Else the loop will never end.
    function performQuery(insta, maxId, callback, finalCallback) {

        var next_max_id = {}
        if(typeof maxId !== "undefined") { next_max_id.next_max_id = maxId; }

        instaNode.user_media_recent(insta.instaId.toString(), next_max_id, function(err, medias, pagination, remaining, limit) {        
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



    function eachInstagramCallback(insta, update) {
        //dev only
        //push into my igg for initial diagnosis
        //igg.instagrams[insta.instaId] = insta.pages;

        //assume when no update param is given, to update is true.
        if(typeof update === "undefined") { var update = true; }

        //check if the array is the same. If it is, just ignore the update.
        if(update) {
            insta.newStopArray = JSON.stringify(insta.newStopArray);
            if(insta.newStopArray === insta.stopArray) {
                console.log(fname + ' no change for User_userId ' + insta.User_userId);
                update = false;
            }
        }

        //if none of the criterias above switched the update flag, perform update.

        
        if(update) { 
            //perform async tasks with the "insta" instance here. Update false, means we don't even run the async task.
            //we will start a repostRunCount
            var hasPages = insta.pages.length > 0;
            if(hasPages) {
                global.igg.dbRepostCount += 1;
                iggCheckForHashtag(insta, completionCallback);
            }
    
            //db tasks.
            insta.updateAttributes({
                stopArray: insta.newStopArray
            }).then(function(insta) {
                console.log(fname + 'UserId: ' + insta.User_userId + ' , screenName: ' + insta.screenName + ' , for instaId: ' + insta.instaId + ' completed WITH update to stopArray');

                return completionCallback("insta");

            }).catch(function(err) {
                console.log(fname + ' error occured for User_usderId' + insta.User_userId + ' , instaId: ' + insta.instaId + '. Error: ' + err);

                return completionCallback("insta");
            });
        }
        
        //when update is false:
        if(!update) {
            
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
            igg.run();
        }, DURATION);

        var nextRun = moment().add(DURATION, 'milliseconds');
        console.log(fname + 'next run is at ' + nextRun.format());

        //set the global object
        igg.nextTimeout = {
            time: nextRun,
            _timeout: timeout
        }
    }


}