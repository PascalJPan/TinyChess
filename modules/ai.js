import { state } from './state.js';
import { getAllMoves } from './moveValidation.js';
import { getGameState, isInCheck, getBoardSignature, getZobristHash } from './gameState.js';
import { performMove, makeMove, unmakeMove} from './moveHandler.js';
import { renderEvalBar } from './render.js';

export function scoreMove(move, board, maximizing) {
  const isWhite = maximizing ? true : false;
  const attacker = board[move.fromY][move.fromX];
  const victim = board[move.toY][move.toX];

  let score = 0;

  const undo = makeMove(board, move, state);

  // Checks
  const opponentColor = isWhite ? 'b' : 'w';
  if (isInCheck(opponentColor, board)) {
    score += 100;
  }

  // Promotions
  const ROWS = board.length;
  const isPromotion = attacker.toLowerCase() === 'p' && (
    (isWhite && move.toY === 0) || (!isWhite && move.toY === ROWS - 1)
  );
  if (isPromotion) {
    score += 89; 
  }

  unmakeMove(board, move, undo, state);

  // Capturing valuable pieces with not valuable pieces
  if (victim) {
    score += (state.pieceValues[victim.toLowerCase()] || 0) * 10;
    score -= (state.pieceValues[attacker.toLowerCase()] || 0);
  }

  return score;
}

export function materialScore(board) {
  let whiteScore = 0, blackScore = 0;
  //let whiteKingAlive = false, 
  //blackKingAlive = false;

  for (const row of board) {
    for (const piece of row) {
      if (!piece) continue;

      const value = state.pieceValues[piece.toUpperCase()] || 0;
      //if (piece === 'K') whiteKingAlive = true;
      //if (piece === 'k') blackKingAlive = true;

      if (piece === piece.toUpperCase()) whiteScore += value;
      else blackScore += value;
    }
  }

  //if (!whiteKingAlive) return -1000000;
  //if (!blackKingAlive) return 1000000;
  //whiteScore = whiteScore || 0.001;
  //blackScore = blackScore || 0.001;
  let evaluation = whiteScore - blackScore
  return evaluation;
}

export function quiescenceSearch(board, maximizing, alpha, beta, depth) {
  const isTopLevel = depth === state.SeqDepth;
  const t0 = isTopLevel ? performance.now() : 0;
  state.quiescenceNodeCount++;

  if (depth <= 0) return materialScore(board);
  const standPat = materialScore(board);
  const color = maximizing ? 'w' : 'b';

  if (maximizing) {
    if (standPat >= beta) return beta;
    if (standPat > alpha) alpha = standPat;
  } else {
    if (standPat <= alpha) return alpha;
    if (standPat < beta) beta = standPat;
  }

  const moves = getAllMoves(board, color, false).filter(m => board[m.toY][m.toX]);
  moves.sort((a, b) => scoreMove(b, board, maximizing) - scoreMove(a, board, maximizing));

  for (const move of moves) {
    const undo = makeMove(board, move, state);
    const evalScore = quiescenceSearch(board, !maximizing, alpha, beta, depth - 1);
    unmakeMove(board, move, undo, state);

    if (maximizing) {
      if (evalScore >= beta) return beta;
      if (evalScore > alpha) alpha = evalScore;
    } else {
      if (evalScore <= alpha) return alpha;
      if (evalScore < beta) beta = evalScore;
    }
  }
  if (isTopLevel) {
    state.quiescenceTime += performance.now() - t0;
  }
  return maximizing ? alpha : beta;
}


