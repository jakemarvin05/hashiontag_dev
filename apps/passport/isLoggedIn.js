module.exports = function isLoggedIn(req) {

    // if user is authenticated in the session, carry on 
    if ( req.isAuthenticated() ) {
    return true;
    }
return false;
}