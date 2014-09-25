var fname = 'checkImg';

module.exports = function checkImg(img) {
    // Check if image has a valid MIME type
    if(!img.type) {
        console.log(fname + ': image has no .type()');
        return false;
    }
    console.log(fname + " MIME type '" + img.type + "' detected.");
    
    var ext = "";
    switch(img.type.toUpperCase()) {
        case "IMAGE/GIF":
            ext=".gif";
        break;
        case "IMAGE/JPEG":
        case "IMAGE/PJPEG":
            ext=".jpg";
        break;
        case "IMAGE/PNG":
            ext=".png";
        break;
        default:
            console.log(fname + " Invalid MIME type detected: "+img.type);
            return false;
    }
    return ext;
}