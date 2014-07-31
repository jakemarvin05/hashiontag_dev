module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Post = sequelize.define('Post',
        {
            post_id: {
                type: DataTypes.INTEGER,
                primaryKey: true
            },
            desc: {
                type: DataTypes.STRING,
                validate: {
                }
            }
        }, {
        timestamps: true,
        tableName: 'posts'
        }, {
            classMethods: {
                associate: function(models) {
                    Post.belongsTo(models.User);
                }
            }
        }
    );

    Post.sync();
 
return Post;
};
