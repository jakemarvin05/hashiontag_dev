var fname = 'metaAddTag';
var db = global.db;

module.exports = function metaAddTag(addtag) {
    if(!addtag) { return false; }
    var tag = addtag
    console.log(fname)
    console.log(tag)
    if(addtag.indexOf('@') === 0) {
        tag = tag.substring(1);
    }
    console.log(tag);
    var match = tag.match(/^[a-zA-Z0-9_]+$/);
    console.log(fname + ' ' + match);

    if(match) {
        return db.User.find({
            where: { userName: match[0].toLowerCase() },
            attributes: ['userNameDisp']
        }, {raw: true});
    }
    return false;
}