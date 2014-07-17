var express = require('express');
var router = express.Router();
//var sys = require('sys');
var pg = require('pg').native;
var conString = "postgres://achmxwosijzdwc:g_05iNqib65ZR7wZArOjfhkmh7@ec2-54-235-245-180.compute-1.amazonaws.com:5432/d2qhi6e8qpq1js";


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

var client = new pg.Client(conString);

client.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  client.query('SELECT NOW() AS "theTime"', function(err, result) {
    if(err) {
      return console.error('error running query', err);
    }
    console.log(result.rows[0].theTime);
    //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
    client.end();

    res.send(result.rows[0].theTime);
  });
});

  
});