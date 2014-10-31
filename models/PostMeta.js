module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var PostMeta = sequelize.define('PostMeta', {   
        metaId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        key: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        value: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: true, 
        tableName: 'PostMeta',//PascalCase
        classMethods: {
            associate: function(models) {
                //Post
                PostMeta.belongsTo(models.Post, {foreignKey: 'Post_postId'});
            }
        },
    });
 
return PostMeta;
};