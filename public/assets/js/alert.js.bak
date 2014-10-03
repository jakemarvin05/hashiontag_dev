var alertFactory = {
    protoAlert: function(msg) {



        if(typeof msg !== 'string') {
            var text = msg.text,
                title = msg.title;
        } else {
            var text = msg,
                title = "Alert" //default title
        }
        var uid = new Date().getTime();
        $('body').append('<div id="error' + uid + '" style="display:none;">' + text + '</div>');
        console.log(msg.text);
        $.fancybox.open([
                {
                        href : '#error' + uid,
                        title : title
                }

        ], {
                padding : 40   
        });     
    },
    commentError: function() {
        var msg = {
            text: 'Error: Please either login or check your internet connection',
            title: 'Error'
        }
        
        this.protoAlert(msg);
    }
}
var aF = alertFactory;