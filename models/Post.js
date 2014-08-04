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
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                }
                //get: function() { return this.getDataValue('desc') }
            }
        }, {
            timestamps: true,
            tableName: 'Posts', //PascalCase
            classMethods: {
                associate: function(models) {
                    Post.belongsTo(models.User,{foreignKey: 'User_userId'});


                    //trying...
                    Post.belongsTo(models.User,{as: 'FollowedPost', foreignKey: 'User_userId'});
                }
            },
            getterMethods: {
                timeLapse: function() { 
                    /* 
                    TO DO. Work this shit out:

                    1 minute = 60
                    1 hour = 3600
                    1 day = 86400
                    1 week = 604800
                    (each month has 4.3452 weeks)
                    1 month = 2 627 977
                    1 year = 31 536 000


                    Thresholds:

                    Less than 60 seconds:
                        Show Seconds

                    More than 60 seconds, less than
                    */

                    var postTime = moment( this.get('createdAt') );
                    var timeHasLapsed = moment() - postTime;

                    //seconds lapsed
                    var secondsLapsed = timeHasLapsed / 1000;
                    timeHasLapsed = Math.round(secondsLapsed) + ' seconds ago';

                    //minutes lapsed
                    if (secondsLapsed > 59.5 && secondsLapsed < 3570) {
                        var minutesHasLapsed = secondsLapsed / 60;
                        timeHasLapsed = 'about ' + Math.round(minutesHasLapsed) + ' minutes ago';
                    }

                    //hours lapsed, 84600 seconds is 23.5hours
                    if (secondsLapsed > 3570 && secondsLapsed < 84600) {
                        var hoursHasLapsed = secondsLapsed / 3600;
                        timeHasLapsed = 'about ' + Math.round(hoursHasLapsed) + ' hours ago';
                    }
                    
                    //days lapsed, 561600 seconds is 6.5days
                    if (secondsLapsed > 84600 && secondsLapsed < 561600) {
                        var daysHasLapsed = secondsLapsed / 86400;
                        timeHasLapsed = 'about ' + Math.round(daysHasLapsed) + ' days ago';
                    }

                    //weeks lapsed, 2116800 seconds is 3.5weeks
                    if (secondsLapsed > 561600 && secondsLapsed < 2116800) {
                        var weeksHasLapsed = secondsLapsed / 604800;
                        timeHasLapsed = 'about ' + Math.round(weeksHasLapsed) + ' weeks ago';
                    }

                    //months lapsed, 30222011 seconds is about 11.5 months
                    if (secondsLapsed > 2116800 && secondsLapsed < 30222011) {
                        var monthsHasLapsed = secondsLapsed / 2627977;
                        timeHasLapsed = 'about ' + Math.round(monthsHasLapsed) + ' months ago';
                    }

                return timeHasLapsed;
                }
            }
        }
    );

    //Post.sync();
 
return Post;
};
