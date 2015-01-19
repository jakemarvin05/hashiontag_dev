var D = require('dottie');

function pathsJSON() {
    var pathsJSON = {
        paths: {},
        files: {}
    }
    //define the absolute path here. leave out the trailing slash.
    pathsJSON.paths = {
        absPath: '' //leave it as '[empty]' for dev. Eventually will be full domain path.
    }

    //topLevel Paths
    //add the paths here.
    function tLPath() {

        var paths = {
            home: '/',
            login: '/login',
            logout: '/logout',
            shop: '/shop',
                //nested paths
                addProduct: '/shop/addproduct',
                shopSettings: '/shop/settings',

            signup: '/signup',
            img: '/images',
            post: '/post',
            me: '/me',
            likes: '/likes',
            search: '/search',
            following: '/following',
            followers: '/followers',
            mediaDir: '/uploads',
        }

        //let the forloop do its job
        for (var key in paths) {
            if (paths.hasOwnProperty(key)) {
                pathsJSON.paths[key] = pathsJSON.paths.absPath + paths[key];
            }
        }
    }
    tLPath();

    function assetsPath() {
        var assetsPath = pathsJSON.paths.absPath + '/assets';

        //set other assets path relative to the main assets folder:
        var paths = {
            assets: '', //assets relative to assets is nothing.
            js: '/js',
            css: '/css',
            fonts: '/fonts'
        }

        //let the forloop do its job
        for (var key in paths) {
            if (paths.hasOwnProperty(key)) {
                pathsJSON.paths[key] = assetsPath + paths[key];
            }
        }
    }assetsPath();

    //commonlly used files.
    var files = {
        errProfilePic: pathsJSON.paths['img'] + '/noprofilepicture.jpg',
        imgLoaderHolder: pathsJSON.paths['img'] + '/imgLoaderHolder.png'
    }

    pathsJSON.files = files;

return pathsJSON;
}
pathsJSON = pathsJSON(); // compile
//console.log(pathsJSON);
module.exports = pathsJSON;
