
module.exports = {
    init: function () {
        
        var Sequelize = require('sequelize')
        //'name','username','password'
        , sequelize = new Sequelize('d2qhi6e8qpq1js', 'achmxwosijzdwc', 'g_05iNqib65ZR7wZArOjfhkmh7', {
            host: "ec2-54-235-245-180.compute-1.amazonaws.com",
            dialect: "postgres", // or 'sqlite', 'postgres', 'mariadb'
            port:    5432, // or 5432 (for postgres)
            native: true
        });
    return sequelize;
    }
}