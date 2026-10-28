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
    this.score = 0;
    this.best = this.loadHighScore();
    this.finished = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, c.colors.grid, 0.3);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(c.width * (i + 0.5) / c.droneCount, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    this.styleScene();
    this.physics.add.overlap(this.player, this.coin, () => {
      if (this.finished) return;
      this.score++;
      window.CoinDashSound.coin();
      this.placeCoin();
    });
    this.physics.add.overlap(this.player, this.drones, () => this.finish('A drone caught you!'));
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.paused = false;
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

  togglePause() {
    if (this.finished) return;
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    if (this.paused) {
      this.pausedAt = this.time.now;
      this.physics.pause();
    } else {
      this.deadline += this.time.now - this.pausedAt;
      this.physics.resume();
    }
  }

  styleScene() {
    const c = COIN_DASH, k = c.colors;
    const glow = (obj, color, strength) => obj.postFX?.addGlow(color, strength, 0, false, 0.1, 12);
    this.player.setStrokeStyle(2, k.outline, 0.9);
    glow(this.player, k.player, 4);
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
    // Avoid spawning the next coin directly underneath the player.
    let x, y;
    do {
      x = Phaser.Math.Between(25, c.width - 25);
      y = Phaser.Math.Between(70, c.height - 25);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < 60);
    this.coin.setPosition(x, y);
    this.coin.body.reset(x, y);
  }

  update() {
    if (this.finished || this.paused) return;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(this.cfg.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    this.hud.setText(`Coins: ${this.score}   Best: ${this.best}      ${this.cfg.label}      Time: ${seconds}s`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    window.CoinDashSound[this.time.now >= this.deadline ? 'timeUp' : 'hit']();
    this.physics.pause();
    const c = COIN_DASH;
    const newBest = this.score > this.best;
    if (newBest) this.saveHighScore(this.best = this.score);
    const bestLine = newBest ? 'New high score!' : `Best: ${this.best}`;
    this.add.rectangle(c.width / 2, c.height / 2, 460, 190, c.colors.panel, 0.94)
      .setStrokeStyle(2, c.colors.drone).setDepth(20);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\n${this.score} coins collected · ${this.cfg.label}\n${bestLine}\nPress R to try again`,
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
