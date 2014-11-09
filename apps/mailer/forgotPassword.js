var sendgrid = require('sendgrid')('vogueandverge', '15664893a642f59780c4');


module.exports = function send(user, host) {

  var resetUrl = host + '/forgetpassword' + '?token=' + user.passwordResetToken;

  sendgrid.send({
    to:       user.email,
    from:     'info@vogue-verve.com',
    subject:  'Password Reset for ' + user.email + '.',
    html:     'In order to reset your password please follow this <a href="' + resetUrl + '">link</a>.' + '\n\n' +
              'You have 12 hours before the request expires.'
  }, function(err, json){
    if (err) { return false; }
    return json;
  });
}

