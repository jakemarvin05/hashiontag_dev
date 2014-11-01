module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var session = sequelize.define('session', {    
        sid: {
            type: DataTypes.STRING(255),
            primaryKey: true,
            allowNull: false
        },
        // sess: {
        //     type: DataTypes.JSON,
        //     allowNull: false
        // },
        expire: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        timestamps: false, 
        tableName: 'session',//PascalCase
        // classMethods: {
        //     associate: function(models) {
        //         //Post
        //     }
        // }
    });
 
return session;
}