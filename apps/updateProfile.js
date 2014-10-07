var db = require('../models');
module.exports = function editProfile(req,res) {
    if(req.isAuthenticated()){
        console.log("Entered if function");
        console.log(req.user);
        db.User.find({where: {userId: req.user.userId}}).success(function(user){
            var profilePicture = req.user.profilePicture;
            if (typeof req.body.profilePicture != "undefined"){
                profilePicture = req.body.profilePicture;
            }
            user.updateAttributes({
                name:req.body.name, 
                about:req.body.about,
                email:req.body.email,
                profilePicture:profilePicture
            }).then(function(user) {
                console.log('here');
                if(user) {
                    //console.log(true);
                    return res.json({success:true});
                } else {
                    console.log("Error 1");
                    return res.json({success:false});
                }
            }).catch(function(err) {
                var msg = [];
                console.log(err);
                if (typeof err.name == "object"){ // "Name" is a reserved keyword
                    msg.push("Invalid name provided.");
                }
                if (typeof err.email != "undefined"){
                    msg.push("Invalid email provided.");
                }
                if (typeof err.about != "undefined"){
                    msg.push("Invalid description provided.");
                }
                if (msg.length==0){
                    msg.push("An unknown error has occured.");
                }
                return res.json({success:false,message:msg});
            });
        });
    }
}