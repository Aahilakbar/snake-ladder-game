const assert = require("assert");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "../outputs/index.html"), "utf8");

function has(text, label) {
  assert.ok(html.includes(text), label);
}

has("Local Multiplayer", "mode screen includes local multiplayer");
has("Play With Bot", "mode screen includes bot mode");
has("Online Multiplayer", "mode screen includes online multiplayer");
has("Create Public Game", "online UI includes public room creation");
has("Create Private Game", "online UI includes private room creation");
has("Join Game", "online UI includes join by id");
has("GAME-4821", "readable game id example is shown");
has("Bot is thinking...", "bot thinking state exists");
has("const botRoll = Math.floor(Math.random() * 6) + 1;", "bot creates its own internal roll");
has("rollDice(botRoll);", "bot can roll despite human click lock");
has("navigator.clipboard.writeText", "copy game id flow exists");
has("firebase-database.js", "Firebase Realtime Database SDK is loaded");
has("getDatabase", "Firebase database is initialized");
has("onValue(roomReference", "real-time room listener exists");
has("onDisconnect", "disconnect handling exists");
has("createFirebaseRoom", "Firebase room creation exists");
has("joinFirebaseRoom", "Firebase room join exists");
has("requestOnlineRoll", "online roll request exists");
has("requestOnlineRestart", "online restart request exists");
has("computeMove", "shared movement rule function exists");
has("window.SnakeGameTest", "frontend test hooks exist");
has("@media (max-width: 480px)", "mobile responsive styles exist");
has("grid-template-columns: repeat(10, 1fr)", "10-column board exists");
has("for (let displayIndex = 0; displayIndex < 100; displayIndex++)", "100 cells are generated");
has("ladders[proposedMove]", "ladder rule is present");
has("snakes[proposedMove]", "snake rule is present");

assert.equal((html.match(/class="choice-card"/g) || []).length >= 5, true, "mode and online choices are rendered");
assert.equal((html.match(/<script type="module">/g) || []).length, 1, "game logic remains in one module script block");
assert.ok(html.includes("snake-ladder-game-ee59e"), "Firebase project config is present");

console.log("Frontend static feature tests passed.");
