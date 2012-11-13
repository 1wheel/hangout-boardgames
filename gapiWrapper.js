//interacts with GAPI, sending updates to gameboard object
var width = 400;
var height = 400;
var board;			//canva
var context;		//canvas context
var container;		//holds color score, player names and join button

//displays above game canvas
var gameList = ["Checkers", "Dots", "Reversi", "Four in a Row"];
var gameFunctionList = ["Checkers", "Dots", "Reversi", "FourInARow"];
var dropDownMenu;

var lastSelection = 0;
createDropDownMenu(lastSelection);
function createDropDownMenu(selectedID){
	dropDownMenu = "";
	for (var i = 0; i < gameList.length; i++){
		if (i == selectedID) {
			dropDownMenu += '<option selected = "selected" value="' + gameList[i] + '">' + gameList[i] +'</option>';
		}
		else{
		dropDownMenu += '<option value="' + gameList[i] + '">' + gameList[i] +'</option>';
		}
	}
	dropDownMenu = '<select  id="gameMenu">' + dropDownMenu + '</select>';
}

var startGameButton = "<input type='button' value='Play' onclick='startNewGameClick();' />";
var startGameHTML = startGameButton + " a game of " + dropDownMenu;
var infoDisplay = startGameHTML;

//stores participantID and corrisponding team color
var participantID = [];
var participantTeam = [];

//video canvas, display to the right of gameboard and info
var VC;

//contains game state and methods
var Game;
var gameName;

function startNewGameClick(){
	console.log("starting new game");	
	setupCanvasObjects();
	lastSelection = document.getElementById("gameMenu").selectedIndex;
	gameSetup(gameFunctionList[document.getElementById("gameMenu").selectedIndex]);
	
	gameStartInfo();

	Game.startGame();
}

function gameSetup(name){
	gameName = name;
	eval("Game = new " + gameName +"();");	
	for (var i = 0; i < Game.teamArray.length; i++){
		document.getElementById(i + "Name").innerHTML = Game.teamArray[i];
	}

}

//called by game object when it has data to send out
function sendStateToServer(boardString){
	if (boardString) {
		gapi.hangout.data.submitDelta({
			boardString: 	boardString,
			gameName: 		gameName, 
			infoDisplay:    infoDisplay,
		});
	}
}

//passes updated state to gameboard
function sendStateToGame(boardString){
	Game.recieveState(boardString);
}

function sendClickToGame(e) {
	Game.click(e);
}

function isPlayerTurn(color) {
	return participantTeam[idIndex(gapi.hangout.getParticipantId())] == color;
}

//updates info div with winner info and button to start new game
function gameEnded(winnerText){
	createDropDownMenu(lastSelection);
	infoDisplay = winnerText + startGameButton + " a new game of " + dropDownMenu;
	gapi.hangout.data.submitDelta({
		infoDisplay:	infoDisplay
	});	
}

//creates on context object and listener
function setupCanvasObjects() {
	board = document.getElementById("board");
	context = board.getContext("2d"); 
	container = document.getElementById("container");
	//listens for clicks on the board	
	board.addEventListener("mousedown",sendClickToGame,false);
}

//game starts when hangout API is ready
gapi.hangout.onApiReady.add(function(eventObj){
	if (eventObj.isApiReady) { 
		try {
			var state = gapi.hangout.data.getState();
			console.log("GAPI loaded");

			//game running, join it
			if (state.gameName) {
				setupCanvasObjects();

				gameSetup(state.gameName);
				console.log("joining running game of " + gameName);

				//Simulate server update to trigger redraw		
				sendStateToGame(state.boardString);
				document.getElementById("info").innerHTML = state.infoDisplay;

			}
			else {
				// gapi.hangout.data.submitDelta({
				// 	infoDisplay:	startGameHTML
				// });	
				// document.getElementById("info").innerHTML = infoDisplay;
				console.log("auto starting game");
				startNewGameClick();
			}				
			participantUpdate();		

				
			//checks to see if there are other players present
			if (state.participantID) {
				participantID = JSON.parse(state.participantID);
				participantTeam = JSON.parse(state.participantTeam);
			}
		
			//adds the local player to team and saves id
			participantID[participantID.length] = gapi.hangout.getParticipantId();
			participantTeam[participantTeam.length] = 0; 
			
			//rejoining creates a duplicate memembers - removes those
			for(var i = 0; i <participantID.length; i++) {
				for(var j = i + 1; j<participantID.length; j++) {
					if (participantID[i] == participantID[j]) {
						participantID.splice(j,j);
						participantTeam.splice(j,j);
					}
				}
			}
			
			//creates a listener for state changes. calls serverUpdate() when activated
			gapi.hangout.data.onStateChanged.add(function(stateChangeEvent) {
				try {
					serverUpdate(stateChangeEvent.state);
				}
				catch (e) {
					alert("update error");
					log1 = e;
				}
			});		
			
			//updates server with particpant info
			gapi.hangout.data.submitDelta({
				participantID:	JSON.stringify(participantID), 
				participantTeam:JSON.stringify(participantTeam),
			});

			//adds videos canvas to the display
			VC = gapi.hangout.layout.getVideoCanvas();
			positionVideoCanvas();
		}
		catch(e) {
			alert("init error");
			log = e;
		}
	}
});

