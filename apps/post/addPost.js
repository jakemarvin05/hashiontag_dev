/* addPost.js is called by posting.js */

/* TODO REFACTOR THIS */

var fname = 'addPost';
var fs = require('fs');
var db = global.db;
var VVutils = require('../utils.js');
var metaAddTag = require('./metaAddTag.js');

module.exports = function addPost(req, uuid, path, fields, deleteTemp, throwErr, callback) {
    
    //flags
    var setProfileFlag = false;


    console.log(fname + ' ' + 'inside addPost');
    var DESC = fields['desc'];
    console.log(fname + ' ' + fields);

    var itemMeta = JSON.parse(fields['itemMeta']);
    
    itemMeta.itemLink = VVutils.nullIfEmpty(itemMeta.itemLink);
    itemMeta.itemAddTag = VVutils.nullIfEmpty(itemMeta.itemAddTag);
    itemMeta.itemPrice = VVutils.nullIfEmpty(itemMeta.itemPrice);
    console.log(fname + ' ' + itemMeta);

    //take out email addresses, because it messes with @tagging.
    var hasEmails = false;
    var emails = DESC.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

    if(emails) {
        if(emails.length > 0) { 
            var eml = 0;
            while(emails[eml]) {
                DESC = DESC.replace(emails[eml], '{{{email}}}');
                eml++;
            }
            hasEmails = true; 
        }
    }

    var hashTags = DESC.match(/#\w+/g),
        addTags = DESC.match(/@\w+/g);

        console.log(fname + 'hashtags: ' + hashTags);
        console.log(fname + 'addtags: ' + addTags);

        //not in use yet.
        //startags = DESC.match(/\*\w+/g);

    //filter them
    function uniqBy(a, key) {
        var seen = {};
        return a.filter(function(item) {
            var k = key(item);
            return seen.hasOwnProperty(k) ? false : (seen[k] = true);
        });
    }

    if(hashTags) { 
        hashTags = uniqBy(hashTags, JSON.stringify); 
        var ht = 0;
        while(hashTags[ht]) {
            var h = hashTags[ht];
            
            //create the RegExp to replace my description later.
            var hRe = new RegExp(h, 'g');
            
            //clean out non-alphanumerics 
            h = h.replace(/\W/g, '');

            //now check the length
            if(h.length > 50) {
                //too long. ignore and take it out.
                hashTags.splice(ht, 1);
                //need to decrement back the count:
                ht--;
            } else {
                //replace all original instances of the unsanitized hashtag (using hRe)
                //with the sanitized hashtag.
                DESC = DESC.replace(hRe, '<a href="/hashtag/' + h + '">#' + h + '</a>');

                //further process hashtag by lowercasing it.
                //then store the completely sanitized hashtag back
                hashTags[ht] = h.toLowerCase();
            }
            ht++;
        }
    }

    if(addTags) { 
        addTags = uniqBy(addTags, JSON.stringify); 
        //lowercas'ify the addTags array
        var at = 0;
        while(addTags[at]) {
            addTags[at] = addTags[at].toLowerCase().substring(1);
            at++;
        }

    }
    console.log(fname + 'hashtags: ' + hashTags);
    console.log(fname + 'addtags: ' + addTags);

    function addHashTags(hashTags, post) {
        //asynchronouse hashtag adding. non-critical process so we don't really care.
        console.log(fname + ' creating hashTags...');
        console.log(fname + ' ' + hashTags);
        if(hashTags) {
            var postId = post.values['postId'];
            var hashTags = hashTags;
            
            //arrange the hashtags for bulkCreation
            var bulk = [];
            for(var i=0; i<hashTags.length; i++) {
                var push = { hashtagId: hashTags[i]}
                bulk.push(push);
            }
            db.Hashtag
                .bulkCreate(bulk)
                .then(function() {
                    console.log(fname + ' ' + 'hashtags: ' + hashTags + ' added for post id ' + postId);
                    return post.addHashtags(hashTags);
                }).catch(function(err) {
                    console.log(fname + ' ' + err);

                    //if the hashtags are already created, promise chain will be brought here.
                    //so we just add the hashtags anyway..
                    return post.addHashtags(hashTags);
                });
        }
    }

    var errorFn = function(err) {
        console.log(fname + ' ' + err);
        //delete away image if error in creating post.
        fs.unlink(path, function(err) {
            if(err) {
                console.log(fname + ' Err: Error deleting' + uuid + '.jpg');
                console.log(fname + ' ' + err);
            }
        });
        return throwErr(err);
    }

    function finalCreate() {
        if(hasEmails) {
            var hml = 0;
            while(emails[hml]) {
                DESC = DESC.replace('{{{email}}}', emails[hml]);
                hml++;
            }
        }

        console.log(fname + ' ' + itemMeta);
        //create the post
        db.User.find().then(function() {

            var postHash = { 
                desc: DESC,
                User_userId: req.user.userId,
                imgUUID: uuid
            }

            //if user has no profile picture, set this one as profile picture.
            if(!req.user.profilePicture) {
                console.log(fname +' ' + 'user has no profile picture. This post will be set as profile picture.')
                postHash.isProfilePicture = true;
                setProfileFlag = true;
            }

            return [

                db.Post.create(postHash),
                //run metaAddTag to attempt to get back the user instance
                metaAddTag(itemMeta.itemAddTag),

            ]

        }).spread(function(post, addtag) {

            //set the profilepicture async.
            if(setProfileFlag) { 
                console.log(fname + ' setting profile picture...'); 
                db.User.update({
                    profilePicture: uuid, 
                    Post_postId_profilePicture: post.postId
                }, {
                    userId: req.user.userId
                }).catch(function(err) {
                    console.log(fname + ' ' + err);
                });
            }

            console.log(fname + ' ' + addtag);
            //asynchronouse hashtag adding. non-critical process so we don't really care.
            console.log(fname + ' ' + hashTags);
            addHashTags(hashTags, post);

            return [
                post,
                
                (function() {
                    if(addtag) {
                        return db.PostMeta.create({
                            key: "itemAddTag",
                            value: addtag.userNameDisp,
                            Post_postId: post.postId
                        });
                    }
                    return false;
                })(),

                (function() {
                    if(itemMeta.itemLink) {
                        console.log(fname + ' ' + 'has itemLink');
                        return db.PostMeta.create({
                            key: "itemLink",
                            value: itemMeta.itemLink,
                            Post_postId: post.postId
                        });
                    } else {
                        return false;
                    }
                })(),

                (function() {
                    if(itemMeta.itemPrice) {
                        console.log(fname + ' ' + 'has price');
                        return db.PostMeta.create({
                            key: "itemPrice",
                            value: itemMeta.itemPrice,
                            Post_postId: post.postId
                        });
                    } else {
                        return false;
                    }
                })()
            ]
        }).spread(function(post) {
            console.log(fname + ' Fields inserted.');
            if(typeof callback === 'function') {
                callback(post);
            }   
        }).then(function() {
            //asynchrous background deletion :)
            if(typeof deleteTemp === 'function') {
                deleteTemp();
            }
        }).catch(errorFn);
    }

    if(addTags) {
        //now find them all to see if they exist.
        db.User.findAll({
            where: {
                userName: addTags
            },
            attributes: ['userName','userNameDisp']
        }).then(function(users) {
            if(users) {
                var i=0;
                while(users[i]) {
                    var user = users[i];
                    var u = '@' + user.values['userNameDisp'];
                    var uRe = new RegExp(u, 'gi');
                    DESC = DESC.replace(uRe, '<a href="/' + u + '">' + u + '</a>');
                    console.log(fname + ' ' + DESC);
                    i++;
                }
            }
            console.log(fname + ' ' + hashTags);
            finalCreate();

        }).catch(errorFn);
    } else {
        finalCreate();
    }
}