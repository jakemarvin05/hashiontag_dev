$('#signupForm').validate({
    rules: {
        username: {
            required: true,
            minlength: 6,
            maxlength: 15,
            regex: '^[a-zA-Z0-9_]*$'
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
            maxlength: 'Please use at 6-15 characters.',
            required: ''
        },
        email: {
            required: ''
        },
        password: {
            minlength: 'Please use a password with at least 6 characters.',
            required: ''
        },
        passwordR: {
            equalTo: 'Your passwords do not match. Please re-enter.',
            required: ''
        }
    },
    errorPlacement: function(error, element) {
        console.log('error');
        element.velocity('callout.shakeShort');
        $('#signupForm').find('.errHolder').append(error).show();
    },
    submitHandler: function() {
        var submitFlasher = Object.create(VV.utils.Flasher);
        var takingTooLong = false;

        var $button = $('#signupForm').find('button[type="submit"]');
        
        //reset any errors
        var $eHW = $('#signupForm').find('.errHolder');
        $eHW.velocity('transition.slideUpOut', 200);

        //start flasher
        submitFlasher.run($button, 'button');

        //get the current button name, cache it, replace with 'logging in'.
        $button.attr('data-attr-html', $button.html());
        $button.html('Signing up...');
        //taking too long message timeout
        takingTooLong = true;
        setTimeout(function() {
                if(takingTooLong) {
                        $('#errHolderTooLong').html('Your signup seems to be taking longer than usual. Please refresh and try again.');
                        $('#errHolderTooLong').velocity('transition.slideDownIn', 200);
                }  
        }, 20000);
        
        
        // Get some values from elements on the page:
        var $form = $('#signupForm'),
            $username = $form.find('input[name="username"]'),
            username = $username.val(),
            $email = $form.find('input[name="email"]'),
            email = $email.val(),
            $password = $form.find('input[name="password"]'),
            password = $password.val(),
            url = $form.attr("action"),
            submitButton = $form.find('button[id="submit"]');
        // Send the data using post
        var posting = $.post( url, { username: username, email: email, password: password } );
        //done
        posting.done(function(data) {
            if(data.success) { 
                console.log('success');
                return window.location.replace(printHead.p.absPath + '/me');
            }

            if(data.error) {
                console.log(data.error);
                if(data.error) {
                    //exception cases
                    if(data.error === 'unknown') {
                        $eHW.html('Something went wrong. Please refresh and try again. If this persist, please contact us and we will help you!');
                        $button.velocity('callout.shakeShort');
                    } else {
                        console.log('test');
                        //generic user/email cases
                        $eHW.html(data.error);
                        if(data.error.toLowerCase().indexOf('username') > -1) {
                            $username.velocity('callout.shakeShort');
                        }
                        if(data.error.toLowerCase().indexOf('email') > -1) {
                            $email.velocity('callout.shakeShort');
                        }
                    }
                        $eHW.velocity('transition.slideDownIn', 200);
                }
                submitFlasher.kill();
                $button.html($button.attr('data-attr-html'));
                takingTooLong = false;
            }
        });

        //fail
        posting.fail(function() {
                submitFlasher.kill();
                $button.html($button.attr('data-attr-html'));
                takingTooLong = false;
                aF.protoAlert('Something went wrong, please check your connection and try again later.');
        });

    }
});