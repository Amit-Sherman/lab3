/* global Phaser, COIN_DASH */
class CoinDash extends Phaser.Scene {
  constructor() { super('CoinDash'); }

  create() {
    const c = COIN_DASH;
    // The registry survives scene restarts, so the chosen mode sticks until changed.
    this.playerCount = this.registry.get('playerCount') || 1;
    this.finished = false;
    this.deadline = this.time.now + c.roundSeconds * 1000;
    this.physics.world.setBounds(0, 44, c.width, c.height - 44);
    this.add.grid(c.width / 2, c.height / 2, c.width, c.height, 40, 40,
      c.colors.background, 1, 0x24334b, 0.45);
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
    this.drones = this.physics.add.group();
    for (let i = 0; i < c.droneCount; i++) {
      const drone = this.add.rectangle(90 + i * 270, 100, 26, 26, c.colors.drone);
      this.drones.add(drone);
      drone.body.setCollideWorldBounds(true).setBounce(1, 1);
      const angle = (35 + i * 105) * Math.PI / 180;
      drone.body.setVelocity(Math.cos(angle) * c.droneSpeed, Math.sin(angle) * c.droneSpeed);
    }
    for (const player of this.players) {
      this.physics.add.overlap(player.sprite, this.coin, () => {
        if (this.finished || player.out) return;
        player.score++;
        this.placeCoin();
      });
      this.physics.add.overlap(player.sprite, this.drones, () => this.knockOut(player));
    }
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
    this.input.keyboard.on('keydown-ONE', () => this.setPlayerCount(1));
    this.input.keyboard.on('keydown-TWO', () => this.setPlayerCount(2));
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
    if (this.players.every(p => p.out)) {
      this.finish(this.playerCount === 1 ? 'A drone caught you!' : 'Both players were caught!');
    }
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
    if (this.finished) return;
    const held = (controls, dir) => controls.some(keys => keys[dir].isDown);
    for (const player of this.players) {
      if (player.out) continue;
      const dx = Number(held(player.controls, 'right')) - Number(held(player.controls, 'left'));
      const dy = Number(held(player.controls, 'down')) - Number(held(player.controls, 'up'));
      const direction = new Phaser.Math.Vector2(dx, dy).normalize().scale(COIN_DASH.playerSpeed);
      player.sprite.body.setVelocity(direction.x, direction.y);
    }
    const seconds = Math.max(0, Math.ceil((this.deadline - this.time.now) / 1000));
    const scores = this.playerCount === 1
      ? `Coins: ${this.players[0].score}`
      : this.players.map(p => `${p.name}: ${p.score}${p.out ? ' (out)' : ''}`).join('   ');
    this.hud.setText(`${scores.padEnd(28)}Time: ${seconds}s   [${this.playerCount}P · 1/2 to switch]`);
    if (seconds === 0) this.finish('Time is up!');
  }

  finish(reason) {
    if (this.finished) return;
    this.finished = true;
    this.physics.pause();
    const c = COIN_DASH;
    let summary;
    if (this.playerCount === 1) {
      summary = `${this.players[0].score} coins collected`;
    } else {
      const [p1, p2] = this.players;
      const verdict = p1.score === p2.score ? "It's a tie!"
        : `${p1.score > p2.score ? 'Player 1' : 'Player 2'} wins!`;
      summary = `P1 ${p1.score} – ${p2.score} P2\n${verdict}`;
    }
    const lines = `${reason}\n${summary}\nPress R to try again`;
    const height = 60 + lines.split('\n').length * 36;
    this.add.rectangle(c.width / 2, c.height / 2, 480, height, 0x0a1120, 0.95);
    this.add.text(c.width / 2, c.height / 2, lines,
      { font: '24px monospace', color: '#ffffff', align: 'center', lineSpacing: 12 }
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
