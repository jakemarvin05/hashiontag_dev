var db = global.db;
var fname = "checkPassword.js ";

module.exports = function checkPassword(req, res) {

    //do some checking
    //console.log(req.body);
    var currPwd = req.body.currPwd,
        newPwd = req.body.newPwd;

    //length shouldn't be less than 6.
    if(newPwd.length < 6) { return res.json({success:false, error: 'unknown'}); }

    db.User.find({
        where: {
            userId: req.user.userId
        }
    }).then(function(user) {
        console.log(user);
        //cannot find the user, unknown error.
        if(!user) { return res.json({success:false, error: 'unknown'}); }

        //user password is incorrect

        if(user.authenticate(currPwd)) { return res.json({success:false, error: 'password'}); }

        user.setPassword(newPwd);

        return user.save();
        
    }).then(function() {
        return res.json({success: true});
    }).catch(function(err) {
        console.log(fname + err);
        return res.json({success:false, error: 'unknown'});
    });
}