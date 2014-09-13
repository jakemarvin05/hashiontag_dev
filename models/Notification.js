module.exports = function(sequelize, DataTypes) {

    var Notification = sequelize.define('Notification',
        {
            //camelCase
            notificationId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        }, {
            timestamps: true,
            updatedAt: false,
            tableName: 'Notifications', //PascalCase
            classMethods: {

                associate: function(models) {

                    Notification.belongsTo(models.User, {as: 'Setter', foreignKey: 'User_userId_setter'});
                    Notification.belongsTo(models.User, {as: 'Receiver', foreignKey: 'User_userId_receiver'});
                    Notification.belongsTo(models.Post, {foreignKey: 'Post_postId'});

                }



            }
        }
    );
 
return Notification;
};