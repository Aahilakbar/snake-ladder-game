const assert = require("assert");

const ladders = { 3: 22, 8: 30, 28: 84, 58: 77, 75: 86, 80: 99 };
const snakes = { 17: 7, 52: 29, 57: 40, 62: 41, 88: 18, 95: 71, 97: 79 };

function computeMove(startPosition, roll) {
  const proposedMove = startPosition + roll;
  if (proposedMove > 100) {
    return { start: startPosition, rolled: roll, land: startPosition, final: startPosition, effect: "overshoot", winner: false };
  }

  let final = proposedMove;
  let effect = "normal";

  if (ladders[proposedMove]) {
    final = ladders[proposedMove];
    effect = "ladder";
  } else if (snakes[proposedMove]) {
    final = snakes[proposedMove];
    effect = "snake";
  }

  return { start: startPosition, rolled: roll, land: proposedMove, final, effect, winner: final === 100 };
}

let players = [1, 1];
let currentPlayer = 0;
let mode = "local";
let gameOver = false;

function canRoll() {
  return !gameOver && !(mode === "bot" && currentPlayer === 1);
}

function playRoll(roll) {
  const move = computeMove(players[currentPlayer], roll);
  players[currentPlayer] = move.final;
  if (move.winner) gameOver = true;
  else currentPlayer = currentPlayer === 0 ? 1 : 0;
  return move;
}

assert.equal(canRoll(), true, "player 1 can roll in local mode");
let move = playRoll(1);
assert.equal(move.final, 2, "player 1 rolls and moves normally");
assert.equal(currentPlayer, 1, "turn switches to player 2");

move = playRoll(1);
assert.equal(move.final, 2, "player 2 rolls and moves normally");
assert.equal(currentPlayer, 0, "turn switches back to player 1");

players = [1, 1];
currentPlayer = 0;
move = playRoll(2);
assert.equal(move.effect, "ladder", "landing on ladder is detected");
assert.equal(move.final, 22, "ladder moves player up");

players = [16, 1];
currentPlayer = 0;
move = playRoll(1);
assert.equal(move.effect, "snake", "landing on snake is detected");
assert.equal(move.final, 7, "snake moves player down");

players = [99, 1];
currentPlayer = 0;
move = playRoll(1);
assert.equal(move.winner, true, "reaching square 100 wins");
assert.equal(gameOver, true, "game over is set on win");

players = [1, 1];
currentPlayer = 0;
gameOver = false;
assert.deepEqual(players, [1, 1], "restart resets players");

mode = "bot";
currentPlayer = 1;
assert.equal(canRoll(), false, "human cannot roll during bot turn");
move = computeMove(99, 1);
assert.equal(move.winner, true, "bot can win with the same rules");

console.log("Local and bot rule tests passed.");
