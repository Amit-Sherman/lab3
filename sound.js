/* global COIN_DASH */
// Synthesized sound effects (Web Audio). Fails silently when audio is unavailable.
window.CoinDashSound = (() => {
  const cfg = Object.assign({ enabled: true, volume: 0.25, muteKey: 'm' }, COIN_DASH.sound);
  let ctx = null;
  let muted = !cfg.enabled;

  const unlock = () => {
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
    } catch (e) { ctx = null; }
  };
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', e => {
    if (!e.repeat && e.key.toLowerCase() === cfg.muteKey) muted = !muted;
  });

  // notes: [frequency Hz, start offset s, duration s]
  const play = (type, notes, level = 1) => {
    if (muted || !ctx || ctx.state !== 'running') return;
    try {
      const t0 = ctx.currentTime;
      for (const [freq, at, dur] of notes) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = t0 + at;
        osc.type = type;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(cfg.volume * level, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur + 0.02);
      }
    } catch (e) { /* ignore */ }
  };

  return {
    coin: () => play('square', [[880, 0, 0.07], [1320, 0.06, 0.12]], 0.5),
    hit: () => play('sawtooth', [[220, 0, 0.15], [165, 0.12, 0.18], [110, 0.27, 0.3]], 0.7),
    timeUp: () => play('triangle', [[660, 0, 0.15], [523, 0.15, 0.15], [392, 0.3, 0.35]]),
    toggle: () => (muted = !muted),
    get muted() { return muted; }
  };
})();
