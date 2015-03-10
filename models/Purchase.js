module.exports = function(sequelize, DataTypes) {
    /* GOTCHA: the model should be in PascalCase. The argument in .define should be in small case. */
    var Purchase = sequelize.define('purchase', {
        //camelCase
        purchaseId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        stage: {
            type: DataTypes.STRING(50),
            allowNull: false,
            isIn: [[
                'cart',
                'reserved',
                'paid',
                'delivery',
                'delivered',
                'not received',
                'refunded'
            ]]
        },
        qty: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
            validate: {
                min: 1
            }
        },
        size: {
            type: DataTypes.STRING,
            allowNull: false
        },
        dataMeta: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'Purchase', //PascalCase
        classMethods: {
            associate: function(models) {
                Purchase.belongsTo(models.Post, {foreignKey: 'Post_postId', onDelete: 'RESTRICT', onUpdate: 'CASCADE'});
                Purchase.belongsTo(models.User, {foreignKey: 'User_userId'});

                //Transaction
                Purchase.belongsTo(models.Transaction, {foreignKey: 'Transaction_transactionId', onDelete: 'RESTRICT', onUpdate: 'CASCADE'});
            }

        }
    });
    return Purchase;
};