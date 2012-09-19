//interacts with GAPI, sending updates to gameboard object
var width = 400;
var height = 400;
var board;			//canva
var context;		//canvas context
var container;		//holds color score, player names and join button

//displays below game canvas
var infoDisplay = "";

//stores participantID and corrisponding team color
var participantID = [];
var participantTeam = [];

//video canvas, display to the right of gameboard and info
var VC;

//contains game state and methods
var Game = new reversi;

//called by game object when it has data to send out
function sendStateToServer(boardString){
	save = boardString;
	if (boardString) {
		gapi.hangout.data.submitDelta({boardString: boardString});
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
	return participantTeam[idIndex(gapi.hangout.getParticipantId())] == color
}

//updates info div with winner info and button to start new game
function gameEnded(winnerText){
	infoDisplay = winnerText + "<input type='button' value='Start New Game' onclick='startGame();' />";
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
			
			//checks to see if game has already been created
			if (typeof state.cArray != 'undefined') {
				//game already running, join it
				setupCanvasObjects();
				serverUpdate();
			}
			else {
				//no game running, start a new one
				Game.startGame();
				gameStartInfo();
			}
			
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

		sendStateToGame(state.boardString);
	}
	catch(e)
	{
		log2 = e;
	}
}

//updates list of particpants and the presence of switch team buttons
function participantUpdate(){
	//team of the local user
	var team = participantTeam[idIndex(gapi.hangout.getParticipantId())];
	
	//adds buttons
	addButton('joinBlack',team);
	addButton('joinNone',team);
	addButton('joinWhite',team);
	
	document.getElementById('blackPlayers').innerHTML = findTeamMembers(1);
	document.getElementById('nonePlayers').innerHTML = findTeamMembers(0);
	document.getElementById('whitePlayers').innerHTML = findTeamMembers(-1);
	
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

function addButton(bName, team){
	//true if player is currently on team - no join Button displayed
	if (buttonNameToTeam(bName) == team ) {
		document.getElementById(bName).innerHTML = "";
	}
	//displays join button
	else {
		document.getElementById(bName).innerHTML = "<input type='button' value='Join' onclick='changeTeam(" + buttonNameToTeam(bName) + ");' />";		
	}
}

//takes a button name and returns a team number
function buttonNameToTeam(bName) {
	if (bName == 'joinBlack') {
		return 1;
	}
	else if (bName == 'joinNone') {
		return 0;
	}
	else if (bName == 'joinWhite') {
		return -1;
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

	if (VC){
		if (maxWidth/maxHeight > VC.getAspectRatio()){
			VC.setHeight(maxHeight);
		}
		else {
			VC.setWidth(maxWidth);
		}
		VC.setPosition(580,0);
		VC.setVisible(true);
	}
	else {
		VC = gapi.hangout.layout.getVideoCanvas();
	}
}

//creates info on game start
function gameStartInfo() {
		var gameStarterID = gapi.hangout.getParticipantId();
		var gameStarterObject = gapi.hangout.getParticipantById(gameStarterID);
		var gameStarterName = gameStarterObject.person.displayName;
		infoDisplay = gameStarterName + " has started a new game";	
}