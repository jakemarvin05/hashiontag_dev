var express = require('express');
var router = express.Router();
//var sys = require('sys');
var db = require('../apps/db.js');


module.exports = router;

// Homepage
router.get('/', function (req, res) {
  //sys.puts(sys.inspect(req));
  res.render('index', { 
    title: 'Hashiontag', 
    someVariable: 'We are using:'
  });
});

router.get('/dbtest', function (req, res) {

  //sz is my sequelize shorthand
  var sz = db.init();
     
  sz.authenticate().complete(function(err) {
    if (!!err) {
      console.log('Unable to connect to the database:', err);
      res.send(err);
    } else {
      console.log('Connection has been established successfully.');
      res.send('Connection has been established successfully.');
    }
  });

});