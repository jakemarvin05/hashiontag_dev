var crypto = require('crypto');

var Encrypter = {
  // Encrypts a given value and generates a salt if none is provided.
  generateHash: function(value, salt) {
    if (!salt) { salt = this.generateSalt(); }

    hashedPassword = crypto.pbkdf2Sync(value, salt, 10000, 64).toString('hex');
    return {
      hash: hashedPassword,
      salt: salt
    };
  },
  // salt generator
  generateSalt: function(){
    return crypto.randomBytes(64).toString('hex');
  },
  // Compares a hash/salt with a given value
  compareHash: function(value, salt, hash) {
    generatedHash = this.generateHash(value, salt).hash;

    return generatedHash == hash;
  }
}

module.exports = Encrypter;
