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
  colors: { background: 0x101c31, player: 0x22c55e, coin: 0xffd166, drone: 0xff657a },
  sound: { enabled: true, volume: 0.25, muteKey: 'm' }
};
