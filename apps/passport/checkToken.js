var db = global.db;
var fname = "checkToken.js ";
var moment = require('moment');

module.exports = function checkToken(req, res, token) {

    db.User.find({
        where: {
            passwordResetToken: token,
            passwordResetTokenExpire: { gt: moment().format() }
        }
    }).then(function(user){
        if (user) { return res.json({success: true}); }
        return res.json({success:false});
    }).catch(function(err){
        console.log(fname + ' catch handler caught error: ' + err);
        console.log(fname + ' token was: ' + token);
        return res.json({success:false});
    });

}