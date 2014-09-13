module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Like = sequelize.define('Like',
        {
            //camelCase
            likeId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
        }, {
            timestamps: true,
            updatedAt: false,
            tableName: 'Liking', //PascalCase
            classMethods: {
                
                associate: function(models) {
                    Like.belongsTo(models.Post, {foreignKey: 'Post_postId'});
                    Like.belongsTo(models.User, {foreignKey: 'User_userId'});
                }



            }
        }
    );
 
return Like;
};