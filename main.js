// Importing all functions and objects
import { preloadPieceImages, renderBoard, updatePieces, toggleView, toggleEvalBar, changePieces, playSound } from './modules/render.js';
import {
isValidMove, isPathClear, isSameSide, getValidMoves, getAllMoves, isCurrentPlayerPiece
} from './modules/moveValidation.js';
import {
  isInCheck, hasLegalMoves, getGameState,
  onlyKingsLeft, isKingMissing, getBoardSignature, initZobrist, getZobristHash
} from './modules/gameState.js';
import {
  handleClick, performMove, resetGame
} from './modules/moveHandler.js';
import {
  materialScore, scoreMove,
  quiescenceSearch, minimax, makeBruteForceBlackMove,
  iterativeMinimax, checkmateSearch
} from './modules/ai.js';
import {
  generate, generateRandomBoard, generateRandomValidBoard
} from './modules/boardGenerator.js';

import {
  cornersButtonClick, settingsButtonClick
} from './modules/buttons.js';

import { state } from './modules/state.js';

// Preloading Pieces
preloadPieceImages()

// Settings Buttons
const buttonSections = {
  size: document.querySelectorAll('#size-section .button'),
  density: document.querySelectorAll('#density .button'),
  mode: document.querySelectorAll('#mode-section .mode-button'),
  pieces: document.querySelectorAll('#pieces-section .piece-button'),
};

Object.entries(buttonSections).forEach(([sectionName, buttons]) => {
  buttons.forEach(button => {
    button.addEventListener('click', () => settingsButtonClick(buttonSections, sectionName, button));
  });
});

// Corner Buttons
cornersButtonClick(state.generateButton,   () => generate(false));
cornersButtonClick(state.toggleViewButton, () => toggleView());
cornersButtonClick(state.toggleEvalButton, () => toggleEvalBar());
cornersButtonClick(state.replayButton,     () => generate(true));

// Generate Initial Board
let initialBoard;
generate(false, true)

