var db = require('../models');

module.exports = function editProfile(req) {

if(req.isAuthenticated()){

        if( req.user.userId===parseFloat(req.body.userId) ) {
            console.log("Entered if function");
            req.user.updateAttributes(
                {
                    name:req.body.name, 
                    about:req.body.about
                }
            ).then(function(user) {
                console.log('here')
                if(user) {
                    //console.log(true);
                    return res.json({success:true});
                }

                else {
                    console.log("Error 1");
                    return res.json({success:false});

                }
            }).catch(function(err) {
                console.log(err);
                /*console.log("Error 2");
                console.log(req.body.name);
                console.log(typeof(req.body.name));
                console.log(req.body.about);
                console.log(typeof(req.body.about));*/
                return res.json({success:false});
            });

        } else {
            console.log("Error 3");
            return res.json({success:false});
        }
        
    }
    else{
        
        console.log("Error 4");
        return res.json({success:false});
    }
}