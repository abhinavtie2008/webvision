function showtext()
{
	$(".more-text").css("display", "block");
	$(".read-more").css("display", "none");
	$(".read-less").css("display", "block");
	// $(this).siblings(".more-text").contents().unwrap();
		// $(this).remove();
	// $(".read-more").click(function(){
		// $(this).siblings(".more-text").contents().unwrap();
		// $(this).remove();
	// });
}
function showlesstext()
{
	$(".more-text").css("display", "none");
	$(".read-more").css("display", "block");
	$(".read-less").css("display", "none");
	// $(this).siblings(".more-text").contents().unwrap();
		// $(this).remove();
	// $(".read-more").click(function(){
		// $(this).siblings(".more-text").contents().unwrap();
		// $(this).remove();
	// });
}

$(document).ready(function() {

$("#pdfModal").on("shown.bs.modal", function () {
        
		var opt = document.getElementById('ifz');
			opt.src = lvalue;
			//$("#pdfModal").text(intentName.replace("_", " ")).end()
			$("#pdfModal").find(".modal-header > h4").text(intentName.replace("_", " ")).end()
			//alert("URL   :  ",lvalue);
			$('.A2').click(function () { return false; });
    });  	

$('.Messages_list').on('click', '.btn', function() {
    //alert(this.id);
    var button_id = this.id;
    var msg = $(this).text();
    var parentmsg = $(this).parent().text();
    //alert(parentmsg);
    if(msg == 'click'){
        var parentmsg = parentmsg.replace(/click/g,'');
        generate_message(parentmsg);
    }
    else{
    //alert(msg);
    generate_message(msg);
    }
});



    
      $('.modal').on('show.bs.modal', function(e) {
    var open = $(this).attr('data-easein');
    if (open == 'shake') {
      $('.modal-dialog').velocity('callout.' + open);
    } else if (open == 'pulse') {
      $('.modal-dialog').velocity('callout.' + open);
    } else if (open == 'tada') {
      $('.modal-dialog').velocity('callout.' + open);
    } else if (open == 'flash') {
      $('.modal-dialog').velocity('callout.' + open);
    } else if (open == 'bounce') {
      $('.modal-dialog').velocity('callout.' + open);
    } else if (open == 'swing') {
      $('.modal-dialog').velocity('callout.' + open);
    } else {
      $('.modal-dialog').velocity('transition.' + open);
    }
  });



    $(".rotate").click(function () {
    $(".rotating").toggleClass("down");
    })

  
    //---------------------- Chat Init ---------------------------------------------------------------------------//
    $(".chat_on").click(function() {
        $(".Layout").toggle();
        $(".chat_on").hide(1000);
        $(".Messages_list").empty();
        $(".Input_field").prop('disabled', true);
		$('.Messenger_header').find('img').attr('src','https://vani-hyd.nic.in/rtoBot/images/vani-gif.png');
        CALLInvoke();
    });


    //---------------------- Chat Close ---------------------------------------------------------------------------//

    $(".chat_close_icon").click(function() {
        $(".Messages_list").empty();
        $(".Input_field").prop('disabled', false);
        $(".Layout-open").removeClass('Layout-open-max');
        $(".Layout-expand").removeClass('Layout-expand-max');
        $(".chat_minimize_icon").find("i").removeClass('fa-window-maximize').addClass('fa-window-minimize');
        $(".Layout").toggle();
        $(".chat_on").show(1000);
    });


    //---------------------- Chat Minimize ---------------------------------------------------------------------------//

    $(".chat_minimize_icon").click(function() {
        $(".Layout-open").toggleClass('Layout-open-max');
        $(".Layout-expand").toggleClass('Layout-expand-max');
        $(this).find("i").toggleClass('fa-window-maximize').toggleClass('fa-window-minimize');
        //$(".Messenger_content").slideToggle();
    });


    //---------------------- Chat SEND Button/ Keyboard Enter Button ---------------------------------------------------------------------------//  

    $("#buttonenter").click(function(e) {
        e.preventDefault();
        var msg = $(".Input_field").val();
        if (msg.trim() == '') {
            return false;
        }
        generate_message(msg, 'self');
    });

    // Get the input field
    var input = document.getElementById("InputEnter");

    // Execute a function when the user releases a key on the keyboard
    input.addEventListener("keyup", function(event) {
        // Number 13 is the "Enter" key on the keyboard

        if (event.keyCode === 13) {
            // Cancel the default action, if needed
            event.preventDefault();
            // Trigger the button element with a click
            document.getElementById("buttonenter").click();
        }
    });

    input.onkeyup = function() {
        // Validate lowercase letters

        var invalidchar = /^[a-zA-Z0-9]+[0-9a-zA-Z\\\/\!\(\)\-_\,\.\;\:\@\&\?\'\" )]*$/;
        var inval = input.value.substr(input.value.length - 1);
        if (input.value.length >= 250) {
            $('#InputEnter').attr('data-original-title', 'A maximum of 250 characters is allowed at a time for a single message.')
                .tooltip('show');
        } else if (input.value.match(invalidchar) || !input.value || input.value == undefined || input.value == " " || input.value.length == 0) {
            //alert("hi");
            $('#InputEnter').attr('data-original-title', 'Invalid Character Used &#013; A maximum of 250 characters is allowed at a time for a single message. Allowed Special Characters are A-Z, a- z, 0-9, ! , ? , . , space , - , ( , ) , @ ,_ , \'\ , " , ; , : ,')
                .tooltip('destroy');
        } else {
            //$('[data-toggle="tooltip"]').tooltip('show');
            //alert(inval);

            if (inval.match(invalidchar) || !inval || inval == undefined || inval == "" || inval.length == 0) {
                $('#InputEnter').attr('data-original-title', 'Invalid Character Used' + " <br/> " + 'A maximum of 250 characters is allowed at a time for a single message. Allowed Special Characters are A-Z, a- z, 0-9, ! , ? , . , space , - , ( , ) , @ ,_ , \'\ , " , ; , : ,')
                    .tooltip('show');
            } else {
                //alert("Hi");
                $('#InputEnter').attr('data-original-title', 'Invalid Character ' + inval + ' Used')
                    .tooltip('show');
            }
        }
    }


    // $(document).bind('ajaxStart', function(){
    // //$(this).show();
    // var str = "<div><span>VANI is typing</span> <div class=\"typing-loader\" style=\"float: right; margin-right: 66%; margin-top: 3%;\"></div></div>";
    //     $(".Messages_list").append(str);
    // }).bind('ajaxStop', function(){
    // //$(this).hide();
    // //$("div.typing-loader").remove();
    // });

    //---------------------- Live Typing (VANI is typing) ---------------------------------------------------------------------------//
    var to;
    $(document).bind('ajaxStart', function() {
        //$(this).show();
        var str = "<div class=\"appendMovingDots\" style=\"font-size:14px; color:black;\">VANI is typing</div>";
        var str2 = "<div class=\"typing-loader\"></div>";
        to = setTimeout(function() {
            $(".typing").append(str);
            $(".Messages_list").append(str2);
        }, 1000);
    }).bind('ajaxStop', function() {
        clearTimeout(to);
        //$(this).hide();
        $("div.appendMovingDots").remove();
        $("div.typing-loader").remove();
    });



    $("#quickTagScroll li").click(function() {
    alert(this.id); // id of clicked li by directly accessing DOMElement property
    alert($(this).attr('id')); // jQuery's .attr() method, same but more verbose
    alert($(this).html()); // gets innerHTML of clicked li
    alert($(this).text()); // gets text contents of clicked li
    });



});



//---------------------- Scroll buttons ---------------------------------------------------------------------------//


/*function validateEmail(sEmail) {
    var regex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-zA-Z][a-zA-Z-0-9]*\.[a-zA-Z]+(\.[a-zA-Z]+)?$/;
    if (regex.test(sEmail.trim())) {
        return true;
    }
    else {
        return false;
    }
}
function validatePanNo(PanNo) {
    var regex = /^([a-zA-Z]{5})(\d{4})([a-zA-Z]{1})$/;
    if (regex.test(PanNo)) {
        return true;
    }
    else {
        return false;
    }
}
*/


window.moveLeft = function() {
    $("#quickTagScroll").animate({
        scrollLeft: "-=156px"
    })
}, window.moveRight = function() {
    $("#quickTagScroll").animate({
        scrollLeft: "+=156px"
    })
}


//---------------------- Generate Chatbubble (User) ---------------------------------------------------------------------------//


function generate_message(msg, type) {
    var chatReg = /^[a-zA-Z0-9]+[0-9a-zA-Z\\\/\!\(\)\-_\,\.\;\:\@\&\?\'\" )]*$/;
    if (chatReg.test(msg)) {
        var str = "<div class=\"containermsg_user darker\">\n" +
            "                  <img class=\"img-responsive right\" src=\"https://vani-hyd.nic.in/rtoBot/images/user.png\" alt=\"Vani\" style=\"width: 65px; height: 65px; margin: 10px;\">\n" +
            "                 <p>" + msg + "</p> \n" +
            "                </div>";

        $(".Messages_list").append(str);
        $(".Input_field").val('');
        $(".Messages").stop().animate({
            scrollTop: $(".Messages")[0].scrollHeight
        }, 1000);
        messageSent(msg);
    } else {
        alert("Invalid Character Input");
    }
}

//---------------------- Generate Chatbubble (VANI) ---------------------------------------------------------------------------//
function generate_message_vani(msg, type) {
	
	msg = linkify(msg);
	
	if(type=="VaniIntent")
	{
		var str = "<div class=\"scrollIntent\">\r\n" +
        "                \r\n" +
        "                 <p class=\"show-read-more\">" +msg+ "</p>\r\n" +
        "               </div>";
	}
	else
	{
		var str = "<div class=\"containermsg_vani\">\r\n" +
        "               <img class=\"img-responsive\" src=\"https://vani-hyd.nic.in/rtoBot/images/vani-gif.png\" alt=\"Vani\" style=\"width: 65px; height: 65px; margin: 10px;\">   \r\n" +
        "                 <p>" +msg+ "</p>\r\n" +
        "               </div>";
		
	}
    $(".Messages_list").append(str);

		$(".show-read-more").each(function(){
		var myStr = msg;
		var maxLength = 50000;
		if($.trim(myStr).length > maxLength){
			var newStr = $.trim(myStr).substring(0, maxLength);
			var removedStr = $.trim(myStr).substring(maxLength, $.trim(myStr).length);
			$(this).empty().html(newStr);
			$(this).append(' <a id="anc" class="read-more" onclick="showtext()">read more...</a>');
			//$(this).append(' <button id="anc" type=\"button\" style=margin-bottom:1%; class=\"btn-primary\">read more...</button>');
			
			//$(this).append(' <span id="anc" class="read-more">read more...</span>');
			$(this).append('<span class="more-text">' + removedStr + ' </span>');
			
			$(this).append(' <a id="anc" class="read-less" onclick="showlesstext()">read less...</a>');

		}
	});	
	
	
    $(".Messages").stop().animate({
        scrollTop: $(".Messages")[0].scrollHeight
    }, 1000);
	
	
						
	
	
}


//---------------------- Generate Link Chatbubble (VANI) ---------------------------------------------------------------------------//
function generate_link_vani(msg, link_text, url, class_name) {
    
    //msg = linkify(msg);

    var str = "<div class=\"containermsg_vani\">\r\n" +
        "               <img class=\"img-responsive\" src=\"https://vani-hyd.nic.in/rtoBot/images\\vani-gif.png\" alt=\"Vani\" style=\"width: 65px; height: 65px; margin: 10px;\">   \r\n" +
        "                 <p>" + //msg +
		" <a class = link_msg data-toggle =\"modal\" data-target=\"#pdfModal\"> " + link_text + "</a></p>" +
		//\r\n" +
        "</div>";
    $(".Messages_list").append(str);
    $(".Messages").stop().animate({
        scrollTop: $(".Messages")[0].scrollHeight
    }, 1000);
    $('a.link_msg').attr('href', "data:application/pdf;base64,"+url);
    $('a.link_msg').addClass(class_name);
	$('a.link_msg').attr('class', 'A2');
	// $('a.link_msg').attr('data-toggle', 'modal');
	// $('a.link_msg').attr('data-target', '#pdfModal');
	
	
}



function linkify(inputText) {
    var replacedText, replacePattern1, replacePattern2;
    //(\(https?:\/\/[^\s]+)|(https?:\/\/[^\s]+)
    replacedText=inputText.replace(/ *"here"*/g,'');
    replacedText = replacedText.replace(/[()]/g,'')
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = replacedText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    replacedText=replacedText.replace(/ *\n\n*/g,'<br>');
    return replacedText;
}


/*function list_buttons(event){
    alert("Button clicked");
    alert(event.button);
    $('ul.list-inline li').text()
}*/


var msg = "";
var contextName = "user";
var intentName = "";
var ChatCount = 0;
var startDate;
var box = null;
var count = 1;
var SessionID = null;
var chatLog = "";
var cdate = "";
var sid = "";
var did = "";
var appname = "rtoChatBot";
var mode = "WebChatBot";
var df = "";
var status = "";
var lvalue = "";


//---------------------- Initialize Chat Cont.---------------------------------------------------------------------------//

function CALLInvoke() {

    var strtData = {
        MSG: msg,
        Sid: SessionID,
        IName: intentName,
        Count: ChatCount,
        app_name: appname,
        Mode: mode,
        dflag: df
    };
    var udata = JSON.stringify(strtData);
    $.ajax({
        url: "https://vani-hyd.nic.in/ChatBotAPI3.0/CallAPI.ashx", //CallAPI.ashx
        type: "POST",
        //contentType: "application/json; charset=utf-8",
        data: {
            ChatData: udata
        },
		// beforeSend: function(request) {
    // request.setRequestHeader("ContentEncoding", "gzip");
	// request.setRequestHeader("AcceptEncoding", "gzip");
  // },
        success: function(data) {
			
            if (data != "") {

                if (data.RespMsg == 'exception') {
                    var str = "<img class=\"img-responsive\" src=\"images\\vani-gif.gif\" alt=\"Vani\" style=\"width: 65px; height: 65px; margin: 10px;\">\r\n" +
                        "           <div class=\"containermsg_vani\"> \r\n" +
                        "                 <p>Oops! Something went wrong. Please try again later.</p>\r\n" +
                        "                 <span class=\"time-right\">11:00</span>\r\n" +
                        "               </div>";
                    $(".Input_field").prop('disabled', true);
                    $(".Messages_list").append(str);
                } else {

                     var res = data.RespMsg;
						// //res=res+"<div class=\"show-read-more\">";
						// res = res.replace(/\$\$/g, "<button type=\"button\" style=margin-bottom:1%; class=\"btn btn-primary\">");
                        // //res = res.replace(/\$\$/g, "<button type=\"button\" style=margin-bottom:1%; class=\"btn btn-primary collapse show\" aria-labelledby=\"containermsg_vani\">");
                        // res = res.replace(/\$\#/g, "</button>");
                        // res = res.split("$");
						// //res=res+"</div>";
						
					// // var intentlist=data.IntentList;
					
					// // intentlist = intentlist.replace(/\$\$/g, "<button type=\"button\" style=margin-bottom:1%; class=\"btn btn-primary\">");
                        // // //res = res.replace(/\$\$/g, "<button type=\"button\" style=margin-bottom:1%; class=\"btn btn-primary collapse show\" aria-labelledby=\"containermsg_vani\">");
                        // // intentlist = intentlist.replace(/\$\#/g, "</button>");
                        // // intentlist = intentlist.split("$");
						res=res.replace(/;/g,"</br>");
                     generate_message_vani(res, 'Vani');
					
					//generate_message_vani(intentlist, 'VaniIntent');
					
                    $(".Input_field").prop('disabled', false);
                    SessionID = data.SessionId;
                     //$("#logToSave").append("CallInvoke: RespMsg= ", data.RespMsg,"<br/>", "Action =", data.Action, "<br/>", "IntentName =", data.IntentName, "<br/>");                                    
                }
            }
        },
        error: function(jqXHR, textStatus, errorThrown) {
            // alert("Error  " + errorThrown);
        }
    });
}



//---------------------- Send Chat to Dialogflow ---------------------------------------------------------------------------//

function messageSent(msg) {
    /* This function is called when user enter something. */
    var regexT = new RegExp("^\\d{4}(0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-9]|3[0-1])([0-9]{8})$");
    var filter = /^[0-9]+$/; /* To match only "Numeric Values" before and after characters */
    //Check the message enter by user against the given RegEx
    var chatReg = /^[a-zA-Z0-9]+[0-9a-zA-Z\\\/\!\(\)\-_\,\.\;\:\@\&\?\'\" )]*$/;
    //var chatReg = /^[0-9A-Za-z/\\\\]*$/;
    if (chatReg.test(msg)) {

        var strtData = {
            MSG: msg,
            Sid: SessionID,
            IName: intentName,
            Count: ChatCount,
            app_name: appname,
            Mode: mode,
            dflag: df
        };
        var udata = JSON.stringify(strtData);
        //$("#chat_div").chatbox("option", "boxManager").addMsg(contextName, msg); 
        $.ajax({
            type: "POST",
            url: "https://vani-hyd.nic.in/ChatBotAPI3.0/CallAPI.ashx", //CallAPI.ashx                                               
            // contentType: "application/json; charset=utf-8",
            data: {
                ChatData: udata
            },
			// beforeSend: function(request) {
    // request.setRequestHeader("ContentEncoding", "gzip");
	// request.setRequestHeader("AcceptEncoding", "gzip");
  // },
            success: function(data) {

                SessionID = data.SessionId;
                RespMsg = data.RespMsg;
                action = data.Action;
                intentName = data.IntentName;
                contextName = data.Context;
                ChatCount = data.Count;
                status = data.Status;
                lvalue = data.Lvalue;
				console.log(RespMsg);
				RespMsg=RespMsg.replace(/;/g,"</br>");
				// if(ChatCount == 2)
								// {
									// //$("#chat_div").chatbox("option", "boxManager").addMsg("Vani", RespMsg);
									// //$("#ooo").prop("disabled", true);
									// $(".Input_field").prop('disabled', true);
								// }
								
								if(status=="rm-lm")
								{
									generate_message_vani(RespMsg, 'Vani');
									//$("#chat_div").chatbox("option", "boxManager").addMsg("Vani", RespMsg);
									$(".Input_field").prop('disabled', false);
									//$("#ooo").prop("disabled", false);
								}
								else if(status=="rm-rm"){
									generate_message_vani(RespMsg, 'Vani');
									// $("#chat_div").chatbox("option", "boxManager").addMsg("Vani", RespMsg);
									// var interval = null;	
										// interval=setInterval(setMsg,60000);	
										// function setMsg(){ 
											  // clearInterval(interval);
										// $("#chat_div").chatbox("option", "boxManager").addMsg("Vani", "Would you like to ask something else?");	
										// }	
								}
								else if(status=="rm-dc"){
									generate_message_vani(RespMsg, 'Vani');
									//$("#chat_div").chatbox("option", "boxManager").addMsg("Vani", RespMsg);
									//$("#ooo").prop("disabled", false);
									$(".Input_field").prop('disabled', false);
								}
								else if(status=="dc"){
									generate_message_vani(RespMsg, 'Vani');
									//$("#chat_div").chatbox("option", "boxManager").addMsg("Vani", RespMsg);	
									//$("#ooo").prop("disabled", false);
									$(".Input_field").prop('disabled', false);
								}
								else if(status=="rm-lk"){
									//alert(lvalue);
									//RespMsg = linkify(RespMsg);
									generate_link_vani(RespMsg, RespMsg, lvalue, "");
									//generate_message_vani(RespMsg, 'Vani');
									//$(".Input_field").prop('disabled', false);
									// $("#chat_div").chatbox("option", "boxManager").addLink("Vani",RespMsg ,lvalue);
									
								}
								else{
									generate_message_vani(RespMsg, 'Vani');
									//$(".Input_field").prop('disabled', false);
									//$("#chat_div").chatbox("option", "boxManager").addMsg("Vani", RespMsg);
                               
								}
                // if (status == "dc") {
                    // generate_message_vani(RespMsg, 'Vani');
                    // $(".Input_field").prop('disabled', true);
                // } else if (status == "rmd") {
                    // generate_message_vani(RespMsg, 'Vani');
                    // $(".Input_field").prop('disabled', true);
                // } else {
                    // var res = RespMsg;
                        // res = res.replace(/\$\$/g, "<button style=margin-bottom:1%; type=\"button\" class=\"btn btn-primary\">");
                        // res = res.replace(/\$\#/g, "</button>");
                    // generate_message_vani(res, 'Vani');
                    // //generate_link_vani(RespMsg, 'more', 'www.google.com', 'profile-link');
                    // //$(".Input_field").prop('disabled', true);                                 
                // }

                 //$("#logToSave").append("User= ", msg, "<br/>", "RespMsg= ", data.RespMsg, "<br/>", "Action =", data.Action, "<br/>", "IntentName =", data.IntentName, "<br/>");

                //   $("#logToSave").append(
                // "<div class=\"table-responsive\">          \n" + 
                // "  <table class=\"table\">\n" + 
                // "    <thead>\n" + 
                // "      <tr>\n" + 
                // "        <th>User</th>\n" + 
                // "        <th>RespMsg</th>\n" + 
                // "        <th>Action</th>\n" + 
                // "        <th>IntentName</th>\n" + 
                // "      </tr>\n" + 
                // "    </thead>\n" + 
                // "    <tbody>\n" + 
                // "      <tr>\n" + 
                // "        <td>"+msg+"</td>\n" + 
                // "        <td>"+data.RespMsg+"</td>\n" + 
                // "        <td>"+data.Action+"</td>\n" + 
                // "        <td>"+data.IntentName+"</td>\n" + 
                // "      </tr>\n" + 
                // "    </tbody>\n" + 
                // "  </table>\n" + 
                // "  </div>");

            },
            error: function(jqXHR, textStatus, errorThrown) {
                // alert("Error  " + errorThrown);
            }
        });

    }
}




