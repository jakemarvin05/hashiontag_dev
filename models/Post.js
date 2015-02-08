var moment = require('../apps/moment/moment.js');

module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Post = sequelize.define('post', {
        //camelCase
        postId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            allowNull: false,
            autoIncrement: true
        },
        desc: {
            type: DataTypes.STRING(4000),
            allowNull: true
        },
        descHTML: {
            type: DataTypes.STRING(10000),
            allowNull: true
        },
        tags: {
            type: DataTypes.STRING(20000),
            allowNull: true
        },
        imgUUID: {
            type: DataTypes.STRING,
            allowNull: false
        },
        postScore:{
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        isProfilePicture: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        isAttributionApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        isNotPublished : {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        isProduct: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        },
        dataProduct: {
            type: DataTypes.JSON,
            allowNull: true
        },
        dataMeta: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'Post', //PascalCase
        classMethods: {

            
            associate: function(models) {
                //Post
                Post.belongsTo(models.User, {foreignKey: 'User_userId'});


                //Profile picture
                //This relationship is to enable post.hasProfilePictureUser so that user can be alerted
                //at deletion.
                Post.hasOne(models.User, {as: 'ProfilePictureUser', foreignKey: 'Post_postId_profilePicture', constraints: false});

                //comment
                Post.hasMany(models.Comment, {foreignKey: 'Post_postId'});

                //likes
                //Post.hasMany(models.User, {as: 'Likers', foreignKey: 'User_userId', through: 'Liking', foreignKeyConstraint: false});
                Post.hasMany(models.Like, {foreignKey: 'Post_postId'})

                //notification
                Post.hasMany(models.Notification, {foreignKey: 'Post_postId'});

                //Hashtags
                Post.hasMany(models.Hashtag, {foreignKey: 'Post_postId', through: 'Post_Hashtag'});

                //Stream
                Post.hasMany(models.Stream, {foreignKey: 'Post_postId'});

                //Metatag
                Post.hasMany(models.PostMeta, {foreignKey: 'Post_postId'});

                //Star Tag Attribution
                Post.belongsTo(models.User, {as: 'attributedPost', foreignKey: 'User_userId_attributed'});

                //Cart and purchase
                Post.hasMany(models.Purchase, {foreignKey: 'Post_postId'});
            }
        },
        getterMethods: {
            timeLapse: function() {
                return moment(this.createdAt).fromNow();
            },
            timeLapseShort: function() {
                return moment(this.createdAt).locale('en-shortened').fromNow();
            }
        }
    });
 
return Post;
};
