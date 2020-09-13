/* global SolverDLX, ConstraintMatrix, Solver, Vector3, box, translate, push, pop, camera, orbitControl, debugMode, WEBGL, frameRate, createCanvas, strokeWeight, background, stroke, strokeFill, key, noFill, fill */

// CONTROLS: 'r' to reset camera view, mouse l/r buttons to change view

// Non-dlx times:
  // Tetris cube: Takes ~20 seconds, on average, to find a solution
  // Soma cube: takes ~0.376 milliseconds, on average, to find a solution

// DLX times: 
  // Tetris cube: Takes ~38 seconds, on average, to find a solution
  //Soma cube: takes ~0.087 milliseconds, on average, to find solution; ~20 ms to create dancing links matrix


// Count solutions for soma cube: 460 when piece index 1 is rotationally locked

// optimization: 
  // TODO: check if there are secluded spaces less than the size of the minimum block each time piece is placed
  // fix 460 count for non-dlx solver

// COORDINATE SYSTEM: note p5 coordinates differ from these "cuboid coordinates"
  // cuboid coordinates: (x, y, z) = width, depth, height = Vector3 (x, y, z)
    // values run from 0-n
    // array[z][y][x] is how a unit at position (x, y, z) is accessed from a 3d bool array

let cubeDisplay = {
  unit: 20,  //size of one unit cube
  padding: 1.1,  //padding is >1
  dimensions: undefined,  //dimensions of bounding cube, in "pixels", in p5 coordinates (may be negative)
  center: undefined, //center of bounding box
  
  setBoundingCubeDimensions: function(dim){
    let unit = this.unit;
    let pad = this.padding;
    this.dimensions = new Vector3((pad*dim.x)*unit, (pad*dim.z)* -unit, (pad*dim.y)* -unit);
    this.center = new Vector3((this.dimensions.x -unit *pad)/2 , (this.dimensions.y +unit*pad)/2, (this.dimensions.z +unit*pad)/2);
  }, 
}

let mySolver;
let startTime;

//dlx code
let mySolverDLX;

function setup() {
  // Canvas & color settings
  createCanvas(800, 800, WEBGL);  
  debugMode();  
  frameRate(60);
  
  strokeWeight(0.5);
  
  //setup cubeDisplay dimensions and then camera
  cubeDisplay.setBoundingCubeDimensions(new Vector3(3, 3, 3));  //! remember to change
  resetCamera(); 
  
  //run code
  startTime = new Date();
  
  //dlx code
  
  let count = 80;
  for(let i =0; i<count; i++){
    mySolverDLX = new SolverDLX("SOMA");
  }
  console.log((new Date() - startTime)/(480*count) + " milliseconds per solution" );
  
  //mySolverDLX = new SolverDLX("TETRIS");
  //console.log((new Date() - startTime)/(20) + " milliseconds per solution" );
  /*
  let count = 150;
  for(let i =0; i<count; i++){
    mySolver = new Solver(new Vector3(3, 3, 3), "SOMA");
    mySolver.findAllSolutions();
  }
  console.log((new Date() - startTime)/(460*count) + " milliseconds per solution" );
  */
  
  //alert(new Date() - startTime + "milliseconds")
}

function draw() {  
  background(204);
  orbitControl();
  displayCubeDebug();
  
  
  //displaySolutionDLX();
  //displayEachSolution();
  
  //displayPieceOrder(mySolverDLX.pieceOrder, mySolverDLX.pieceCollection);
  displayPieceOrder(mySolver.pieceOrder, mySolver.pieceCollection);
}

function keyTyped(){
  if(key === 'r' || key === 'R'){
    resetCamera();
  }
  
}

//DLX DISPLAY METHODS
function displaySolutionDLX(){
  for(let piece of mySolverDLX.pieceSolution){
    displayPieceDLX(piece);
  }
}
function displayPieceDLX(piece){
  let unit = cubeDisplay.unit;
  let pad = cubeDisplay.padding;
  
  //display pieces
  push();
  fill(piece.color);
  
  for(let position of piece.positions){
    push();
    //p5 coordinates differ from cuboid coordinates
    translate((pad*position.x)*unit, (pad*position.z)* -unit, (pad*position.y)* -unit);
    box(unit);
    pop();
  }
  
  pop();
}


//METHODS
// function displayEachSolution(){
//   if(mySolver.foundAllSolutions === false){
//     mySolver.findNextSolution();
//     mySolver.solutionCount++;   
//     mySolver.saveCurrentSolution();
//     avgTimePerSolution =Math.floor(new Date() - startTime)/mySolver.solutionCount;
//     console.log("Avg. time per solution: " + avgTimePerSolution + " ms.");
//   }  else if(timeElapsed === undefined){
//     timeElapsed = Math.floor(new Date() - startTime);
//     avgTimePerSolution = timeElapsed/mySolver.solutionCount;
//     alert("All solutions found. Elapsed: " + timeElapsed + " ms. Avg. time per solution: " + avgTimePerSolution + " ms.");
//   }
// }
// function displaySolving(){
//   for(let i=0; i<8000; i++){
//     if(mySolver.isSolved === false){
//       mySolver.placeNextPiece();   
//     } else if(timeElapsed === undefined){
//       timeElapsed = Math.floor(new Date() - startTime);
//       alert("Elapsed: " + timeElapsed + " ms.");
//     }else{
//       break;
//     }
//   }
    
// }
function resetCamera(){
  let cen = cubeDisplay.center;
  camera(cen.x, cen.y, 200, cen.x, cen.y, cen.z, 0, 1, 0);
}
function displayCubeDebug(){
  push();
  //display origin
  fill('RED');
  box(1);
  
  //display bounding cube
  noFill();
  stroke('WHITE');
  
  let dim = cubeDisplay.dimensions;
  let cen = cubeDisplay.center;

  translate(cen.x, cen.y, cen.z);
  box(dim.x, dim.y, dim.z);
  
  pop();
}

//DISPLAY METHODS
function displayPieceOrder(pieceOrder, pieceCollection){  
  let length = pieceOrder.length;
  for(let i =0; i < length; i++){
    let pieceIndex = pieceOrder[i];
    displayPiece(pieceCollection.pieces[pieceIndex]);
  }
}

function displayTargetFigure(){  //for debug
  let dim = mySolver.dim;
  let tf = mySolver.targetFigure;
  
  let unit = cubeDisplay.unit;
  let pad = cubeDisplay.padding;  
  
  push();
  fill('WHITE'); 
  for(let z = 0; z < dim.z; z++){
    for(let y = 0; y < dim.y; y++){
      for(let x = 0; x < dim.x; x++){
        if(tf[z][y][x] === true){
          push();
          //p5 coordinates differ from cuboid coordinates
          translate((pad*x)*unit, (pad*z)* -unit, (pad*y)* -unit);
          box(unit -5);
          pop();
        }        
      }
    }
  }   
  pop();
}

function displayPiece(piece){
  let unit = cubeDisplay.unit;
  let pad = cubeDisplay.padding;
  
  let pArray = piece.currentPiece;
  let pos = piece.position;
  
  let zm = pArray.length;
  let ym = pArray[0].length;
  let xm = pArray[0][0].length;
  
  //display pieces
  push();
  fill(piece.color);
  
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
