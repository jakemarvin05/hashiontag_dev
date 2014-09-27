function pathsJSON() {
  var pathsJSON = {
    absPath: '', //leave it as '[empty]' for dev. Eventually will be full domain path.

    //top level paths
    home: '',
    login: '',
    logout: '',
    signup: '',
    img: '',

    //assets paths that uses assetPath() to initialize its values
    assets: '',
    js: '',
    css: '',
    fonts: ''
  }
  //topLevel Paths
  function tLPath() {

    //set other assets path relative to the main assets folder:
    var paths = {
      home: '/',
      login: '/login',
      logout: '/logout',
      signup: '/signup',
      img: '/images',
      post: '/post',
      me: '/me',
      search: '/search',
      following: '/following',
      followers: '/followers',
      mediaDir: '/uploads'
    }

    //let the forloop do its job
    for (var key in paths) {
      if (paths.hasOwnProperty(key)) {
        pathsJSON[key] = pathsJSON.absPath + paths[key];
      }
    }
  }tLPath();

  function assetsPath() {
    var assetsPath = pathsJSON.absPath + '/assets';

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
        pathsJSON[key] = assetsPath + paths[key];
      }
    }
  }assetsPath();
return pathsJSON;
}
pathsJSON = pathsJSON(); // compile
//console.log(pathsJSON);
module.exports = pathsJSON;
