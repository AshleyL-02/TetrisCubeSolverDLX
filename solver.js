/* global box, translate, cubeDisplay, push, pop, fill, PieceRotation, create3dBoolArray, PieceCollection, Vector3, color, colorMode, RGB, HSB */

/*
Algorithm: 
- To find a solution:
    Place pieces until target figure is filled
      To place a piece:
        Find empty position in target figure
        Find unused piece and test its rotations; continue until a piece fits
      If no pieces fit, remove the last piece
      Place a piece, picking up from the next rotation of removed piece
      
- To find next solution:
    Remove a piece from the previous solution
    Continue placing pieces until a solution is found
*/

class Solver {   
  //considers the cube solved if the target figure is completely filled
  constructor(type, dim){
    this.dim = dim;  //dimensions

    //mutables
    this.targetFigure = create3dBoolArray(dim);  //the figure being built on to prevent piece intersections
    this.pieceCollection = new PieceCollection(type);
    this.pieceOrder = [];  //list of pieceIndexes in the order they're placed
    this.startingPieces = [];  //integers representing the first piece tested for any index in pieceOrder (prevents repeat testing)
    
    this.foundAllSolutions = false;
    this.isSolved = false;
    this.solutions = [];
    this.timeElapsed = 0; //time taken to find solutions
    
    this.solutionForDisplay = [];
  } 
  
  //SOLUTION METHODS
  findAllSolutions(){  //returns true if there were solutions to find
    if(this.foundAllSolutions === false){
      let startTime = new Date();
      while(this.findNextSolution()){} //find all solutions
      this.timeElapsed += new Date() - startTime;
      return true;
    } 
    return false;
  }
  findNextSolution(){ //returns true if found a solution
    if(this.foundAllSolutions){
        return false;
    }
    
    let startTime = new Date();
    
    //remove last piece in cube, if any
    let p = this.removeLastPiece();
    if(p === false){
      p =0;
    }
    
    this.isSolved = false;  
    this.placeNextPiece(p);
    
    while(this.isSolved === false){
      this.placeNextPiece();
      if(this.foundAllSolutions){
        return false;
      }
    }
    
    //add solution
    this.solutions.push(this.getCurrentSolution());
    this.timeElapsed += new Date() - startTime;
    return true;
  }
  
  // PIECE-PLACING METHODS
  
  placeNextPiece(startingIndex =0){  //returns true if piece is placed, false if no solutions are left   
    let emptyPos = this.getNextEmptyPositionInTargetFigure();
    if(emptyPos === false){  //! temp
      this.isSolved = true;
      return false;
    }
    
    let testPiece = this.getNextUnusedPiece(startingIndex);
    let placedPiece;  //true if piece was placed  
    if(this.startingPieces.length-1 < this.pieceOrder.length){  //haven't placed starting piece yet, try to place starting piece before checking equals starting piece
      this.startingPieces.push(testPiece.index);    
      //test place first piece
      placedPiece = this.placePieceAtEmptyPosition(testPiece, emptyPos);   
      if(placedPiece){
        return true;
      }
      
      testPiece = this.getNextUnusedPiece((testPiece.index+1)%this.pieceCollection.getLength());  //mod is technically unnecessary
    }
    
    //run through rest of pieces
    while(!this.checkEqualsStartingPiece(testPiece)){  //tests remaining pieces at emptyPos      
      //place testPiece
      placedPiece = this.placePieceAtEmptyPosition(testPiece, emptyPos);
      if(placedPiece){  //if placed piece, break
        return true;
      }   
      //get next piece
      testPiece = this.getNextUnusedPiece((testPiece.index+1)%this.pieceCollection.getLength());
    }
    //no pieces fit in emptyPos, so remove a piece and call placeNextPiece()
    let pieceIndex = this.removeLastPiece();  //also removes starting piece    
    
    if(pieceIndex !== false){  //if piece was removed
      placedPiece = this.placeNextPiece(pieceIndex); 
      return placedPiece;
    }
    this.foundAllSolutions = true;
    return false;    
  }
  
