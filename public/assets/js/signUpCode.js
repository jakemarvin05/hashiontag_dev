$.validator.addMethod(
        "regex",
        function(value, element, regexp) {
            var re = new RegExp(regexp);
            return this.optional(element) || re.test(value);
        }
);
$( '#signup' ).validate({
  rules: {
    username: {
      required: true,
      minlength: 6,
      maxlength: 15,
      regex: '^[a-zA-Z0-9_]*$',
    },
    email: {
      required: true,
      email: true
    },
    password: {
      required: true,
      minlength: 6
    },
    passwordR: {
      required: true,
      equalTo: "#password"
    }
  },
  messages: {
    username: {
      regex: 'Please use only alphanumeric inputs. Underscores are also allowed.',
      minlength: 'Please use at 6-15 characters.',
      maxlength: 'Please use at 6-15 characters.'
    },
    password: {
      minlength: 'Please use a password with at least 6 characters.'
    },
    password: {
      equalTo: 'You passwords do not match. Please re-enter.'
    }
  }
});