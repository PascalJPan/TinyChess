import { isInCheck, initZobrist, getZobristHash, hasLegalMoves} from './gameState.js';
import { state } from './state.js';
import {resetGame,handleClick} from './moveHandler.js';
import {renderBoard, toggleView} from './render.js';
import {checkmateSearch, printTree, iterativeMinimax} from './ai.js';
import { renderEvalBar } from './render.js';



export function rotateSlices(arr, numSlices) {
  // used for the spin mode in board generation
  const n = arr.length;
  const sliceSize = Math.floor(n / numSlices);
  const slices = [];

  for (let i = 0; i < numSlices; i++) {
    const start = i * sliceSize;
    const end = (i === numSlices - 1) ? n : start + sliceSize; 
    slices.push(arr.slice(start, end));
  }
  const rotated = slices.slice(1).concat(slices[0]);

  return rotated.flat();
}


export function generateRandomBoard(piecesSelection, rows, cols, density, mode) {
  const total = rows * cols; //amount of squares
  const available = piecesSelection.filter(p => p !== 'k' && p !== 'K'); //selected pieces
  
  let totalMaxPieces = total
  if (mode === "spin" && totalMaxPieces%2 !== 0) {
    totalMaxPieces--
  } 
  
  if (mode === "mirror") {
    totalMaxPieces = Math.floor(rows/2) * cols * 2
  } 

  let piecesPerSide = Math.floor(density * totalMaxPieces / 2 - 1);

  let pieces = ['K'];
  for (let i = 0; i < piecesPerSide; i++) {
    const r = available[Math.floor(Math.random() * available.length)].toUpperCase();
    pieces.push(r);
  }

  
  if (mode === "random") {
    //Random Generation Mode
    pieces = [...pieces, ...pieces.map(p => p.toLowerCase()).reverse()];
    while (pieces.length < total) pieces.push('');


    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }

  } else if (mode === "spin") {
    //Spin Generation Mode
    while (pieces.length * 2 < total - 1) pieces.push('');
    if (rows%2 !== 0) {
      pieces = [...pieces, ...[''], ...pieces.map(p => p.toLowerCase()).reverse()];
    } else {
      pieces = [...pieces, ...pieces.map(p => p.toLowerCase()).reverse()];
    }
      
    let l = pieces.length - 1;
    for (let i = pieces.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));

      if (rows%2 !== 0) {
        i = i === Math.floor(total/2) ? 0 : i;
        j = j === Math.floor(total/2) ? 0 : j;
      }

      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      [pieces[l-i], pieces[l-j]] = [pieces[l-j], pieces[l-i]];
    }  

  } else if (mode === "mirror") {
    //Mirror Generation Mode
    const piecesPerSide = Math.floor(rows / 2) * cols;

    pieces = [...pieces]; 
    while (pieces.length < piecesPerSide) pieces.push('');
    if (pieces.length > piecesPerSide) pieces = pieces.slice(0, piecesPerSide);

    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }

    const whiteSpace = Array(rows % 2 * cols).fill('');

    let blackPieces = pieces.map(p => p.toLowerCase());
    let numSlices = Math.floor(rows / 2)
    blackPieces = rotateSlices(blackPieces, numSlices)

    pieces = [...blackPieces, ...whiteSpace, ...pieces];
  } else if (mode == "puzzle") {
    //Puzzle Generation Mode
    if (piecesPerSide * 2 < 3 && available.length === 1 && available[0] === "n") {
      piecesPerSide = 1.5
    }

    pieces = ['K','k'];
    for (let i = 0; i < piecesPerSide*2; i++) {
      let r = available[Math.floor(Math.random() * available.length)];
      if (Math.random() > 0.4) {
        r = r.toUpperCase()
      }
      pieces.push(r)
    }

    while (pieces.length < total) pieces.push('');

    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
  }

  //reverse order if white king is before black king
  const indexKBlack = pieces.indexOf("k");
  const indexKWhite = pieces.indexOf("K");

  if (indexKBlack > indexKWhite) {
    pieces = pieces.reverse()
  }

  // turn all pawns on the last rows to pawns of the opposite color
  pieces = pieces.map((value,index,array) => {
    if (index < cols && value === "P") {
      return("p")
    }

    if (index > array.length - 1 - cols && value === "p") {
      return("P")
    }

    return value

  })
  

  const board = [];
  for (let y = 0; y < rows; y++) {
    board.push(pieces.slice(y * cols, (y + 1) * cols));
  }
  return board;
}



