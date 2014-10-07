module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Following = sequelize.define('Following',
        {
            //camelCase
            id: {
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
        }
    );
return Following;
};
