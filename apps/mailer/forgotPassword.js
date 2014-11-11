var sendgrid = require('sendgrid')('vogueandverge', '15664893a642f59780c4');


module.exports = function send(user, host) {

  var resetUrl = host + '/passwordtokenreset' + '?token=' + user.passwordResetToken;

  sendgrid.send({
    to:       user.email,
    from:     'info@vogueverve.com',
    fromname: 'Vogue and Verve',
    subject:  'VogueVerve password reset for ' + user.email + '.',
    html:     'You have request for a password reset. In order to reset your password please follow this <a href="' + resetUrl + '">link</a>.' + '\n\n' +
              'You have 12 hours before the request expires.\n\nIf you did not request for the change, please ignore this mail.\n\n'
  }, function(err, json){
    if (err) { return false; }
    return json;
  });
}

