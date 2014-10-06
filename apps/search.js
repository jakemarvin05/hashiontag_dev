var db = global.db;

module.exports = function search(req, res) {

    var throwErr = function(error) {
        console.log(error);
        return res.json({success: false});
    }//end throwErr

    var parseUsers = function(users){
        console.log(users);
        console.log('search: db retrieval complete');

        // var userArray = {};

        // for(var i in users) {
        //     var user = users[i];
        //     userArray[i] = {
        //         userId: user.values['userId'],
        //         userNameDisp: user.values['userNameDisp'],
        //         name: user.values['name'],
        //         imgUUID: user.values['imgUUID']
        //     }
        // }
        results = {
            success: true,
            userArray: users
        }
    
        console.log('returning the array...');

        return res.json(results);

    }//end parseUsers

    console.log('search: .. finding users...');


    var input = req.body.query,
        hasAdd = input.indexOf('@') === 0,
        hasHash = input.indexOf('#') === 0;

    console.log(input);

    if(hasAdd) {
        //username trying to key a @screenname, trim it
        var searchParam = input.replace('@', '');
    } 
    db.User.search(searchParam)
        .then(parseUsers)
        .catch(throwErr);

}