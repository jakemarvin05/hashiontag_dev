var fs        = require('fs'),
    path      = require('path'),
    Sequelize = require('sequelize'),
    lodash    = require('../node_modules/sequelize/node_modules/lodash'),
    
    //sequelize parameters: 'name','username','password'

    // //heroku
    // sequelize = new Sequelize('d2qhi6e8qpq1js', 'achmxwosijzdwc', 'g_05iNqib65ZR7wZArOjfhkmh7',
    //     {
    //         host: "ec2-54-235-245-180.compute-1.amazonaws.com",
    //         dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
    //         port: 5432, // or 5432 (for postgres)
    //         native: true, //requires c binding

    //     }),
    // //DIGITAL OCEAN
    // sequelize = new Sequelize('postgres', 'postgres', 'mondayblues'
    //     ,{
    //         host: "localhost",
    //         dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
    //         port: 5432, // or 5432 (for postgres)
    //         native: false,  //change settings to localhost and turn native to false if unable to compile native C bindings
    //     }),
    //DIGITAL OCEAN FOREIGN ACCESS
    sequelize = new Sequelize('postgres', 'postgres', 'mondayblues'
        ,{
            host: "128.199.242.236",
            dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
            port: 5432, // or 5432 (for postgres)
            native: false,  //change settings to localhost and turn native to false if unable to compile native C bindings
        }),
    // //localhost
    // sequelize = new Sequelize('postgres', 'postgres', 'password'
    //     ,{
    //         host: "localhost",
    //         dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
    //         port: 5432, // or 5432 (for postgres)
    //         native: false,  //change settings to localhost and turn native to false if unable to compile native C bindings
    //     }),
    db        = {}
 

// db.User.sync();
//sequelize.sync()

fs
.readdirSync(__dirname)
.filter(function(file) {
    return (file.indexOf('.') !== 0) && (file !== 'index.js')
})
.forEach(function(file) {
    var model = sequelize.import(path.join(__dirname, file))
    db[model.name] = model
})
Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {

        db[modelName].associate(db)
    }
})


module.exports = lodash.extend({
    sequelize: sequelize,
    Sequelize: Sequelize
}, db)