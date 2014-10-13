module.exports = function(sequelize, DataTypes) {

//note: (bug) have to manually add these fields because the association create this table already.

    var Following = sequelize.define('Following', {
        //camelCase
        affinityId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        affinity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        }
    }, {
        timestamps: true,
        updatedAt: false,
        tableName: 'Following', //PascalCase
    });
return Following;
};
