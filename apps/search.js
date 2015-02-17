var db = global.db;

module.exports = function search(req, res) {

    var throwErr = function(error) {
        console.log(error);
        return res.json({success: false});
    };//end throwErr

    console.log('search: .. finding users...');

    var input = req.body.query,
        hasAdd = input.indexOf('@') === 0,
        hasHash = input.indexOf('#') === 0;

    if (hasAdd) {
        //username trying to key a @screenname, trim it
        var searchParam = input.replace('@', '');
        return db.User.search(searchParam)
            .then(function(users) {
                return parseUsers(users, res);
            }).catch(throwErr);
    }
    if (hasHash) {
        var query = input.replace('#', '');
        var searchParam = [ "\"hashtag\".\"hashtagId\" LIKE ?", query + '%' ];
        return db.Hashtag.findAll({
            where: searchParam,
        }).then(function(hashtags) {
            results = {
                success: true,
                results: hashtags,
                resultType: 'hashtag'
            }
            res.json(results);
        }).catch(throwErr);
    }
    return db.User.search(input)
        .then(function(users) {
            return parseUsers(users, res);
        }).catch(throwErr);
};

var parseUsers = function(users, res){
    console.log('search: db retrieval complete');

    results = {
        success: true,
        results: users,
        resultType: 'user'
    };

    console.log('returning the array...');
    console.log(results);
    return res.json(results);

};//end parseUsers