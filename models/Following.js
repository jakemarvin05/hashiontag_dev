module.exports = function(sequelize, DataTypes) {

//note: (bug) have to manually add these fields because the association create this table already.

    var Following = sequelize.define('following', {
        //camelCase
        affinityId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        affinity: {
            type: DataTypes.DECIMAL(1000, 6), //or manually set datatype to real
            allowNull: false,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        updatedAt: false,
        tableName: 'Following', //PascalCase
        classMethods: {
            associate: function(models) {
                //following belongs to user
                Following.belongsTo(models.User, {foreignKey: 'FollowId'});

            }
        }
    });
return Following;
};
