function Backgammon(){
	this.bnx = 7;						//number of boxs
	this.bny = 6;
	this.bs = Math.min(width,height) /7; //boxsize

	this.ps = 15;
	this.cArray = [];					//chipArray
	this.bar = {white: 0, brown: 0};

	this.whiteTurn;
	this.teamArray = ["Neutral", "White", "Brown"];
	this.gameOver;
	this.triangleCenter = [];

	this.dice = [];

	this.validMoves = [];
	this.validDrops = [];
	this.triSelected = false;

	this.diceImg = [];
	for (var i = 1; i <= 6; i++){
		this.diceImg[i] = new Image();
		console.log("dice" + i)
		this.diceImg[i].src = document.getElementById("dice" + i).src;
	}

	//sends the starting game layout to wrapper
	this.callSendState = function(){
			var boardState = {
				cArray:			JSON.stringify(this.cArray), 
				whiteTurn:		JSON.stringify(this.whiteTurn),
				gameOver: 		JSON.stringify(this.gameOver)
			}
		sendStateToServer(JSON.stringify(boardState));
		console.log("state sent");
	}
	
	this.recieveState = function (boardString) {
		console.log("state recieveState");
		var boardState = 	JSON.parse(boardString);
		this.cArray = 		JSON.parse(boardState.cArray);
		this.whiteTurn = 	JSON.parse(boardState.whiteTurn);
		this.gameOver = 	JSON.parse(boardState.gameOver);
	
		this.findValidMoves();
		
		this.drawBoard();
	}

	//initilizes empty arrays representing game state
	this.startGame = function() {		
		setupCanvasObjects();	

		//fills this.cArray with empty objects
		for (var i = 0; i < 26; i++) {
			this.cArray[i] = {color: 0, num: 0};
		}
		this.cArray[1] = {color: 1, num: 2};
		this.cArray[6] = {color: 2, num: 5};
		this.cArray[8] = {color: 2, num: 3};		
		this.cArray[12] = {color: 1, num: 5};
		this.cArray[13] = {color: 2, num: 5};
		this.cArray[17] = {color: 1, num: 3};
		this.cArray[19] = {color: 1, num: 5};
		this.cArray[24] = {color: 2, num: 2};

		//sets starting player
		this.whiteTurn = true;
		this.gameOver = false;
		this.rollDice();

		this.callSendState();	
	}

	//clears canvas and redraws board
	this.drawBoard = function() {	
		console.log('drawboard');	
		//clears canvas
		ps = this.ps;

		context.fillStyle = "rgb(141,113,69)";
		context.fillRect(0, 0, width, height);
		
		context.fillStyle = "rgb(226,187,153)";

		context.fillRect(ps,ps,(400-ps*4)/2,400-ps*2);
		context.fillRect((400+ps)/2,ps,(400-ps*4)/2,400-ps*2);

		this.drawTriangles();
		
		this.drawPieces();
		this.drawRemovedPieces();

		this.drawDice();

		//don't draw possible moves if game is over
		if (!this.gameOver){
			this.drawMoves();
		}
	}	

	//draws triangles and records the x center of the ith triel
	this.drawTriangles = function(){
		this.triangleCenter = [0];
		this.drawTriangleSet((400-ps*4)/12, (400+ps)/2, ps, 180, 0);		
		this.drawTriangleSet((400-ps*4)/12, ps, 		ps, 180, 0);
		this.drawTriangleSet((400-ps*4)/12, ps, 		400-ps, 220, 1);
		this.drawTriangleSet((400-ps*4)/12, (400+ps)/2, 400-ps, 220, 1);

		for (var i = 13; i < 25; i++){
			this.triangleCenter[i] = this.triangleCenter[25-i];
		}
		//this.triangleCenter = this.triangleCenter.concat(this.triangleCenter.reverse());
	}

	this.drawTriangleSet = function(base, xOff, yBot, yTop, modY){
		for (var i = 5; i > -1; i--){
			context.fillStyle = ((i+modY)%2 == 0) ? 'rgb(162,125,92)' : 'rgb(201,163,114)';
			//highlight clicked triangle code goes here
			context.strokeStyle = context.fillStyle;

			this.drawTriangle(xOff+base*i, yBot, xOff+base*i+base/2, yTop, xOff+base*i+base, yBot);
			
			if (modY === 0){
				this.triangleCenter.push(xOff+base*i+base/2);
			}
		}
	}

	this.drawTriangle = function(x0,y0,x1,y1,x2,y2){
		context.beginPath();

		context.moveTo(x0, y0); 
		context.lineTo(x1, y1);
		context.lineTo(x2, y2);
		context.lineTo(x0, y0);

		context.fill();
		context.stroke();
		context.closePath();
	}

	//draw pieces placed by players
	this.drawPieces = function(){
		for (var i = 1; i < 25; i++) {
			if (this.cArray[i].num > 0){
				this.drawPiece(this.cArray[i].color,this.cArray[i].num,i);
			}
		}

		//draw side bar peices
		if (this.cArray[0].num > 0){
			context.fillStyle = 'rgb(226,226,197)';
			this.drawCircle(195, 183, this.ps -1);
			if (this.cArray[0].num > 1){
				context.fillStyle = 'Grey';
				context.fillText("x" + this.cArray[0].num, 195-5, 183);
			}
		}
		if (this.cArray[25].num > 0){
			context.fillStyle = 'rgb(101,59,49)';
			this.drawCircle(195, 217, this.ps -1);
			if (this.cArray[25].num > 1){
				context.fillStyle = 'Grey';
				context.fillText("x" + this.cArray[25].num, 195-5, 217);
			}

		}
	}

	//draws a single piece at x, y with color and size passed
	//larger size values make smaller pieces
	this.drawPiece = function(color, num, i) {
		xCenter = this.triangleCenter[i];
		yCenter = (i<13) ? 15 + this.ps : 400-30;
		
		stack = [0,0,0,0,0];
		for (var n = 0; n < num; n++){
			stack[n%5] = stack[n%5] + 1;
		}

		for (var n = 0; n < Math.min(num, 5); n++){		
			context.fillStyle = (color == 1) ? 'rgb(226,226,197)' : 'rgb(101,59,49)';
			
			this.drawCircle(xCenter, yCenter, this.ps-1);

			this.drawStack(xCenter, yCenter, stack[n]);

			yCenter = yCenter + (2*this.ps+2)*((i<13) ? 1 : -1);
		}
	}

	this.drawStack = function(x, y, num){			
		context.fillStyle = 'Grey';
		if (num == 2){
			this.drawCircle(x, y, 3);
		}
		if (num == 3){
			this.drawCircle(x-5, y, 3);
			this.drawCircle(x+5, y, 3);
		}
	}

	this.drawCircle = function(x, y, radius){
		context.beginPath();
		context.arc(x, y, radius, 0, 2*Math.PI, false);
		context.fill();
		context.closePath();
	}

	this.drawDice = function(){
		context.fillStyle = "rgba(0, 0, 0, 0.5)";
		context.strokeStyle = "rgba(0, 0, 0, 0)";

		context.drawImage(this.diceImg[this.dice[0].num], 65, 184, 32, 32);
		if (this.dice[0].available == 0){
			context.fillRect(65,184,32,32);
		}
		else if (this.dice[0].available == 1 && this.dice[0].num == this.dice[1].num){
			this.drawTriangle(65,184, 65+32,184, 65,184+32);
		}

		context.drawImage(this.diceImg[this.dice[1].num], 130, 184, 32, 32);
		if (this.dice[1].available == 0){
			context.fillRect(130,184, 32,32);
		}
		else if (this.dice[1].available == 1 && this.dice[0].num == this.dice[1].num){
			this.drawTriangle(130,184, 130+32,184, 130,184+32);
		}

	}

	this.drawMoves = function(){
		context.fillStyle = "Green";
		//displays dots under rows where chip can be picked up from
		if (this.triSelected === false){
			for (var i = 1; i < 26; i++){
				if (this.validMoves[i]){
					this.drawCircle(this.triangleCenter[i], (i<13) ? 7 : 393, 5)
				}
			}
		}
		else {
			var index = this.triSelected;

			//displays dots under places to drop chip
			//TODO: make this a function or loop over twice?
			this.validDrops = [];
			if (this.isValidMove(index, this.dice[0].num) && this.dice[0].available > 0){
				var moveTo = index+this.dice[0].num*this.currentDirection();
				if (0 < moveTo && moveTo < 25){
					this.drawCircle(this.triangleCenter[moveTo], (moveTo < 13) ? 7 : 393, 5);
				}				
				//99 indicates peice is being moved off the board - make the sidebar with a dop
				else{
					moveTo = 99;
					this.drawCircle(390, 200, 5);
				}
				this.validDrops.push(moveTo);
			}
			else{
				this.validDrops.push(-1);
			}
			if (this.isValidMove(index, this.dice[1].num) && this.dice[1].available > 0){
				var moveTo = index+this.dice[1].num*this.currentDirection();
				if (0 < moveTo && moveTo < 25){
					this.drawCircle(this.triangleCenter[moveTo], (moveTo < 13) ? 7 : 393, 5);
				}				
				//99 indicates peice is being moved off the board - make the sidebar with a dop
				else{
					moveTo = 99;
					this.drawCircle(390, 200, 5);
				}
				this.validDrops.push(moveTo);
			}
			else{
				this.validDrops.push(-1);
			}

			//displays line under location of the chip picked up
			if (this.triSelected == 0){
				context.fillRect(195 - 9, 183 - 25, 20, 6);
			}
			else if (this.triSelected == 25){
				context.fillRect(195 - 9, 217 + 25, 20, 6);
			}
			else {
				context.fillRect(this.triangleCenter[index]-10, (index<13) ? 4 : 390, 20, 6);
			}
		}
	}

	this.drawRemovedPieces = function(){
		var numWhite = 15 - this.countRemainingPieces(1);
		context.fillStyle = 'rgb(226,226,197)';
		for (var i = 0; i < numWhite; i++){
			context.fillRect(380, 370 - i*10, 18, 4);
		}

		var numBrown = 15 - this.countRemainingPieces(2);
		context.fillStyle ='rgb(101,59,49)';		
		for (var i = 0; i < numBrown; i++){
			context.fillRect(380, 30 + i*10, 18, 4);
		}

	}

	//called when there are no valid moves. adds a button to start new game
	 this.endGame = function(){
	 	this.gameOver = true;

		//creates Winner text
		var winnerText = (this.whiteTurn) ? "White Wins!" : "Brown Wins!";

		console.log(winnerText);
		gameEnded(winnerText);
	}

	//called when turn ends or gamestarts
	this.rollDice = function(){
		this.dice = [{num:Math.floor(Math.random()*6 + 1), available: 1}, {num:Math.floor(Math.random()*6 + 1), available: 1}];
		if (this.dice[0].num == this.dice[1].num){
			this.dice[0].available = 2;
			this.dice[1].available = 2;
		}
		console.log("dice rolled");
	}

	//called when the page is clicked
	this.click = function(e){
		var color = (this.whiteTurn) ? 1 : 2;
		var pos = this.findPos(board);		
		var cord = this.findCord(e.pageX - pos.x, e.pageY - pos.y);
		console.log(cord);
		if (cord && !this.gameOver) {
			//if no column is selected, picks one
			if (cord != 99 && this.triSelected === false) {
				if (this.validMoves[cord]){
					this.triSelected = cord;
					this.drawBoard();
				}
			}
			//if picked column is click, unselect
			else if (this.triSelected === cord){
				this.triSelected = false;
				this.drawBoard();
			}
			//checks to see if it is the local player's turn
			else if (isPlayerTurn(color)) {
				var dropIndex = this.validDrops.indexOf(cord);
				//is the move valid?
				if (dropIndex != -1){
					console.log("move is valid");
					//take piece off the board
					this.cArray[this.triSelected].num = this.cArray[this.triSelected].num - 1;
					
					//add piece back to the board; doesn't happen if piece is being removed at game end
					if (cord != 99){
						if (this.cArray[cord].color == color || this.cArray[cord].num == 0){
							this.cArray[cord] = {color: color, num: this.cArray[cord].num + 1};
						}
						else {
							this.cArray[cord] = {color: color, num: 1};
							console.log((color == 1) ? 25 : 0);
							this.cArray[(color == 1) ? 25 : 0] = {color: (color == 1) ? 2 : 1, num: this.cArray[(color == 1) ? 25 : 0].num + 1};
						}
					}

					//dice can't be used to move again.
					this.dice[dropIndex].available = this.dice[dropIndex].available - 1;

					//checks to see if game has ended
					if (this.checkGameEnd()) {
						console.log("GAME OVER");
						this.endGame();
					}
					else{
						//checks to see if turn has ended
						this.findValidMoves();

						//keep rolling the dice until someone can move
						while(this.checkTurnEnd()){
							console.log("turn over");
							this.whiteTurn = !this.whiteTurn;
							this.rollDice();
							this.findValidMoves();
						}
					}
					this.drawBoard();
					
					//uploads newboard state. not sure if this should be before or after send state..
					this.callSendState();
				}
			}
		}
	}

	this.checkTurnEnd = function(){
		var openMove = false;					
		for (var i = 0; i < this.validMoves.length; i++){
			openMove = openMove || this.validMoves[i];
		}
		return !openMove;
	}

	this.checkGameEnd = function(){
		return (this.countRemainingPieces(1) == 0 || this.countRemainingPieces(2) == 0);
	}

	this.countRemainingPieces = function (color){
		var rv = 0;
		for (var i = 1; i < 25; i++){
			if (this.cArray[i].color == color){
				rv = rv + this.cArray[i].num;
			}
		}
		return rv;
	}

	this.findValidMoves = function(){
		this.triSelected = false;
		for (var i = 0; i < 26; i++){
			this.validMoves[i] = false;
		}

		var color = this.currentColor();
		//no dice with valid moves left => no valid moves
		if(this.dice[0].available == 0 && this.dice[1].available == 0){

		}
		//if peices are on the bar, they have to be moved - selection is locked on them
		else if (color == 1 && this.cArray[0].num > 0){
			this.validMoves[0] = true;
			this.triSelected = 0;
		}
		else if (color == 2 && this.cArray[25].num > 0){
			this.validMoves[25] = true;
			this.triSelected = 25;
		}
		//no peices on bar, and dice availibe - check all spaces for a valid move
		else {
			for (var i = 1; i < 25; i++){
				if (color == this.cArray[i].color && this.cArray[i].num > 0){
					this.validMoves[i] = this.isValidMove(i, this.dice[0].num) && this.dice[0].available > 0;
					this.validMoves[i] = (this.isValidMove(i, this.dice[1].num) && this.dice[1].available > 0) || this.validMoves[i];
				}
			}
		}
	}

	this.isValidMove = function(i, num){
		direction = this.currentDirection();
		var color = this.currentColor();
		//brown is end game and can move peices off
		if (0 >= i + direction*num){
			if (this.isEndGame() && color == 2){
				return true;
			}
		}
		//white is in end game and can clear peice
		else if (25 <= i + direction*num){
			if (this.isEndGame() && color == 1){
				return true;
			}
		}
		//piece not moving off board - check if it has a place to land
		else if (this.cArray[i + direction*num].color == this.currentColor() || this.cArray[i + direction*num].num < 2){
			return true;
		}
		return false;
	
	}

	//returns true if current player has all their pieces on their homeboard
	this.isEndGame = function(){
		var rv = true;
		var color = this.currentColor();
		var start = (color == 1) ? 1 : 7;
		var end   = (color == 1) ? 18 : 24;
		for (var i = start; i <= end; i++){
			if (this.cArray[i].color == color && this.cArray[i].num > 0){
				rv = false;
			}
		}
		return rv;
	}

	this.currentColor = function(){
		return (this.whiteTurn) ? 1 : 2;
	}

	this.currentDirection = function(){
		return (this.whiteTurn) ? 1 : -1;
	}

	//finds which line the passed cord is closest to
	this.findCord = function(x, y){			
		//true if point is inside grid
		if (0 < x && x < 400 && 0 < y && y < 400 ){
			var index = 1;
			if (y > 200){
				index = index + 12;
			}

			for (var i = 0; i < 12; i++){
				if (this.triangleCenter[i + index] - this.ps < x 
					&& x < this.triangleCenter[i + index] + this.ps){
					return (i+index);
				}
			}
		}
		if (378 < x && x < 401){
			return 99;
		}
		//cord not on grid or on a line; return false		
		return false;
	}

	//returns true if the cord is on the board
	this.onBoard = function(x, y) {
		return (0 <= x && x < this.bnx && 0 <= y && y < this.bny);
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