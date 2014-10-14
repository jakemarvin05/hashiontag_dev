module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var ErrorReceiver = sequelize.define('ErrorReceiver',
        {   
            id: {//cant change
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            where: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            type: {
                type: DataTypes.STRING(500),
                allowNull: true
            },
            data: {
                type: DataTypes.STRING(10000),
                allowNull: true
            },
            userAndUA: {
                type: DataTypes.STRING(1000),
                allowNull: true
            },
            req: {
                type: DataTypes.STRING(10485760),
                allowNull: true
            }
        }, {
            timestamps: true,
            updatedAt: false,
            tableName: 'ErrorReceiver'//PascalCase
        }
    );
 
return ErrorReceiver;
};