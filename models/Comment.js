module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Comment = sequelize.define('Comment',
        {
            //camelCase
            commentId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            comment: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    not: /<[^>]*script/g
                }
            },
        }, {
            timestamps: true,
            tableName: 'Comments', //PascalCase
            classMethods: {

                
                associate: function(models) {
                    Comment.belongsTo(models.Post, {foreignKey: 'Post_postId'});
                    Comment.belongsTo(models.User, {foreignKey: 'User_userId'});
                }



            }
        }
    );
 
return Comment;
};
