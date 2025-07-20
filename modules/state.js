const soundFiles = {
  capture: [ 'captureSound1.mp3', 'captureSound2.mp3' ],
  click:   [ 'clickSound.mp3' ],
  move:    [ 'moveSound.mp3' ],
  win:     [ 'winSound1.mp3', 'winSound2.mp3', 'winSound3.mp3', 'winSound4.mp3' ],
  lose:    [ 'loseSound1.mp3', 'loseSound2.mp3', 'loseSound3.mp3', 'loseSound4.mp3' ],
  draw:    [ 'drawSound1.mp3', 'drawSound2.mp3'],
};

export const state = {
  // DOM
  board: document.getElementById('chessboard'),
  controlBoard: document.getElementById('control-board'),
  generateButton: document.getElementById("regenerate-button"),
  toggleViewButton: document.getElementById("toggle-view-button"),
  toggleEvalButton: document.getElementById("toggle-eval-button"),
  replayButton: document.getElementById("replay-button"),

  evalBarContainer: document.getElementById('evaluation-bar'),
  evalBar: document.getElementById('evaluation-fill'),
  evalScoreBox: document.getElementById('evaluation-score'),
  gameResultBox: document.getElementById("gameResult"),
  resultText: document.getElementById("resultText"),

  engineTimeContainer: document.getElementById('engine-time'),

  //View
  view: "generationView",
  showEvalBar: true,
  piecesStyle: "common",
  piecesStyleEnding: ".svg",

  // Board Generation
  selectedSize : 4,
  selectedDensity : 0.5,
  selectedMode : "spin",
  selectedPieces : ["p","n","b","r"],

  rowAmount: 4,
  columnAmount: 4,

  // Game state
  boardState: [],
  initialBoard: [],
  selectedPiece: null,
  currentPlayer: 'w',
  gameOver: false,
  validMoves: [],
  zobrist: {
  table: [],
  sideToMove: 0n
},
  moveHistory: [],
  movedPawnPositions: [],
  enPassantTarget: null,

  // AI and config
  blackMovesPerTurn: 1,
  BruteForceDepth: 10,
  SeqDepth: 5,
  Timelimit: 3000,
  buildTree: true,
  engineMoveHighlight: true,
  PuzzleGenerationTimelimit: 5000,
  verbose: false,

  transpositionTable: {},
  currentEvaluation: 0,
  currentBoardStartEvaluation: 0,
  currentStartEvalDepth: 0,

  // Pieces
  pieceToEmoji: {
    'K': '♔', 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
    'k': '♚', 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟︎'
  },
  pieceValues: { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100, P: 1, N: 3, B: 3, R: 5, Q: 9, K: 100 },

  // Timings and counts (used for performance measuremnets)
  minimaxTime: 0,
  getAllMovesTime: 0,
  getGameStateTime: 0,
  quiescenceTime: 0,
  scoreMoveTime: 0,
  boardSignatureTime: 0,
  keyGenTime: 0,

  AIMoveTime: 0,
  quiescenceNodeCount: 0,
  nodeCount: 0,

  timerInterval: null,
  elapsed: 0,

  //Sounds
  sounds: Object.fromEntries(
    Object.entries(soundFiles).map(([type, files]) => [
      type,
      files.map(filename => {
        const audio = new Audio(`/sounds/${filename}?v=5`);
        audio.preload = 'auto';
        return audio;
      })
    ])
  )
};
