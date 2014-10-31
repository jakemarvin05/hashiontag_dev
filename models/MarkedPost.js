module.exports = function(sequelize, DataTypes) {

    var MarkedPost = sequelize.define('MarkedPost',
        {   
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            Post_postId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            User_userId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            User_userId_reporter: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
        }, {
            timestamps: true,
            updatedAt: false,
            tableName: 'MarkedPost'//PascalCase
        }
    );
 
return MarkedPost;
};