/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const d = COIN_DASH.difficulties;
    if (!d[this.difficulty]) {
      try { this.difficulty = localStorage.getItem('coinDash.difficulty'); } catch (e) { /* no storage */ }
      if (!d[this.difficulty]) this.difficulty = COIN_DASH.defaultDifficulty;
    }
    const c = this.cfg = { ...COIN_DASH, ...d[this.difficulty] };
    // The registry survives scene restarts, so the chosen mode sticks until changed.
    this.playerCount = this.registry.get('playerCount') || 1;
    this.best = this.loadHighScore();
    this.finished = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, c.colors.grid, 0.3);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    const wasd = { up: this.keys.W, down: this.keys.S, left: this.keys.A, right: this.keys.D };
    // In single-player both key sets drive the one player; in two-player P1 is WASD, P2 is arrows.
    const specs = this.playerCount === 1
      ? [{ name: 'Player', x: c.width / 2, color: c.colors.player, controls: [wasd, this.cursors] }]
      : [
        { name: 'P1', x: c.width / 2 - 80, color: c.colors.player, controls: [wasd] },
        { name: 'P2', x: c.width / 2 + 80, color: c.colors.player2, controls: [this.cursors] }
      ];
    this.players = specs.map(spec => {
      const sprite = this.add.rectangle(spec.x, c.height / 2, 24, 24, spec.color);
      this.physics.add.existing(sprite);
      sprite.body.setCollideWorldBounds(true);
      return { ...spec, sprite, score: 0, out: false };
    });
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.initPowerUps();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(c.width * (i + 0.5) / c.droneCount, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.styleScene();
    for (const player of this.players) {
      this.physics.add.overlap(player.sprite, this.coin, () => {
        if (this.finished || player.out) return;
        player.score++;
        window.CoinDashSound.coin();
        this.placeCoin();
      });
      this.physics.add.overlap(player.sprite, this.drones, () => this.knockOut(player),
        () => !this.shieldBlocks(player));
    }
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    // 1/2/3 pick the difficulty, so the player-count toggle lives on T.
    this.input.keyboard.on('keydown-T', () => this.setPlayerCount(3 - this.playerCount));
    this.paused = false;
    this.time.paused = false;
    this.pauseOverlay = this.add.container(c.width / 2, c.height / 2, [
      this.add.rectangle(0, 0, 460, 100, c.colors.panel, 0.94).setStrokeStyle(2, c.colors.accent),
      this.add.text(0, 0, 'Paused — press P to resume',
        { ...this.neonText(24, c.colors.outline, c.colors.accent), align: 'center' }).setOrigin(0.5)
    ]).setDepth(20).setVisible(false);
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());
    Object.entries({ ONE: 'easy', TWO: 'normal', THREE: 'hard' }).forEach(([key, name]) =>
      this.input.keyboard.on(`keydown-${key}`, () => this.setDifficulty(name)));
  }

  setDifficulty(name) {
    this.difficulty = name;
    try { localStorage.setItem('coinDash.difficulty', name); } catch (e) { /* no storage */ }
    this.scene.restart();
  }

  setPlayerCount(count) {
    this.registry.set('playerCount', count);
    this.scene.restart();
  }

  knockOut(player) {
    if (this.finished || player.out) return;
    player.out = true;
    player.sprite.body.setVelocity(0, 0);
    player.sprite.body.enable = false;
    player.sprite.setAlpha(0.3);
    player.shieldRing.setVisible(false);
    if (this.players.every(p => p.out)) {
      this.finish(this.playerCount === 1 ? 'A drone caught you!' : 'Both players were caught!');
    } else {
      window.CoinDashSound.hit();
    }
  }

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    this.time.paused = this.paused; // freezes power-up spawn/expiry timers
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
    } else {
      const pausedFor = this.time.now - this.pausedAt;
      this.deadline += pausedFor;
      for (const target of [this, ...this.players]) {
        for (const k of ['speedUntil', 'shieldUntil', 'invulnerableUntil', 'bonusUntil']) {
          if (target[k] > this.pausedAt) target[k] += pausedFor;
        }
      }
      this.physics.resume();
    }
  }

  styleScene() {
    const c = COIN_DASH, k = c.colors;
    const glow = (obj, color, strength) => obj.postFX?.addGlow(color, strength, 0, false, 0.1, 12);
    this.players.forEach(p => {
      p.sprite.setStrokeStyle(2, k.outline, 0.9);
      glow(p.sprite, p.color, 4);
    });
    this.coin.setStrokeStyle(2, k.outline, 0.8);
    const coinGlow = glow(this.coin, k.coin, 2);
    if (coinGlow) {
      this.tweens.add({ targets: coinGlow, outerStrength: 6, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.coinRing = this.add.circle(this.coin.x, this.coin.y, 12).setStrokeStyle(2, k.coin);
    this.tweens.add({ targets: this.coinRing, scale: 2, alpha: 0, duration: 1100, repeat: -1, ease: 'Cubic.easeOut' });
    const follow = () => this.coinRing.setPosition(this.coin.x, this.coin.y);
    this.events.on('postupdate', follow);
    this.events.once('shutdown', () => this.events.off('postupdate', follow));
    this.drones.getChildren().forEach(d => {
      d.setFillStyle(k.drone, 0.45).setStrokeStyle(2, k.drone);
      glow(d, k.drone, 4);
    });
    const g = this.add.graphics().setDepth(5);
    g.fillStyle(k.background, 0.85).fillRect(0, 0, c.width, 44);
    g.lineStyle(2, k.accent, 0.9).lineBetween(0, 44, c.width, 44);
    g.fillStyle(0x000000, 0.14);
    for (let y = 0; y < c.height; y += 4) g.fillRect(0, y, c.width, 1);
    for (let i = 0; i < 8; i++) {
      const inset = 4 + i * 8;
      g.lineStyle(8, 0x000000, 0.035 * (8 - i)).strokeRect(inset, inset, c.width - inset * 2, c.height - inset * 2);
    }
    this.hud.setStyle(this.neonText(18, k.accent)).setDepth(10);
    this.powerUpLabel.setStyle(this.neonText(18, k.outline, k.accent)).setDepth(10);
  }

  neonText(size, color, glow = color) {
    const css = n => `#${n.toString(16).padStart(6, '0')}`;
    return {
      fontFamily: 'ui-monospace, Menlo, Consolas, monospace', fontSize: `${size}px`, fontStyle: 'bold',
      color: css(color), padding: { x: 8, y: 8 },
      shadow: { color: css(glow), blur: 12, fill: true, offsetX: 0, offsetY: 0 }
    };
  }

  placeCoin() {
    const c = COIN_DASH;
    // Avoid spawning the next coin directly underneath any active player.
    const active = this.players.filter(p => !p.out).map(p => p.sprite);
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (active.some(s => Phaser.Math.Distance.Between(x, y, s.x, s.y) < 60));
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update() {
    if (this.finished || this.paused) return;
    const now = this.time.now;
    const held = (controls, dir) => controls.some(keys => keys[dir].isDown);
    for (const player of this.players) {
      if (player.out) continue;
      const boost = now < player.speedUntil ? COIN_DASH.powerUps.speedMultiplier : 1;
      const dx = Number(held(player.controls, 'right')) - Number(held(player.controls, 'left'));
      const dy = Number(held(player.controls, 'down')) - Number(held(player.controls, 'up'));
      const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(this.cfg.playerSpeed * boost);
      player.sprite.body.setVelocity(direction.x, direction.y);
    }
    const seconds = Math.max(0, Math.ceil((this.deadline - now) / 1000));
    const scores = this.playerCount === 1
      ? `Coins: ${this.players[0].score}`
      : this.players.map(p => `${p.name}: ${p.score}${p.out ? ' (out)' : ''}`).join('  ');
    this.hud.setText(`${scores}   Best: ${this.best}   ${this.cfg.label}   Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
    this.updatePowerUps();
  }

  initPowerUps() {
    const c = COIN_DASH;
    this.bonusUntil = 0;
    this.powerUp = null;
    // Speed and shield belong to whoever picks them up; the time bonus is shared.
    for (const player of this.players) {
      Object.assign(player, { speedUntil: 0, shieldUntil: 0, invulnerableUntil: 0 });
      player.shieldRing = this.add.circle(0, 0, 21).setStrokeStyle(3, c.powerUps.colors.shield)
        .setVisible(false);
    }
    this.powerUpLabel = this.add.text(c.width - 18, 12, '', { font: '18px monospace', color: '#ffffff' })
      .setOrigin(1, 0);
    this.schedulePowerUp();
  }

  schedulePowerUp() {
    const p = COIN_DASH.powerUps;
    const delay = Phaser.Math.Between(p.minDelay * 1000, p.maxDelay * 1000);
    this.time.delayedCall(delay, () => this.spawnPowerUp());
  }

  spawnPowerUp() {
    if (this.finished || this.powerUp) return;
    const c = COIN_DASH, colors = c.powerUps.colors;
    const active = this.players.filter(p => !p.out).map(p => p.sprite);
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (active.some(s => Phaser.Math.Distance.Between(x, y, s.x, s.y) < 60)
      || Phaser.Math.Distance.Between(x, y, this.coin.x, this.coin.y) < 30);
    const type = Phaser.Utils.Array.GetRandom(['speed', 'shield', 'time']);
    const shape = type === 'speed' ? this.add.triangle(x, y, 0, 20, 10, 0, 20, 20, colors.speed)
      : type === 'shield' ? this.add.rectangle(x, y, 15, 15, colors.shield).setAngle(45)
      : this.add.star(x, y, 5, 5, 11, colors.time);
    this.tweens.add({ targets: shape, scale: 1.25, duration: 300, yoyo: true, repeat: -1 });
    const expiry = this.time.delayedCall(c.powerUps.lifetime * 1000, () => this.clearPowerUp());
    this.powerUp = { type, shape, expiry };
  }

  clearPowerUp() {
    if (!this.powerUp) return;
    this.powerUp.expiry.remove();
    this.powerUp.shape.destroy();
    this.powerUp = null;
    this.schedulePowerUp();
  }

  applyPowerUp(type, player) {
    const p = COIN_DASH.powerUps, now = this.time.now;
    if (type === 'speed') player.speedUntil = now + p.speedSeconds * 1000;
    else if (type === 'shield') player.shieldUntil = now + p.shieldSeconds * 1000;
    else {
      this.deadline += p.timeBonus * 1000;
      this.bonusUntil = now + 1500;
    }
  }

  shieldBlocks(player) {
    const now = this.time.now;
    if (now < player.invulnerableUntil) return true;
    if (now >= player.shieldUntil) return false;
    player.shieldUntil = 0;
    player.invulnerableUntil = now + COIN_DASH.powerUps.graceSeconds * 1000;
    return true;
  }

  updatePowerUps() {
    if (this.finished) return;
    const now = this.time.now, left = (until) => Math.ceil((until - now) / 1000);
    const parts = [];
    for (const player of this.players) {
      if (player.out) continue;
      const s = player.sprite;
      if (this.powerUp && Phaser.Math.Distance.Between(s.x, s.y,
        this.powerUp.shape.x, this.powerUp.shape.y) < 22) {
        this.applyPowerUp(this.powerUp.type, player);
        this.clearPowerUp();
      }
      player.shieldRing.setPosition(s.x, s.y).setVisible(now < player.shieldUntil);
      s.setAlpha(now < player.invulnerableUntil && Math.floor(now / 100) % 2 ? 0.4 : 1);
      const who = this.playerCount === 1 ? '' : `${player.name} `;
      if (now < player.speedUntil) parts.push(`${who}Speed ${left(player.speedUntil)}s`);
      if (now < player.shieldUntil) parts.push(`${who}Shield ${left(player.shieldUntil)}s`);
    }
    if (now < this.bonusUntil) parts.push(`+${COIN_DASH.powerUps.timeBonus}s`);
    this.powerUpLabel.setText(parts.join('  '));
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    window.CoinDashSound[this.time.now >= this.deadline ? 'timeUp' : 'hit']();
    this.physics.pause();
    const c = COIN_DASH;
    const top = Math.max(...this.players.map(p => p.score));
    const newBest = top > this.best;
    if (newBest) this.saveHighScore(this.best = top);
    const bestLine = newBest ? 'New high score!' : `Best: ${this.best}`;
    let summary;
    if (this.playerCount === 1) {
      summary = `${this.players[0].score} coins collected · ${this.cfg.label}`;
    } else {
      const [p1, p2] = this.players;
      const verdict = p1.score === p2.score ? "It's a tie!"
        : `${p1.score > p2.score ? 'Player 1' : 'Player 2'} wins!`;
      summary = `P1 ${p1.score} – ${p2.score} P2 · ${this.cfg.label}\n${verdict}`;
    }
    const lines = `${reason}\n${summary}\n${bestLine}\nPress R to try again`;
    const height = 60 + lines.split('\n').length * 36;
    this.add.rectangle(c.width / 2, c.height / 2, 480, height, c.colors.panel, 0.94)
      .setStrokeStyle(2, c.colors.drone).setDepth(20);
    this.add.text(c.width / 2, c.height / 2, lines,
      { ...this.neonText(24, c.colors.outline, c.colors.drone), align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5).setDepth(21);
  }

  // localStorage can throw (private mode, file://); fall back to a session-only best.
  loadHighScore() {
    try {
      return Math.max(Number(localStorage.getItem(COIN_DASH.highScoreKey)) || 0, this.sessionBest || 0);
    } catch (e) { return this.sessionBest || 0; }
  }

  saveHighScore(score) {
    this.sessionBest = score;
    try { localStorage.setItem(COIN_DASH.highScoreKey, String(score)); } catch (e) { /* session only */ }
  }
}
window.coinDashGame = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: COIN_DASH.width,
  height: COIN_DASH.height,
  backgroundColor: COIN_DASH.colors.background,
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_HORIZONTALLY },
  scene: CoinDash
});
