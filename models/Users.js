module.exports = function(sequelize, DataTypes) {

    var User = sequelize.define('User',
        {
        user_id: {
            type: DataTypes.INTEGER,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            validate: {
                max: 15
            }
        },
        email: {
            type: DataTypes.STRING,
            validate: {
                isEmail: true
            }
        },
        password: DataTypes.STRING
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
