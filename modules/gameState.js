import { state } from './state.js';
import { makeMove, unmakeMove } from './moveHandler.js';
import { getAllMoves} from './moveValidation.js';
import { isValidMove, getValidMoves } from './moveValidation.js';



export function isInCheck(color, board = state.boardState) {
  //checks if the given color is in check
  const king = color === 'w' ? 'K' : 'k';
  let kingX = -1, kingY = -1;

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      if (board[y][x] === king) {
        kingX = x;
        kingY = y;
        break;
      }
    }
  }

  if (kingX === -1 || kingY === -1) return false;

  const opponent = color === 'w' ? 'b' : 'w';

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const piece = board[y][x];
      if (!piece) continue;

      const isOpponent = (piece === piece.toLowerCase()) === (opponent === 'b');
      if (!isOpponent) continue;

      if (isValidMove(x, y, kingX, kingY, board)) {
        return true;
      }
    }
  }

  return false;
}



export function hasLegalMoves(color, board = state.boardState) {
  //checks if the given color has legal moves
  const isWhite = color === 'w';

  // Reordering to be faster
  const pieces = [];
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[0].length; x++) {
      const piece = board[y][x];
      if (!piece) continue;

      const belongsToColor = (piece === piece.toUpperCase()) === isWhite;
      if (belongsToColor) {
        pieces.push({ x, y });
      }
    }
  }

  // Try king moves first
  pieces.sort((a, b) => {
    const aIsKing = board[a.y][a.x].toLowerCase() === 'k';
    const bIsKing = board[b.y][b.x].toLowerCase() === 'k';
    return bIsKing - aIsKing;
  });

  for (const { x, y } of pieces) {
    const moves = getValidMoves(x, y, board, true);
    for (const [toX, toY] of moves) {
      const move = { fromX: x, fromY: y, toX, toY };
      const undo = makeMove(board, move, state);
      const legal = !isInCheck(color, board);
      unmakeMove(board, move, undo, state);

      if (legal) return true;
    }
  }

  return false;
}



export function getGameState(color, board = state.boardState, sim = false, history = state.moveHistory) {
  // tests if the game is over, or ongoing
  
  if (!sim && history) {
    const sig = getBoardSignature(board, color === 'w' ? 'b' : 'w');
    const repCount = history.filter(s => s === sig).length;
    if (repCount >= 3) return 'repetition';
    if (onlyKingsLeft(board)) return 'draw';
  }

  const hasMoves = hasLegalMoves(color, board);
  if (hasMoves) return 'ongoing';

  return isInCheck(color, board) ? 'checkmate' : 'draw';
}



export function onlyKingsLeft(board = state.boardState) {
  let hasW = false, hasB = false, extras = 0;

  for (const row of board) {
    for (const p of row) {
      if (!p) continue;
      if (p === 'K') hasW = true;
      else if (p === 'k') hasB = true;
      else if (p === "n" || p === "N" || p === "b" || p === "B") extras++ ;
      else extras = extras + 2;
    }
  }

  return hasW && hasB && extras<=1;
}



export function isKingMissing() {
  let w = false, b = false;

  for (const row of state.boardState) {
    for (const p of row) {
      if (p === 'K') w = true;
      if (p === 'k') b = true;
    }
  }

  return !w ? 'Black' : !b ? 'White' : null;
}



export function getBoardSignature(board, player) {
  return player + ':' + board.map(row => row.map(p => p || '.').join('')).join('/');
}



const pieceToIndex = {
  'P': 0, 'N': 1, 'B': 2, 'R': 3, 'Q': 4, 'K': 5,
  'p': 6, 'n': 7, 'b': 8, 'r': 9, 'q': 10, 'k': 11
};



export function initZobrist(rows, cols) {
  const table = [];
  const pieceTypes = 12;

  for (let y = 0; y < rows; y++) {
    table[y] = [];
    for (let x = 0; x < cols; x++) {
      table[y][x] = [];
      for (let p = 0; p < pieceTypes; p++) {
        table[y][x][p] = random64Bit();
      }
    }
  }

  state.zobrist = {
    table,
    sideToMove: random64Bit()
  };
}



function random64Bit() {
  return BigInt.asUintN(64,
    (BigInt(Math.floor(Math.random() * 0xFFFFFFFF)) << 32n) |
    BigInt(Math.floor(Math.random() * 0xFFFFFFFF))
  );
}



export function getZobristHash(board, color) {
  let hash = 0n;

  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const piece = board[y][x];
      if (!piece) continue;
      const index = pieceToIndex[piece];
      if (index !== undefined) {
        hash ^= state.zobrist.table[y][x][index];
      }
    }
  }

  if (color === 'w') {
    hash ^= state.zobrist.sideToMove;
  }

  return hash.toString(); // to use as key
}