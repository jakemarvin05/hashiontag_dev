// Digital Ocean Local URL
//var databaseUrl = 'postgresql://username:password@localhost:5432/database?native=false'
// Digital Ocean Development URL
var databaseUrl = 'postgresql://postgres:mondayblues@128.199.242.236:5432/postgres_dev';
// Digital Ocean Production? URL
// var databaseUrl = 'postgresql:://postgres:password@localhost/postgres'

var fs        = require('fs'),
    path      = require('path'),
    Sequelize = require('sequelize'),
    lodash    = require('../node_modules/sequelize/node_modules/lodash'),
    sequelize = new Sequelize(databaseUrl),
    //sequelize parameters: 'name','username','password'

    // //DIGITAL OCEAN LOCAL
    // sequelize = new Sequelize('hashiontag', 'gotjosh', ''
    //     ,{
    //         host: "localhost",
    //         dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
    //         port: 5432, // or 5432 (for postgres)
    //         native: false,  //change settings to localhost and turn native to false if unable to compile native C bindings
    //     }),
    //DIGITAL OCEAN FOREIGN ACCESS
    // sequelize = new Sequelize('postgres_dev', 'postgres', 'mondayblues'
    //     ,{
    //         host: "128.199.242.236",
    //         dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
    //         port: 5432, // or 5432 (for postgres)
    //         native: false,  //change settings to localhost and turn native to false if unable to compile native C bindings
    //     }),
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
    Sequelize: Sequelize,
    databaseUrl: databaseUrl
}, db)