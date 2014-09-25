var fname = 'addPost';
var fs = require('fs');

module.exports = function addingPost(req, uuid, path, fields, deleteTemp, throwErr, callback) {

    var DESC = fields['desc'];

    //take out email addresses
    var hasEmails = false;
    var emails = DESC.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);

    if(emails.length > 0) { 
        var eml = 0;
        while(emails[eml]) {
            DESC = DESC.replace(emails[eml], '{{{email}}}');
            eml++;
        }
        hasEmails = true; 
    }

    var hashTags = DESC.match(/#\w+/g),
        addTags = DESC.match(/@\w+/g);

        console.log(hashTags);
        console.log(addTags);

        //not in use yet.
        //startags = DESC.match(/\*\w+/g);

    //filter them
    function uniqBy(a, key) {
        var seen = {};
        return a.filter(function(item) {
            var k = key(item);
            return seen.hasOwnProperty(k) ? false : (seen[k] = true);
        })
    }

    hashTags = uniqBy(hashTags, JSON.stringify);
    addTags = uniqBy(addTags, JSON.stringify);
    console.log(hashTags);
    console.log(addTags);

    var ht = 0;
    while(hashTags[ht]) {
        var h = hashTags[ht];
        var hRe = new RegExp(h, 'g');
        DESC = DESC.replace(hRe, '<a href="/api/search/' + h + '">' + h + '</a>');
        ht++;
    }

    //lowercas'ify the addTags array
    var at = 0;
    while(addTags[at]) {
        addTags[at] = addTags[at].toLowerCase().substring(1);
        at++;
    }

    //now find them all to see if they exist.
    global.db.User.findAll({
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
                console.log(DESC);
                i++;
            }
        }
        if(hasEmails) {
            var hml = 0;
            while(emails[hml]) {
                DESC = DESC.replace('{{{email}}}', emails[hml]);
                hml++;
            }
        }
    }).then(function() {

        //create the post
        return global.db.Post.create({ 
            desc: DESC,
            User_userId: req.user.userId,
            imgUUID: uuid
        }).then(function(post) {
            console.log(fname + ' Fields inserted.');
            if(typeof callback === 'function') {
                callback(post);
            }
        }).then(function() {
            //asynchrous background deletion :)
            if(typeof deleteTemp === 'function') {
                deleteTemp();
            }

        });
    }).catch(function(err) {
        console.log(err);

        //delete away image if error in creating post.
        fs.unlink(path, function(err) {
            if(err) {
                console.log(fname + ' Err: Error deleting' + uuid + '.jpg');
                console.log(err);
            }
        });

        return throwErr(err);
    });

}