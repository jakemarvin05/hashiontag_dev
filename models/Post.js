var moment = require('moment');

module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var Post = sequelize.define('Post',
        {
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

                }
            },
            getterMethods: {
                timeLapse: function() { 

                    var postTime = moment( this.get('createdAt') );
                    var timeHasLapsed = moment() - postTime;


                    var secondsLapsed = timeHasLapsed / 1000;

                    //1 SECOND lapsed
                    if( secondsLapsed < 1.5) {
                        timeHasLapsed = '1 second ago';

                    return timeHasLapsed;
                    }

                    //SECONDS lapsed
                    if (secondsLapsed >= 1.5 && secondsLapsed < 59.5) {
                        
                        timeHasLapsed = Math.round(secondsLapsed) + ' seconds ago';

                    return timeHasLapsed;
                    }


                    //MINUTES lapsed, 3570 seconds is 59.5 minutes
                    if (secondsLapsed >= 59.5 && secondsLapsed < 3570) {

                        var minutesHasLapsed = secondsLapsed / 60,
                            min = 'minute',
                            minRnd = Math.round(minutesHasLapsed);

                        if( minRnd > 1 ) {
                            min = 'minutes';
                        }
                        
                        timeHasLapsed = minRnd + ' ' + min + ' ago';
                    return timeHasLapsed;
                    }


                    //HOURS lapsed, 84600 seconds is 23.5 hours
                    if (secondsLapsed >= 3750 && secondsLapsed < 84600) {

                        var hoursHasLapsed = secondsLapsed / 3600,
                                hr = 'hour';
                                hrRnd = Math.round(hoursHasLapsed);

                        if(hrRnd > 1) {
                            hr = 'hours';
                        }

                        timeHasLapsed = hrRnd + ' ' + hr + ' ago';

                    return timeHasLapsed;
                    }


                    //DAYS lapsed,  561600 seconds is 6.5 days
                    if(secondsLapsed >= 84600 && secondsLapsed < 561600) {

                        var daysHasLapsed = secondsLapsed / 86400;
                            day = 'day';
                            dayRnd = Math.round(daysHasLapsed);

                        if(dayRnd > 1) {
                            day = 'days';
                        }
                        timeHasLapsed = dayRnd + ' ' + day + ' ago';

                    return timeHasLapsed;
                    }


                    //WEEK lapsed, 2116800 seconds is 3.5weeks
                    if (secondsLapsed >= 561600 && secondsLapsed < 2116800) {
                        var weeksHasLapsed = secondsLapsed / 604800,
                            week = 'week',
                            weekRnd = Math.round(weeksHasLapsed);

                        if(Math.round(weeksHasLapsed) > 1) {
                            week = 'weeks';
                        }

                        timeHasLapsed = weekRnd + ' ' + week + ' ago';

                    return timeHasLapsed;
                    }


                    //MONTHS lapsed, 30221735.499 seconds is about 11.5 months
                    if (secondsLapsed >= 2116800 && secondsLapsed < 30221735.499) {
                        var monthsHasLapsed = secondsLapsed / 2627977,
                            month = 'month',
                            monthRnd = Math.round(monthsHasLapsed);

                        if(Math.round(monthsHasLapsed) > 1) {
                            month = 'months';
                        }

                        timeHasLapsed = monthRnd + ' ' + month + ' ago';

                    return timeHasLapsed;
                    }


                    //YEAR lapsed, 151110055 seconds is about 5 years
                    if (secondsLapsed >= 30221735.499 && secondsLapsed < 151110055) {
                        var yearsHasLapsed = secondsLapsed / 30222011,
                            year = 'year',
                            yearRnd = Math.round(yearsHasLapsed);

                        if(yearRnd > 1) {
                            year = 'years';
                        }

                        timeHasLapsed = yearRnd + ' ' + year + ' ago';

                    return timeHasLapsed;
                    }

                 
                    //more than 5 year lapse
                    if(secondsLapsed >= 151110055) {

                        //lol
                        timeHasLapsed = 'Hashiontag is now more than 5 years old! - WY';

                    return timeHasLapsed;
                    }

                return false;
                } 
            }
        }
    );
 
return Post;
};
