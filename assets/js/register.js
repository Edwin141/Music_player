$(document).ready(function(){  //will execute code as soon as page is loaded
	
	$("#hideLogin").click(function(){
		$("#loginForm").hide();
		$("#registerForm").show();
	});

	$("#hideRegister").click(function(){
		$("#loginForm").show();
		$("#registerForm").hide();
	});
});