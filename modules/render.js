import { state } from './state.js';



export function preloadPieceImages() {
  const styles = ['common', 'costum'];
  const endings = { common: '.svg', costum: '.png' };
  const pieces = ['K', 'Q', 'R', 'B', 'N', 'P'];

  styles.forEach(style => {
    const ending = endings[style];
    ['w', 'b'].forEach(color => {
      pieces.forEach(name => {
        const img = new Image();
        img.src = `pieces/${style}/${color}${name}${ending}`;
      });
    });
  });
}



export function renderBoard(boardContainer, COLS, ROWS, handleClick) {
  boardContainer.innerHTML = '';

  const labelsTop = document.createElement('div');
  labelsTop.className = 'board-labels-top';
  labelsTop.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;

  const labelsLeft = document.createElement('div');
  labelsLeft.className = 'board-labels-left';
  labelsLeft.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

  const board = document.createElement('div');
  board.className = 'board-grid';
  board.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
  board.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const square = document.createElement('div');
      square.className = 'square ' + ((x + y) % 2 === 0 ? 'white' : 'black');
      square.dataset.x = x;
      square.dataset.y = y;

      if (x === 0) {
      const labelWrap = document.createElement('div');
      labelWrap.className = 'label-wrap row-label-wrap';
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = (ROWS - y);
      labelWrap.appendChild(label);
      square.appendChild(labelWrap);
      }

      if (y === 0) {
      const labelWrap = document.createElement('div');
      labelWrap.className = 'label-wrap column-label-wrap';
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = String.fromCharCode(97 + x).toUpperCase();
      labelWrap.appendChild(label);
      square.appendChild(labelWrap);
      }

      const img = document.createElement('img');
      img.className = 'piece';
      img.draggable = false;
      square.appendChild(img);


      square.addEventListener('click', () => handleClick(x, y));
      board.appendChild(square);
    }
  }

  boardContainer.appendChild(board);
}



export function updatePieces(boardState, selectedPiece, validMoves) {
  document.querySelectorAll('.square').forEach(square => {
    const x = parseInt(square.dataset.x);
    const y = parseInt(square.dataset.y);
    const piece = boardState[y]?.[x];
    const img = square.querySelector('img');

    if (piece) {
      const color = piece === piece.toUpperCase() ? 'w' : 'b';
      const name = piece.toUpperCase();
      img.src = `pieces/${state.piecesStyle}/${color}${name}${state.piecesStyleEnding}`;
      img.style.display = 'block';
    } else {
      img.style.display = 'none';
    }

    square.classList.toggle('selected', selectedPiece && selectedPiece[0] == x && selectedPiece[1] == y);
    square.classList.toggle('valid-move', validMoves.some(([vx, vy]) => vx === x && vy === y));
  });
}



export function renderEvalBar (currentEvaluation = state.currentEvaluation, whitesTurn = false, iterativeDepth = state.iterativeDepth) {
  
  let evaluationText;
  if (!isFinite(currentEvaluation)) {
    console.warn("Invalid evaluation:", currentEvaluation);
    return;
  }
  
  if (currentEvaluation > -100000 && currentEvaluation < 100000) {
    let evalRatio = evalToRatio(currentEvaluation)
    state.evalBar.style.borderRadius = `0vmin 0vmin 2vmin 2vmin`
    state.evalBar.style.height = `${evalRatio * 100}%`;
    state.evalScoreBox.innerHTML = `${currentEvaluation.toFixed(1)}` 
  } else {
    if (currentEvaluation < 0) {
      state.evalBar.style.height = `0%`;
      if (whitesTurn) { 
        evaluationText = (iterativeDepth - (- currentEvaluation.toFixed(1) - 1000000))/2 
      } else {
        evaluationText = (iterativeDepth - (- currentEvaluation.toFixed(1) - 1000000))/2 - 0.5
      }
      
    } else {
      state.evalBar.style.borderRadius = `2vmin 2vmin 2vmin 2vmin`
      state.evalBar.style.height = `100%`;
      if (whitesTurn) {
        evaluationText = (iterativeDepth - (currentEvaluation - 1000000))/2 + 0.5
      } else {
        evaluationText = (iterativeDepth - (currentEvaluation - 1000000))/2 
      }
      
    }
    evaluationText = Math.ceil(evaluationText)
    state.evalScoreBox.innerHTML = `#${evaluationText}`
  }
}



export function evalToRatio(evalScore) {
  const maxEval = 30;
  const minEval = -30;
  const clampedEval = Math.max(minEval, Math.min(maxEval, evalScore));

  const steepness = 0.25; // Smaller = more gradual curve
  const sigmoid = 1 / (1 + Math.exp(-clampedEval * steepness));

  return 0.05 + sigmoid * 0.9;
}



export function toggleView(toggleViewButton = state.toggleViewButton) {

  if (state.view === "generationView") {

    state.controlBoard.style.display = 'none';

    if (state.showEvalBar) {
      state.evalBarContainer.style.display = 'flex';
    }

    state.view = "gameView";

    document.querySelectorAll('.label-wrap').forEach(el => {
    el.style.display = 'flex';
    });

  } else if (state.view === "gameView") {

    state.controlBoard.style.display = 'flex';

    if (state.showEvalBar) {
      state.evalBarContainer.style.display = 'none';
    }

    state.view = "generationView";

    document.querySelectorAll('.label-wrap').forEach(el => {
    el.style.display = 'none';
    });
  }
}



export function toggleEvalBar () {

  if (state.showEvalBar) {

    state.evalBarContainer.style.display = 'none';

    state.showEvalBar = false;

  } else if (!state.showEvalBar) {

    state.evalBarContainer.style.display = 'flex';

    state.showEvalBar = true;
  }
}



export function changePieces () {
  if (state.piecesStyle == "common") { 
    state.piecesStyle = "costum"
    state.piecesStyleEnding = ".png"
  } else {
    state.piecesStyle = "common"
    state.piecesStyleEnding = ".svg"
  }

  updatePieces(state.boardState, state.selectedPiece, state.validMoves)
}



export function playSound(type) {
  const arr = state.sounds[type];
  if (!arr) {
    console.warn(`No sound registered for type “${type}”`);
    return;
  }
  // pick one (random if more than one)
  const original = arr.length > 1
    ? arr[Math.floor(Math.random() * arr.length)]
    : arr[0];

  const clip = original.cloneNode();
  clip.play().catch(err => {
    console.error('Sound play failed', err);
  });
}
