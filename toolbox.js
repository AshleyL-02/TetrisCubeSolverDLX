class Vector3{
  constructor(x =0, y =0, z =0){
    this.x = x;
    this.y = y;
    this.z = z;
  }
}

function create3dBoolArray(dim){  //parameter: dimensions, all values are false
  let w = dim.x;
  let d = dim.y;
  let h = dim.z;
  let array = [];
  
  for(let z = 0; z < h; z++){
    array[z] = [];
    for(let y = 0; y < d; y++){
      array[z][y] = [];
      for(let x = 0; x < w; x++){
        array[z][y][x] = false;
      }
    }
  } 
  
  return array;  
}