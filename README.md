# TetrisCubeSolverDLX

Finds and displays solutions for the Tetris and Soma cubes, 3d block assembly puzzles.

Application page: https://tetris-cube-solver-dlx-v3.glitch.me/
Glitch code: https://glitch.com/edit/#!/tetris-cube-solver-dlx-v3
  
____________________________________________________________________
## Overview
- Uses two algorithms to solve Tetris and Soma cubes
  - Simple recursive backtracking
    - imperfect algorithm, misses solutions
  - Knuth's Algorithm X with dancing links (DLX)
    - finds all solutions
    - finds solutions about 10x faster than other algorithm
 
- To avoid rotational symmetry of solutions, piece 1 can't rotate for either cube
- Displays solutions using p5.js
  
## Algorithms
- **Simple recursive backtracking:**
    - To find a solution:
        - Place pieces until target figure is filled
          - To place a piece:
            - Find empty position in target figure
            - Find unused piece and test its rotations; continue until a piece fits
          - If no pieces fit, remove the last piece
          - Place a piece, picking up from the next rotation of removed piece
    - To find next solution:
        - Remove a piece from the previous solution
        - Continue placing pieces until a solution is found

- **Algorithm X and dancing links:** based on Donald Knuth's article on dancing links and dlx
    - To solve constraint matrix:
        - If no columns, save solution and return false (matrix is solved)   
        - Choose a column with the least nodes
          - If the column has zero nodes return false (matrix can't be solved)
        - For each node n in the chosen column
          - Include node n in the partial solution
          - For each node p in the row of node n
            - Remove column of the node
            - Remove all rows containing nodes in the same column as node p
          - Solve remaining constraint matrix (call solveMatrix)
          - Remove n from partial solution
          - Reinsert the removed rows and columns in reverse order to removal
          - Loop down to next node n
        - Column can't be solved therefore current matrix can't be solved, return false

Enjoy :)
