var S = require('string');

module.exports = function meta(renderJSON, page) {

    //defaults
    var metaArr = {
        title: 'VogueVerve',
        desc: 'Social fashion feeds that way you love it.',
        img: 'images/vv-logo-og.png'
    }

    //default/commonly user params
    var title = 'VogueVerve',
        uploadDir = 'uploads/';



    if(page === "singlePost" && renderJSON) {
        var post = renderJSON.posts[0];

        //title
        var userNameDisp = post.user.userNameDisp;
        metaArr.title = userNameDisp + ' on ' + title;

        //description
        var newDesc = S(post.desc).truncate(150).s;
        metaArr.desc = newDesc;

        //og image
        var newImg = uploadDir + post.imgUUID + '.jpg';
        metaArr.img = newImg;
    }

    if(page === "profile" && renderJSON) {
        var user = renderJSON;

        //title
        var userNameDisp = user.userNameDisp;
        metaArr.title = userNameDisp + ' on ' + title;

        //description
        var newDesc = 'Check out ' + userNameDisp + '\'s profile on VogueVerve. ' + metaArr.desc;
        metaArr.desc = newDesc;

        //og image
        if(user.profilePicture) {
            var newImg = uploadDir + user.profilePicture + '.jpg';
            metaArr.img = newImg;
        }
    }

    return metaArr;
}