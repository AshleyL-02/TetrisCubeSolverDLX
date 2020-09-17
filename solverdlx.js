/* global cubeDisplay, push, pop, fill, translate, box, PieceRotation, create3dBoolArray, PieceCollection, Vector3 */

/*
  Constraint matrix definitions:
  - Each column in the matrix is a position in the target cube, labeled height, depth, width (hdw); or a piece labeled p(n)
      - e.g. position labels: "000", "001", "002", "003", "010", ... "332", "333"
      - e.g. piece labels: "p0", "p1" ...
  - Each row in the matrix is a piece with a certain rotation and position in the cube
*/

/*
> Algorithm X and dancing links: based on Donald Knuth's article on dancing links and dlx
    - To solve constraint matrix:
        If no columns, save solution and return false (matrix is solved)   
        Choose a column with the least nodes
          If the column has zero nodes return false (matrix can't be solved)
        For each node n in the chosen column
          Include node n in the partial solution
          For each node p in the row of node n
            - Remove column of the node
            - Remove all rows containing nodes in the same column as node p
          Solve remaining constraint matrix (call solveMatrix)
          Remove n from partial solution
          Reinsert the removed rows and columns in reverse order to removal
          Loop down to next node n
        Column can't be solved therefore current matrix can't be solved, return false
*/

class SolverDLX{
  constructor(type, cubeLength){
    this.constraintMatrix = new ConstraintMatrix(type, cubeLength);
    //set up mutables
    this.solution = [];  //array of nodes
        
    this.solutions = []; //array of pieceSolutions
    this.foundAllSolutions = false;
    this.timeElapsed =0; //time taken to find solutions
    
    this.pieceSolutionForDisplay = []; //solution currently being displayed
    
    this.findAll; //true if all solutions should be found
    this.solutionGenerator = this.solveMatrix();
  }
  findAllSolutions(){ //returns true if there were solutions to find
    if(this.foundAllSolutions === false){
      let startTime = new Date();
      
      this.findAll = true;
      this.solutionGenerator.next();
      this.foundAllSolutions = true;
      
      this.timeElapsed += new Date() - startTime;
      return true;
    }
    return false;
  }
  findNextSolution(){ //returns true if solution was found
    if(this.foundAllSolutions === false){
      let startTime = new Date();

      this.findAll = false;
      this.foundAllSolutions = this.solutionGenerator.next().done;
      if(this.foundAllSolutions){
        return false; //if generator returned true, that means solution wasn't found (ran out of solutions)
      }
      
      this.timeElapsed += new Date() - startTime;
      return true;
    }  
    return false;
  }
  *solveMatrix(){  //solves dancing links matrix for exact cover; finds all solutions
    let head = this.constraintMatrix.head;
    //if no columns, terminate successfully
    if(head === head.right){ //solution found
      //count solutions
      this.solutions.push(this.convertCurrentSolutionToPieceSolution());
      
      if(this.findAll === false){
        yield; //yield until more solutions are needed
      } 
      return false;
    }
    
    //choose the target column with min size
    let testColumn = head.right.right; // temp variable, make a closure?
    let targetColumn = head.right;
    while(testColumn !== head){
      if(testColumn.size < targetColumn.size){
        targetColumn = testColumn;
      }
      
      testColumn = testColumn.right;
    } //TODO: check if size is 0, return false   
     
    if(targetColumn.size === 0){    
      return false;
    }
    
    //test rows with a value in the chosen column
    let targetNode = targetColumn.down;     //node in solution row
    while(targetNode !== targetColumn){
      // add row to the partial solution
      this.solution.push(targetNode);   
      
      //REMOVE NODES: remove rows with nodes in the columns of the targetNode row
      let posNode = targetNode;
      do{  //for each column in targetNode row
        let columnToRemove = posNode.column;
        
        // remove column header because it's solved
        this.removeColumn(columnToRemove);
        
        // remove all rows nodes of nodes in the column, except the node itself (markerNode)
        let markerNode = columnToRemove.down;
        while(markerNode.value ===1){
          this.removeRow(markerNode);
          markerNode = markerNode.down;
        }      

        posNode = posNode.right;
      }while(posNode !== targetNode);
      //DONE REMOVING NODES

      // matrix has been fully updated so call solveMatrix again
      yield* this.solveMatrix();
      
      // matrix wasn't solved with this partial solution:
      // remove node from partial solution
      this.solution.pop();
      
      //REINSERT NODES (reverse the node removal)
      posNode = targetNode.left;
      let noReturn = targetNode.left;
      do{  //for each column in targetNode row
        let columnToReinsert = posNode.column;
         
        // reinsert all rows nodes of nodes in the column, except the node itself (markerNode)
        let markerNode = columnToReinsert.up;
        while(markerNode.value ===1){
          this.reinsertRow(markerNode);
          markerNode = markerNode.up;
        }   
        
        // reinsert column
        this.reinsertColumn(columnToReinsert);

        posNode = posNode.left;
      }while(posNode !== noReturn);    
      //DONE REINSERTING NODES
      
      //continue to next row in for loop        
      targetNode = targetNode.down;
    }
    
    // column can't be solved therefore current matrix can't be solved, terminate unsuccessfully (return false)
    return false;  
  }
  
