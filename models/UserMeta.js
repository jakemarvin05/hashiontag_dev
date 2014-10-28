module.exports = function(sequelize, DataTypes) {

    var UserMeta = sequelize.define('UserMeta',
        {
            //camelCase
            userMetaId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            key: {
                type: DataTypes.STRING(20),
                allowNull: false
            },
            value: {
                type: DataTypes.STRING(5000),
                allowNull: false
            }
        }, {
            timestamps: false,
            tableName: 'UserMeta', //PascalCase
            classMethods: {
                
                associate: function(models) {
                    UserMeta.belongsTo(models.User, {foreignKey: 'User_userId'});
                }

            }
        }
    );
 
return UserMeta;
};
