/* global Vector3, create3dBoolArray */

// piece 1 can't rotate -> solutions won't have rotational symmetry
    //piece 1 should have maximum possible rotations compared to other pieces

// there's width, depth, and height axis, or w,d,h (new axes); correspond to x, y, z

let FACES = 6;
let ROTATIONS = 4;

class PieceRotation{
  constructor(){
    this.face = 0;
    this.rotation = 0;
  }
  
  //STATIC METHODS
  static getAllRotatedPieces(originalPiece){  //returns 2d array containing all rotated piece arrays
    let rotatedPieces = [];
    
    //iterate through all rotations
    for(let f =0; f<FACES; f++){
      for(let r =0; r < ROTATIONS; r++){
        let piece = PieceRotation.getRotatedPiece(originalPiece, {face: f, rotation: r});
        if(!this.checkPieceMatch(piece, rotatedPieces)){  //if piece isn't a repeat
          rotatedPieces.push(piece);
        }        
      }
    }
    
    return rotatedPieces;
  }
  static checkPieceMatch(piece, arrayOfPieces){ //returns true if there's a match with piece
    if(arrayOfPieces.length === 0){
      return false;
    }
    
    //get dimensions of piece
    let pzm = piece.length;
    let pym = piece[0].length;
    let pxm = piece[0][0].length;
    for(let rp of arrayOfPieces){  //iterate through other pieces      
      let zm = rp.length;
      let ym = rp[0].length;
      let xm = rp[0][0].length;
      
      //check if dimensions match
      if(pzm === zm && pym === ym && pxm === xm){
        let piecesMatch = true;
        for(let z = 0; z < pzm; z++){  //iterate through piece
          for(let y = 0; y < pym; y++){
            for(let x = 0; x < pxm; x++){
              if(piece[z][y][x] !== rp[z][y][x]){  //if piece units don't match
               piecesMatch = false;
              }
            }
          }
        } //piece iteration loop end
        if(piecesMatch){
          return true;
        }
      } //pieces don't match, check next piece in for loop  
    } //none of pieces match
    
    return false;
  }
  static getRotatedPiece(originalPiece, pieceRotation){ // parameters: 3d bool array, pieceRotation
    let axisMatchup = AxisMatchup.getNewAxisMatchup(pieceRotation.face, pieceRotation.rotation);
    let dimensions = new Vector3(originalPiece[0][0].length, originalPiece[0].length, originalPiece.length);

    //setup new piece array
    let newPieceDimensions = axisMatchup.getNewDimensions(dimensions);
    let newPiece = create3dBoolArray(newPieceDimensions);

    //iterating through original piece to set newPiece values
    let zm = dimensions.z;
    let ym = dimensions.y;
    let xm = dimensions.x;
    for(let z = 0; z < zm; z++){
      for(let y = 0; y < ym; y++){
        for(let x = 0; x < xm; x++){
          if(originalPiece[z][y][x] === true){
            let newCoor = axisMatchup.getNewCoordinates(new Vector3(x, y, z), dimensions);
            //console.log(newCoor);
            newPiece[newCoor.z][newCoor.y][newCoor.x] = true;
          }        
        }
      }
    } 
    //returns 3d array  
    return newPiece;
  }
}

// AXIS STUFF
let Axis = {
  w: 1,  //must start at 1; axis uses negative values and -0 = 0
  d: 2,
  h: 3,
}

class AxisMatchup {  //for rotating pieceArrays
  constructor(){
    //this.w is the new w, which is set to one of the three original axes
    this.w = Axis.w;  // new axis = some old axis
    this.d = Axis.d;
    this.h = Axis.h;
  }
  
  //METHODS
  getNewCoordinates(originalCoor, dimensions){  //original coordinates, xyz; dimensions of piece box
    let vw = this.getNewCoordinateValue(originalCoor, this.w, dimensions);  //value for the w axis
    let vd = this.getNewCoordinateValue(originalCoor, this.d, dimensions); 
    let vh = this.getNewCoordinateValue(originalCoor, this.h, dimensions);
    
    //returns new coordinates based on axis matchup
    return new Vector3(vw, vd, vh);
  }
  getNewDimensions(oldDimensions){
    let vw = this.getNewDimensionValue(this.w, oldDimensions);  //value for the w axis
    let vd = this.getNewDimensionValue(this.d, oldDimensions);
    let vh = this.getNewDimensionValue(this.h, oldDimensions);
    
    //returns new coordinates based on axis matchup
    return new Vector3(vw, vd, vh);
  }
  
