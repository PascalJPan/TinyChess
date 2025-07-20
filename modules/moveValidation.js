import { state } from './state.js';
import { makeMove, unmakeMove } from './moveHandler.js';
import { isInCheck } from './gameState.js';



export function isSameSide(pieceA, pieceB) {
  if (!pieceA || !pieceB) return false;
  const isWhiteA = pieceA === pieceA.toUpperCase();
  const isWhiteB = pieceB === pieceB.toUpperCase();
  return isWhiteA === isWhiteB;
}



export function isCurrentPlayerPiece(piece) {
  return (state.currentPlayer === 'w' && piece === piece.toUpperCase()) ||
         (state.currentPlayer === 'b' && piece === piece.toLowerCase());
}



export function isPathClear(fromX, fromY, toX, toY, board = state.boardState) {
  const dx = Math.sign(toX - fromX);
  const dy = Math.sign(toY - fromY);
  let x = fromX + dx;
  let y = fromY + dy;

  while (x !== toX || y !== toY) {
    if (board[y]?.[x]) return false;
    x += dx;
    y += dy;
  }
  return true;
}



export function isValidMove(fromX, fromY, toX, toY, board = state.boardState) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const piece = board[fromY][fromX]?.toLowerCase();
  const target = board[toY]?.[toX];

  if (!piece) return false;
  if (target && isSameSide(board[fromY][fromX], target)) return false;

  switch (piece) {
    case 'p': {
      const dir = board[fromY][fromX] === 'P' ? -1 : 1;
      const key = `${fromX},${fromY}`;
      const hasMoved = state.movedPawnPositions.includes(key);

      if (dx === 0 && !target && dy === dir) return true;

      if (
        dx === 0 &&
        !target &&
        dy === 2 * dir &&
        !hasMoved &&
        isPathClear(fromX, fromY, toX, toY, board)
      ) return true;

      if (Math.abs(dx) === 1 && dy === dir && target) return true;

      if (
        Math.abs(dx) === 1 &&
        dy === dir &&
        !target &&
        state.enPassantTarget &&
        state.enPassantTarget[0] === toX &&
        state.enPassantTarget[1] === toY
      ) return true;

      return false;
    }


    case 'r':
      if (dx !== 0 && dy !== 0) return false;
      return isPathClear(fromX, fromY, toX, toY, board);

    case 'n':
      return (
        (Math.abs(dx) === 2 && Math.abs(dy) === 1) ||
        (Math.abs(dx) === 1 && Math.abs(dy) === 2)
      );

    case 'b':
      if (Math.abs(dx) !== Math.abs(dy)) return false;
      return isPathClear(fromX, fromY, toX, toY, board);

    case 'q':
      if (
        dx === 0 ||
        dy === 0 ||
        Math.abs(dx) === Math.abs(dy)
      ) return isPathClear(fromX, fromY, toX, toY, board);
      return false;

    case 'k':
      return Math.abs(dx) <= 1 && Math.abs(dy) <= 1;

    default:
      return false;
  }
}



export function getValidMoves(x, y, board = state.boardState, skipCheckTest = false) {
  const moves = [];
  const piece = board[y]?.[x];
  if (!piece) return moves;

  const color = piece === piece.toUpperCase() ? 'w' : 'b';

  for (let toY = 0; toY < board.length; toY++) {
    for (let toX = 0; toX < board[0].length; toX++) {
      if (!isValidMove(x, y, toX, toY, board)) continue;

      if (skipCheckTest) {
        moves.push([toX, toY]);
      } else {
        const move = { fromX: x, fromY: y, toX, toY, piece };
        const undo = makeMove(board, move, state);
        if (!isInCheck(color, board)) {
          moves.push([toX, toY]);
        }
        unmakeMove(board, move, undo, state);
      }
    }
  }

  return moves;
}



export function getAllMoves(board = state.boardState, color, skipCheckTest = false) {
  const moves = [];
  const isWhite = color === 'w';

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const piece = board[y][x];
      if (!piece) continue;

      const belongsToColor = (piece === piece.toUpperCase()) === isWhite;
      if (!belongsToColor) continue;

      const legalMoves = getValidMoves(x, y, board, true); 
      for (const [toX, toY] of legalMoves) {
        const move = { fromX: x, fromY: y, toX, toY, piece };

        if (skipCheckTest) {
          moves.push(move);
        } else {
          const undo = makeMove(board, move, state);
          if (!isInCheck(color, board)) {
            moves.push(move);
          }
          unmakeMove(board, move, undo, state);
        }
      }
    }
  }

  return moves;
}