//if global state is changed, update local copy of global varibles and redraw board
function serverUpdate(){
	try {
		var state = gapi.hangout.data.getState();
		participantID = JSON.parse(state.participantID);
		participantTeam = JSON.parse(state.participantTeam);
		participantUpdate();

		infoDisplay = state.infoDisplay;
		document.getElementById("info").innerHTML = infoDisplay;

		if (gameName != state.gameName) {
			gameSetup(state.gameName);
		}
		if (context) {
			sendStateToGame(state.boardString);
		}
	}
	catch(e)
	{
		log2 = e;
	}
}

//updates list of particpants and the presence of switch team buttons
function participantUpdate(){
	//team of the local user
	var pTeam = participantTeam[idIndex(gapi.hangout.getParticipantId())];
	
	var teamArray = (Game && Game.teamArray) ? 
		Game.teamArray : ["Neutral", "Team One", "Team Two"];
	for (var i = 0; i < teamArray.length; i++){
		addButton(i,pTeam);
		document.getElementById(i + 'Players').innerHTML = findTeamMembers(i);
	}
}

function findTeamMembers(team) {
	var rv = "";
	for (var i = 0; i < participantTeam.length; i++){
		if (participantTeam[i] == team) {
			rv = rv + " " + gapi.hangout.getParticipantById(participantID[i]).person.displayName + "<br />";
		}
	}
	return rv;
}

function addButton(bTeam, pTeam){
	//true if player is currently on team - no join Button displayed
	if (bTeam == pTeam ) {
		document.getElementById(bTeam + "Join").innerHTML = "";
	}
	//displays join button
	else {
		document.getElementById(bTeam + "Join").innerHTML = "<input type='button' value='Join' onclick='changeTeam(" + bTeam + ");' />";		
	}
}

//passed a team color and changes to it
function changeTeam(team){
	participantTeam[idIndex(gapi.hangout.getParticipantId())] = team;
	//sends switch to server
	gapi.hangout.data.submitDelta({
		participantID:	JSON.stringify(participantID), 
		participantTeam:JSON.stringify(participantTeam),
	});
}

//finds index of passed ID in participantID array
function idIndex(id) {
	var i = 0;
	while(i < participantID.length)
	{
		if (participantID[i] == id) {
			return i;
		}
		i++;
	}
	//passed id not in array, add entry
	participantID[i] = id;
	participantTeam[i] = 0;
	return i;
}

//positions video canvas to take up largest possible area without covering board
function positionVideoCanvas() {
	maxHeight = window.innerHeight;
	maxWidth = window.innerWidth - 430;
	console.log("position video canvas called");

	if (VC){
		if (maxWidth/maxHeight > VC.getAspectRatio()){
			VC.setHeight(maxHeight);
		}
		else {
			VC.setWidth(maxWidth);
		}
		VC.setPosition(430,0);
		VC.setVisible(true);
	}
	else {
		VC = gapi.hangout.layout.getVideoCanvas();
	}
	window.onresize = positionVideoCanvas;
}

//creates info on game start
function gameStartInfo() {
		var gameStarterID = gapi.hangout.getParticipantId();
		var gameStarterObject = gapi.hangout.getParticipantById(gameStarterID);
		var gameStarterName = gameStarterObject.person.displayName;
		//infoDisplay = gameStarterName + " has started a new game of " + gameName;	
}