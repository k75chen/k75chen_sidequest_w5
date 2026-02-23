class Player {
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.s = speed ?? 3; // max speed

    // velocity for inertia
    this.vx = 0;
    this.vy = 0;

    // tuning
    this.accel = 0.4;
    this.friction = 0.88;
  }

  updateInput() {
    // directional input (-1, 0, 1)
    const dx =
      (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) -
      (keyIsDown(LEFT_ARROW) || keyIsDown(65));

    const dy =
      (keyIsDown(DOWN_ARROW) || keyIsDown(83)) -
      (keyIsDown(UP_ARROW) || keyIsDown(87));

    // normalize to avoid faster diagonal acceleration
    let nx = 0,
      ny = 0;
    const len = sqrt(dx * dx + dy * dy);
    if (len > 0) {
      nx = dx / len;
      ny = dy / len;
    }

    // apply acceleration to velocity
    this.vx += nx * this.accel;
    this.vy += ny * this.accel;

    // cap speed
    const sp = sqrt(this.vx * this.vx + this.vy * this.vy);
    if (sp > this.s) {
      const k = this.s / sp;
      this.vx *= k;
      this.vy *= k;
    }

    // apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;

    // update position
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    noStroke();

    // soft halo behind the player (concentric translucent ellipses)
    for (let i = 3; i >= 1; i--) {
      const a = map(i, 3, 1, 30, 8);
      fill(255, 255, 255, a);
      ellipse(this.x, this.y, 22 + i * 6, 22 + i * 6);
    }

    // core bright ellipse
    fill(255, 255, 255, 220);
    ellipse(this.x, this.y, 20, 20);
  }
}
