var db = global.db;

module.exports = function search(req, res) {

    var throwErr = function(error) {
        console.log(error);
        return res.json({success: false});
    }//end throwErr

    var parseUsers = function(users){
        console.log('search: db retrieval complete');

        results = {
            success: true,
            results: users,
            resultType: 'user'
        }
    
        console.log('returning the array...');

        return res.json(results);

    }//end parseUsers

    console.log('search: .. finding users...');


    var input = req.body.query,
        hasAdd = input.indexOf('@') === 0,
        hasHash = input.indexOf('#') === 0;

    if(hasAdd) {
        //username trying to key a @screenname, trim it
        var searchParam = input.replace('@', '');
        return db.User.search(searchParam)
            .then(parseUsers)
            .catch(throwErr);
    }
    if(hasHash) {
        var searchParam = input.replace('#', '');
        /* TODO: WHEN UNPLURALISE THE TABLES, THIS NEEDS TO BE CHANGED!! */
        searchParam = "\"hashtag\".\"hashtagId\" LIKE '" + searchParam + "%'";
        return db.Hashtag.findAll({
            where: [searchParam],
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
        .then(parseUsers)
        .catch(throwErr);
}