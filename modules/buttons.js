import { playSound } from './render.js';
import { state } from './state.js';

export function cornersButtonClick(el, handler) {
  el.addEventListener("click", e => {
    playSound("click");
    handler(e);
  });
}

export function settingsButtonClick(buttonSections, sectionName, button) {
    // handles buttons in the board generation settings view

  const id = button.id;
  const isActive = button.classList.contains('active');
  state.engineTimeContainer.style.transition = `1s`;
  state.engineTimeContainer.style.opacity = `100%`;

  if (sectionName === 'pieces') {
    if (isActive) {
      if (state.selectedPieces.length >= 2) {
      button.classList.remove('active');
      state.selectedPieces = state.selectedPieces.filter(pid => pid !== id);
      state.engineTimeContainer.innerHTML = `Piece excluded: ${id.toUpperCase()}`
      }
    } else {
      button.classList.add('active');
      state.selectedPieces.push(id);
      state.engineTimeContainer.innerHTML = `Piece included: ${id.toUpperCase()}` 
    }
  } else {
    buttonSections[sectionName].forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    if (sectionName === 'size') {
      state.selectedSize = id;
      state.engineTimeContainer.innerHTML = `Board size: ${id} x ${id}`
    }
    if (sectionName === 'density') {
      state.selectedDensity = id;
      state.engineTimeContainer.innerHTML = `Board density: ${id*100}%`
    }
    if (sectionName === 'mode') {
      state.selectedMode = id;
      state.engineTimeContainer.innerHTML = `Board generation mode: ${id}`
    }
  }
}