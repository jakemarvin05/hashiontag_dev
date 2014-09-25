module.exports = function routeTempFiles(upl_temp_prefix) {
    var hr = (new Date()).getHours();
    // 0300hrs to 1459hrs -> upl_temp
    // 1500hrs to 0259hrs -> upl_temp2
    var upl_temp_prefix = "upl_temp";
    if(hr >= 3 && hr < 15 ) {
        var uploadDir = "./public/" + upl_temp_prefix;
    } else {
        var uploadDir = "./public/" + upl_temp_prefix + "2";
    }
    return uploadDir;
}