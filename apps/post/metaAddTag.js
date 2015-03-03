var fname = 'metaAddTag ';
var db = global.db;

module.exports = function metaAddTag(itemMeta) {
    if(!itemMeta) { return false; }
    if(!itemMeta.userName) { return false; }
    var tag = itemMeta.userName;
    if(tag.indexOf('@') === 0) {
        tag = tag.substring(1);
    }
    var match = tag.match(/^[a-zA-Z0-9_]+$/);
    if(match) {
        return db.User.find({
            where: { userName: match[0].toLowerCase() },
            attributes: ['userId', 'userNameDisp', 'profilePicture']
        }, {raw: true}).catch(function(err) {
            console.log(fname + 'error in catch handler. Error: ' + err);
            return false;
        });
    }
    return false;
}