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
                    is: ["^[a-zA-Z0-9_]*$"]
                }
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
                    User.hasMany(models.Post,{foreignKey: 'User_userId'});

                    //following
                    User.hasMany(models.User, {as: 'Follower', through: 'Following'});
                    User.hasMany(models.User, {as: 'Follow', through: 'Following'});

                    //trying...
                    User.hasMany(models.Post, {as: 'FollowUserPost', foreignKey: 'User_userId'})
                }
            },
            // getterMethods: {
            //     //testing...
            //     date: function() {
            //         console.log(this.get('updatedAt'));
            //         return this.get('updatedAt');
            //     }
            // }
        }
    );

    //User.sync();
 
return User;
};
