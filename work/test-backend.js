const assert = require("assert");
const http = require("http");

const base = process.env.TEST_BASE || "http://127.0.0.1:8766";

async function json(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function request(path, body) {
  return json(path, { method: "POST", body: JSON.stringify(body || {}) });
}

function openEvents(roomId, playerIndex, onData) {
  const req = http.get(`${base}/api/rooms/${roomId}/events?player=${playerIndex}`, res => {
    res.setEncoding("utf8");
    res.on("data", chunk => {
      chunk.split("\n\n").forEach(part => {
        if (part.startsWith("data: ")) onData(JSON.parse(part.slice(6)));
      });
    });
  });
  return req;
}

(async () => {
  const health = await json("/api/health");
  assert.equal(health.response.status, 200, "health endpoint works");

  const publicRoom = await request("/api/rooms", { type: "public" });
  assert.equal(publicRoom.response.status, 201, "create public game");
  assert.match(publicRoom.body.room.id, /^GAME-\d{4}$/, "public game id is readable");

  const privateRoom = await request("/api/rooms", { type: "private" });
  assert.equal(privateRoom.response.status, 201, "create private game");
  assert.equal(privateRoom.body.room.type, "private", "private room type is stored");

  const invalidJoin = await request("/api/rooms/GAME-0000/join");
  assert.equal(invalidJoin.response.status, 404, "invalid game id returns friendly error");

  const id = publicRoom.body.room.id;
  const updates = [];
  const hostStream = openEvents(id, 0, data => updates.push(data));
  await new Promise(resolve => setTimeout(resolve, 120));

  const joined = await request(`/api/rooms/${id}/join`);
  assert.equal(joined.response.status, 200, "join valid game");
  assert.equal(joined.body.room.state.connectedPlayers, 2, "connected player count syncs");

  const full = await request(`/api/rooms/${id}/join`);
  assert.equal(full.response.status, 409, "full room returns error");

  const wrongTurn = await request(`/api/rooms/${id}/roll`, { playerIndex: 1 });
  assert.equal(wrongTurn.response.status, 403, "only current player can roll");

  const p1Roll = await request(`/api/rooms/${id}/roll`, { playerIndex: 0 });
  assert.equal(p1Roll.response.status, 200, "player 1 rolls");
  assert.equal(p1Roll.body.room.state.currentPlayer, 1, "turn switches to player 2");
  assert.ok(p1Roll.body.room.state.diceResult >= 1 && p1Roll.body.room.state.diceResult <= 6, "dice result syncs");

  const p2Roll = await request(`/api/rooms/${id}/roll`, { playerIndex: 1 });
  assert.equal(p2Roll.response.status, 200, "player 2 rolls");
  assert.equal(p2Roll.body.room.state.currentPlayer, 0, "turn switches to player 1");
  assert.ok(p2Roll.body.room.state.lastMove, "last movement syncs");

  const restart = await request(`/api/rooms/${id}/restart`, { playerIndex: 0 });
  assert.equal(restart.response.status, 200, "restart works");
  assert.deepEqual(restart.body.room.state.players, [1, 1], "restart resets positions");

  hostStream.destroy();
  await new Promise(resolve => setTimeout(resolve, 120));
  assert.ok(updates.length >= 2, "server streams room updates");

  console.log("Backend online-room tests passed.");
})().catch(error => {
  console.error(error);
  process.exit(1);
});
