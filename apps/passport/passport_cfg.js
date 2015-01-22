// load all the things we need
var LocalStrategy = require('passport-local').Strategy;
var db = require('../../models'); //required once
var Promise = require('bluebird');

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
        db.User
        .find({
            where: {userId: id},
            attributes: ['userId', 'userNameDisp', 'profilePicture', 'hasNoFollow', 'shopStatus']
        }).then(function(user){
            return done(null, user);
        }).catch(function(err){
            return done(err, null);
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
        return done(error);
        }

        // asynchronous
        // User.find wont fire unless data is sent back
        process.nextTick(function() {

            console.log('check if username already exist..');

            var userName = req.body.username.toLowerCase();
            var userNameDisp = req.body.username;
            var email = req.body.email.toLowerCase();
            // check if username already exist

            //first call
            function firstCall() {
                return db.User.find({where: {userName: userName}, attributes: ['userId']});
            }
            function secondCall() {
                return db.User.find({where: {email: email}, attributes: ['userId']});
            }

            Promise.join(firstCall(), secondCall(), function(userExists, emailExists) {
                if(userExists) {
                    var message = 'Username';
                }
                if(emailExists) {
                    if(message) {
                        //Username and Email
                        message += ' and Email';
                    } else {
                        //Email
                        var message = 'Email';
                    }
                }

                if(message) {
                    message += ' already taken';
                    return done(null, false, message);
                }

                //all is good

                // create the user
                var newUser = db.User.build({
                    // set the user's local credentials
                    userName: userName,
                    userNameDisp: userNameDisp,
                    email: email,
                });

                newUser.setPassword(password);


                return newUser.save();
            }).then(function(user) {
                if(user) {
                    console.log('New user signup. Username: ' + user.userName);
                    return done(null, user);
                }
            }).catch(throwErr);

        }); //nextTick()

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

        if (!user || !password) { return done(null, false); }

        if (typeof user !== 'string') { return done(null, false); }

        if (!(typeof password === 'string' || typeof password === 'number')) { return done(null, false); }


        var user = user.toLowerCase();

        /* Error handling */
        var throwErr = function(error) {
            console.log(error);
        return done(error, false);
        }


        /* validate function */
        var validate = function(user) {
            console.log('user was found by email or username, validating password...');

            if (user.authenticate(password)) {
                return done(null, user);
            } else {
                console.log('Password validation failed.');
                return done(null, false);
            }
        }

        /* start */
        //adminstrator login
        if (user.indexOf('@admin') > -1) {
            var secret = 'vogueverve';

            if (password !== secret) {
                return done(null, false);
            }

            db.User.find({ where: {userName: user.substring(0, user.indexOf('@admin'))} }).then(function(user) {
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            });
        } else if(user.indexOf('@') > -1) {
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



