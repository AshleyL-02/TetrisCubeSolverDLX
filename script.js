/* global HSB, createButton, createSelect, createDiv, createRadio, colorMode, PuzzleCube, SolverDLX, 
  ConstraintMatrix, Solver, Vector3, box, translate, push, pop, camera, orbitControl, debugMode, WEBGL, frameRate, 
  createCanvas, strokeWeight, background, stroke, strokeFill, key, noFill, fill */

// * Note that the simple recursive backtracking algorithm fails to find all solutions (e.g. 460/480 for soma). Fix later?

// To avoid rotational symmetry of solutions, piece 1 can't rotate for tetris and soma cubes

// SRB times:
  // Tetris cube: Takes ~20 seconds, on average, to find a solution
  // Soma cube: takes ~0.376 milliseconds, on average, to find a solution

// DLX times: (roughly 10x faster than non-dlx)
  // Tetris cube: Takes ~90 milliseconds, on average, to find a solution
  // Soma cube: takes ~0.087 milliseconds, on average, to find solution

// COORDINATE SYSTEM: note p5 coordinates differ from these "cuboid coordinates"
  // cuboid coordinates: (x, y, z) = width, depth, height = Vector3 (x, y, z)
    // values run from 0-n
    // array[z][y][x] is how a unit at position (x, y, z) is accessed from a 3d bool array

// P5 METHODS
function setup() {
  // Canvas & color settings
  createCanvas(600, 400, WEBGL);  
  debugMode();  
  frameRate(60);  
  strokeWeight(0.5);
  colorMode(HSB, 255);
  
  //ui
  userInterface.setup();
}

function draw() {  
  background(204);
  orbitControl();
  cubeDisplay.displayCubeDebug();
  
  userInterface.updateDisplay();  
}

function keyTyped(){
  if(key === 'r' || key === 'R'){
    cubeDisplay.resetCamera();
  }
}

