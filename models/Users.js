module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var User = sequelize.define('User',
        {
            user_id: {
                type: DataTypes.INTEGER,
                primaryKey: true
            },
            username: {
                type: DataTypes.STRING,
                validate: {
                    max: 15,
                    min: 6,
                    is: ["^[a-zA-Z0-9_]*$"]
                }
            },
            email: {
                type: DataTypes.STRING,
                validate: {
                    isEmail: true
                }
            },
            password: {
                type: DataTypes.STRING,
                validate: {
                    min: 6
                }
            }
        }, {
        timestamps: true,
        createdAt: false,
        tableName: 'users'
        }
    );

    //User.sync();
 
return User
};


// module.exports = function(sequelize, DataTypes) {
//   var User = sequelize.define('User', {
//     username: DataTypes.STRING
//   }, {
//     classMethods: {
//       associate: function(models) {
//         User.hasMany(models.Task)
//       }
//     }
//   })
 
//   return User
// }
