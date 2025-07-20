import { state } from './state.js';
import { generate } from './boardGenerator.js';
import { updatePieces, renderEvalBar, playSound } from './render.js';
import { makeBruteForceBlackMove, iterativeMinimax } from './ai.js';
import { getValidMoves, isCurrentPlayerPiece } from './moveValidation.js';
import { getBoardSignature, getGameState, initZobrist } from './gameState.js';



function moveBlackNTimes(movesLeft) {
  //starts a black move
  if (state.gameOver) return;
  if (movesLeft <= 0 || state.currentPlayer !== 'b') {
    if (!state.gameOver) {
      state.currentPlayer = 'w';
    }
    return;
  }

  makeBruteForceBlackMove(state.BruteForceDepth);

  if (state.gameOver) return;
  movesLeft--;
  setTimeout(() => moveBlackNTimes(movesLeft), 200);
}



export function handleClick(x, y) {
  // handles clicks on pieces

  if (state.gameOver) return;
  const piece = state.boardState[y]?.[x];

  if (state.selectedPiece) {
    const [fromX, fromY] = state.selectedPiece;
    const allowedMoves = getValidMoves(fromX, fromY);

    if (allowedMoves.some(([vx, vy]) => vx === x && vy === y)) {
      performMove(fromX, fromY, x, y);

      if (state.currentPlayer === 'b') {
        let movesLeft = state.blackMovesPerTurn;

        setTimeout(() => moveBlackNTimes(movesLeft), 200);
      }
    }

    state.selectedPiece = null;
    state.validMoves = [];
  } else if (piece && isCurrentPlayerPiece(piece)) {
    state.selectedPiece = [x, y];
    state.validMoves = getValidMoves(x, y);
  }

  updatePieces(state.boardState, state.selectedPiece, state.validMoves);
}



export function performMove(fromX, fromY, toX, toY, skipSwitch = false) {
  if (state.gameOver) return;

  const piece = state.boardState[fromY][fromX];

  // En passant capture
  if (
    piece.toLowerCase() === 'p' &&
    toX !== fromX &&
    !state.boardState[toY][toX]
  ) {
    state.boardState[fromY][toX] = '';
    playSound("capture")
  } else {
    !!state.boardState[toY][toX] ? playSound("capture") : playSound("move")
  }
  
  // Move the piece
  state.boardState[toY][toX] = piece;
  state.boardState[fromY][fromX] = '';

  // Set en passant target if this was a 2-step pawn move
  state.enPassantTarget =
    piece.toLowerCase() === 'p' && Math.abs(toY - fromY) === 2
      ? [fromX, (fromY + toY) / 2]
      : null;

  // Handle promotion
  const ROWS = state.boardState.length;
  if (piece === 'P' && toY === 0) {
    state.boardState[toY][toX] = 'Q';
  } else if (piece === 'p' && toY === ROWS - 1) {
    state.boardState[toY][toX] = 'q';
  }

  // Track pawn movement (for double-move rules)
  if (piece.toLowerCase() === 'p') {
    const fromKey = `${fromX},${fromY}`;
    const toKey = `${toX},${toY}`;

    // Add destination
    if (!state.movedPawnPositions.includes(toKey)) {
      state.movedPawnPositions.push(toKey);
    }

    // Remove old position
    state.movedPawnPositions = state.movedPawnPositions.filter(
      (k) => k !== fromKey
    );
  }

  // Record position signature for repetition detection
  const signature = getBoardSignature(state.boardState, state.currentPlayer);
  state.moveHistory.push(signature);

  // Update rendering
  updatePieces(state.boardState, state.selectedPiece, state.validMoves);

  // Evaluate game state for the next player
  const nextPlayer = state.currentPlayer === 'w' ? 'b' : 'w';
  const result = getGameState(nextPlayer);

  if (result === 'checkmate') {
    state.gameOver = true;
    setTimeout(() => {
      showGameResult(state.currentPlayer === 'w' ? 'Win' : 'Lose');
    }, 500);
    return;
  }

  if (result === 'draw' || result === 'repetition') {
    state.gameOver = true;
    setTimeout(() => {
      showGameResult('Draw');
    }, 500);
    return;
  }

  // Switch turn if game is still on
  if (!skipSwitch && !state.gameOver) {
    state.currentPlayer = nextPlayer;
  }
}



export function showGameResult(message) {
  if (message === "Win") {
    playSound("win")
    message = "You won"
  } else if (message === "Lose") {
    playSound("lose")
    message = "You lost"
  } else if (message === "Draw") {
    playSound("draw")
    message = "Draw"
  }

  // Remove old result box if it exists
  const existingBox = document.getElementById("gameResult");
  if (existingBox) existingBox.remove();

  state.box = document.createElement("div");
  state.box.id = "gameResult";
  state.box.className = "game-result";
  state.box.innerHTML = `
    <p>${message}</p>
  `;

  state.board.appendChild(state.box);

  // Hook up the reset button
  const button = document.getElementById("gameResult");
  setTimeout(()=> {
    button.addEventListener("click", () => {
    //resetGame();
    generate(false,true)
  });
  }, 200)
  
}



export function resetGame() {
  state.box?.remove()
  state.moveHistory = [getBoardSignature(state.boardState, state.currentPlayer)];
  state.boardState = JSON.parse(JSON.stringify(state.initialBoard));
  state.currentPlayer = 'w';
  state.selectedPiece = null;
  state.validMoves = [];
  state.gameOver = false;
  state.currentEvaluation = 0;

  state.movedPawnPositions = [];

  initZobrist(state.selectedSize, state.selectedSize);

  updatePieces(state.boardState, state.selectedPiece, state.validMoves);
  renderEvalBar(state.currentBoardStartEvaluation, true, state.currentStartEvalDepth)
}



export function makeMove(board, move, state) {
  const fromPiece = board[move.fromY][move.fromX];
  const toPiece = board[move.toY][move.toX];

  // Handle promotion
  const isPromotion =
    (fromPiece === 'P' && move.toY === 0) ||
    (fromPiece === 'p' && move.toY === board.length - 1);
  const promotedTo = isPromotion
    ? (fromPiece === 'P' ? 'Q' : 'q')
    : null;

  board[move.toY][move.toX] = promotedTo || fromPiece;
  board[move.fromY][move.fromX] = '';

  const undo = {
  fromX: move.fromX,
  fromY: move.fromY,
  toX: move.toX,
  toY: move.toY,
  movedPiece: fromPiece,
  capturedPiece: toPiece,
  promotedTo,
  previousEnPassant: state.enPassantTarget ? [...state.enPassantTarget] : null,
  fullMovedPawnPositions: [...state.movedPawnPositions] 
  };

  // En passant target (vertical 2-step pawn move)
  if (
    fromPiece.toLowerCase() === 'p' &&
    Math.abs(move.toY - move.fromY) === 2
  ) {
    state.enPassantTarget = [move.toX, (move.fromY + move.toY) / 2];
  } else {
    state.enPassantTarget = null;
  }

  return undo;
}



export function unmakeMove(board, move, undo, state) {
  // unmakes the last calculated move

  board[move.fromY][move.fromX] = undo.movedPiece;
  board[move.toY][move.toX] = undo.capturedPiece;

  if (undo.promotedTo) {
    board[move.fromY][move.fromX] = undo.movedPiece;
  }

  if (undo.fullMovedPawnPositions) {
    state.movedPawnPositions = [...undo.fullMovedPawnPositions]; 
  }

  state.enPassantTarget = undo.previousEnPassant;
}