// DISPLAY OBJECTS
let userInterface = { //handles everything based on user options, using state machine
  setup: function(){ //creates and displays all cube options
    //cube type
    createDiv("Cube type:");
    this.cubeRadio = createRadio();
    this.cubeRadio.option("Soma");
    this.cubeRadio.option("Tetris");
    this.cubeRadio.selected("Soma");
    this.cubeRadio.changed(this.updateSolver);

     //algorithm
    createDiv("Algorithm type:");
    this.algorithmRadio = createRadio();
    this.algorithmRadio.option("Simple Recursive Backtracking", "srb");
    this.algorithmRadio.option("Algorithm X and Dancing Links", "dlx");
    this.algorithmRadio.selected("srb");
    this.algorithmRadio.changed(this.updateSolver);

    //solution
    createDiv("Find solution:");
    this.findNextButton = createButton("Find Next");
    this.findNextButton.mouseClicked(this.findNextSolution);
    //this.findNextButton = createButton("Find Next (w/ Display)"); //TODO
    this.findAllButton = createButton("Find All");
    this.findAllButton.mouseClicked(this.findAllSolutions);
    
    //select solution
    createDiv("Display solution by index:");
    this.somaSelect = {srb: this.createSolutionSelect(), dlx: this.createSolutionSelect(),};
    this.tetrisSelect = {srb: this.createSolutionSelect(), dlx: this.createSolutionSelect(),};
    
    //directions
    createDiv("<br/><strong>Directions:</strong>"
              +"<br/>- Select desired cube type and algorithm.<br/>- Press 'Find Next' or 'Find All' to find solution(s)."
              +"<br/>- Drag mouse L/R to change view. Press 'R' to reset view."
              +"<br/>*Tetris Cube may take a few seconds to find a SRB solution.");
    
    //set table variables
    this.solutionRow = document.getElementById("rSol");
    this.averageRow = document.getElementById("rAvg");
    this.tableIndex; //index for row cell
    
    //create puzzle cubes
    this.tetrisCube = new PuzzleCube("TETRIS");
    this.somaCube = new PuzzleCube("SOMA");
    
    //mutables
    this.currentSolver = this.somaCube.solver;
    this.currentSolutionSelect = this.somaSelect.srb;
        
    //update
    this.updateSolver();
  },
  createSolutionSelect: function(){ //called by constructor; returns select
    let select = createSelect();
    select.changed(userInterface.updateCurrentSolution);
    select.hide();
    select.length =0;
    return select;
  },
  
  //callback functions (avoid "this.")
  updateSolver: function(){ // updates based on cube and algorithm radios
    let puzzleCube;  
    let selectCube;
    let prevSelect = userInterface.currentSolutionSelect;
    let currSelect;
    
    //initially show buttons
    userInterface.findNextButton.show();
    userInterface.findAllButton.show();
    
    //get puzzleCube and select type from radio, update findAll button
    if(userInterface.cubeRadio.value() === "Soma"){
      puzzleCube = userInterface.somaCube;
      selectCube = userInterface.somaSelect;
      userInterface.tableIndex = 0;
    } else{ //tetris
      puzzleCube = userInterface.tetrisCube;
      selectCube = userInterface.tetrisSelect;
      userInterface.tableIndex = 1;
      
     userInterface.findAllButton.hide();
    }
    
    //update current solver and current select
    if(userInterface.algorithmRadio.value() === "srb"){
      userInterface.currentSolver = puzzleCube.solver;
      currSelect = selectCube.srb;
      userInterface.tableIndex +=1; //just some math to get the right index
    } else{ //tetris
      userInterface.currentSolver = puzzleCube.solverDLX;
      currSelect = selectCube.dlx;
      userInterface.tableIndex +=3;
    }
    //setup buttons
    if(userInterface.currentSolver.foundAllSolutions){
      userInterface.findNextButton.hide();
      userInterface.findAllButton.hide();
    }
    //setup current select
    prevSelect.hide();
    currSelect.show();
    userInterface.currentSolutionSelect = currSelect;
    
    //set cubeDisplay
    cubeDisplay.setBoundingCubeDimensions(puzzleCube.length);
    
    //update solution display
    userInterface.updateCurrentSolution();  
  },
  updateTable: function(){
    let totalSolutions = userInterface.currentSolver.solutions.length;
    userInterface.solutionRow.cells[userInterface.tableIndex].innerHTML = totalSolutions;
    userInterface.averageRow.cells[userInterface.tableIndex].innerHTML = (userInterface.currentSolver.timeElapsed/totalSolutions).toPrecision(3);
  },
  findNextSolution: function(){
    //update solution select with new option
    if(userInterface.currentSolver.findNextSolution()){ //if a solution was found
      //add solution to select
      let index = userInterface.currentSolver.solutions.length -1;
      userInterface.addIndexToSolutionSelect(index);
      
      //select last solution and display it
      userInterface.currentSolutionSelect.selected("" +  index);
      userInterface.updateCurrentSolution();
      
      //update table time
      userInterface.updateTable();
    } else{
      //all solutions were found, remove find next and find all buttons //TODO
      userInterface.findNextButton.hide();
      userInterface.findAllButton.hide(); 
    }
  },
  findAllSolutions: function(){
    //if there were solutions to find
    if(userInterface.currentSolver.findAllSolutions()){
      //add solutions to select
      let totalSolutions = userInterface.currentSolver.solutions.length;
      userInterface.addIndicesToSolutionSelect(totalSolutions);

      //select last solution and display it
      if(totalSolutions >=1){
        userInterface.currentSolutionSelect.selected("" +  totalSolutions-1);
        userInterface.updateCurrentSolution();
      }
      
      //update table time
      userInterface.updateTable();
      
      //remove find all button
      userInterface.findNextButton.hide();
      userInterface.findAllButton.hide();
    }
  },
  
  updateCurrentSolution(){ //sets userInterface.updateDisplay to desired display function
    let index = userInterface.currentSolutionSelect.value();
    if(index !== ""){
      index = parseInt(index, 10);
      //get solution at index and display it
      userInterface.currentSolver.setSolutionForDisplay(index);
    } 
  },
  updateDisplay(){ //called every frame
    this.currentSolver.displaySolution();
  },
  
  //Solution Select updating methods
  addIndicesToSolutionSelect(maxIndex){ //adds indices until before maxIndex
    for(let i =userInterface.currentSolutionSelect.length; i<maxIndex; i++){
      userInterface.addIndexToSolutionSelect(i);
    }
  },
  addIndexToSolutionSelect(index){
    userInterface.currentSolutionSelect.option("" + index);
    userInterface.currentSolutionSelect.length++;
  },
}



let cubeDisplay = {
  zoom: 120, //lower = closer
  unit: 20,  //size of one unit cube
  padding: 1.15,  //padding is >1
  dimensions: undefined,  //dimensions of bounding cube, in "pixels", in p5 coordinates (may be negative)
  center: undefined, //center of bounding box
  
  setBoundingCubeDimensions: function(cubeLength){
    let unit = this.unit;
    let pad = this.padding;
    this.dimensions = new Vector3((pad*cubeLength)*unit, (pad*cubeLength)* -unit, (pad*cubeLength)* -unit);
    this.center = new Vector3((this.dimensions.x -unit *pad)/2 , (this.dimensions.y +unit*pad)/2, (this.dimensions.z +unit*pad)/2);
    
    this.resetCamera();
  }, 
  
  // general display
  displayCubeDebug: function(){ //called every frame
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
  },
  
  // camera
  resetCamera: function(){
    let cen = cubeDisplay.center;
    camera(cen.x, cen.y, cubeDisplay.zoom, cen.x, cen.y, cen.z, 0, 1, 0);
  },
}