  checkEqualsStartingPiece(testPiece){  //check if piece to be placed is equal to starting piece    
    let i = this.pieceOrder.length;    
    return this.startingPieces[this.pieceOrder.length] === testPiece.index && testPiece.hasZeroRotation();
  }
  
  placePieceAtEmptyPosition(piece, emptyPos){  //tries to place same piece at position emptyPos, returns true if piece is placed
    //console.log("Testing piece: " + piece.index + ", from rotation: " + piece.rotation + "; Don't return to piece: " + this.startingPieces[this.pieceOrder.length]);
    //if piece came with maxed rotation
    if(piece.isMaxed === true){
      piece.reset();
      return false;
    }
    
    let placedPiece = false;
    //test current rotation before incrementing
    placedPiece = this.placePieceAtEmptyPositionWithRotation(piece, emptyPos);
    
    //runs through each rotation of the piece
    while(placedPiece === false){
      //rotate piece
      if(!piece.incrementRotation()){
        piece.reset();
        return false;  //if rotation was maxed
      } 
      //test piece
      placedPiece = this.placePieceAtEmptyPositionWithRotation(piece, emptyPos);      
    }
    
    return true;    
  }
  placePieceAtEmptyPositionWithRotation(piece, emptyPos){  //returns true if piece can be placed with this rotation
    //console.log("\tTesting: " + piece.toString());
    let testPiece = piece.currentPiece;
    
    //find position of a unit block in testPiece array
    //    Given the way target figure is filled (x, y, then z), 
    //    the unit block to fit in empty Pos must be z=0 in pieceArray.
    //    X and Y values must be minimized   .
    let pym = testPiece[0].length;
    let pxm = testPiece[0][0].length;
    let x;  //x and y pos in testPiece array
    let y;
    
    outerloop:
    for(y =0; y < pym; y++){
      for(x =0; x < pxm; x++){
        if(testPiece[0][y][x]){
          break outerloop;
        }
      }
    }
    
    //calculates new piece position    
    let newX = emptyPos.x -x;
    let newY = emptyPos.y -y;
    if(newX <0 || newY<0){
      return false;  //piece goes out of targetFigure
    }
    let newPiecePosition = new Vector3(newX, newY, emptyPos.z);
    piece.position = newPiecePosition;
    
    return this.placePieceOnTargetFigure(piece);
  }
  
  placePieceOnTargetFigure(piece){  //uses piece's position and rotation  //returns true if placed piece, false if piece didn't fit    
    //set piece dimensions
    let testPiece = piece.currentPiece;    
    let pzm = testPiece.length;
    let pym = testPiece[0].length;
    let pxm = testPiece[0][0].length;
    let piecePos = piece.position;
    
    //check if pieceArray dimensions go out of targetFigure dimensions
    if(piecePos.x + pxm > this.dim.x || piecePos.y + pym > this.dim.y || piecePos.z + pzm > this.dim.z){
      return false;
    }
    
    //checks if piece can be placed on target figure, returning false if there's an intersection
    let posToAdd = [];  //array of Vector3 positions to be set to true on target Figure   
    
    for(let pz = 0; pz < pzm; pz++){  //iterate through piece
      for(let py = 0; py < pym; py++){
        for(let px = 0; px < pxm; px++){
          if(testPiece[pz][py][px]){  //if testPiece has unit there
            if(this.targetFigure[piecePos.z +pz][piecePos.y +py][piecePos.x +px] === true){  //if intersection
              return false;
            } else{
              //mark position to be set to true
              posToAdd.push(new Vector3(piecePos.x +px, piecePos.y +py, piecePos.z +pz));
            }
          }      
        }
      }       
    }    
    
    //actualy place pieces on target figure
    for(let pos of posToAdd){
      this.targetFigure[pos.z][pos.y][pos.x] = true;
    }
    //console.log("\t\tPLACED PIECE: " + piece.toString());  
    //add piece to pieceOrder
    this.pieceOrder.push(piece.index);
    return true;
  }
  removeLastPiece(){
    if(this.pieceOrder.length ===0){
      //can't remove piece
      return false;
    }
    
    let piece = this.pieceCollection.pieces[this.pieceOrder[this.pieceOrder.length -1]];  //get last piece in pieceOrder
    let pArray = piece.currentPiece;
    let piecePos = piece.position;
    
    //remove piece from target figure
    let pzm = pArray.length;
    let pym = pArray[0].length;
    let pxm = pArray[0][0].length;
    for(let pz = 0; pz < pzm; pz++){  //iterate through piece
      for(let py = 0; py < pym; py++){
        for(let px = 0; px < pxm; px++){
          if(pArray[pz][py][px]){  //if piece has something there
              //remove unit
              this.targetFigure[piecePos.z +pz][piecePos.y +py][piecePos.x +px] = false;           
          }      
        }
      }       
    }  
    
    // console.log("\tNo piece fits, removing last piece: " + piece.toString());
    
    //remove a startingPiece if needed 
    if(this.startingPieces.length > this.pieceOrder.length){   
      this.startingPieces.pop();
    } 
    
    //increment rotation
    piece.incrementRotation();
    
    //update pieceOrder
    return this.pieceOrder.pop();
  }
  
