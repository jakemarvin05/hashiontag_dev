var sendgrid = require('sendgrid')('vogueandverge', '15664893a642f59780c4');


module.exports = function send(user) {
  sendgrid.send({
    to:       user.email,
    from:     'info@vogue-verve.com',
    subject:  'Password Reset for ' + user.email + '.',
    text:     'Your password has reset. Your new password is : ' + user.password + '\n Please store in a safe location.'
  }, function(err, json){
    if (err) { return false; }
    return json;
  });
}

