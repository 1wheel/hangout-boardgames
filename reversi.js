function Reversi(){
	this.bn = 8;						//number of boxs
	this.bs = Math.min(width,height) /8; //boxsize

	this.cArray = [];					//chipArray
	this.vArray = [];					//array of valid moves
	for (var x = 0; x < this.bn; x++) {
		this.vArray[x] = [];
		for (var y = 0; y < this.bn; y++) {
			this.vArray[x][y] = 0;
		}
	}

	this.blackTurn;
	this.teamArray = ["Neutral", "Black", "White"];

	//sends the starting game layout to wrapper
	this.callSendState = function(){
			var boardState = {
				cArray:			JSON.stringify(this.cArray), 
				blackTurn:		JSON.stringify(this.blackTurn),
			}
		sendStateToServer(JSON.stringify(boardState));
	}
	
	this.recieveState = function (boardString) {
		var boardState = 	JSON.parse(boardString);
		this.cArray = 		JSON.parse(boardState.cArray);
		this.blackTurn = 	JSON.parse(boardState.blackTurn);
		this.drawBoard();
	}


	//initilizes empty arrays representing game state
	this.startGame = function() {		
		setupCanvasObjects();	

		//fills this.cArray with 0s
		for (var x = 0; x < this.bn; x++) {
			this.cArray[x] = [];
			this.vArray[x] = [];
			for (var y = 0; y < this.bn; y++) {
				this.cArray[x][y] = 0;
				this.vArray[x][y] = 0;
			}
		}
		
		//places starting pieces
		this.cArray[3][3] = 2;
		this.cArray[4][4] = 2;
		this.cArray[3][4] = 1;
		this.cArray[4][3] = 1;
		
		//sets starting player
		this.blackTurn = true;
		

		this.callSendState();	
	}

	//clears canvas and redraws board
	this.drawBoard = function() {
		//clear and resize canvas
		//board.width = width;
		//board.height = height;
		
		//clears canvas
		context.fillStyle = "rgb(255,255,255)";
		context.fillRect(0, 0, width, height);
		context.fillStyle = "rgb(0,200,0)";
		context.fillRect(0, 0, this.bn*this.bs, this.bn*this.bs);
		
		//draw grid
		this.drawGrid();
		
		this.createValidMoveArray();
		//draw pieces placed by players	
		this.drawPieces();
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

	//draw pieces placed by players
	this.drawPieces = function(){
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				if (this.cArray[x][y] != 0) {
					this.drawPiece(x,y,this.cArray[x][y],8);
				}
				else if (this.vArray[x][y] != 0) {
					this.drawPiece(x,y,this.vArray[x][y],30);
				}
			}
		}
	}

	//draws a single piece at x, y with color and size passed
	//larger size values make smaller pieces
	this.drawPiece = function(x, y, color, size) {
		if (color == 1) {
			context.fillStyle = "rgb(0,0,0)";
		}
		else {
			context.fillStyle = "rgb(255,255,255)";
		}
		
		context.fillRect(x*this.bs + size, y*this.bs + size, this.bs - size*2, this.bs - size*2);
	}

	//called when there are no valid moves. adds a button to start new game
	 this.endGame = function(){
		//creates Winner text
		var winnerText;
		var scoreDif = this.findScore(1)-this.findScore(2);
		if (scoreDif>0){
			winnerText = "Black Wins! "
		}
		else if (scoreDif<0){
			winnerText = "White Wins! "
		}
		else {		
			winnerText = "Tie Game! Maybe there are no winners in war. "
		}

		console.log(winnerText);
		gameEnded(winnerText);
	}

	//counts the total boxes by the passed player color
	this.findScore = function(color) {
		score = 0;
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				if (this.cArray[x][y] == color) {
					score++;
				}
			}
		}
		return score;
	}

	//called when the page is clicked
	this.click = function(e){
		var color = this.currentColor();
		var pos = this.findPos(board);		
		var cord = this.findCord(e.pageX - pos.x, e.pageY - pos.y);
		cor = cord;
		if (cord) {
			//if click is on the board, see if it is valid move
			if (this.vArray[cord.x][cord.y] != 0) {
				//checks to see if it is the local player's turn
				if (isPlayerTurn(color)) {
					var flippedChips = this.findFlipDirections(cord.x, cord.y, color);
					for (var i = 0; i < flippedChips.length; i++) {
						this.cArray[flippedChips[i].x][flippedChips[i].y] = color;
					}
					this.cArray[cord.x][cord.y] = color;
					csave = this.cArray;
					console.log("saved c");
					this.blackTurn = !this.blackTurn;
					
					//uploads newboard state
					this.callSendState();

					this.createValidMoveArray();
					var vEmpty = true;
					for(var i = 0; i < this.bn; i++){
						for(var j = 0; j < this.bn; j++){
							if (this.vArray[i][j] != 0) {
								vEmpty = false;
							}
						}
					}
					//game ended
					if (vEmpty){
						this.endGame();
					}
					
				}
			}
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
		}
		//cord not on grid; return false
		else {
			RV = false;
		}
		
		return RV;
	}

	//find valid moves
	this.createValidMoveArray = function() {
		//cycles through every board space, finding those with valid moves
		var color = this.currentColor();
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				this.vArray[x][y] = 0;
				if (this.cArray[x][y] == 0) {
					if (this.findFlipDirections(x,y,color).length>0){
						this.vArray[x][y] = color;
					}
				}
			}
		}
	}

	//from a given location, trys all flip directions
	//returns an array of all the pieces that will be flipped if move is valid
	//returns false otherwise
	this.findFlipDirections = function(x,y,color){
		var rv = [];
		var flippedChips;
		for (var dx	= -1;  dx<=1; dx++){
			for (var dy	= -1;  dy<=1; dy++){
				if (dx != 0 || dy != 0) {
					flippedChips = this.findFlipLength(x,y,dx,dy,color);
					for (var i = 0; i < flippedChips.length; i++) {
						rv[rv.length] = flippedChips[i];
						
					}
				}
			}
		}
		return rv;
	}

	//passed a location and direction
	this.findFlipLength = function(x,y,dx,dy,color){	
		var rv = [];
		var i = 1;
		while (this.onBoard(x+i*dx,y+i*dy) && this.cArray[x+dx*i][y+dy*i] == this.flipColor(color) ) {
			i++;	
		}
		
		if (i>1 && this.onBoard(x+i*dx,y+i*dy) && this.cArray[x+dx*i][y+dy*i] == color) {
			
			for (var j = 0; j<i; j++) {
				rv[j] = new Object;
				rv[j].x = x+j*dx;
				rv[j].y = y+j*dy;
			}
		}
		
		return rv;
	}

	this.flipColor = function (color){
		return (color - 1) + (color - 2)*-2;
	}

	//returns true if the cord is on the board
	this.onBoard = function(x, y) {
		return (0 <= x && x <= 7 && 0 <= y && y <= 7);
	}

	//finds whose turn it is
	this.currentColor = function(){
		var color;
		if (this.blackTurn) {
			color = 1;
		}
		else {
			color = 2;
		}
		return color;
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