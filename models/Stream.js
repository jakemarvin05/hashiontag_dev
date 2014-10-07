module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Stream = sequelize.define('Stream', {   
        streamKey: {//cant change
            type: DataTypes.DECIMAL(1000,500), //this means 1000 digits, with 500 decimal digits
            primaryKey: true,
            allowNull: false
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