export function generateRandomValidBoard(piecesSelection, rows, cols, density, mode, maxSimulations = 100) {
  // called in the generate function, generates boards,
  // tests if they are valid 
  // and in puzzle mode tests if there is a checkmate sequence
  
  let sim = 0;
  let validPositions = 0;

  while (sim++ < Math.max(1, maxSimulations)) {
    const candidate = generateRandomBoard(piecesSelection, rows, cols, density, mode);
    
    if (!hasLegalMoves(`w`, candidate)) continue;
    const temp = JSON.parse(JSON.stringify(candidate));

    if (!isInCheck('b', temp) && !isInCheck('w', temp)) {  
      if (mode !== "puzzle") {
        const evaluation = iterativeMinimax(candidate, 5, true, 3, true, 500) //rough initial board evaluation
        state.currentEvaluation = evaluation.bestScore
        state.currentBoardStartEvaluation = evaluation.bestScore
        state.engineTimeContainer.innerHTML = `New board generated.`
        state.currentStartEvalDepth = state.iterativeDepth
        return candidate;

      } else {
        validPositions++;
        const searchResult = checkmateSearch("w", candidate, 5, state.PuzzleGenerationTimelimit) //checks if a checkmate sequence is present
        state.currentEvaluation = searchResult.bestScore
        state.currentBoardStartEvaluation = searchResult.bestScore
        state.currentStartEvalDepth = state.iterativeDepth
        if (searchResult.isMate && searchResult.movesUntilMate >= 5) {
          printTree(searchResult.bestTree, "", true, true)
          renderEvalBar(searchResult.bestScore, true);
          state.engineTimeContainer.innerHTML = `Puzzle found. (${validPositions} boards tested)`
          return candidate;

        }
      }
    } 
  }
  console.warn("NO VALID BOARD WAS FOUND!")
}



export async function generate (replay = false, evaluatePosition = false) {
// called after pressing the generate or replay button
// to generate a new board given the settings
// or to replay the current board in state.initialBoard 

if (state.view === "generationView") {
  toggleView()
}

if (!replay) {
  state.rowAmount = state.selectedSize;
  state.columnAmount = state.selectedSize;

  initZobrist(state.selectedSize, state.selectedSize);

  state.engineTimeContainer.innerHTML = `Generating...`
  await new Promise(r => setTimeout(r, 10));

  state.initialBoard = generateRandomValidBoard(
  state.selectedPieces,
  state.rowAmount,
  state.columnAmount,
  state.selectedDensity,
  state.selectedMode,
  10000,
  );
  state.engineTimeContainer.style.transition = `1s`;
  state.engineTimeContainer.style.opacity = `100%`;
} else {
  if (evaluatePosition) {
    initZobrist(state.selectedSize, state.selectedSize);
    const evaluation = iterativeMinimax(state.initialBoard, 5, true, 3, true, 10000)
    state.currentEvaluation = evaluation.bestScore
    state.currentBoardStartEvaluation = evaluation.bestScore
    state.currentStartEvalDepth = state.iterativeDepth
  }
  state.rowAmount = state.initialBoard.length;
  state.columnAmount = state.initialBoard[0].length;
}

state.boardState = JSON.parse(JSON.stringify(state.initialBoard));
renderBoard(state.board, state.columnAmount, state.rowAmount, handleClick);
resetGame()
}



