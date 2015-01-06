module.exports = function(sequelize, DataTypes) {

    var Hashtag = sequelize.define('hashtag',
        {
            //camelCase
            hashtagId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            }
        }, {
            timestamps: false,
            tableName: 'Hashtag', //PascalCase
            classMethods: {
                associate: function(models) {
                    Hashtag.hasMany(models.Post, {foreignKey: 'Hashtag_hashtagId', through: 'Post_Hashtag', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                }
            } //classMethods
        }
    );
 
return Hashtag;
};