export function minimax(board, depth, maximizing, alpha = -Infinity, beta = Infinity, seqDepth = state.SeqDepth, history = [], treeNode = null) {
  const isTopLevel = depth === state.BruteForceDepth - 1;
  const t0 = isTopLevel ? performance.now() : 0;

  state.nodeCount++;
  if (maximizing) {
    state.nodeCountWhite++
  } else {
    state.nodeCountBlack++
  }

  const color = maximizing ? 'w' : 'b';
  const keyStart = performance.now();
  const boardSig = getZobristHash(board, color);
  const key = boardSig + `|${depth}|${Math.floor(alpha * 10)}|${Math.floor(beta * 10)}`;
  state.keyGenTime += performance.now() - keyStart;

  if (treeNode) treeNode.children = [];

  const cached = state.transpositionTable[key];
  if (cached !== undefined) {
    if (isTopLevel) state.minimaxTime += performance.now() - t0;
    return cached;
  }

  const sigStart = performance.now();
  const newHistory = [...history, getBoardSignature(board, color)];
  state.boardSignatureTime += performance.now() - sigStart;

  const gsStart = performance.now();
  const gameState = getGameState(color, board, true, newHistory);
  state.getGameStateTime += performance.now() - gsStart;

  if (gameState === 'checkmate') {
    const score = maximizing ? -1000000 - depth : 1000000 + depth;
    if (isTopLevel) state.minimaxTime += performance.now() - t0;
    return { score, sequence: [] };
  }
  if (gameState === 'draw') {
    if (isTopLevel) state.minimaxTime += performance.now() - t0;
    return { score: 0, sequence: [] };
  }

  if (depth === 0) {
    const qScore = quiescenceSearch(board, maximizing, alpha, beta, seqDepth);
    if (isTopLevel) state.minimaxTime += performance.now() - t0;
    return { score: qScore, sequence: [] };
  }

  const gaStart = performance.now();
  const moves = getAllMoves(board, color, false);
  state.getAllMovesTime += performance.now() - gaStart;

  const sortFn = maximizing
    ? (a, b) => scoreMove(b, board) - scoreMove(a, board)
    : (a, b) => scoreMove(a, board) - scoreMove(b, board);
  moves.sort(sortFn);

  let best = maximizing ? -Infinity : Infinity;
  let bestSequence = [];

  for (const move of moves) {
    const undo = makeMove(board, move, state);

    let childNode = null;
    if (treeNode) {
      childNode = { move, score: null, best: false, depth: depth - 1, children: [] };
    }

    const result = minimax(board, depth - 1, !maximizing, alpha, beta, seqDepth, newHistory, childNode);

    unmakeMove(board, move, undo, state);

    const evalScore = result.score;
    if (treeNode && childNode) {
      childNode.score = evalScore;
      treeNode.children.push(childNode);
    }

    const isBetter = maximizing ? evalScore > best : evalScore < best;
    if (isBetter) {
      best = evalScore;
      bestSequence = [move, ...(result.sequence || [])];

      if (treeNode && treeNode.children) {
        for (const c of treeNode.children) c.best = false;
        if (childNode) childNode.best = true;
      }
    }

    if (maximizing) {
      alpha = Math.max(alpha, evalScore);
    } else {
      beta = Math.min(beta, evalScore);
    }

    if (beta <= alpha) {
      if (treeNode) treeNode.cutoff = true;
      break;
    }
  }

  const output = { score: best, sequence: bestSequence };
  state.transpositionTable[key] = output;
  if (isTopLevel) state.minimaxTime += performance.now() - t0;
  return output;
}