   //private constructor methods
  removeRow(markerNode){ //removes references to every node in the row of markerNode, except markerNode
    let currNode = markerNode.right;
    while(currNode !== markerNode){
      currNode.up.down = currNode.down;
      currNode.down.up = currNode.up;
      
      currNode.column.size--;
      
      currNode = currNode.right;
    }
  }
  reinsertRow(markerNode){  //reverses removeRow
    let currNode = markerNode.left;
    while(currNode !== markerNode){
      currNode.down.up = currNode;
      currNode.up.down = currNode;
      
      currNode.column.size++;
      
      currNode = currNode.left;
    }
  }
  removeColumn(node){  //removes node while preserving up and down  
    //remove references to col node
    node.left.right = node.right;
    node.right.left = node.left;
    
  }
  reinsertColumn(node){  //reverses removeColumn
    node.right.left = node;
    node.left.right = node;  
  }
  // printing methods
  printMatrix(){
    console.log("Matrix:\n" + this.constraintMatrix.toString() + "\n");
  }
  printSolution(){  //TODO: update
    let string = "Current solution:\n";
    for(let rowNode of this.solution){
      let node = rowNode;
      do{
        string += node.column.value +", ";
        
        node = node.right;
      }while(node !==  rowNode);
      string += "\n";
    }
    console.log(string);
  }
  
  //DISPLAY METHODS
  convertCurrentSolutionToPieceSolution(){ //returns pieceSolution
    let pieceSolution = []; //array of objects with color and positions property; index corresponds to pieceIndex; 
    let pieces = this.constraintMatrix.pieceCollection.pieces;
    
    for(let rowNode of this.solution){ //for each node in solution
      //find node in piece column; find pieceIndex
      let pieceNode = rowNode.left;
      while(pieceNode.column.value.charAt(0) !== "p"){
        pieceNode = pieceNode.left;
      }     
      let pieceIndex = parseInt(pieceNode.column.value.substring(1), 10);
      
      //create piece
      let piece = {};
      piece.color = pieces[pieceIndex].color;
      
      //set piece positions
      let positions = []; //array of vector3
      let node = pieceNode.right;
      while(node !== pieceNode){
        let pos = node.column.value.split('');
        positions.push(new Vector3(parseInt(pos[2], 10), parseInt(pos[1], 10), parseInt(pos[0], 10)));
        
        node = node.right;
      }
      
      piece.positions = positions;
      //add piece to pieceSolution
      pieceSolution[pieceIndex] = piece;
    }
    return pieceSolution;
  }
  setSolutionForDisplay(index){
    this.pieceSolutionForDisplay = this.solutions[index];
  }
  displaySolution(){ //called every frame (if solver is selected)
    for(let piece of this.pieceSolutionForDisplay){
      this.displayPiece(piece);
    }
  }
  displayPiece(piece){
    let unit = cubeDisplay.unit;
    let pad = cubeDisplay.padding;
    
    let p = piece.positions[0];
    let dx = p.x *(pad -1);
    let dy = p.y *(pad -1);
    let dz = p.z *(pad -1);
    

    //display pieces
    push();
    fill(piece.color);

    for(let position of piece.positions){
      push();
      //p5 coordinates differ from cuboid coordinates
      translate((dx +position.x)*unit, (dz +position.z)* -unit, (dy +position.y)* -unit);
      box(unit);
      pop();
    }

    pop();
  }
}


