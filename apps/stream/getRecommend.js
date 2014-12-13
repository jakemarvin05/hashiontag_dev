var db = global.db,
    fname = "getRecommend.js ",
    utils = require('../utils.js');


module.exports = function getRecommend(req, res) {

    if(!req.isAuthenticated()) { return res.json({success: false}); }

    var userId = req.user.userId;

    /*Current list of recommended users */
    var recUserIds = [
        11, //bellywellyjelly
        37, //floraisabelle
        34, //clubcouture
        30, //awfullyamanda
        43, //mongabong
        58, //joycelynthiang
        54 //gerritheberri
    ]

    db.User.findAll({
        where: {
            userId: recUserIds
        },
        attributes: ['userId', 'profilePicture', 'userNameDisp', 'about'],
        include: [{
            model: db.Post,
            atttributes: ['postId', 'imgUUID']
        }],
        order: [[db.Post, 'createdAt', 'DESC']]
    }).then(function(users) {

        var shuffled = users.slice(0),
            temp, index,
            i = users.length;

        while(i--) {
            index = Math.floor( (i+1) * Math.random() );
            temp = shuffled[index];
            shuffled[index] = shuffled[i];
            shuffled[i] = temp;
        }

        return res.json({success: true, users: shuffled});
    }).catch(function(err) {
        console.log(fname + ' db error: ' + err);
        return res.json({ success: false });
    });
    
}