export function iterativeMinimax(board, maxDepth, isMaximizing, seqDepth = state.SeqDepth, buildTree = false, maxAIMoveTime = 100000, alpha = -Infinity, beta = Infinity) {
  const color = isMaximizing ? 'w' : 'b';
  const allMoves = getAllMoves(board, color);
  if (allMoves.length === 0) return null;
  if (allMoves.length === 0) return null;
  allMoves.sort((a, b) => scoreMove(b, board, isMaximizing) - scoreMove(a, board, isMaximizing));

  let bestMove;
  let bestScore;
  let bestTree = null;
  let previousScores = new Map();
  let startTime = performance.now()

  for (let depth = 1; depth <= maxDepth; depth++) {
    state.transpositionTable = {};
    state.iterativeDepth = depth;

    if (depth > 1) {
      allMoves.sort((a, b) => {
        const scoreA = previousScores.get(JSON.stringify(a)) ?? 0;
        const scoreB = previousScores.get(JSON.stringify(b)) ?? 0;
        return isMaximizing ? scoreB - scoreA : scoreA - scoreB;
      });
    }

    const treeRoot = buildTree ? { move: null, score: null, depth, children: [] } : null;
    bestMove = null;
    bestScore = isMaximizing ? -Infinity : Infinity;
    previousScores.clear()

    for (const move of allMoves) {
      const undo = makeMove(board, move, state);
      const history = [getBoardSignature(board, color)];

      let result, childNode = null;

      if (buildTree) {
        childNode = {
          move,
          score: null,
          best: false,
          depth: depth - 1,
          children: []
        };
        result = minimax(board, depth - 1, !isMaximizing, alpha, beta, seqDepth, history, childNode);
        childNode.score = result.score;
        treeRoot.children.push(childNode);
      } else {
        result = minimax(board, depth - 1, !isMaximizing, alpha, beta, seqDepth, history, null);
      }

      unmakeMove(board, move, undo, state);

      previousScores.set(JSON.stringify(move), result.score);

      const isBetter = isMaximizing ? result.score > bestScore : result.score < bestScore;

      if (isBetter) {
        bestMove = move;
        bestScore = result.score;

        if (buildTree && treeRoot) {
          treeRoot.children.forEach(c => c.best = false);
          if (childNode) childNode.best = true;
        }
      }

    }

    if (buildTree && treeRoot) {
      treeRoot.score = bestScore;
      bestTree = treeRoot;
    }

    if (Math.abs(bestScore) >= 1000000) break;
    //console.log("time:",performance.now() - startTime)

    if (performance.now() - startTime >= maxAIMoveTime) break;
  }

  let resultDepth = state.iterativeDepth
  return {
    bestMove,
    bestScore,
    bestTree,
    resultDepth
  };
}


export async function makeBruteForceBlackMove(depth, seqDepth = state.SeqDepth, buildTree = state.buildTree) {
  if (state.gameOver) return false;

  let time = performance.now()
  state.engineTimeContainer.style.transition = `0.5s`;
  state.engineTimeContainer.style.opacity = `100%`;
  state.engineTimeContainer.innerHTML = `Thinking...`;

  await new Promise(r => setTimeout(r, 10));

  resetTimerAndCounts()
  const t0_AIMoveTime = performance.now();
  const result = iterativeMinimax(state.boardState, depth, false, seqDepth, buildTree, state.Timelimit);
  state.AIMoveTime += performance.now() - t0_AIMoveTime;
  if (state.verbose) {
    printTimes()
  }

  if (!result || !result.bestMove) {
    state.engineTimeContainer.innerHTML = "No move found.";
    setTimeout(() => {
      state.engineTimeContainer.style.transition = `1s`;
      state.engineTimeContainer.style.opacity = `0%`;
    }, 500);
    return false;
  }

  if (buildTree && result.bestTree) {
    printTree(result.bestTree, "", true, true);
  }

  state.currentEvaluation = result.bestScore;
  performMove(
    result.bestMove.fromX,
    result.bestMove.fromY,
    result.bestMove.toX,
    result.bestMove.toY,
    true
  );
  
  renderEvalBar(result.bestScore);

  if( performance.now() - time > 1000) {
      state.engineTimeContainer.innerHTML = `${Math.floor((performance.now() - time)/100)/10}s`;
      setTimeout(() => {
        state.engineTimeContainer.style.transition = `2s`;
        state.engineTimeContainer.style.opacity = `0%`;
      }, 1500);
  } else {
    state.engineTimeContainer.style.opacity = `0%`;
  }


  return true;
}



export function checkmateSearch (color, board, depth, timePerIteration) {
  let isMate = false;
  let movesUntilMate = 100;

  const isWhite = color === "w" ? true : false
  const alpha = isWhite ? 10000 : -Infinity
  const beta = isWhite ? Infinity : -10000
  const minimaxResult = iterativeMinimax(board, depth, isWhite, 0, true, timePerIteration, alpha, beta)
  const bestScore = minimaxResult.bestScore
  const resultDepth = minimaxResult.resultDepth


  if (bestScore > -100000 && !isWhite || bestScore < 100000 && isWhite) {
      return {
        isMate,
        movesUntilMate
      }
    } else {
      isMate = true;
      movesUntilMate = (resultDepth - (bestScore - 1000000))
      return {
        isMate,
        movesUntilMate,
        bestTree: minimaxResult.bestTree,
        bestScore
      }
  }
}


