var fname = 'metaAddTag ';
var db = global.db;

module.exports = function metaAddTag(addtag) {
    if(!addtag) { return false; }
    var tag = addtag;
    if(addtag.indexOf('@') === 0) {
        tag = tag.substring(1);
    }
    var match = tag.match(/^[a-zA-Z0-9_]+$/);
    if(match) {
        return db.User.find({
            where: { userName: match[0].toLowerCase() },
            attributes: ['userNameDisp']
        }, {raw: true}).catch(function(err) {
            console.log(fname + 'error in catch handler. Error: ' + err);
            return false;
        });
    }
    return false;
}