class ConstraintMatrix{  //implements dancing links (quadruple linked list) to represent sparse matrix
  constructor(type, cubeLength){ 
    //setup pieces and cubeLength
    this.pieceCollection = new PieceCollection(type);
    this.cubeLength = cubeLength;
    
    let totalPieces = this.pieceCollection.getLength();
    
    //matrix head
    this.head = new Node("h");
    this.head.left = this.head;
    this.head.right = this.head;
    
    //add column nodes
    let columnLabels = this.getColumnLabels(this.cubeLength, totalPieces);
    let leftNode = this.head;  //node to left of current col node
    for(let columnLabel of columnLabels){
      let node = new Node(columnLabel);
      node.up = node;  //necessary bc of how insertNode works
      node.down = node;
      this.insertNode(node, node, leftNode);
      
      node.size = 0;
      
      leftNode = node;   
    } 
   
    //add row nodes, going top-down
    let pieces = this.pieceCollection.pieces;
    
    for(let piece of pieces){
      let rotatedPieces = piece.allRotatedPieces;
      
      for(let pieceArray of rotatedPieces){
        let maxZPos = this.cubeLength -pieceArray.length;  //max z position piece can have, inclusive
        let maxYPos = this.cubeLength -pieceArray[0].length;
        let maxXPos = this.cubeLength -pieceArray[0][0].length;
        
        for(let z = 0; z <= maxZPos; z++){  //iterate through all possible positions; must be <=
          for(let y = 0; y <= maxYPos; y++){
            for(let x = 0; x <= maxXPos; x++){
              //create first row node in piece index column
              let colNode = this.getPieceColumn(this.getPieceColumnLabel(piece.index));
              let node = new Node(1);
              node.left = node; //necessary bc of how insertNode works
              node.right = node;
              this.insertNode(node, colNode.up, node);  //colNode.up to get last node in column, so rows fill from top down
              
              node.column = colNode;
              node.column.size++;
              
              //add each nodes in piece to row
              this.insertNodesForPiece(node, pieceArray, new Vector3(x, y, z));
            }
          }
        }
        
      } //rotated piece end
    } //piece end    
  }
  
  //PRIVATE accessors
  getColumn(label){ //returns column node
    let node = this.head.right;
    let h = this.head;  //to break while loop in case of error
    
    while(node.value !== label){
      node = node.right;
      
      if(node === h){
        return false;
      }
    }
    return node;
  }
  getPieceColumn(label){  //simply goes left first instead of right; returns column node
    let colNode = this.head.left;
    let h = this.head;  //to break while loop in case of error
    
    while(colNode.value !== label){
      colNode = colNode.left;
      
      if(colNode === h){
        return false;
      }
    }
    return colNode;
  }
  
  //private methods
  insertNode(node, upNode, leftNode){   //nodes above and to the left of desired node
    let downNode = upNode.down;
    let rightNode = leftNode.right;
    //up
    node.up = upNode;
    upNode.down = node;
    //down
    node.down = downNode;
    downNode.up = node;
    //left
    node.left = leftNode;
    leftNode.right = node;
    //right
    node.right = rightNode;
    rightNode.left = node;
  }
  
