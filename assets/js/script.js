var currentPlaylist = [];  //[] is a declaration of empty array
var shufflePlaylist = [];
var tempPlaylist = [];
var audioElement;
var mouseDown = false; //keeps track whether mouse is pressed or not for playback bar
var currentIndex = 0;  //for songs array function to be able to skip song
var repeat = false;
var shuffle = false;
var userLoggedIn;
var timer;


$(document).click(function(click){		//event listener for options menu that when you click it dissapears
	var target = $(click.target);

	if(!target.hasClass("item") && !target.hasClass("optionsButton")){ // if the button we clicked on doesnt have the class item, which is not the options menus(because it has item class)
		hideOptionsMenu();
	}
});



$(window).scroll(function(){  //event listener for hide options menu function, that when you scroll up or down the menu would dissapear
	hideOptionsMenu();
});



$(document).on("change", "select.playlist", function(){  //event that selects items with the class playlist
	var select = $(this);
	var playlistId = select.val();
	var songId = select.prev(".songId").val();


	$.post("includes/handlers/ajax/addToPlaylist.php", { playlistId: playlistId, songId: songId})
	.done(function(error){

			if(error != ""){
				alert(error);
				return;
			}

		hideOptionsMenu();
		select.val("");
	});
});


function updateEmail(emailClass) {
	var emailValue = $("." + emailClass).val();

	$.post("includes/handlers/ajax/updateEmail.php", { email: emailValue, username: userLoggedIn})
	.done(function(response) {
		$("." + emailClass).nextAll(".message").text(response);
	})


}

function updatePassword(oldPasswordClass, newPasswordClass1, newPasswordClass2) {
	var oldPassword = $("." + oldPasswordClass).val();
	var newPassword1 = $("." + newPasswordClass1).val();
	var newPassword2 = $("." + newPasswordClass2).val();

	$.post("includes/handlers/ajax/updatePassword.php", 
		{ oldPassword: oldPassword,
			newPassword1: newPassword1,
			newPassword2: newPassword2, 
			username: userLoggedIn})

	.done(function(response) {
		$("." + oldPasswordClass).nextAll(".message").text(response);
	})


}


function logout(){ //function for logout button
	$.post("includes/handlers/ajax/logout.php", function() {
		location.reload();
	});
}




function openPage(url){ //function for seamless page transitions

	if(timer != null){
		clearTimeout(timer);
	}
	if(url.indexOf("?") == -1){
		url = url + "?";
	}

	var encodedUrl = encodeURI(url + "&userLoggedIn=" + userLoggedIn); //we are encoding the url
	console.log(encodedUrl);
	$("#mainContent").load(encodedUrl);
	$("body").scrollTop(0); //when we change a page we automatically scroll up on the page
	history.pushState(null, null, url); //puts the album url on the page url
}

function removeFromPlaylist(button, playlistId){
	var songId = $(button).prevAll(".songId").val();

		$.post("includes/handlers/ajax/removeFromPlaylist.php", { playlistId: playlistId, songId: songId }).done(function(error){//making an ajax call for comunicating with database
			//.done is kind of preffered way of executing ajax calls
		
		if(error != ""){
			alert(error);
			return;
		}


		openPage("playlist.php?id=" + playlistId);
	});
}

function createPlaylist(){
	console.log(userLoggedIn);
	var popup = prompt("Please enter the name of your playlist");

	if(popup != null){  //if alert was filled in and button was pressed
	

		$.post("includes/handlers/ajax/createPlaylist.php", { name: popup, username: userLoggedIn }).done(function(error){//making an ajax call for comunicating with database
			//.done is kind of preffered way of executing ajax calls
			
			if(error != ""){
				alert(error);
				return;
			}


			openPage("yourMusic.php");
		});

	}
}

function deletePLaylist(playlistId){
	var prompt = confirm("Are you sure you want to delete this playlis?");

	if(prompt == true){
			$.post("includes/handlers/ajax/deletePlaylist.php", { playlistId: playlistId }).done(function(error){//making an ajax call for comunicating with database
			//.done is kind of preffered way of executing ajax calls
			
			if(error != ""){
				alert(error);
				return;
			}


			openPage("yourMusic.php");
		});
	}
}

function hideOptionsMenu (){ //function for hiding the options menu 
	var menu = $(".optionsMenu");
	if(menu.css("display") != "none"){
		menu.css("display", "none");
	}

}

function showOptionsMenu(button){//function for showing the options menu, button is the three dot one
	var songId = $(button).prevAll(".songId").val();
	var menu = $(".optionsMenu");
	var menuWidth = menu.width();
	menu.find(".songId").val(songId);



	var scrollTop = $(window).scrollTop(); // distance fromtop of window to top of document
	var elementOffset = $(button).offset().top;

	var top = elementOffset - scrollTop;
	var left = $(button).position().left;

	menu.css({ "top": top + "px", "left": left - menuWidth + "px", "display": "inline" });

}



function formatTime(seconds){
	var time = Math.round(seconds);
	var minutes = Math.floor(time / 60);  //rounds number down
	var seconds = time - (minutes * 60);

	var extraZero;

	if(seconds < 10){		//to display stuff like 4.03 instead of 4.3
		extraZero = "0";

	}
	else{
		extraZero="";
	}

	return minutes + ":" + extraZero + seconds;   //to append string in js we use + while in php we use .
}


function updateTimeProgressBar(audio){
	$(".progressTime.current").text(formatTime(audio.currentTime)); //this updates the current time
	$(".progressTime.remaining").text(formatTime(audio.duration - audio.currentTime)); //this updates the time thats left for a song

	var progress = audio.currentTime / audio.duration * 100; // to see the percentage of song duration for bar
	$(".playbackBar .progress").css("width", progress + "%");  //jquery + css for playing bar movement
}



function updateVolumeProgressBar(audio){
	var volume = audio.volume  * 100; // to see the percentage of song volume, because volume values are from (0 to 1) adding 100 gives you percentage for example 0.2 *100 is 20, so its 20 %
	$(".volumebar .progress").css("width", volume + "%");  //jquery + css for playing bar movement
}


function playFirstSong(){ //function for button play in artist page
	setTrack(tempPlaylist[0], tempPlaylist, true); //tempPlaylist is temporary array and we set first song to play because it starts counting from 0
}


function Audio(){  //creating audio class

	this.currentlyPlaying;  //is the same as private $currentlyPlaying in php
	this.audio = document.createElement('audio');  //this.audio is property of class

	this.audio.addEventListener("ended", function(){ //when repeat button is pressed and song reaches the end, instead of it just stopping, it should play from the start again
		nextSong();
	});

	this.audio.addEventListener("canplay", function(){
		//this refers to the object that the event was called on
		var duration = formatTime(this.duration);
		$(".progressTime.remaining").text(duration);

	});



	this.audio.addEventListener("timeupdate", function(){
		if(this.duration){
			updateTimeProgressBar(this);  //this is this.audio object
		}
	});


	this.audio.addEventListener("volumechange", function(){  //for updating volume bar
		updateVolumeProgressBar(this);
	});


	this.setTrack = function(track) {   //creating a function for setTrack
		this.currentlyPlaying = track;
		this.audio.src = track.path;
	}


	this.play = function() {
		this.audio.play();

	}

	this.pause = function(){
		this.audio.pause();
	}

	this.setTime = function(seconds){
		this.audio.currentTime = seconds;
	}

}