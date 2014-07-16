var express = require('express');
var router = express.Router();
var sys = require('sys');



module.exports = router;

// Homepage
router.get('/', function (req, res) {
  sys.puts(sys.inspect(req));
  res.render('index', { 
    title: 'Hashiontag', 
    someVariable: 'This is a variable passed from node.js'
  });
});
