# Snake Ladder Game

## Folder Structure

```text
outputs/
  index.html          # Game UI, board, local multiplayer, bot mode, online client
  server.js           # No-dependency Node room server for online play
  README.md           # Setup, tests, and deployment notes

work/
  test-game-rules.js        # Local multiplayer and bot rule checks
  test-backend.js           # Online-room API tests
  test-frontend-static.js   # Frontend feature/static checks
```

## Run Locally

```powershell
cd C:\Users\amsal\Documents\Codex\2026-06-17\prompt-create-a-complete-snake-and\outputs
node server.js 8765
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

## Test Locally

In a second terminal:

```powershell
cd C:\Users\amsal\Documents\Codex\2026-06-17\prompt-create-a-complete-snake-and
node work\test-game-rules.js
node work\test-frontend-static.js
$env:TEST_BASE='http://127.0.0.1:8765'; node work\test-backend.js
```

## Deployment

Deployment has not been performed. After approval, the easiest free path is usually:

1. Use a Node-capable free host for `server.js`, or adapt the online layer to Firebase Realtime Database.
2. Use a related site name such as `snake-ladder-game`.
3. Verify online rooms after hosting before sharing the public URL.
