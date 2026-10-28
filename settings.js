// Keep tuning separate from game behaviour so features can be developed independently.
window.COIN_DASH = {
  width: 800,
  height: 500,
  roundSeconds: 45,
  playerSpeed: 240,
  droneSpeed: 105,
  droneCount: 3,
  difficulties: {
    easy: { label: 'Easy', roundSeconds: 60, playerSpeed: 260, droneSpeed: 80, droneCount: 2 },
    normal: { label: 'Normal', roundSeconds: 45, playerSpeed: 240, droneSpeed: 105, droneCount: 3 },
    hard: { label: 'Hard', roundSeconds: 30, playerSpeed: 230, droneSpeed: 140, droneCount: 5 }
  },
  defaultDifficulty: 'normal',
  highScoreKey: 'coinDash.highScore',
  colors: { background: 0x0d0221, player: 0x39ff14, coin: 0xffe600, drone: 0xff2a6d,
    grid: 0x9d4edd, accent: 0x05d9e8, panel: 0x150530, outline: 0xf5f0ff },
  sound: { enabled: true, volume: 0.25, muteKey: 'm' },
  powerUps: {
    minDelay: 8, maxDelay: 12, lifetime: 6, speedSeconds: 5, speedMultiplier: 1.6,
    shieldSeconds: 5, graceSeconds: 1, timeBonus: 5,
    colors: { speed: 0x38bdf8, shield: 0xa78bfa, time: 0xf8fafc }
  }
};
