module.exports = function(sequelize, DataTypes) {
    /* GOTCHA: the model should be in PascalCase. The argument in .define should be in small case. */
    var Transaction = sequelize.define('transaction', {
        //camelCase
        transactionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        status: {
            type: DataTypes.STRING(50),
            allowNull: false,
            isIn: [[
                'cart',
                'success',
                'failed'
            ]]
        },
        dataMeta: {
            type: DataTypes.JSON,
            allowNull: true
        },
        dataReceipt: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'Transaction', //PascalCase
        classMethods: {
            associate: function(models) {
                Transaction.hasMany(models.Purchase, {foreignKey: 'Transaction_transactionId', onDelete: 'RESTRICT', onUpdate: 'CASCADE'});
                Transaction.belongsTo(models.User, {foreignKey: 'User_userId'});
            }

        }
    });
    return Transaction;
};