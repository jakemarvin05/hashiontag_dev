module.exports = function(sequelize, DataTypes) {

//note: jQuery validation rules applied at clientside should sync with this

    var StreamScore = sequelize.define('streamScore',
        {   
            id: {//cant change
                type: DataTypes.INTEGER,
                primaryKey: true,
                allowNull: false,
                autoIncrement: true
            },
            postId: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            followingId:{
                type: DataTypes.INTEGER,
                allowNull: false
            }
            ,
            streamScore:{
                type: DataTypes.INTEGER,
                allowNull: false
            }
        }, {
            timestamps: true,
            updatedAt: false,
            tableName: 'StreamScore'//PascalCase
        }
    );
 
return StreamScore;
};
