var moment = require('moment');

module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var User = sequelize.define('User',
        {
            userId: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            userName: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    max: 15,
                    min: 6,
                    is: ["^[a-z0-9_]+$", "i"]
                }
            },
            userNameDisp: {
                type: DataTypes.STRING,
                allowNull: false
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    min: 6
                }
            }
        }, {
            timestamps: true,
            tableName: 'Users',
            classMethods: {
                associate: function(models) {
                    User.hasMany(models.Post, {foreignKey: 'User_userId'});

                    //following
                    //would like to change "follows" to "followings", more verbose.
                    User.hasMany(models.User, {as: 'Follows', foreignKey: 'UserId', through: 'Following' });
                    User.hasMany(models.User, {as: 'Followers', foreignKey: 'FollowId', through: 'Following'});

                    //comment
                    User.hasMany(models.Comment, {foreignKey: 'User_userId'});

                    //like
                    //User.hasMany(models.Post, {as:'Likes', foreignKey: 'Post_postId', through: 'Liking'});
                    User.hasMany(models.Like, {foreignKey: 'User_userId'});

                    //notification
                    //User.hasMany(models.Notification, {foreignKey: 'User_userId'});

                },
                getSearchVector: function() {
                    return 'userNameVector';
                },
                addFullTextIndex: function() {

                    var User = this;
     
                    var searchFields = ["userName"];
     
                    var vectorName = User.getSearchVector();
                    sequelize
                        .query('ALTER TABLE "' + User.tableName + '" ADD COLUMN "' + vectorName + '" TSVECTOR')
                        .success(function() {
                            return sequelize
                                    .query('UPDATE "' + User.tableName + '" SET "' + vectorName + '" = to_tsvector(\'english\', ' + '"' + searchFields.join(' || \' \' || ') + '")')
                                    .error(console.log);
                        }).success(function() {
                            return sequelize
                                    .query('CREATE INDEX userName_search_idx ON "' + User.tableName + '" USING gin("' + vectorName + '");')
                                    .error(console.log);
                        }).success(function() {
                            return sequelize
                                    .query('CREATE TRIGGER userName_vector_update BEFORE INSERT OR UPDATE ON "' + User.tableName + '" FOR EACH ROW EXECUTE PROCEDURE tsvector_update_trigger("' + vectorName + '", \'pg_catalog.english\', ' + '"' + searchFields.join(', ') + '")')
                                    .error(console.log);
                        }).error(console.log);
     
                },
                search: function(query) {
   
                    var User = this;
     
                    query = sequelize.getQueryInterface().escape(query);
                    console.log(query);
                    
                    return sequelize
                            .query('SELECT * FROM "' + User.tableName + '" WHERE "' + User.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ')', User);
                }
            },
            getterMethods: {
                //testing...
                joinedDateProfile: function() {
                    var joined = this.get('createdAt'),
                        theMoment = moment(joined),
                        formattedDate = theMoment.format('Do MMMM YYYY');
                    return formattedDate;
                }
            }
        }
    );

    //User.addFullTextIndex();
 
return User;
};
