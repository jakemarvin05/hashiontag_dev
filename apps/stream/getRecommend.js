var db = global.db,
    fname = "getRecommend.js ";


module.exports = function getRecommend(req, res) {

    if(!req.isAuthenticated()) { return res.json({success: false}); }

    var userId = req.user.userId;

    /*Current list of recommended users */
    var recUserIds = [
        11, //bellywellyjelly
        37, //floraisabelle
        34, //clubcouture
        30 //awfullyamanda
    ]

    db.User.findAll({
        where: {
            userId: recUserIds
        },
        attributes: ['profilePicture', 'userNameDisp', 'about'],
        include: [{
            model: db.Post,
            atttributes: ['postId', 'imgUUID']
        }],
        order: [[db.Post, 'createdAt', 'DESC']]
    }).then(function(users) {

        var joinedUsers = [];
        var i = 0;
        while(users[i]) {
            var user = JSON.parse(JSON.stringify(users[i]));
            joinedUsers.push(user);
            i++;
        }

        return res.json({success: true, users: joinedUsers});
    }).catch(function(err) {
        console.log(fname + ' db error: ' + err);
        //return res.json({ success: false });
    });
    
}



