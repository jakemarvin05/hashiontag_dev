// Digital Ocean Local URL
//var databaseUrl = 'postgresql://username:password@localhost:5432/database?native=false'
// Digital Ocean Development URL
var databaseUrl = 'postgresql://postgres:mondayblues@128.199.242.236:5432/postgres_dev';
// Digital Ocean Production? URL
// var databaseUrl = 'postgresql://postgres:mondayblues@localhost/postgres';

var fs        = require('fs'),
    path      = require('path'),
    Sequelize = require('sequelize'),
    lodash    = require('../node_modules/sequelize/node_modules/lodash'),
    sequelize = new Sequelize(databaseUrl, {jsonDeepCompare: false}),
    // sequelize = new Sequelize(databaseUrl, {
    //     jsonDeepCompare: false,
    //     logging: false
    // }),
    db        = {}


//db.User.sync();
//sequelize.sync()

fs.readdirSync(__dirname).filter(function(file) {

    return (file.indexOf('.') !== 0) && (file !== 'index.js')

}).forEach(function(file) {

    var model = sequelize.import(path.join(__dirname, file))
    var name = file.substring(0, file.indexOf(".")); //ugly hack to restore uppercase
    db[name] = model

});

Object.keys(db).forEach(function(modelName) {
    if ('associate' in db[modelName]) {
        db[modelName].associate(db)
    }
});


module.exports = lodash.extend({
    sequelize: sequelize,
    Sequelize: Sequelize,
    databaseUrl: databaseUrl
}, db)