  //HELPER METHODS
  getNextUnusedPiece(startingIndex){  //finds unused piece starting from piece index startingIndex
    let total = this.pieceCollection.getLength();   
    let maxI = startingIndex + total;
    for(let i = startingIndex; i < maxI; i++){
      let canUseIndex = true;
      for (let usedPiece of this.pieceOrder) {
         if(usedPiece ===i %total){
           canUseIndex = false;
         }
      }
      if(canUseIndex){
        return this.pieceCollection.pieces[i %total];
      }
    }
  }
  getNextEmptyPositionInTargetFigure(){
      for(let h = 0; h < this.dim.z; h++){
          for(let d = 0; d < this.dim.y; d++){
              for(let w = 0; w < this.dim.x; w++){
                  if(this.targetFigure[h][d][w] === false){
                      return new Vector3(w, d, h);
                  }
              }
          }       
      }
    return false;
  }
  getCurrentSolution(){
    let solution = [];  
    for(let pieceIndex of this.pieceOrder){
      let piece = this.pieceCollection.pieces[pieceIndex];
      solution.push({index: piece.index, rotation: piece.rotation, position: new Vector3(piece.position.x, piece.position.y, piece.position.z)});
        //object for storing piece data
    }
    return solution;
  }
  //SRB DISPLAY METHODS
  setSolutionForDisplay(index){
    this.solutionForDisplay = this.solutions[index];
  }
  displaySolution(){  //displays solutionForDisplay
    for(let piece of this.solutionForDisplay){
      this.displayPiece(piece);
    }
  }
  displayPiece(piece){
    let unit = cubeDisplay.unit;
    let pad = cubeDisplay.padding;

    let pColor = this.pieceCollection.pieces[piece.index].color;
    let pArray = this.pieceCollection.pieces[piece.index].allRotatedPieces[piece.rotation];
    let pos = piece.position;

    let zm = pArray.length;
    let ym = pArray[0].length;
    let xm = pArray[0][0].length;

    //display pieces
    push();
    fill(pColor);

    for(let z = 0; z < zm; z++){  //go through each unit in piece
      for(let y = 0; y < ym; y++){
        for(let x = 0; x < xm; x++){
          if(pArray[z][y][x] === true){
            push();
            //p5 coordinates differ from cuboid coordinates
            translate((pad*pos.x+ x)*unit, (pad*pos.z+ z)* -unit, (pad*pos.y+ y)* -unit);
            box(unit);
            pop();
          }        
        }
      }
    } 

    pop();
  }
}
