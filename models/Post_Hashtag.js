module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Post_Hashtag = sequelize.define('post_Hashtag', {}, {
        timestamps: true, 
        tableName: 'Post_Hashtag'//PascalCase
    });
 
return Post_Hashtag;
};