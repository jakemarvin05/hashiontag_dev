module.exports = function globalJSON() {
  var globalJSON = {
    paths: {
      home: '/',
      login: '/login',
      logout: '/logout',
      signup: '/signup',
      absPath: '/', //leave it as '/' for dev. Eventually will be full domain path.

      //assets paths that uses assetPath() to initialize its values
      assets: '',
      img: '',
      js: '',
      css: '',
      fonts: ''
    }
  }
  function assetsPath() {
    var assetsPath = globalJSON.paths.absPath + 'assets/';

    //set other assets path relative to the main assets folder:
    var paths = {
      assets: '', //assets relative to assets is nothing.
      img: 'img/',
      js: 'js/',
      css: 'css/',
      fonts: 'fonts/'
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
