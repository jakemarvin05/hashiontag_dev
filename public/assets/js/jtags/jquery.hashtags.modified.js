/*!
  Original Plugin By:
  jQuery #hashtags v0.1
	(c) 2013 Simon Nussbaumer - admin@thurnax.com
	updated: 2013-07-19
	license: GNU LESSER GENERAL PUBLIC LICENSE
*/
(function($) {
    $.fn.hashtags = function(raw){
        if ($(this).is("textarea,input")){
            $(this).edit_hashtags(raw);
        } else {
            $(this).display_hashtags(raw);
        }
    };
    // Displaying Hashtags
    $.fn.display_hashtags = function(raw,type) {
        var caller = $(this);
        var element = type || "p";
        var str = raw || caller.attr("data-raw") || "";
        if (caller.is("textarea,input")){
            var id = caller.attr("id");
            caller.parent().parent().replaceWith("<"+element+" id='"+id+"'></"+element+">");
            caller = $("#"+id);
        }
        caller.attr("raw",str);
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/</g, '&lt;');
        var lines = str.split("\n");
        var html = "";
        for (var i=0,l=lines.length;i<l;i++){
            var words = lines[i].split(" ");
            for (var j=0,w=words.length;j<w;j++){
                if (words[j].match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/)){
                    html+="<a href='"+words[j]+"' class='hashtag_display_url'>"+words[j]+"</a> ";
                } else if (words[j].match(/^#([a-zA-Z0-9]+)$/g)) {
                    html+="<a href='/search/"+words[j]+"' class='hashtag_display_url'>"+words[j]+"</a> ";
                } else if (words[j].match(/^@([a-zA-Z0-9]+)$/g)) {
                    html+="<a href='/"+words[j].substring(1)+"' class='hashtag_display_url'>"+words[j]+"</a> ";
                } else {
                    html+=words[j]+" ";
                }
            }
            html+="<br/>";
        }
        caller.html(html);
    };
    // Editing Hashtags
    function txt2display(str){
        str = str.replace(/>/g, '&gt;');
        str = str.replace(/</g, '&lt;');
        var lines = str.split("\n");
        var html = "";
        for (var i=0,l=lines.length;i<l;i++){
            var words = lines[i].split(" ");
            for (var j=0,w=words.length;j<w;j++){
                if (words[j].match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)/)){
                    html+=words[j] + ' ';

                } else if (words[j].match(/^\*([a-zA-Z0-9_]+)$/)) {

                    html+="<span class='startag'>"+words[j]+"</span>  ";

                } else if (words[j].match(/^#([a-zA-Z0-9#]+$)/g)) {

                    html+="<span class='hashtag'>"+words[j]+"</span> ";

                } else if (words[j].match(/^@([a-zA-Z0-9_]+)$/g)) {
                    html+="<span class='username'>"+words[j]+"</span> ";
                }  else {
                    html+=words[j]+" ";
                }
            }
            html+="<br/>";
        }
        return html;
    }

    // function cloneDom($dom) {
    //     $dom.wrap('<div></div>');
    //     var html = $dom.parent('div').html();
    //     $dom.unwrap('<div></div>');
    //     return html;
    // }

    $.fn.edit_hashtags = function(raw,type) {
        var caller = $(this);
        var element = type || "textarea";
        var width = caller.css('width');

        if(raw === "newpost") {
            var str = '';
        } else {
            var str = raw || decodeURIComponent(caller.attr("data-raw")) || "";
        }
            
        if (!caller.is("textarea,input")){
            var $article = caller.closest('article');
            var id = $article.attr("data-pid");
            $textHolder = $article.find('.blockTextHolder');
            var callerClone = caller.clone();
            callerClone.insertAfter(caller);
            callerClone.replaceWith("<"+element+" id='edit_"+id+"'></"+element+">");
            caller = $("#edit_"+id);
        }

        caller.wrap('<div class="jqueryHashtags editingDOMS"><div class="highlighter"></div></div>').unwrap().before('<div class="highlighter"></div>').wrap('<div class="typehead"></div></div>');
		$(".jqueryHashtags").css('width', width);
        caller.addClass("theSelector");
        caller.on("keyup", function() {
            caller.parent().parent().find(".highlighter").css("width",width);
            caller.parent().parent().find(".highlighter").html(txt2display(caller.val()));
            //still need the raw value for comparison
            caller.attr("data-raw", caller.val());
        });
        caller.parent().prev().on('click', function() {
            caller.parent().find(".theSelector").focus();
        });
        caller.val(str).keyup();
        caller.autosize({append: "\n"});
        return caller;
    };
})(jQuery);
