var D = require('dottie');

module.exports = function(user) {
    if (!user.dataMeta) { return false; }
    var data = user.dataMeta.dataShop;

    if (!D.get(data, 'currency')) {
        return setStatus(user, false);
    }

    if (!D.get(data, 'shipping.light')) {
        return setStatus(user, false);
    }

    return setStatus(user, true);
}


function setStatus(user, complete) {

    var status = user.shopStatus;

    if (complete) {
        if (status === "active-incomplete") {
            return "active";
        }
        
    }
    //other statuses.

    return user.shopStatus;
}