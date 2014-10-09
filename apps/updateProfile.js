var db = global.db;
var Promise = require('bluebird');
module.exports = function editProfile(req,res) {

    /* this function will receive:
    { name: 'Calvin Tan',
      gender: 'female',
      email: 'calvin14@gmail.com',
      web: 'hjjjjj',
      country: 'Andorra',
      about: 'I built this thing.',
      picture: 'img5232848d40000000' }

    */

    if(!req.isAuthenticated()){ return res.redirect('/'); }

    console.log(req.body.country);

    db.Post.find().then(function() {
        if(req.body.picture) {
            return db.Post.find({
                where: {imgUUID: req.body.picture},
                attributes: ['postId']
            });
        }
    }).then(function(post) {
        return [
            function() { if(post) { return post.setProfilePictureUser(req.user); } },
            db.User.update({
                name: req.body.name,
                gender: req.body.gender,
                email: req.body.email,
                web: req.body.web,
                country: req.body.country,
                about: req.body.about
            }, {
                userId: req.user.userId
            })
        ]
    }).spread(function() {
        return res.json({ success: true});
    }).catch(function(err) {
        // var msg = [];
        // console.log(err);
        // if (typeof err.name == "object"){ // "Name" is a reserved keyword
        //     msg.push("Invalid name provided.");
        // }
        // if (typeof err.email != "undefined"){
        //     msg.push("Invalid email provided.");
        // }
        // if (typeof err.about != "undefined"){
        //     msg.push("Invalid description provided.");
        // }
        // if (msg.length==0){
        //     msg.push("An unknown error has occured.");
        // }
        console.log(err);
        return res.json({success:false});
    });
}