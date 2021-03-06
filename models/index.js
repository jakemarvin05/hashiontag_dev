// Digital Ocean Local URL
//var databaseUrl = 'postgresql://postgres:password@localhost:5432/postgres2?native=false'
// Digital Ocean Development URL
var databaseUrl = 'postgresql://postgres:mondayblues@128.199.242.236:5432/postgres_dev';
// Digital Ocean Production? URL
// var databaseUrl = 'postgresql://postgres:mondayblues@localhost/postgres';

var fs        = require('fs'),
    path      = require('path'),
    Sequelize = require('sequelize'),
    lodash    = require('../node_modules/sequelize/node_modules/lodash'),
    sequelize = new Sequelize(databaseUrl),
    // sequelize = new Sequelize(databaseUrl, {logging: false }),
    db        = {}

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

//call db.[Model].sync() to sync only one model.
//db.Transaction.sync();
//sequelize.sync()


module.exports = lodash.extend({
    sequelize: sequelize,
    Sequelize: Sequelize,
    databaseUrl: databaseUrl
}, db)