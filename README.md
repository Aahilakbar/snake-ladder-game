# Snake Ladder Game

A colorful Snake and Ladder game with local multiplayer, bot mode, and online multiplayer rooms.

## Features

- 10x10 numbered board from 1 to 100
- Visual snakes and ladders
- Local two-player mode
- Bot mode with automatic bot turns
- Online multiplayer rooms with readable game IDs
- Public/private room creation
- Join game by ID
- Dice and player movement animations
- Responsive layout for desktop and mobile

## Live Site

After GitHub Pages is enabled for this repository, the game will be available at:

```text
https://aahilakbar.github.io/snake-ladder-game/
```

## Online Multiplayer

Online rooms use Firebase Realtime Database.

If online rooms do not connect, check that Realtime Database is enabled for the Firebase project and that the database rules allow reads/writes for testing.

## Project Structure

```text
.
+-- .github/workflows/pages.yml
+-- outputs/
|   +-- index.html
+-- .gitignore
+-- README.md
```

## Run Locally

Open this file in a browser:

```text
outputs/index.html
```

Local multiplayer and bot mode work directly from the file. Online multiplayer requires internet access to Firebase.

## Deploy

This repo includes a GitHub Pages workflow that publishes the `outputs` folder.

To enable it:

1. Open the repository settings on GitHub.
2. Go to **Pages**.
3. Select **GitHub Actions** as the source, or use the pushed `gh-pages` branch.
4. Wait for the Pages deployment to finish.