  //private methods for constructor
  insertNodesForPiece(rowNode, pieceArray, piecePosition){  //inserts position nodes; assumes rows are being filled in ascending order
    let columns = this.convertPieceArrayToColumnArray(pieceArray, piecePosition);   
    let leftNode = rowNode;
    
    for(let columnLabel of columns){
      let colNode = this.getColumn(columnLabel);
      let upNode = colNode.up;  //last node in column
      
      let node = new Node(1);
      this.insertNode(node, upNode, leftNode);
      
      node.column = colNode;
      node.column.size++;
      
      leftNode = node;
    }
  }
  convertPieceArrayToColumnArray(pieceArray, piecePosition){  //returns ordered array of column labels representing piece positions
    let columns = [];
    
    let dz = piecePosition.z;  //delta z (offset in target figure)
    let dy = piecePosition.y;
    let dx = piecePosition.x;
    
    let zm = pieceArray.length;
    let ym = pieceArray[0].length;
    let xm = pieceArray[0][0].length;
    
    for(let z = 0; z < zm; z++){  //iterate through piece
      for(let y = 0; y < ym; y++){
        for(let x = 0; x < xm; x++){
          if(pieceArray[z][y][x]){  //if piece has unit there
            columns.push(this.getColumnLabel(x +dx, y +dy, z +dz));
          }
        }
      }
    }
    return columns;
  }
  
  //labels
  getColumnLabels(cubeLength, totalPieces){  //returns ordered array of all column labels
    let columnLabels = [];
    
    //add position labels
    for(let h =0; h < cubeLength; h++){
      for(let d =0; d < cubeLength; d++){
        for(let w =0; w < cubeLength; w++){
          columnLabels.push(this.getColumnLabel(w, d, h));
        }
      }
    }
    
    //add piece labels
    for(let i =0; i<totalPieces; i++){
      columnLabels.push(this.getPieceColumnLabel(i));
    }
        
    return columnLabels;
  }
  getColumnLabel(x, y, z){
    return "" + z + y + x;
  }
  getPieceColumnLabel(pieceIndex){
    return "p" + pieceIndex;
  }
  
  //printing methods
  toArray(){  //turns dancing link matrix to array
    let matrixArray = [];  //array[0] is array of columns, array[1] is array for first row
    let colRowArray = [];  //array of columns
    let h = this.head.value;
    
    //create columns array
    colRowArray.push(h);   
    let col = this.head.right;       
    while(col.value !== h){
      colRowArray.push(col.value);
      col = col.right;
    } 
    
    // add each row to matrixArray, starting from bottom matrix but using unshift()
    let pieceCol = this.head.left;
    while(pieceCol.value.charAt(0) === "p"){ //for each piece
      let pieceNode = pieceCol.up;     //rowNode      
      while(pieceNode !== pieceCol){ //for each row in pieceColumn
        let rowArray = [];      
        //iterate each node in row
        let rowNode = pieceNode.right; //first node in row
        let startRowNode = rowNode;      
        do{
          //find column of node
          let columnNodeLabel = ConstraintMatrix.getColumnFromNode(rowNode).value;

          //set node's index in rowArray based on colRowArray          //TODO: change this       
          for(let i =0, len = colRowArray.length; i <len; i++){
            if(columnNodeLabel === colRowArray[i]){
              rowArray[i] = 1;
              break;
            }
          }
          rowNode = rowNode.right;
        }while(rowNode !== startRowNode);

        matrixArray.unshift(rowArray);
        pieceNode = pieceNode.up;
      } 
      
      pieceCol = pieceCol.left;
    }
    
    //add columns
    matrixArray.unshift(colRowArray);
    
    return matrixArray;
  }
  toString(){ //turns dancing link matrix to string
    let string = "";
    let matrixArray = this.toArray();
    
    for(let rowArray of matrixArray){
      rowArray.shift(); //remove header column
      let rowString = "";
      
      for(let label of rowArray){
        if(label !== undefined){
          rowString += label + "\t";
        } else{
          rowString += "0" + "\t";
        }
      }     
      string += rowString + "\n";
    }
    
    return string;
  } 
  
  // STATIC METHODS
  static getColumnFromNode(node){
    let n = node;
    while(n.value ===1){
      n =n.up;
    }
    return n;
  }
}

class Node{
  //column nodes have properties: value, up, down, left, right; size
  //nodes have properties: value (1), up, down, left, right; column
  constructor(value){ //properties are injected externally by constraint matrix
    this.value = value;
  }
}

