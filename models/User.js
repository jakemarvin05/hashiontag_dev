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
                    len:[6,20],
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
                    len:[6,999999]
                }
            },
            name: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len:[2,30]
                    //TODO: VALIDATION of username
                    //is: ["^[a-z]+$", "i"]
                }
            },
            about: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    len:[1,140]
                }
            }
        }, {
            timestamps: true,
            tableName: 'Users',
            classMethods: {
                associate: function(models) {
                    User.hasMany(models.Post, {foreignKey: 'User_userId'});

                    //FOLLOWING
                    User.hasMany(models.User, {as: 'Follows', foreignKey: 'FollowerId', through: 'Following' });

                    /*
                    Explanation: User has many other users as "Followers". In the "Following" table, this user
                                 record is identified using the foreign key "FollowId"
                    */
                    User.hasMany(models.User, {as: 'Followers', foreignKey: 'FollowId', through: 'Following'});



                    //COMMENT
                    User.hasMany(models.Comment, {foreignKey: 'User_userId'});



                    //LIKE
                    User.hasMany(models.Like, {foreignKey: 'User_userId'});



                    //NOTIFICATION
                    User.hasMany(models.Notification, {as: 'Notifications', foreignKey: 'User_userId_receiver'});
                    
                        //User has many notifications that they set -> "SetNotifications".
                    User.hasMany(models.Notification, {as: 'SetNotifications', foreignKey: 'User_userId_setter'});

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
