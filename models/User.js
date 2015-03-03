var moment = require('moment');
var crypto = require('crypto');
var encrypter = require('../apps/passport/encrypter');
var forgotPasswordMailer = require('../apps/mailer/forgotPassword');

module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var User = sequelize.define('user', {
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
                is: ["^[a-z0-9_]+$", "i"],
                notIn: disallowedUsernames
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
        passwordResetToken: {
            type: DataTypes.STRING
        },
        passwordResetTokenExpire: {
            type: DataTypes.DATE
        },
        salt: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len:[0,30]
                //TODO: VALIDATION of username
                //is: ["^[a-z]+$", "i"]
            }
        },
        about: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len:[0,250]
            }
        },
        profilePicture: {
            type: DataTypes.STRING,
            allowNull: true
        },
        web: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len:[0,250]
            }
        },
        gender: {
            type: DataTypes.STRING(6),
            allowNull: true,
            validate: {
                isIn: [['', 'male','female']]
            }
        },
        country: {
            type: DataTypes.STRING(100),
            allowNull: true,
            validate: {
                isIn: [listOfCountries]
            }
        },
        isPrivate: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        lastStreamUpdate:{
            type: DataTypes.DATE,
            allowNull: true
        },
        hasNoFollow: {
            type: DataTypes.BOOLEAN,
            allowNull: true, // no need to allow null if you have a default value.
            defaultValue: true
        },
        shopStatus: {
            type: DataTypes.STRING,
            allow: true,
            defaultValue: false,
            validate: {
                isIn: [['false', 'active-incomplete', 'active', 'suspended']]
            }
        },
        dataMeta: {
            type: DataTypes.JSON,
            allowNull: true
        }
    }, {
        timestamps: true,
        tableName: 'User',
        instanceMethods: {
            generatePasswordResetToken: function(){
                this.passwordResetToken  = crypto.randomBytes(16).toString('hex');
                this.passwordResetTokenExpire = moment().add(12, 'hours').format(); //add .format()?
                return this;
            },
            authenticate: function(password){
                return encrypter.compareHash(password, this.salt, this.password);
            },
            setPassword: function(password){
                var generator   = encrypter.generateHash(password);
                this.password   = generator.hash;
                this.salt       = generator.salt;
                return this;
            },
            deliver: function(host){
                return forgotPasswordMailer(this, host);
            }
        },
        classMethods: {
            associate: function(models) {
                //POSTS
                User.hasMany(models.Post, {foreignKey: 'User_userId'});

                //Profile picture
                //Use belongsTo here to place the postId key here.
                User.belongsTo(models.Post, {as: 'ProfilePicture', foreignKey: 'Post_postId_profilePicture', constraints: false});

                //FOLLOWING
                /*
                Explanation: User has many other users as "Followers". In the "Following" table, this user
                             record is identified using the foreign key "FollowId"
                */
                User.belongsToMany(models.User, {as: 'Follows', foreignKey: 'FollowerId', through: models.Following });
                User.belongsToMany(models.User, {as: 'Followers', foreignKey: 'FollowId', through: models.Following });

                //GOTCHA: Associating Users directly with Following table. FollowId fkey is overwritten.
                User.hasMany(models.Following, {foreignKey: 'FollowId'});


                //COMMENT
                User.hasMany(models.Comment, {foreignKey: 'User_userId'});



                //LIKE
                User.hasMany(models.Like, {foreignKey: 'User_userId'});



                //NOTIFICATION
                User.hasMany(models.Notification, {as: 'Notifications', foreignKey: 'User_userId_receiver'});

                    //User has many notifications that they set -> "SetNotifications".
                User.hasMany(models.Notification, {as: 'SetNotifications', foreignKey: 'User_userId_setter'});

                //Stream
                User.hasMany(models.Stream, {foreignKey: 'User_userId'});

                //USER META
                User.hasMany(models.UserMeta, {foreignKey: 'User_userId'});

                //Instagram
                User.hasOne(models.Instagram, {foreignKey: 'User_userId'});

                //STAR TAG
                User.hasMany(models.StarTag, {foreignKey: 'User_userId'});
                User.hasMany(models.Post, {as: 'attributedUser', foreignKey: 'User_userId_attributed'})

                //Cart and purchase
                User.hasMany(models.Purchase, {foreignKey: 'User_userId'});

                //Seller
                User.hasMany(models.Purchase, {as: 'Sale', foreignKey: 'User_userId_seller'});
            },
            getSearchVector: function() {
                return 'userNameVector';
            },
            addFullTextIndex: function() {

                var User = this;
                //also include name. but a manual overwrite from db backend because I have issues trying to include name here.
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
            search: function(query, opts) {
                opts = opts || {};

                var User = this;

                var queryLike = query + '%';
                var query = sequelize.getQueryInterface().escape(query);

                function _attrs() {
                    return '"userId", "userNameDisp", "profilePicture", "name", "about"';
                }

                if (opts.attributes) {
                    try {
                        var attrs = JSON.stringify(opts.attributes);
                        attrs = attrs.substring(1, attrs.length-1);
                    } catch (err) {
                        console.log('Error in JSON.stringify attrs. Check `attrs` passed into User.search.');
                        var attrs = _attrs();
                    }
                } else {
                    var attrs = _attrs();
                }

                var sql  = ' SELECT ' + attrs;
                    sql += ' FROM "' + User.tableName + '"';
                    sql += ' WHERE'
                        sql += ' ("' + User.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ')';
                        sql += ' OR "userName" LIKE \'' + queryLike + '\')';

                    if (opts.where) {
                        try {
                            var keys = Object.keys(opts.where);
                            if (keys.length > 0) {
                                
                                for(var i in keys) {
                                    var key = keys[i];
                                    sql += ' AND ';
                                    sql += ' "' + key + '" = \'' + opts.where[key] + '\'';
                                }

                            }
                        } catch(err) {
                            console.log(err);
                            console.log('where criteria passed in is invalid');
                        }
                    }
                return sequelize.query(sql, {
                //return sequelize.query('SELECT "userId", "userNameDisp", "profilePicture", "name", "about" FROM "' + User.tableName + '" WHERE "' + User.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ') OR "userName" LIKE \'' + queryLike + '\'', {
                    type: sequelize.QueryTypes.SELECT
                });
            }
        }
    });

    //User.addFullTextIndex();

return User;
};

/* This is the standard set of countries. Another copy of this reside in public
folder: selectCode.js

Remember to map the old country values over to the new on when you change it here,
else the user will hit errors when updating their profile */
var CountryList = require('../public/assets/js/commons/listOfCountries.js');
var listOfCountries = (new CountryList()).withoutRegion();

var disallowedUsernames = [
"assets",
"contact",
"css",
"explore",
"following",
"followers",
"fuck",
"help",
"image",
"images",
"js",
"likes",
"login",
"logout",
"me",
"post",
"posts",
"profile",
"search",
"setting",
"settings",
"shop",
"support",
"signup",
"upload",
"uploads",
"usernname",
"vogueverve",
"vogue_verve"
]