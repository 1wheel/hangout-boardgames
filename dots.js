function Dots() {
	this.bn = 8;								//number of boxs
	this.bs = (Math.min(width,height) - 4) /8; 		//boxsize

	this.vArray = [];	//array of vertical lines
	this.hArray = [];	//array of horizontal lines
	this.boxArray = [];	//array of filled boxes
	this.blueTurn;

	this.teamArray = ["Neutral", "Red", "Blue"];

	//sends the starting game layout to wrapper
	this.callSendState = function(){
			var boardState = {
				vArray:				JSON.stringify(this.vArray), 
				hArray:				JSON.stringify(this.hArray), 
				boxArray:			JSON.stringify(this.boxArray), 
				blueTurn:			JSON.stringify(this.blueTurn),
			}
		sendStateToServer(JSON.stringify(boardState));
	}

	this.recieveState = function (boardString) {
		var boardState = 	JSON.parse(boardString);
		this.vArray = 		JSON.parse(boardState.vArray);
		this.hArray = 		JSON.parse(boardState.hArray);
		this.boxArray = 	JSON.parse(boardState.boxArray);
		this.blueTurn = 	JSON.parse(boardState.blueTurn);
		this.drawBoard();
	}

	//initilizes empty arrays representing game state
	this.startGame = function() {
		setupCanvasObjects();

		//fills this.this.vArray with 0s
		for (var x = 0; x < this.bn + 1; x++) {
			this.vArray[x] = [];
			for (var y = 0; y < this.bn; y++) {
				this.vArray[x][y] = false;
			}
		}
		
		//fills this.hArray with 0s
		for (var x = 0; x < this.bn; x++) {
			this.hArray[x] = [];
			for (var y = 0; y < this.bn + 1; y++) {
				this.hArray[x][y] = false;
			}
		}	
		
		//fills this.boxArray with 0s
		for (var x = 0; x < this.bn; x++) {
			this.boxArray[x] = [];
			for (var y = 0; y < this.bn; y++) {
				this.boxArray[x][y] = 0;
			}
		}	
		
		//sets starting player
		this.blueTurn = true;
		
		this.drawBoard();
		this.callSendState();
	}

	//clears canvas and redraws board
	this.drawBoard = function() {	
		//clears canvas
		context.fillStyle = "rgb(255,255,255)";
		context.fillRect(0, 0, width, height);
		
		//draw grid
		this.drawGrid();
		
		//draw lines placed by players
		this.drawLines();
		
		//draws filled boxs
		this.drawFilledBox();
	}	

	//draws grid of lines 
	this.drawGrid = function(){
		context.beginPath();
		//draw vertical lines
		for (var x=0; x<=this.bn*this.bs; x+= this.bs) {
			context.moveTo(x,0);
			context.lineTo(x,this.bn*this.bs);
		}
		
		//draw horizontal lines
		for (var y=0; y<=this.bn*this.bs; y+= this.bs) {
			context.moveTo(0,y);
			context.lineTo(this.bn*this.bs,y);
		}
		
		//fills in lines in offwhite
		context.strokeStyle = "rgb(190,190,190)";
		context.stroke();
		context.closePath();
	}

	//draws in lines clicked by player
	this.drawLines = function(){
		//lines are mostly with a little red or blue
		context.fillStyle = (this.blueTurn) ? "rgb(4,9,83)" : "rgb(103,3,3)";

		//draws vertical and horizontal lines
		for (var x = 0; x < this.bn + 1; x++) {
			for (var y = 0; y < this.bn; y++) {
				if (this.vArray[x][y]) { 
					context.fillRect(x*this.bs, y*this.bs, 4, this.bs+3);
				}
				if (this.hArray[y][x]) { 
					context.fillRect(y*this.bs, x*this.bs, this.bs+3, 4);
				}
			}
		}
	}

	//draws boxes surrounded by lines
	this.drawFilledBox = function(){
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				if(this.boxArray[x][y] == 1) {
					context.fillStyle = "rgb(200,0,0)";
					context.fillRect(x*this.bs+5,y*this.bs+5,this.bs-7,this.bs-7);
				}
				else if(this.boxArray[x][y] == 2) {
					context.fillStyle = "rgb(0,0,200)";
					context.fillRect(x*this.bs+5,y*this.bs+5,this.bs-7,this.bs-7);
				}
			}
		}	
	}

	//counts the total boxes by the passed player color
	this.findScore = function(color) {
		score = 0;
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				if (this.boxArray[x][y] == color) {
					score++;
				}
			}
		}
		return score;
	}

	//called when the page is clicked
	this.click = function (e){
		var pos = this.findPos(board);
		var cord = this.findCord(e.pageX - pos.x, e.pageY - pos.y);
		if (cord) {
			if (isPlayerTurn(blueTurn? 2 : 1))
			//if line is added to board, redraw lines
			if (this.attemptMove(cord.vertical, cord.x, cord.y)) {
				this.drawBoard();
				this.callSendState();
				this.checkGameEnd();
			}
		}
	}

	this.checkGameEnd = function(){
		var blueScore = this.findScore(2);
		var orangeScore = this.findScore(1);
		if (blueScore + orangeScore == this.bn*this.bn) {
			var scoreDif = blueScore - orangeScore;
			if (scoreDif>0){
				winnerText = "Blue Wins! "
			}
			else if (scoreDif<0){
				winnerText = "Orange Wins! "
			}
			else {		
				winnerText = "Tie Game! Maybe there are no winners in war. "
			}
			gameEnded(winnerText);
		}
	}

	//finds which line the passed cord is closest to
	this.findCord = function(x, y){	
		var RV = new Object; 	//return value
		
		//true if point is inside grid
		if (0 < x && x < this.bs*this.bn && 0 < y && y < this.bs*this.bn){
			xs = Math.floor(x/this.bs);
			ys = Math.floor(y/this.bs);
			
			RV.x = xs;
			RV.y = ys;
			//closer to left & bottom
			if (x - xs*this.bs < y - ys*this.bs) {
				//closer to left & top
				if (x - xs*this.bs < (ys+1)*this.bs - y) {
					RV.vertical = true;
				}
				//bottom
				else {
					RV.vertical = false;
					RV.y = RV.y + 1;
				}
			}
			//closer to right & top
			else
			{
				//closer to left & top
				if (x - xs*this.bs < (ys+1)*this.bs - y) {
					RV.vertical = false;
				}
				//right
				else {
					RV.vertical = true;
					RV.x = RV.x + 1;
				}			
			}
			
		}
		//cord not on grid; return false
		else {
			RV = false;
		}
		
		return RV;
	}

	//Trys to add line to board. Returns true if position is not filled
	this.attemptMove = function(vertical, x, y){
		var success = false;		//function will return true if line is not filled
		var switchPlayer = true;	//if no box is completed, player color will switch
		
		if (vertical) {
			if (!this.vArray[x][y]) {
				success = true;
				this.vArray[x][y] = true;
				if (this.boxCompleted(x,y)) {
					switchPlayer = false;
				}
				if (this.boxCompleted(x-1,y)) {
					switchPlayer = false;
				}
			}
		}
		else if (!this.hArray[x][y]) {
			success = true;
			this.hArray[x][y] = true;
			if (this.boxCompleted(x,y)) {
				switchPlayer = false;
			}
			if (this.boxCompleted(x,y-1)) {
				switchPlayer = false;
			}
		}
		
		if (switchPlayer) {
			this.blueTurn = !this.blueTurn;
		}
		
		return success;
		
		
	}

	//colors a box based on current player color if it is surroned by lines
	//returns true if box has been filled
	this.boxCompleted = function (x, y) {
		//checks to make sure box is in grid
		if (0<=x && x<this.bn && 0<=y && y<this.bn) {
			if (this.vArray[x][y] && this.vArray[x+1][y] && this.hArray[x][y] && this.hArray[x][y+1]) {
				if (this.blueTurn) {
					this.boxArray[x][y] = 2;
				}
				else {
					this.boxArray[x][y] = 1;
				}
				return true;
			}
		}
		return false;
	}

	//finds how much the canvas is offset in the frame
	this.findPos = function(obj) {
		var curleft = 0, curtop = 0;
		if (obj.offsetParent) {
			do {
				curleft += obj.offsetLeft;
				curtop += obj.offsetTop;
			} while (obj = obj.offsetParent);
			return { x: curleft, y: curtop };
		}
		return undefined;
	}
}


