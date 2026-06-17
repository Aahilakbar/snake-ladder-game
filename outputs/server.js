const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const port = Number(process.env.PORT || process.argv[2] || 8765);
const host = process.env.HOST || "0.0.0.0";
const root = __dirname;
const rooms = new Map();

const ladders = {
  3: 22,
  8: 30,
  28: 84,
  58: 77,
  75: 86,
  80: 99
};

const snakes = {
  17: 7,
  52: 29,
  57: 40,
  62: 41,
  88: 18,
  95: 71,
  97: 79
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1e6) {
        reject(new Error("Request body is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("Invalid JSON body."));
      }
    });
  });
}

function generateGameId() {
  let id;
  do {
    id = `GAME-${Math.floor(1000 + Math.random() * 9000)}`;
  } while (rooms.has(id));
  return id;
}

function publicRoom(room) {
  return {
    id: room.id,
    type: room.type,
    state: {
      ...room.state,
      connectedPlayers: room.players.filter(Boolean).length
    }
  };
}

function createRoom(type) {
  const id = generateGameId();
  const room = {
    id,
    type: type === "private" ? "private" : "public",
    players: [true, false],
    clients: new Set(),
    state: freshState()
  };
  rooms.set(id, room);
  return room;
}

function freshState() {
  return {
    players: [1, 1],
    currentPlayer: 0,
    diceResult: null,
    winner: null,
    lastMove: null,
    disconnected: false,
    connectedPlayers: 1
  };
}

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

function broadcast(room) {
  const payload = `data: ${JSON.stringify({ type: "state", room: publicRoom(room) })}\n\n`;
  room.clients.forEach(client => client.write(payload));
}

function serveStatic(req, res) {
  const safePath = req.url === "/" ? "index.html" : decodeURIComponent(req.url.slice(1));
  const filePath = path.normalize(path.join(root, safePath));

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath);
    const type = ext === ".js" ? "text/javascript" : ext === ".png" ? "image/png" : "text/html";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(data);
  });
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split("/").filter(Boolean);

  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      sendJson(res, 200, { ok: true, rooms: rooms.size });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/rooms") {
      const body = await readBody(req);
      const room = createRoom(body.type);
      sendJson(res, 201, { room: publicRoom(room) });
      broadcast(room);
      return;
    }

    if (parts[0] === "api" && parts[1] === "rooms" && parts[2]) {
      const room = rooms.get(parts[2].toUpperCase());
      if (!room) {
        sendJson(res, 404, { error: "Game ID not found." });
        return;
      }

      if (req.method === "POST" && parts[3] === "join") {
        if (room.players[1]) {
          sendJson(res, 409, { error: "This game is already full." });
          return;
        }
        room.players[1] = true;
        room.state.disconnected = false;
        room.state.connectedPlayers = room.players.filter(Boolean).length;
        sendJson(res, 200, { room: publicRoom(room) });
        broadcast(room);
        return;
      }

      if (req.method === "GET" && parts[3] === "events") {
        const playerIndex = Number(url.searchParams.get("player"));
        res.writeHead(200, {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-store",
          Connection: "keep-alive"
        });
        room.clients.add(res);
        room.players[playerIndex] = true;
        room.state.disconnected = false;
        room.state.connectedPlayers = room.players.filter(Boolean).length;
        res.write(`data: ${JSON.stringify({ type: "state", room: publicRoom(room) })}\n\n`);
        broadcast(room);
        req.on("close", () => {
          room.clients.delete(res);
          if (playerIndex === 0 || playerIndex === 1) {
            room.players[playerIndex] = false;
            room.state.disconnected = true;
            room.state.connectedPlayers = room.players.filter(Boolean).length;
            broadcast(room);
          }
        });
        return;
      }

      if (req.method === "POST" && parts[3] === "roll") {
        const body = await readBody(req);
        const playerIndex = Number(body.playerIndex);
        if (room.state.winner !== null) {
          sendJson(res, 409, { error: "The game is already over." });
          return;
        }
        if (room.players.filter(Boolean).length < 2) {
          sendJson(res, 409, { error: "Wait for an opponent before rolling." });
          return;
        }
        if (playerIndex !== room.state.currentPlayer) {
          sendJson(res, 403, { error: "It is not your turn." });
          return;
        }

        const roll = crypto.randomInt(1, 7);
        const move = computeMove(room.state.players[playerIndex], roll);
        room.state.players[playerIndex] = move.final;
        room.state.diceResult = roll;
        room.state.lastMove = { ...move, playerIndex };
        if (move.winner) {
          room.state.winner = playerIndex;
        } else {
          room.state.currentPlayer = playerIndex === 0 ? 1 : 0;
        }

        sendJson(res, 200, { room: publicRoom(room) });
        broadcast(room);
        return;
      }

      if (req.method === "POST" && parts[3] === "restart") {
        const body = await readBody(req);
        const playerIndex = Number(body.playerIndex);
        if (playerIndex !== 0 && playerIndex !== 1) {
          sendJson(res, 403, { error: "Only room players can restart this game." });
          return;
        }
        room.state = freshState();
        room.state.connectedPlayers = room.players.filter(Boolean).length;
        sendJson(res, 200, { room: publicRoom(room) });
        broadcast(room);
        return;
      }
    }

    sendJson(res, 404, { error: "Endpoint not found." });
  } catch (error) {
    sendJson(res, 400, { error: error.message });
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    handleApi(req, res);
    return;
  }
  serveStatic(req, res);
});

server.listen(port, host, () => {
  console.log(`Snake Ladder server running at http://${host}:${port}`);
});