  //private
  getNewCoordinateValue(coordinates, axisType, dimensions){  //gets a coordinate value from -coordinates- based on axisType
    if(Axis.w === Math.abs(axisType)){
      if(axisType<0){
        return (-coordinates.x + dimensions.x-1);
      }
      return coordinates.x;
    } else if(Axis.d === Math.abs(axisType)){
      if(axisType<0){
        return (-coordinates.y + dimensions.y-1);
      }
      return coordinates.y;
    }else if(Axis.h === Math.abs(axisType)){
      if(axisType<0){
        return (-coordinates.z + dimensions.z-1)
      }
      return coordinates.z;
    }
    console.log("ERROR: Invalid axisType inputted: " + axisType);
  }
  getNewDimensionValue(axisType, oldDimensions){  //gets a coordinate value from -coordinates- based on axisType
    if(Axis.w === Math.abs(axisType)){
      return oldDimensions.x;
    } else if(Axis.d === Math.abs(axisType)){
      return oldDimensions.y;
    }else if(Axis.h === Math.abs(axisType)){
      return oldDimensions.z;
    }
    console.log("ERROR: Invalid axisType inputted: " + axisType);
  }
  
  //STATIC METHODS
  static getNewAxisMatchup(targetFace, targetRotation){
    let axisMatchup = new AxisMatchup();

    axisMatchup = AxisMatchup.getAxisMatchupFace(axisMatchup, targetFace);
    axisMatchup = AxisMatchup.getAxisMatchupRotation(axisMatchup, targetRotation);
    return axisMatchup;
  }
  
  //private static methods
  static getAxisMatchupFace(axisMatchup, targetFace){  //6 total faces
    let newAxisMatchup = new AxisMatchup();

    switch(targetFace) {
      case 0:
        //use original axis
        return axisMatchup;
        break;
      case 1:
        newAxisMatchup.w = axisMatchup.d;
        newAxisMatchup.d = -axisMatchup.w;
        newAxisMatchup.h = axisMatchup.h;
        break;
      case 2:
        newAxisMatchup.w = -axisMatchup.w;
        newAxisMatchup.d = -axisMatchup.d;
        newAxisMatchup.h = axisMatchup.h;
        break;
      case 3:
        newAxisMatchup.w = -axisMatchup.d;
        newAxisMatchup.d = axisMatchup.w;
        newAxisMatchup.h = axisMatchup.h;
        break;
      case 4:
        newAxisMatchup.w = axisMatchup.w;
        newAxisMatchup.d = -axisMatchup.h;
        newAxisMatchup.h = axisMatchup.d;
        break;
      case 5:
        newAxisMatchup.w = axisMatchup.w;
        newAxisMatchup.d = axisMatchup.h;
        newAxisMatchup.h = -axisMatchup.d;
        break;
      default:
        console.log("Invalid face rotation entered: " + targetFace);
    }  
    return newAxisMatchup;
  }

  static getAxisMatchupRotation(axisMatchup, targetRotation){  //4 ways to rotate a face
    let newAxisMatchup = new AxisMatchup();
    newAxisMatchup.d = axisMatchup.d;

    switch(targetRotation) {
      case 0:
        //use original axis
        return axisMatchup;
        break;
      case 1:
        newAxisMatchup.w = axisMatchup.h;
        newAxisMatchup.h = -axisMatchup.w;
        break;
      case 2:
        newAxisMatchup.w = -axisMatchup.w;
        newAxisMatchup.h = -axisMatchup.h;
        break;
      case 3:
        newAxisMatchup.w = -axisMatchup.h;
        newAxisMatchup.h = axisMatchup.w;
        break;
      default:
        console.log("Invalid sub-rotation entered: " + targetRotation);
    }

    return newAxisMatchup;
  }
}