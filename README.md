# TinyChess - Chess Position Generator with AI

Generate and play custom chess positions at tiny board sizes, test your tactics with a built-in AI, and explore puzzles generated on the fly.

[Play it here!](https://pascalpan.com/creations/TinyChess/)

## Features

* **Custom Board Generation**: Random, Spin, Mirror, Puzzle modes

* **Configurable Parameters**: Board size, piece selection, density

* **AI Opponent**:

  * Minimax with alpha‑beta pruning
  * Quiescent search for tactical depth
  * Zobrist hashing & transposition table
  * Iterative deepening with time limits
  * Move tree visualization & performance metrics

* **Interactive UI**:

  * Click-to-move with full legality checks (en passant, promotions, castling)
  * Real-time evaluation bar

## Usage

1. **Select Settings**: Choose board size (N×N), density, and generation mode.
2. **Generate** a new position or **Replay** the last one.
3. **Play**:

   * Click a piece to highlight valid moves.
   * Click a target square to execute the move.
   * Watch the AI respond automatically for the opposing side.
4. **Toggle Views**: Use the **Toggle View** button to show/hide generation controls.
5. **Toggle Evaluation**: Show or hide the evaluation bar with the **Toggle Eval** button.

## Configuration

All core logic resides in `./modules/`:

* `ai.js`
* `moveValidation.js`
* `gameState.js`
* `boardGenerator.js`
* `render.js`
* `moveHandler.js`

Adjust engine and generation parameters in `modules/state.js` (e.g., `BruteForceDepth`, `SeqDepth`, `Timelimit`, `PuzzleGenerationTimelimit`).
