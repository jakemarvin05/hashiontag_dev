module.exports = function(sequelize, DataTypes) {

    var Hashtag = sequelize.define('Hashtag',
        {
            //camelCase
            hashtagId: {
                type: DataTypes.STRING,
                primaryKey: true,
                allowNull: false
            }
        }, {
            timestamps: false,
            tableName: 'Hashtags', //PascalCase
            classMethods: {
                associate: function(models) {
                    Hashtag.hasMany(models.Post, {foreignKey: 'Hashtag_hashtagId', through: 'Posts_Hashtags'});
                }
            } //classMethods
        }
    );
 
return Hashtag;
};
