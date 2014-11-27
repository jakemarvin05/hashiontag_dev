var sendgrid = require('sendgrid')('vogueandverge', '15664893a642f59780c4');


module.exports = function send(user, host) {

  var resetUrl = host + '/passwordtokenreset' + '?token=' + user.passwordResetToken;

  var html  = '<h3>Hi there!</h3>';
      html += '<p>You have requested for a password reset. In order to reset your password please follow this <a href="' + resetUrl + '">link</a>.</p>';
      html += '<p>You have 12 hours before the request expires. If you did not request for the change, please ignore this mail.</p>';

  sendgrid.send({
    to:       user.email,
    from:     'info@vogueverve.com',
    fromname: 'Vogue and Verve',
    subject:  'VogueVerve password reset for ' + user.email + '.',
    html:     html
  }, function(err, json){
    if (err) { return false; }
    return json;
  });
}

