module.exports = function(sequelize, DataTypes) {

    var Instagram = sequelize.define('Instagram',
        {
            //camelCase
            runningKey: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            instaId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            screenName: {
                type: DataTypes.STRING(200),
                allowNull: false
            },
            stopArray: {
                type: DataTypes.STRING(1000),
                allowNull: false,
                defaultValue: "[]"
            }
        }, {
            timestamps: true,
            tableName: 'Instagram', //PascalCase
            classMethods: {
                
                associate: function(models) {
                    Instagram.belongsTo(models.User, {foreignKey: 'User_userId'});
                }

            }
        }
    );
 
return Instagram;
};
