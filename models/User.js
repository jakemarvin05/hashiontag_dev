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
                    is: ["^[a-z0-9_]+$", "i"],
                    //hmmm why is this here.....
                    not: disallowedUsernames
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
            }
        }, {
            timestamps: true,
            tableName: 'User',
            classMethods: {
                associate: function(models) {
                    //POSTS
                    User.hasMany(models.Post, {foreignKey: 'User_userId'});

                    //Profile picture
                    //Use belongsTo here to place the postId key here.
                    User.belongsTo(models.Post, {as: 'ProfilePicture', foreignKey: 'Post_postId_profilePicture', constraints: false});

                    //FOLLOWING
                    User.hasMany(models.User, {as: 'Follows', foreignKey: 'FollowerId', through: models.Following });

                    /*
                    Explanation: User has many other users as "Followers". In the "Following" table, this user
                                 record is identified using the foreign key "FollowId"
                    */
                    User.hasMany(models.User, {as: 'Followers', foreignKey: 'FollowId', through: models.Following });



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
                search: function(query) {
   
                    var User = this;
     
                    query = sequelize.getQueryInterface().escape(query);
                    console.log(query);
                    //return sequelize.query('SELECT "userId", "userNameDisp", "profilePicture", "name", "about" FROM "' + User.tableName + '" WHERE "' + User.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ') OR "userName" LIKE ?', null, null, [query + '%']);
                    return sequelize.query('SELECT "userId", "userNameDisp", "profilePicture", "name", "about" FROM "' + User.tableName + '" WHERE "' + User.getSearchVector() + '" @@ plainto_tsquery(\'english\', ' + query + ')' );
                }
            }
        }
    );

    //User.addFullTextIndex();
 
return User;
};

/* This is the standard set of countries. Another copy of this reside in public
folder: selectCode.js

Remember to map the old country values over to the new on when you change it here,
else the user will hit errors when updating their profile */

var listOfCountries = [
"",
"Afghanistan",
"Albania",
"Algeria",
"American Samoa",
"Andorra",
"Angola",
"Anguilla",
"Antarctica",
"Antigua and Barbuda",
"Argentina",
"Armenia",
"Aruba",
"Australia",
"Austria",
"Azerbaijan",
"Bahamas",
"Bahrain",
"Bangladesh",
"Barbados",
"Belarus",
"Belgium",
"Belize",
"Benin",
"Bermuda",
"Bhutan",
"Bolivia",
"Bosnia and Herzegovina",
"Botswana",
"Bouvet Island",
"Brazil",
"British Indian Ocean Territory",
"Brunei Darussalam",
"Bulgaria",
"Burkina Faso",
"Burundi",
"Cambodia",
"Cameroon",
"Canada",
"Cape Verde",
"Cayman Islands",
"Central African Republic",
"Chad",
"Chile",
"China",
"Christmas Island",
"Cocos (Keeling) Islands",
"Colombia",
"Comoros",
"Congo",
"Congo, The Democratic Republic of The",
"Cook Islands",
"Costa Rica",
"Cote D'ivoire",
"Croatia",
"Cuba",
"Cyprus",
"Czech Republic",
"Denmark",
"Djibouti",
"Dominica",
"Dominican Republic",
"Ecuador",
"Egypt",
"El Salvador",
"Equatorial Guinea",
"Eritrea",
"Estonia",
"Ethiopia",
"Falkland Islands (Malvinas)",
"Faroe Islands",
"Fiji",
"Finland",
"France",
"French Guiana",
"French Polynesia",
"French Southern Territories",
"Gabon",
"Gambia",
"Georgia",
"Germany",
"Ghana",
"Gibraltar",
"Greece",
"Greenland",
"Grenada",
"Guadeloupe",
"Guam",
"Guatemala",
"Guinea",
"Guinea-bissau",
"Guyana",
"Haiti",
"Heard Island and Mcdonald Islands",
"Holy See (Vatican City State)",
"Honduras",
"Hong Kong",
"Hungary",
"Iceland",
"India",
"Indonesia",
"Iran, Islamic Republic of",
"Iraq",
"Ireland",
"Israel",
"Italy",
"Jamaica",
"Japan",
"Jordan",
"Kazakhstan",
"Kenya",
"Kiribati",
"Korea, Democratic People's Republic of",
"Korea, Republic of",
"Kuwait",
"Kyrgyzstan",
"Lao People's Democratic Republic",
"Latvia",
"Lebanon",
"Lesotho",
"Liberia",
"Libyan Arab Jamahiriya",
"Liechtenstein",
"Lithuania",
"Luxembourg",
"Macao",
"Macedonia, The Former Yugoslav Republic of",
"Madagascar",
"Malawi",
"Malaysia",
"Maldives",
"Mali",
"Malta",
"Marshall Islands",
"Martinique",
"Mauritania",
"Mauritius",
"Mayotte",
"Mexico",
"Micronesia, Federated States of",
"Moldova, Republic of",
"Monaco",
"Mongolia",
"Montserrat",
"Morocco",
"Mozambique",
"Myanmar",
"Namibia",
"Nauru",
"Nepal",
"Netherlands",
"Netherlands Antilles",
"New Caledonia",
"New Zealand",
"Nicaragua",
"Niger",
"Nigeria",
"Niue",
"Norfolk Island",
"Northern Mariana Islands",
"Norway",
"Oman",
"Pakistan",
"Palau",
"Palestinian Territory, Occupied",
"Panama",
"Papua New Guinea",
"Paraguay",
"Peru",
"Philippines",
"Pitcairn",
"Poland",
"Portugal",
"Puerto Rico",
"Qatar",
"Reunion",
"Romania",
"Russian Federation",
"Rwanda",
"Saint Helena",
"Saint Kitts and Nevis",
"Saint Lucia",
"Saint Pierre and Miquelon",
"Saint Vincent and The Grenadines",
"Samoa",
"San Marino",
"Sao Tome and Principe",
"Saudi Arabia",
"Senegal",
"Serbia and Montenegro",
"Seychelles",
"Sierra Leone",
"Singapore",
"Slovakia",
"Slovenia",
"Solomon Islands",
"Somalia",
"South Africa",
"South Georgia and The South Sandwich Islands",
"Spain",
"Sri Lanka",
"Sudan",
"Suriname",
"Svalbard and Jan Mayen",
"Swaziland",
"Sweden",
"Switzerland",
"Syrian Arab Republic",
"Taiwan, Province of China",
"Tajikistan",
"Tanzania, United Republic of",
"Thailand",
"Timor-leste",
"Togo",
"Tokelau",
"Tonga",
"Trinidad and Tobago",
"Tunisia",
"Turkey",
"Turkmenistan",
"Turks and Caicos Islands",
"Tuvalu",
"Uganda",
"Ukraine",
"United Arab Emirates",
"United Kingdom",
"United States",
"United States Minor Outlying Islands",
"Uruguay",
"Uzbekistan",
"Vanuatu",
"Venezuela",
"Viet Nam",
"Virgin Islands, British",
"Virgin Islands, U.S.",
"Wallis and Futuna",
"Western Sahara",
"Yemen",
"Zambia",
"Zimbabwe"
]

var disallowedUsernames = [
"assets",
"explore",
"css",
"following",
"followers",
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
"signup",
"upload",
"uploads"
]