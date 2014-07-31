function globalJSON() {
  var globalJSON = {
    paths: {
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
  }
  function tLPath() {

    //set other assets path relative to the main assets folder:
    var paths = {
      home: '/',
      login: '/login',
      logout: '/logout',
      signup: '/signup',
      img: '/images',
      post: '/post'
    }

    //let the forloop do its job
    for (var key in paths) {
      if (paths.hasOwnProperty(key)) {
        globalJSON.paths[key] = globalJSON.paths.absPath + paths[key];
      }
    }
  }tLPath();
  function assetsPath() {
    var assetsPath = globalJSON.paths.absPath + '/assets';

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
        globalJSON.paths[key] = assetsPath + paths[key];
      }
    }
  }assetsPath();
return globalJSON;
}
globalJSON = globalJSON(); // compile
//console.log(globalJSON);
module.exports = globalJSON;
