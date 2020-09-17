/* global PieceRotation, Vector3, color, colorMode, RGB, HSB */

let tetrisPieces = {
  //TETRIS CUBE PIECES
    //blue pieces
    blueLRightIn: [
      [ [ false, false, true, ], [ true, true, true, ], ],
      [ [ false, false, false, ], [ true, false, false, ], ],
      [ [ false, false, false, ], [ true, false, false, ], ],
        ],   
    blueLMidIn: [   //ie protrusion faces inward
      [ [ false, true, false, ], [ true, true, true, ], ],
      [ [ false, false, false, ], [ true, false, false, ], ],
      [ [ false, false, false, ], [ true, false, false, ], ],
        ],
    blueGunRight: [
      [ [ true, true, false, false, ], ],
      [ [ false, true, true, true, ], ],
        ],
    blueZRightOut: [
      [ [ true, true, false, ], [ false, false, false, ], ],
      [ [ false, true, true, ], [ false, false, true, ], ],
        ],

    //red pieces
    redStaffRight: [
      [ [ true, false, ], ],
      [ [ true, false, ], ],
      [ [ true, true, ], ],
      [ [ true, false, ], ],
        ],
    redL: [
      [ [ true, true, true, ], ],
      [ [ true, false, false, ], ],
      [ [ true, false, false, ], ],
        ],
    redLRightOut: [
      [ [ false, true, true, ], [ false, false, true, ], ],
      [ [ true, true, false, ], [ false, false, false, ], ],
      [ [ false, true, false, ], [ false, false, false, ], ],
        ],
    redCubeBottomRightOut: [
      [ [ true, true, ], [ false, true, ], ],
      [ [ true, true, ], [ false, false, ], ],
        ],

    //yellow pieces
    yellowFaucetTop: [
      [ [ false, true, false, ], [ false, false, false, ], ],
      [ [ false, true, false, ], [ true, true, true, ], ],
      [ [ false, false, false, ], [ false, true, false, ], ],
        ], 
    yellowFaucetDotCom: [
      [ [ false, true, false, ], [ false, false, false, ], ],
      [ [ false, true, false, ], [ true, true, true, ], ],
        ],
    yellowLRightIn: [
      [ [ false, true, ], [ true, true, ], ],
      [ [ false, false, ], [ true, false, ], ],
      [ [ false, false, ], [ true, false, ], ],
        ],
    yellowDisjointedZRightIn: [
      [ [ false, true, false, ], [ true, true, false, ], ],
      [ [ false, true, true, ], [ false, false, false, ], ],
        ],
}

let somaPieces = {
  v: [
    [[true, true], [true, false]],
  ],
  
  l: [
    [[true, true, true], [true, false, false]],
  ],
  
  t: [
    [[true, true, true], [false, true, false]],
  ],
  
  z: [
    [[true, true, false], [false, true, true]],
  ],
  
  a: [
    [[true, true], [false, false]],
    [[true, false], [true, false]],
  ],
  
  b: [
    [[true, true], [false, false]],
    [[false, true], [false, true]],
  ],
  
  p: [
    [[true, true], [true, false]],
    [[true, false], [false, false]],
  ],
}

let testPieces = {
  a: [
    [[true, true], [true, false]],
  ],

  b: [
    [[true, true]],
  ],
  c: [
    [[true, false], [true, true]],
  ],
}

class Piece{
  constructor(index, originalPiece, color){
    this.index = index;
    this.originalPiece = originalPiece;
    this.color = color;
    
    //create all rotated piece arrays  //! temp, to prevent solutions with multiple rotations
    if(index !== 1){
      this.allRotatedPieces = PieceRotation.getAllRotatedPieces(this.originalPiece);
    } else{
      this.allRotatedPieces = [originalPiece];
    }
    
    //mutables  
    this.reset();
  }
  reset(){
    this.rotation =0;  //INDEX in rotated pieces array
    this.currentPiece = this.originalPiece;
    this.position = new Vector3();
    
    this.isMaxed = false;  //rotation is maxed
  }
  
  //public methods
  hasZeroRotation(){
    return this.rotation ===0;
  }
  
  incrementRotation(){  //false if can't rotate any more
    if(this.rotation === this.allRotatedPieces.length -1){  //if rotation is maxed
      this.isMaxed = true;
      return false;
    }
    //rotation isn't maxed, so rotate piece
    this.rotation++;   
    this.currentPiece = this.allRotatedPieces[this.rotation];
    return true;
  }
   
  toString(){
    let s = "Piece: " + this.index + " rot: " + this.rotation;
    return s;
  }
}

class PieceCollection{
  constructor(type) {
    if (type === "SOMA") {
        this.construtorForSoma();
    } else if (type === "TETRIS") {
        this.constructorForTetris();
    } else if(type === "TEST"){
      this.constructorForTest();
    }
  }
  
  constructorForTest() {
    this.pieces = [];

    //colorMode(HSB, 255);
    this.pieces[0] = new Piece(0, testPieces.a, color(160, 200, 255));
    this.pieces[1] = new Piece(1, testPieces.b, color(160, 200, 195));
    this.pieces[2] = new Piece(2, testPieces.c, color(160, 210, 135));
    //colorMode(RGB, 255);

    this.length = this.pieces.length;
  }
  
  constructorForTetris(){
    this.pieces = [];
    //colorMode(HSB, 255);    
    this.pieces[0] = new Piece(0, tetrisPieces.blueLRightIn, color(160,200,255));
    this.pieces[1] = new Piece(1, tetrisPieces.blueLMidIn, color(167,230,205));
    this.pieces[2] = new Piece(2, tetrisPieces.blueGunRight, color(173,245,185));
    this.pieces[3] = new Piece(3, tetrisPieces.blueZRightOut, color(180,255,150));

    this.pieces[4] = new Piece(4, tetrisPieces.redStaffRight, color(255,225,255));
    this.pieces[5] = new Piece(5, tetrisPieces.redL, color(250, 255, 205));
    this.pieces[6] = new Piece(6, tetrisPieces.redLRightOut, color(245,255,155));
    this.pieces[7] = new Piece(7, tetrisPieces.redCubeBottomRightOut, color(240,250,100));

    this.pieces[8] = new Piece(8, tetrisPieces.yellowFaucetTop, color(34,225,255));
    this.pieces[9] = new Piece(9, tetrisPieces.yellowFaucetDotCom, color(32,240,220));
    this.pieces[10] = new Piece(10, tetrisPieces.yellowLRightIn, color(30,255,195));
    this.pieces[11] = new Piece(11, tetrisPieces.yellowDisjointedZRightIn, color(28,225,160));
    //colorMode(RGB, 255);
    
    this.length = this.pieces.length;
  }
  construtorForSoma(){
    this.pieces = [];
    //colorMode(HSB, 255);    
    this.pieces[0] = new Piece(0, somaPieces.v, color(240,150,250));
    this.pieces[1] = new Piece(1, somaPieces.l, color(50,150,250));
    this.pieces[2] = new Piece(2, somaPieces.t, color(70,150,250));
    this.pieces[3] = new Piece(3, somaPieces.z, color(110,150,250));
    this.pieces[4] = new Piece(4, somaPieces.a, color(140,150,250));
    this.pieces[5] = new Piece(5, somaPieces.b, color(160,150,250));
    this.pieces[6] = new Piece(6, somaPieces.p, color(180,150,250));
    //colorMode(RGB, 255);
    
    this.length = this.pieces.length;
  }
  /*
  reset(){
    let len = this.getLength();
    for(let i =0; i<len; i++){
      this.pieces[i].reset();
    }
  }
  */
  getLength(){
    return this.length;
  }
}