// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  playerSpeed: 240,
  lives: 3,
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
  colors: {
    background: 0x101c31, player: 0x22c55e, coin: 0xffd166,
    bouncer: 0xff657a, chaser: 0xa78bfa, guard: 0x38bdf8, dasher: 0xfb923c, warning: 0xffffff
  }
};
