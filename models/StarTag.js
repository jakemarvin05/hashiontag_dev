module.exports = function(sequelize, DataTypes) {

    var StarTag = sequelize.define('starTag', {
        //camelCase
        starTagId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        starTag: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        starTagLowerCase: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        expiry: {
            type: DataTypes.DATE,
            allowNull: true //when null, means no expiry
        },
        newPostCounter: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        updatedAt: false,
        tableName: 'StarTag', //PascalCase
        classMethods: {
            associate: function(models) {
                StarTag.belongsTo(models.User, {foreignKey: 'User_userId'});
            }
        }
    });
 
return StarTag;
};
