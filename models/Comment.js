var moment = require('../apps/moment/moment.js');

module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Comment = sequelize.define('comment',
        {
            //camelCase
            commentId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            comment: {
                type: DataTypes.STRING(1000),
                allowNull: false,
                validate: {
                    not: /<[^>]*script/g
                }
            },
        }, {
            timestamps: true,
            tableName: 'Comment', //PascalCase
            classMethods: {
                associate: function(models) {
                    Comment.belongsTo(models.Post, {foreignKey: 'Post_postId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                    Comment.belongsTo(models.User, {foreignKey: 'User_userId'});
                }

            },
            getterMethods: {
                timeLapse: function() {
                    return moment(this.createdAt).fromNow();
                },
                timeLapseShort: function() {
                    return moment(this.createdAt).locale('en-shortened').fromNow();
                }
            }
        }
    );
 
return Comment;
};
