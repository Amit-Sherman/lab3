# Coin Dash — Lab 3 starter

Collect coins, avoid enemies, and clear five levels before the round runs out. Move with arrow keys
or WASD; press P (or Esc) to pause and R to restart. This is deliberately small so you can add
features during the lab.

Every 5 coins starts the next level, which brings a new mix of enemies: red bouncers, violet
chasers (home in on the nearest player), mint coin guards (orbit the coin) and orange dashers
(flash and show a charge line, then dash). Clearing level 5 wins the run. You have three lives;
after a hit you blink and are briefly invincible, and a new level gives a short grace period.
Levels live in `settings.js` under `levels`.

Power-ups appear every 8–12 seconds and vanish after 6: a blue triangle (speed boost), a purple
diamond (shield that absorbs one enemy hit) and a white star (+5 seconds).

Press 1, 2 or 3 to pick the Easy, Normal or Hard preset and restart the round. Presets live in
`settings.js` under `difficulties` (Easy: 60 s, 4 lives, slower enemies; Normal: 45 s, 3 lives;
Hard: 30 s, 2 lives, faster enemies); the choice is remembered in the browser.

Press T to toggle a competitive two-player mode (P1 green on WASD, P2 blue on the arrow keys).
Each player has their own lives and is knocked out when they run out; coins from either player
advance the level, and the most coins wins. Speed and shield power-ups go to whoever grabs them;
the time bonus is shared.

Your best score is saved in the browser's `localStorage` and survives a reload
(if storage is blocked, it is kept for the current session only).

**Play it here:** https://www.avivz.net/coin-dash/

## Run it locally

Clone the repository and open `index.html` in a browser. Everything is in the repository;
there is no package to install, no build step, no backend, and nothing is fetched from the network.
If your agent prefers a local server, let it serve this folder, for example with
`python3 -m http.server 8000`, and open `http://localhost:8000`.

## Use it in the lab

This is a template repository. One partner creates the pair's own repository from it
(the **Use this template** button, or `gh repo create <name> --template avivz/coin-dash --public --clone`)
and adds the other partner as a collaborator. Both clone it and open `index.html`.

## Lab report

The repository includes a `lab-report` skill: use `/lab-report` in Claude Code or `$lab-report`
in Codex, for the pre-lab practice run and at the end of the lab. Give it your name, a unique
laptop label, and the session's start and end times with timezone. If it is not listed, ask
your agent to read `.claude/skills/lab-report/SKILL.md` and follow it.

The skill writes a JSON export and a report page under `reports/`, which Git ignores.
Open that page, load your JSON, and check the result. For the final pair report, load both
laptops' JSON files together and save the combined HTML. Use the same time window on both laptops.

## Files

- `.claude/skills/lab-report/`: reporting skill and offline HTML page.
- `.agents/skills/lab-report`: link to the same skill for Codex.
- `.gitignore`: keeps generated reports out of Git.
- `index.html`: page and script loading.
- `style.css`: page appearance.
- `settings.js`: round duration, lives, level layouts, enemy tuning, speeds, difficulty presets,
  colours and dimensions.
- `sound.js`: synthesized sound effects (Web Audio) and the M mute toggle.
- `game.js`: scene, input, enemy behaviours, levels, lives, collisions, score and end-of-round behaviour.
- `vendor/phaser-3.90.0.min.js`: the pinned Phaser runtime, byte for byte the file published at
  `https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js`; `vendor/LICENSE.phaser.txt` is its MIT licence.

The game draws its own shapes and synthesizes its sounds with the Web Audio API; there are no image
or audio assets. The authored files are under the MIT licence in LICENSE.txt. Phaser documentation:
https://docs.phaser.io/phaser/getting-started/making-your-first-phaser-game
