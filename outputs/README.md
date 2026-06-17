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
```

Then open:

```text
index.html
```

Local and bot modes work from the file. Online mode uses Firebase Realtime Database.

## Test Locally

In a second terminal:

```powershell
cd C:\Users\amsal\Documents\Codex\2026-06-17\prompt-create-a-complete-snake-and
node work\test-game-rules.js
node work\test-frontend-static.js
```

## Deployment

This version is ready for free GitHub Pages hosting. The `.github/workflows/pages.yml`
workflow publishes the `outputs/` folder on every push to `main`.

Online rooms use Firebase Realtime Database project `snake-ladder-game-ee59e`.