export function formatMove(move, board = null, ROWS = 8) {
  if (!move || move.fromX == null || move.fromY == null || move.toX == null || move.toY == null) {
    return `Invalid move: ${JSON.stringify(move)}`;
  }

  const piece = move.piece || '?';
  const isCapture = move.isCapture ?? false; // fallback

  const fileFrom = String.fromCharCode(97 + move.fromX);
  const fileTo = String.fromCharCode(97 + move.toX);
  const rankTo = ROWS - move.toY;

  let moveNotation = '';

  if (piece.toLowerCase() === 'p' && isCapture) {
    moveNotation = `${fileFrom}x${fileTo}${rankTo}`;
  } else if (piece.toLowerCase() === 'p') {
    moveNotation = `${fileTo}${rankTo}`;
  } else {
    moveNotation = `${piece.toUpperCase()}${isCapture ? 'x' : ''}${fileTo}${rankTo}`;
  }

  if ((piece === 'P' && move.toY === 0) || (piece === 'p' && move.toY === ROWS - 1)) {
    moveNotation += '=Q';
  }

  return `${moveNotation} (${fileFrom}${ROWS - move.fromY} → ${fileTo}${rankTo})`;
}

export function printTree(node, prefix = "", isLast = true, minimal = false) {
  if (!node) return;

  const ROWS = state.boardState.length;

  const moveStr = node.move 
    ? formatMove(node.move, null, ROWS) 
    : "ROOT";

  const marker      = node.best   ? "⭐" : " ";
  const cutoffMarker= node.cutoff ? "⛔" : " ";
  const score       = node.score?.toFixed(2) ?? "?";
  const depth       = state.BruteForceDepth - node.depth;

  const branch = prefix + (isLast ? "└── " : "├── ");
  console.log(`${branch}${marker}${cutoffMarker} ${moveStr} | Score: ${score} | Depth: ${depth}`);

  // Best Childs Only
  if (minimal && node.children?.length > 0) {
    const bestChild = node.children.find(c => c.best);
    if (bestChild) {
      printTree(bestChild,
                prefix + (isLast ? "    " : "│   "),
                true,
                true);
    }
    return;
  }

  // Full tree
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, i) => {
      const last = i === node.children.length - 1;
      printTree(child,
                prefix + (isLast ? "    " : "│   "),
                last,
                false);
    });
  }
}

export function printTimes () {
  //prints the performance times (needs to enabled via state.)

  const total = state.AIMoveTime;

  const rawData = [
    { label: 'getAllMoves', value: state.getAllMovesTime },
    { label: 'getGameState', value: state.getGameStateTime },
    { label: 'quiescence', value: state.quiescenceTime },
    { label: 'boardSignature', value: state.boardSignatureTime },
    { label: 'keyGen', value: state.keyGenTime },
    {label: 'AI move time', value: state.AIMoveTime }
  ];

  const table = rawData
    .map(({ label, value }) => ({
      label,
      time: `${value.toFixed(0)} ms`,
      percent: `${((value / total) * 100).toFixed(1)} %`
    }))
    .sort((a, b) => parseFloat(b.percent) - parseFloat(a.percent));

  console.table(table);
}

export function resetTimerAndCounts () {
  state.AIMoveTime = 0;
  state.quiescenceNodeCount = 0;
  state.nodeCount = 0;
  state.nodeCountWhite = 0;
  state.nodeCountBlack = 0;
  state.minimaxTime = 0;
  state.getAllMovesTime = 0;
  state.getGameStateTime = 0;
  state.boardSignatureTime = 0;
  state.quiescenceTime = 0;
  state.keyGenTime = 0;
}
