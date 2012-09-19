//interacts with GAPI, sending updates to gameboard object
var width = 400;
var height = 400;
var board;			//canva
var context;		//canvas context
var container;		//holds color score, player names and join button

//displays below game canvas
var infoDisplay = "";


//contains game state and methods
var Game = new reversi();


//called by game object when it has data to send out
function sendStateToServer(boardString){
	sendStateToGame(boardString);
	//gapi.hangout.data.submitDelta({boardString: boardString})
}

//passes updated state to gameboard
function sendStateToGame(boardString){
	Game.recieveState(boardString);
}

function sendClickToGame(e) {
	Game.click(e);
}

function isPlayerTurn(color) {
	return true;
}

//updates info div with winner info and button to start new game
function gameEnded(winnerText){
	infoDisplay = winnerText + "<input type='button' value='Start New Game' onclick='Game.startGame();' />";
	document.getElementById("info").innerHTML = infoDisplay; 
}

//creates on context object and listener
function setupCanvasObjects() {
	board = document.getElementById("board");
	context = board.getContext("2d"); 
	container = document.getElementById("container");
	//listens for clicks on the board	
	board.addEventListener("mousedown",sendClickToGame,false);
}

Game.startGame();