// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var db = require('../../models'); //required once

// expose this function to our app using module.exports
module.exports = function(passport) {

//userId
//password
//email


    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    //used to serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.userId);
    });

    // used to deserialize the user
    passport.deserializeUser(function(id, done) {
        db.User.find({ where: {userId: id} }).success(function(user){
            done(null, user);
          }).error(function(err){
            done(err, null);
          });
    });

    // =========================================================================
    // messages ================================================================
    // =========================================================================

    var ppMessages = {
        errors: {
            somethingWW: 'Oops... something went wrong. Please try again.',
            userTaken: 'That username or email is already taken.',
            userOrPassword: 'Oops... Either username does not exist or your password is wrong.'
        },
        success: {
            afterSignup: 'Now you can login...'
        }

    }

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    //we are using named strategies since we have one for login and one for signup
    //by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, user, password, done) {

        /* Error handling */
        var throwErr = function(error) {
            console.log(error);
        return done( null, false, req.flash('signupMessage', ppMessages.errors.somethingWW) );
        }

        // asynchronous
        // User.find wont fire unless data is sent back
        //process.nextTick(function() {
            console.log('check if username already exist..');

            var userName = user.toLowerCase();
            var userNameDisp = user;
            var email = req.body.email.toLowerCase();
            // check if username already exist
            db.User.find({ where: 
                db.Sequelize.or(
                    {userName: userName},
                    {email: email}
                )
            }).then(function(user) {

                console.log('db query is complete');

                // check to see if theres already a user with that username
                if (user) {

                    console.log('username or email already exist');

                return done( null, false, req.flash('signupMessage', ppMessages.errors.userTaken) );
                } else {

                    console.log('creating user...');
                    // if there is no user with that username

                    // create the user
                    var newUser = db.User.build({
                        // set the user's local credentials
                          userName: userName
                        , userNameDisp: userNameDisp
                        , email: email
                        , password: password
                    });

                    // save the user
                    newUser.save().then(function() {
                        console.log('saving...');
                    return done(null, newUser, req.flash('loginMessage', ppMessages.success.afterSignup));                         
                    }).catch(throwErr);  
                }
            }).catch(throwErr);  

        //}); //nextTick()

    }));

    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'
    //
    // Notes: The done() object calls the callback defined in 
    //        passport.authenticate([strategyName],[callback])

    passport.use('local-login', new LocalStrategy({
        // by default, local strategy uses username and password, we will override with email
        usernameField : 'user',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, user, password, done) { // callback with email and password from our form

        var user = user.toLowerCase();
        

        /* Error handling */
        var throwErr = function(error) {
            console.log(error);
        return done(error, false);
        }


        /* validate function */
        var validate = function(user) {
            console.log('user was found by email or username, validating password...');
            if( !(user.password === password) ) {
                // if the user is found but the password is wrong
                console.log('password validation failed');
                return done(null, false); // create the loginMessage and save it to session as flashdata
            }
        // all is well, return successful user
        return done(null, user);
        }



        console.log("finding users...");

        /* start */
        if(user.indexOf('@') > -0.5) {
            //it is an email login
            db.User.find({ where: { email : user } }).then(function(user) {

                // if no user is found, return the message
                if(!user) {

                    console.log('Login: email not found');
                
                return done(null, false);
                }
                // validate
                validate(user);

            }).catch(throwErr);

        } else {
            //normal login
            db.User.find({ where: { userName : user } }).then(function(user) {

                // if no user is found, return the message
                if(!user) {
                    
                    console.log('Login: user not found');

                    return done(null, false);
                }
                console.log(user.email);
                //validate
                validate(user);

            }).catch(throwErr);
        }
        
    })); // closure: passport.use 'local'

}; // closure: exports



