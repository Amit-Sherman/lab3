// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  lives: 3,
  enemySpeedScale: 1,
  // Each preset sets the round length, player speed, lives and a multiplier on every enemy speed.
  difficulties: {
    easy: { label: 'Easy', roundSeconds: 60, playerSpeed: 260, lives: 4, enemySpeedScale: 0.75 },
    normal: { label: 'Normal', roundSeconds: 45, playerSpeed: 240, lives: 3, enemySpeedScale: 1 },
    hard: { label: 'Hard', roundSeconds: 30, playerSpeed: 230, lives: 2, enemySpeedScale: 1.33 }
  },
  defaultDifficulty: 'normal',
  highScoreKey: 'coinDash.highScore',
  hitInvincibleMs: 1500,
  levelStartGraceMs: 1000,
  coinsPerLevel: 5,
  enemySpawnMinDistance: 170,
  enemies: {
    bouncer: { size: 26, speed: 105 },
    chaser: { size: 22, speed: 75 },
    guard: { size: 20, orbitRadius: 70, orbitSpeed: 2.4, maxSpeed: 280 },
    dasher: { size: 24, restMs: 1300, windupMs: 750, dashMs: 650, dashSpeed: 430 }
  },
  // Each level lists how many of each enemy type to spawn. Clearing the last level wins the run.
  levels: [
    { bouncer: 2 },
    { bouncer: 2, chaser: 1 },
    { bouncer: 1, chaser: 1, guard: 1 },
    { bouncer: 2, guard: 1, dasher: 1 },
    { bouncer: 2, chaser: 1, guard: 1, dasher: 2 }
  ],
  colors: { background: 0x0d0221, player: 0x39ff14, player2: 0x38bdf8, coin: 0xffe600, drone: 0xff2a6d,
    bouncer: 0xff2a6d, chaser: 0xc04bff, guard: 0x00ffc8, dasher: 0xff8c00, warning: 0xffffff,
    grid: 0x9d4edd, accent: 0x05d9e8, panel: 0x150530, outline: 0xf5f0ff },
  sound: { enabled: true, volume: 0.25, muteKey: 'm' },
  powerUps: {
    minDelay: 8, maxDelay: 12, lifetime: 6, speedSeconds: 5, speedMultiplier: 1.6,
    shieldSeconds: 5, graceSeconds: 1, timeBonus: 5,
    colors: { speed: 0x38bdf8, shield: 0xa78bfa, time: 0xf8fafc }
  }
};
