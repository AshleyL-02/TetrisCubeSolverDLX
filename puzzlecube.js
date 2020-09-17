/* global PieceRotation, create3dBoolArray, PieceCollection, Vector3, color, colorMode, RGB, HSB, Solver, SolverDLX */

class PuzzleCube { //stores both solvers for a type of cube
  constructor(type){
    //set type and dimensions, displaySolution
    if(type === "TETRIS"){
      this.length = 4;
    } else if(type === "SOMA"){
      this.length = 3;
    } else{
      return false;
    }
    
    //setup solvers
    this.solver = new Solver(type, new Vector3(this.length, this.length, this.length));
    this.solverDLX = new SolverDLX(type, this.length);
  }
}