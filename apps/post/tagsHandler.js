/* Dependents:
   addPost.js
   iggPost.js
*/

var fname = "tagsHandler.js ";
var events = require('events');
var eventEmitter = new events.EventEmitter();
var baseURI = '';
var S = require('string');

module.exports = function tagsHandler(desc, CALLBACK, callback) {

    /*
    1) Take out the emails first.
    2) Start the promise chain
    3) Sort out all the tags.
    4) Run through the DB for addtags and star tags.
    5) Do all the replacements.
    6) Return descJSON
    */

    var descJSON = {
        desc: desc,
        descHTML: desc,
        descTags: {
            add: [],
            hash: [],
            star: []
        }
    }

    //working arrays
    var hash = {
        raw: [],
        lowercase: [],
        link: [],
        unique: []
    }

    var add = {
        raw: [],
        lowercase: [],
        link: [],
        unique: []
    }

    var star = {
        raw: [],
        link: [],
        unique: [],
        userId: []
    }

    //defaulting flags
    var tagSearchCounter = 2; //have 2 db tasks to complete.


    //remove emails first.
    var emails = desc.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

    if(emails) { 
        desc = desc.replace(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, '{{{email}}}');
    }

    //extract the tags
    hash.raw = desc.match(/#([a-zA-Z0-9]+)/g);
    add.raw = desc.match(/@([a-zA-Z0-9_]+)/g);
    star.raw = desc.match(/\*([a-zA-Z0-9]+)/); //only match for 1 startag.

    //after calling match, if there are no match {tag}.raw will default to null.

    //now replace away all these tags.
    if(add.raw) { 
        desc = desc.replace(/@([a-zA-Z0-9_]+)/g, '{{{addtag}}}'); 
    }
    if(star.raw) { 
        desc = desc.replace(/\*([a-zA-Z0-9]+)/, '{{{startag}}}'); 
    }
    //keep the one that has hashtags.
    //this is to produce a raw desc with the properly CASED add and star tags.
    descJSON.desc = desc;

    //then do a replacement.
    if(hash.raw) { desc = desc.replace(/#([a-zA-Z0-9]+)/g, '{{{hashtag}}}'); }

    descJSON.descHTML = S(desc).escapeHTML().s; //escape the HTML that came with the desc

    //need to do a search with DB after obtaining the tags.
    //bind the search listeners here.
    //********************
    eventEmitter.on('addTagSearchDone', function(array) {
        tagSearchCounter -= 1;
        replaceAddAndStarArrays('add', array);
    });
    eventEmitter.on('starTagSearchDone', function(array) {
        tagSearchCounter -= 1;
        replaceAddAndStarArrays('star', array);
    });


    //addtags need to be checked against the DB.
    if(add.raw) {

        var i = 0;
        while(add.raw[i]) {
            //remove the front tag
            add.raw[i] = add.raw[i].substring(1);
            var a = add.raw[i];
            //lowercase the addtags
            add.lowercase.push(a.toLowerCase());
            i++;
        }

        //get the uniques
        add.unique = uniqueBy(add.lowercase, JSON.stringify);

        //now find them all to see if they exist.
        db.User.findAll({
            where: {
                userName: add.unique
            },
            attributes: ['userName','userNameDisp']
        }).then(function(users) {

            //clear the unique [];
            add.unique = [];

            if(users.length > 0) {

                var usersArray = {
                    userName: [],
                    userNameDisp: []
                }

                var i=0;
                while(users[i]) {
                    var user = users[i];

                    usersArray.userName.push(user.userName);
                    usersArray.userNameDisp.push(user.userNameDisp);
                    i++;
                }
                return eventEmitter.emit('addTagSearchDone', usersArray);
            }
            
            return eventEmitter.emit('addTagSearchDone', false);

        }).catch(function(err) {
            console.log(fname + 'user search error: ' + err);
            return eventEmitter.emit('addTagSearchDone', false);
        });
    } else {
        //this branch represents no search performed
        eventEmitter.emit('addTagSearchDone', false);
    }


    if(hash.raw) {

        var i = 0;
        while(hash.raw[i]) {
            //remove the front tag
            hash.raw[i] = hash.raw[i].substring(1);
            var h = hash.raw[i];

            //lowercase the hashtags
            hash.lowercase.push(h.toLowerCase());

            //produce the hashtag links
            hash.link.push('<a data-tagtype="hash" href="' + baseURI + '/hashtag/' + h + '">#' + h + '</a>');
            i++;
        }

        //get the uniques
        hash.unique = uniqueBy(hash.lowercase, JSON.stringify); 
    }

    //addtags need to be checked against the DB.
    if(star.raw) {

        star.raw[0] = star.raw[0].substring(1);
        var s = star.raw[0];

        //trying to push the startag into the hash tag array so that post can be indexed via #hashtag.
        var lowercase = s.toLowerCase();
        if (hash.unique.indexOf(lowercase) > -1) {
            hash.unique.push(lowercase);
        }
        
        //now find the startag to see if it exist.
        db.StarTag.find({
            where: {
                starTagLowerCase: lowercase
            },
            include: [{
                model: db.User,
                attributes: ['userNameDisp']
            }],
            attributes: ['starTag','User_userId']
        }).then(function(startag) {

            if(startag) {

                var starArray = {
                    starTag: startag.starTag,
                    userId: startag.User_userId,
                    userNameDisp: startag.user.userNameDisp
                }
                //noAddTag = false; eventEmitter arg = [];
                return eventEmitter.emit('starTagSearchDone', starArray);
            }
            //noAddTag = false; eventEmitter arg = false;
            return eventEmitter.emit('starTagSearchDone', false);

        }).catch(function(err) {
            console.log(fname + 'star tag search err: ' + err);
            return eventEmitter.emit('starTagSearchDone', false);
        });
    } else {

        //this branch represents no search performed
        eventEmitter.emit('starTagSearchDone', false);
    }


    //now after the searches are done, need to replace the add and star as appropriate.
    //the function is binded above its emitters.
    function replaceAddAndStarArrays(whoDone, array) {

        //check the array to see if the completed action contains any results.
        if(!array) {

            //special case for addtag
            //clear out its uniques because there are no returned results
            if(whoDone === "add") { add.unique = []; }

            //no results, move on....
            if(tagSearchCounter === 0) {
                return replaceDesc();
            }
            return false;
        }


        //there are results...
        if(whoDone === "add") {

            var i = 0;
            while(add.lowercase[i]) {
                //check if the lowercased submitted addtags matches any of the returned userNames (lowercased)
                var index = array.userName.indexOf(add.lowercase[i]);
                if(index > -1) {
                    //if found, replace the raw string with the cased Username.
                    var casedUsername = array.userNameDisp[index];
                    add.raw[i] = casedUsername;

                    //make the link
                    add.link[i] = '<a data-tagtype="add" href="' + baseURI + '/' + casedUsername + '">@' + casedUsername + '</a>';
                }
                //else do nothing.
                i++;
            }

            var j = 0;
            while(array.userNameDisp[j]) {
                add.unique.push(array.userNameDisp[j]);
                j++;
            }


            if(tagSearchCounter === 0) {
                return replaceDesc();
            }
            return true;

        }

        if(whoDone === "star") {
            //only 1 star tag allowed now. so just access it via 0.
            star.raw[0] = array.starTag;
            star.userId.push(array.userId);
            star.link.push('<a data-tagtype="star" href="' + baseURI+ '/' + array.userNameDisp + '">*' + array.starTag + '</a>');
            star.unique.push(array.starTag);

            if(tagSearchCounter === 0) {
                return replaceDesc();
            }
            return true;

        }

    }

    //replace the description.
    function replaceDesc() { 

        var d = descJSON.desc,
            dHTML = descJSON.descHTML;

        //put back the emails.
        if(emails) { 
            var eml = 0;
            while(emails[eml]) {
                d = d.replace('{{{email}}}', emails[eml]);
                dHTML = dHTML.replace('{{{email}}}', emails[eml]);
                eml++;
            }
        }
        //deal with hashtags
        if(hash.raw) {
            
            var hh = 0;
            while(hash.raw[hh]) {
                dHTML = dHTML.replace('{{{hashtag}}}', hash.link[hh]);
                hh++;
            }
        }
        //addtag
        if(add.raw) {
            var rr = 0;
            while(add.raw[rr]) {
                d = d.replace('{{{addtag}}}', '@' + add.raw[rr]);

                //for HTML, need to check if the addtag is valid. When it is, there is a link.
                if(add.link[rr]) {
                    dHTML = dHTML.replace('{{{addtag}}}', add.link[rr]);
                } else {
                    //when there isn't a valid link, the username is not valid. replace it back with the raw.
                    dHTML = dHTML.replace('{{{addtag}}}', '@' + add.raw[rr]);
                }
                rr++;
            }

        }
        //startag
        if(star.raw) {
            d = d.replace('{{{startag}}}', '*' + star.raw[0]);

            //if there is valid link
            if(star.link[0]) {
                dHTML = dHTML.replace('{{{startag}}}', star.link[0]);
            } else {
                //*startag is not valid, just put the tag back
                dHTML = dHTML.replace('{{{startag}}}', '*' + star.raw[0]);
            }
        }

        descJSON.desc = d;
        descJSON.descHTML = dHTML;
        descJSON.descTags.add = add.unique;
        descJSON.descTags.hash = hash.unique;
        descJSON.descTags.star = {
            unique: star.unique,
            userId: star.userId
        }
        if(typeof callback === "function") { 
            return callback(descJSON, CALLBACK);
        }
        return descJSON;
        
    } //function replaceDesc()

}


//filter them
function uniqueBy(a, key) {
    var seen = {};
    return a.filter(function(item) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
}