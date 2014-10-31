var db = global.db;
var fs = require('fs');
var fname = "markPost ";

module.exports = function markInapp(req, res) {
    if(!req.isAuthenticated()) { return res.json({success: false, reason: 'notAuth'}); }

    var postToMark = req.body.pid,
        postOwner = req.body.uid;

    db.MarkedPost.create({
        Post_postId: postToMark,
        User_userId: postOwner,
        User_userId_reporter: req.user.userId
    }).then(function() {
        console.log(fname + 'postId ' + postToMark + ' by ' + postOwner + ' is marked as inappropriate.');
        return res.json({success: true});
    }).catch(function(err) {
        console.log(err);
        return res.json({success: false});
    });

}