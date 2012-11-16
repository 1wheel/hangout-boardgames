function Checkers(){
	this.bn = 8;						//number of boxs
	this.bs = Math.min(width,height) /8; //boxsize

	this.cArray = [];					//chipArray
	this.vArray = [];					//array of valid moves
	this.kArray = [];					//array of kings

	this.gameOver;
	for (var x = 0; x < this.bn; x++) {
		this.vArray[x] = [];
		this.kArray[x] = [];
		for (var y = 0; y < this.bn; y++) {
			this.vArray[x][y] = 0;
			this.kArray[x][y] = 0;
		}
	}

	this.whiteTurn;
	this.teamArray = ["Neutral", "Black", "Red"];

	this.pieceClicked = false;
	this.jumpRequired = false;
	//sends the starting game layout to wrapper
	this.callSendState = function(){
			var boardState = {
				cArray:			JSON.stringify(this.cArray), 
				blackTurn:		JSON.stringify(this.whiteTurn),
				gameOver: 		JSON.stringify(this.gameOver),
				kArray: 		JSON.stringify(this.kArray)
			}
		sendStateToServer(JSON.stringify(boardState));
	}
	
	this.recieveState = function (boardString) {
		var boardState = 	JSON.parse(boardString);
		this.cArray = 		JSON.parse(boardState.cArray);
		this.whiteTurn = 	JSON.parse(boardState.blackTurn);
		this.gameOver = 	JSON.parse(boardState.gameOver);
		this.kArray = 		JSON.parse(boardState.kArray);
		this.drawBoard();
	}


	//initilizes empty arrays representing game state
	this.startGame = function() {		
		setupCanvasObjects();	
		
		//places starting pieces
		this.cArray[0] = [0,2,0,0,0,1,0,1];
		this.cArray[1] = [2,0,2,0,0,0,1,0];
		this.cArray[2] =  [0,2,0,0,0,1,0,1];
		this.cArray[3] = [2,0,2,0,0,0,1,0];
		this.cArray[4] =  [0,2,0,0,0,1,0,1];
		this.cArray[5] = [2,0,2,0,0,0,1,0];
		this.cArray[6] = [0,2,0,0,0,1,0,1];
		this.cArray[7] = [2,0,2,0,0,0,1,0];
		
		//sets starting player
		this.whiteTurn = true;

		this.gameOver = false;
		
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
		
		this.drawCheckers();
		
		if (this.pieceClicked) {
			this.drawPiece(this.pieceClicked.x,this.pieceClicked.y,0,this.bs/2.2);
		}
		else {
			this.createValidMoveArray();
		}
		//draw pieces placed by players	
		this.drawPieces();
	}	

	//draws checker pattern
	this.drawCheckers = function() {
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				if ((x+y)%2 == 0) {
					context.fillStyle = "#FFCC99";
				}
				else {
					context.fillStyle = "#C68E3F";
				}
				context.fillRect(x*this.bs,y*this.bs,this.bs,this.bs);
			}
		}
	}

	//draw pieces placed by players
	this.drawPieces = function(){
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				if (this.cArray[x][y] != 0) {
					this.drawPiece(x,y,this.cArray[x][y],this.bs/2.5);
				}
				if (this.kArray[x][y] != 0){
					this.drawStar(x,y,this.bs/3,5,.5);
				}
				if (this.vArray[x][y] != 0) {
					this.drawPiece(x,y,3,this.bs/10);
				}
			}
		}
	}

	//draws a single piece at x, y with color and size passed
	//larger size values make smaller pieces
	this.drawPiece = function(x, y, color, size) {
		if (color == 1) {
			context.fillStyle = "Black";
		}
		else if  (color == 2) {
			context.fillStyle = "Red";
		}
		else {
			context.fillStyle = "White";
		}
		
		context.beginPath();
		context.arc((x+.5)*this.bs, (y+.5)*this.bs, size, 0, 2*Math.PI, false);
		context.fill();
		context.closePath();
	}

	this.drawStar = function(x, y, r, p, m){
		x = (.5 + x)*this.bs;
		y = (.5 + y)*this.bs;

		context.fillStyle = "gold";
	    context.save();
	    context.beginPath();
	    context.translate(x, y);
	    context.moveTo(0,0-r);
	    for (var i = 0; i < p; i++)
	    {
	        context.rotate(Math.PI / p);
	        context.lineTo(0, 0 - (r*m));
	        context.rotate(Math.PI / p);
	        context.lineTo(0, 0 - r);
	    }
	    context.fill();
	    context.restore();
	}

	//called when there are no valid moves. adds a button to start new game
	 this.endGame = function(){
	 	this.gameOver = true;
		//creates Winner text
		var winnerText = (this.whiteTurn) ? "Red Wins!" : "Black Wins!";
		console.log(winnerText);
		gameEnded(winnerText);
	}


	//called when the page is clicked
	this.click = function(e){
		var color = (this.whiteTurn) ? 1 : 2;
		var pos = this.findPos(board);		
		var cord = this.findCord(e.pageX - pos.x, e.pageY - pos.y);

		if (cord && !this.gameOver) {
			//if click is on the board, see if it is valid move
			if (this.vArray[cord.x][cord.y] != 0) {
				//checks to see if it is the local player's turn
				if (isPlayerTurn(color)) {
					//checks to see if a peice has been selected
					if (this.pieceClicked) {
						console.log("piececlick already selected, making move");
						this.movePiece(cord.x,cord.y,color);
						
						//uploads newboard state
						this.callSendState();

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
					else {
						console.log("selecting peice");
						this.pieceClickedOn(cord.x,cord.y);
					}

					this.drawBoard();
				}
			}
			else if (this.pieceClicked && !this.jumpRequired){
				this.pieceClicked = false;
				this.drawBoard();
			}
		}
	}

	//find valid moves
	this.createValidMoveArray = function() {
		//cycles through every board space, finding those with valid moves
		var color = (this.whiteTurn) ? 1 : 2;
		var possibleJump = false;
		for (var x = 0; x < this.bn; x++) {
			for (var y = 0; y < this.bn; y++) {
				this.vArray[x][y] = 0;
				if (this.cArray[x][y] == color) {
					if (this.validSlides(x,y,color).length>0){
						this.vArray[x][y] = 's';
					}
					if (this.validJumps(x,y,color).length>0){
						this.vArray[x][y] = 'j';
						possibleJump = true;
					}
				}
			}
		}

		if (possibleJump){
			console.log("jump exists");

			for (var x = 0; x < this.bn; x++) {
				for (var y = 0; y < this.bn; y++) {
					if (this.vArray[x][y] == 's') {
						this.vArray[x][y] = 0;
					}
				}
			}
		}

	}

	//returns array of valid slide positions from passsed spot
	this.validSlides = function(x,y,color){
		var rv = [];
		var dir = this.findDirection(x,y,color);
		for (var i = 0; i < dir.length; i++){
			if (this.onBoard(x-1,y+dir[i]) && this.cArray[x-1][y+dir[i]] == 0){
				rv.push({xm: x-1, ym: y+dir[i]});
			}
			if (this.onBoard(x+1,y+dir[i]) && this.cArray[x+1][y+dir[i]] == 0){
				rv.push({xm: x+1, ym: y+dir[i]});
			}
		}
		return rv;
	}

	//returns array of valid jumps landings from passed spot
	this.validJumps = function(x,y,color){
		var rv = [];
		var dir = this.findDirection(x,y,color);
		for (var i = 0; i < dir.length; i++){
			if (this.onBoard(x-1,y+dir[i]) && this.cArray[x-1][y+dir[i]] == this.flipColor(color)){
				if (this.onBoard(x-2,y+dir[i]*2) && this.cArray[x-2][y+dir[i]*2] == 0){
					rv.push({xm: x-2, ym: y+dir[i]*2});
				}
			}
			if (this.onBoard(x+1,y+dir[i]) && this.cArray[x+1][y+dir[i]] == this.flipColor(color)){
				if (this.onBoard(x+2,y+dir[i]*2) && this.cArray[x+2][y+dir[i]*2] == 0){
					rv.push({xm: x+2, ym: y+dir[i]*2});
				}
			}
		}
		return rv;
	}

	//returns direction(s) piece can slide or jump in
	this.findDirection = function (x,y,color) {
		var dir = (color==1) ? [-1] : [1];
		dir[1] = (this.kArray[x][y]==1) ? -1*dir[0]: 99;
		return dir;
	}

	//called after a piece with a valid move has been clicked on
	this.pieceClickedOn = function(x,y){
		console.log("pieceClicked " + x + " " + y);
		this.pieceClicked = {x: x, y: y};
		var jumpMove = (this.vArray[x][y] == 'j');
		this.clearvArray();
		var color = this.cArray[x][y];

		var moves = (jumpMove) ? this.validJumps(x,y,color) : this.validSlides(x,y,color);
		for (i = 0; i < moves.length; i++){
			this.vArray[moves[i].xm][moves[i].ym] = (jumpMove) ? 'j' : 's';
		}
		z = moves;
	}

	//called after a peice has been selected
	this.movePiece = function(xm,ym,color){		
		this.kArray[xm][ym] = this.kArray[this.pieceClicked.x][this.pieceClicked.y];
		this.kArray[this.pieceClicked.x][this.pieceClicked.y] = 0;
		this.cArray[this.pieceClicked.x][this.pieceClicked.y] = 0;
		this.cArray[xm][ym] = color;
		this.jumpRequired = false;

		if ((xm+this.pieceClicked.x)%2 == 0){
			console.log("jump move");
			this.cArray[(xm+this.pieceClicked.x)/2][(ym+this.pieceClicked.y)/2] = 0;
			this.kArray[(xm+this.pieceClicked.x)/2][(ym+this.pieceClicked.y)/2] = 0;
			if (this.validJumps(xm,ym,color).length>0){
				console.log("another jump possible");
				this.jumpRequired = true;
				this.clearvArray();
				var moves = this.validJumps(xm,ym,color);
				for (i = 0; i < moves.length; i++){
					this.vArray[moves[i].xm][moves[i].ym] = 'j';
				}
				this.pieceClicked = {x:xm,y:ym};
			}
		}
		if ((this.whiteTurn && ym == 0) || (!this.whiteTurn && ym == 7)) {
			this.kArray[xm][ym] = 1;
		}

		if (!this.jumpRequired){
			console.log("no jump chain : switching players");
			this.whiteTurn = !this.whiteTurn;
			this.jumpRequired = false;
			this.createValidMoveArray();
			this.pieceClicked = false;
		}

	}


	//returns true if the cord is on the board
	this.onBoard = function(x, y) {
		return (0 <= x && x <= 7 && 0 <= y && y <= 7);
	}

	this.flipColor = function (color){
		return (color - 1) + (color - 2)*-2;
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

	this.clearvArray = function(){
		for (var i = 0; i < this.bn; i++){
			for (var j = 0; j < this.bn; j++) {
				this.vArray[i][j] = 0;
			}
		}
	}

}