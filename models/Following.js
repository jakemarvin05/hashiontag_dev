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
            type: DataTypes.DECIMAL(1000, 6), //or manually set datatype to real
            allowNull: false
        }
    }, {
        timestamps: true,
        updatedAt: false,
        tableName: 'Following', //PascalCase
    });
return Following;
};
