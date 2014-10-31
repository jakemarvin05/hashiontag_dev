module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Stream = sequelize.define('Stream', {   
        
        streamKey: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: false
        }
    }, {
        timestamps: true, 
        updatedAt: false,
        tableName: 'Stream',//PascalCase
        classMethods: {
  
            associate: function(models) {
                //Post
                Stream.belongsTo(models.Post, {foreignKey: 'Post_postId'});
                Stream.belongsTo(models.User, {foreignKey: 'User_userId'});
            }
        },
    });
 
return Stream;
};
//need to add association to 