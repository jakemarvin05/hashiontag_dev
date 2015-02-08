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
                    Hashtag.belongsToMany(models.Post, {through: models.Post_Hashtag, foreignKey: 'Hashtag_hashtagId', onDelete: 'CASCADE', onUpdate: 'CASCADE'});
                }
            } //classMethods
        }
    );
 
return Hashtag;
};
