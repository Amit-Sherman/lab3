/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    this.score = 0;
    this.lives = c.lives;
    this.levelIndex = 0;
    this.levelCoins = 0;
    this.invincibleUntil = 0;
    this.finished = false;
    this.elapsed = 0;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
    this.hud = this.add.text(18, 12, '', { font: '18px monospace', color: '#ffffff' });
    this.telegraph = this.add.graphics();
    this.player = this.add.rectangle(c.width / 2, c.height / 2, 24, 24, c.colors.player);
    this.physics.add.existing(this.player);
    this.player.body.setCollideWorldBounds(true);
    this.coin = this.add.circle(100, 100, 9, c.colors.coin);
    this.physics.add.existing(this.coin);
    this.coin.body.setCircle(9);
    this.placeCoin();
    this.enemies = this.physics.add.group();
    this.physics.add.overlap(this.player, this.coin, () => this.collectCoin());
    this.physics.add.overlap(this.player, this.enemies, () => this.hitPlayer());
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,R');
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.startLevel(0);
  }

  startLevel(index) {
    const c = COIN_DASH;
    this.levelIndex = index;
    this.levelCoins = 0;
    this.enemies.clear(true, true);
    for (const [kind, count] of Object.entries(c.levels[index])) {
      for (let i = 0; i < count; i++) this.spawnEnemy(kind);
    }
    // A short grace period so a freshly spawned enemy can't hit the player before they react.
    this.invincibleUntil = Math.max(this.invincibleUntil, this.elapsed + c.levelStartGraceMs);
    const banner = this.add.text(c.width / 2, c.height / 2 - 60, `Level ${index + 1}`,
      { font: '36px monospace', color: '#ffffff' }).setOrigin(0.5);
    this.tweens.add({ targets: banner, alpha: 0, delay: 700, duration: 500,
      onComplete: () => banner.destroy() });
  }

  spawnEnemy(kind) {
    const c = COIN_DASH;
    const spec = c.enemies[kind];
    let x, y;
    do {
      x = Phaser.Math.Between(30, c.width - 30);
      y = Phaser.Math.Between(75, c.height - 30);
    } while (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) < c.enemySpawnMinDistance);
    const enemy = this.add.rectangle(x, y, spec.size, spec.size, c.colors[kind]);
    this.enemies.add(enemy);
    enemy.kind = kind;
    enemy.body.setCollideWorldBounds(true);
    if (kind === 'bouncer') {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      enemy.body.setBounce(1, 1);
      enemy.body.setVelocity(Math.cos(angle) * spec.speed, Math.sin(angle) * spec.speed);
    } else if (kind === 'guard') {
      enemy.orbitAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    } else if (kind === 'dasher') {
      enemy.state = 'rest';
      enemy.stateUntil = this.elapsed + Phaser.Math.Between(spec.restMs / 2, spec.restMs);
    }
  }

  updateEnemies(delta) {
    const c = COIN_DASH;
    const now = this.elapsed;
    this.telegraph.clear();
    for (const enemy of this.enemies.getChildren()) {
      const spec = c.enemies[enemy.kind];
      if (enemy.kind === 'chaser') {
        this.physics.moveToObject(enemy, this.player, spec.speed);
      } else if (enemy.kind === 'guard') {
        // Steer towards a point orbiting the coin, so the guard glides over when the coin moves.
        enemy.orbitAngle += spec.orbitSpeed * delta / 1000;
        const tx = this.coin.x + Math.cos(enemy.orbitAngle) * spec.orbitRadius;
        const ty = this.coin.y + Math.sin(enemy.orbitAngle) * spec.orbitRadius;
        const pull = new Phaser.Math.Vector2(tx - enemy.x, ty - enemy.y).scale(8).limit(spec.maxSpeed);
        enemy.body.setVelocity(pull.x, pull.y);
      } else if (enemy.kind === 'dasher') {
        this.updateDasher(enemy, spec, now);
      }
    }
  }

  updateDasher(enemy, spec, now) {
    const c = COIN_DASH;
    if (enemy.state === 'windup') {
      // Flash and show the charge line; the target was locked when the windup began.
      enemy.setFillStyle(Math.floor(now / 90) % 2 ? c.colors.warning : c.colors.dasher);
      this.telegraph.lineStyle(2, c.colors.dasher, 0.5)
        .lineBetween(enemy.x, enemy.y, enemy.targetX, enemy.targetY);
    }
    if (now < enemy.stateUntil) return;
    if (enemy.state === 'rest') {
      enemy.state = 'windup';
      enemy.stateUntil = now + spec.windupMs;
      enemy.targetX = this.player.x;
      enemy.targetY = this.player.y;
    } else if (enemy.state === 'windup') {
      enemy.state = 'dash';
      enemy.stateUntil = now + spec.dashMs;
      enemy.setFillStyle(c.colors.dasher);
      this.physics.moveTo(enemy, enemy.targetX, enemy.targetY, spec.dashSpeed);
    } else {
      enemy.state = 'rest';
      enemy.stateUntil = now + spec.restMs;
      enemy.body.setVelocity(0, 0);
    }
  }

  collectCoin() {
    if (this.finished) return;
    const c = COIN_DASH;
    this.score++;
    this.levelCoins++;
    this.placeCoin();
    if (this.levelCoins < c.coinsPerLevel) return;
    if (this.levelIndex + 1 < c.levels.length) this.startLevel(this.levelIndex + 1);
    else this.finish('You cleared every level!');
  }

  hitPlayer() {
    if (this.finished || this.elapsed < this.invincibleUntil) return;
    this.lives--;
    this.cameras.main.shake(150, 0.01);
    if (this.lives <= 0) {
      this.finish('Out of lives!');
      return;
    }
    this.invincibleUntil = this.elapsed + COIN_DASH.hitInvincibleMs;
    this.tweens.add({ targets: this.player, alpha: 0.25, duration: 100, yoyo: true,
      repeat: Math.floor(COIN_DASH.hitInvincibleMs / 200) - 1, onComplete: () => this.player.setAlpha(1) });
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

  elapsedSeconds() {
    return Math.floor(this.elapsed / 1000);
  }

  update(time, delta) {
    if (this.finished) return;
    const c = COIN_DASH;
    // Run time comes from frame deltas, so every restart starts at zero and timers stop while finished.
    this.elapsed += delta;
    const dx = Number(this.cursors.right.isDown || this.keys.D.isDown)
      - Number(this.cursors.left.isDown || this.keys.A.isDown);
    const dy = Number(this.cursors.down.isDown || this.keys.S.isDown)
      - Number(this.cursors.up.isDown || this.keys.W.isDown);
    const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(c.playerSpeed);
    this.player.body.setVelocity(direction.x, direction.y);
    this.updateEnemies(delta);
    this.updateHud();
  }

  updateHud() {
    const c = COIN_DASH;
    const hearts = '♥'.repeat(Math.max(0, this.lives)) + '·'.repeat(c.lives - Math.max(0, this.lives));
    this.hud.setText(`Level ${this.levelIndex + 1}/${c.levels.length}   `
      + `Coins: ${this.levelCoins}/${c.coinsPerLevel}   Lives: ${hearts}   Time: ${this.elapsedSeconds()}s`);
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    this.telegraph.clear();
    this.updateHud();
    const c = COIN_DASH;
    this.add.rectangle(c.width / 2, c.height / 2, 480, 180, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2,
      `${reason}\nReached level ${this.levelIndex + 1} · ${this.score} coins · ${this.elapsedSeconds()}s`
      + '\nPress R to play again',
      { font: '22px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
    ).setOrigin(0.5);
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
