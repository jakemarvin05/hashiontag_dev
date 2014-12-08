var db = global.db;
var fname = "changePassword.js ";
var moment = require('moment');

module.exports = function changePassword(req, res) {

    var isTokenReset;

    //if there is token, alter the where statement
    if (req.body.token) {
        var where = {
            passwordResetToken: req.body.token,
            passwordResetTokenExpire: { gt: moment().format() }
        }
        isTokenReset = true;
    } else {
        //else it is not a tokenised password reset. Need to check if user is logged in.
        if(!req.isAuthenticated()) { return res.json({success:false}); }

        var where = { userId: req.user.userId }
        isTokenReset = false;
    }



    var currPwd = req.body.currPwd,
        newPwd = req.body.newPwd;

    //length shouldn't be less than 6.
    if(newPwd.length < 6) { return res.json({success:false, error: 'unknown'}); }

    db.User.find({
        where: where
    }).then(function(user) {


        //cannot find the user, unknown error.
        if(!user) { return 'unknown'; }

        //if not a token reset, authenticate password.
        if (!isTokenReset) {
            if(!user.authenticate(currPwd)) { return 'password'; }
        }

        //either the token is valid, or user is properly authenticated
        user.setPassword(newPwd);
        return user.save();
        
    }).then(function(result) {
        if (result === 'unknown') { return res.json({success:false, error: 'unknown'}); }
        if (result === 'password') { return res.json({success:false, error: 'password'}); }
        return res.json({success: true});
    }).catch(function(err) {
        console.log(fname + err);
        return res.json({success:false, error: 'unknown'});
    });
}