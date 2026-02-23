class WorldLevel {
  constructor(json) {
    this.schemaVersion = json.schemaVersion ?? 1;

    this.w = json.world?.w ?? 2400;
    this.h = json.world?.h ?? 1600;
    this.bg = json.world?.bg ?? [235, 235, 235];
    this.gridStep = json.world?.gridStep ?? 160;

    this.obstacles = json.obstacles ?? [];
    this.memories = json.memories ?? [];

    // Camera tuning from JSON
    this.camLerp = json.camera?.lerp ?? 0.12;
    this.breatheSpeed = json.camera?.breatheSpeed ?? 0.4;
    this.breatheAmount = json.camera?.breatheAmount ?? 3;

    // Pastel palette for obstacles
    this.pastelPalette = [
      [200, 150, 180], // muted rose
      [150, 180, 200], // muted blue
      [180, 200, 150], // muted mint
      [200, 180, 150], // muted peach
      [170, 160, 190], // muted lavender
      [160, 190, 180], // muted sage
    ];
  }

  drawBackground() {
    // Create vertical gradient: lighter at top, darker at bottom (subtle)
    noStroke();

    const baseR = this.bg[0];
    const baseG = this.bg[1];
    const baseB = this.bg[2];

    // Draw gradient lines from top to bottom
    for (let y = 0; y < this.h; y++) {
      const t = y / this.h;
      const gradientAmount = 50;
      const r = constrain(
        baseR + (1 - t) * gradientAmount - t * gradientAmount,
        0,
        255,
      );
      const g = constrain(
        baseG + (1 - t) * gradientAmount - t * gradientAmount,
        0,
        255,
      );
      const b = constrain(
        baseB + (1 - t) * gradientAmount - t * gradientAmount,
        0,
        255,
      );
      stroke(r, g, b);
      line(0, y, this.w, y);
    }

    noStroke();

    // Make background motion more visible: larger alpha, horizontal drift, and sparkles
    const t = frameCount * 0.0012;

    // Layer 1 - slow, large, soft gradient with horizontal drift
    let y1 = 300 + sin(frameCount * 0.002) * 150;
    const layer1AlphaBase = 60;
    const horizAmp1 = 80;
    for (let i = 0; i < 4; i++) {
      const a = layer1AlphaBase - i * 10 + sin(t * 0.6 + i) * 8;
      fill(200, 180, 220, constrain(a, 18, 200));
      const xOff = sin(t * 0.4 + i) * horizAmp1;
      ellipse(
        400 + xOff,
        y1 + cos(t * 0.3 + i) * 30,
        500 + i * 80,
        300 + i * 60,
      );
      ellipse(
        1800 - xOff,
        y1 + 200 + cos(t * 0.28 + i) * 28,
        450 + i * 70,
        280 + i * 55,
      );
    }

    // Layer 2 - medium speed, more contrast
    let y2 = 600 + sin(frameCount * 0.003 + 1) * 180;
    const layer2AlphaBase = 45;
    const horizAmp2 = 60;
    for (let i = 0; i < 4; i++) {
      const a = layer2AlphaBase - i * 8 + sin(t * 0.9 + i) * 6;
      fill(180, 160, 200, constrain(a, 12, 200));
      const xOff = cos(t * 0.35 + i) * horizAmp2;
      ellipse(
        900 + xOff,
        y2 + sin(t * 0.25 + i) * 40,
        600 + i * 90,
        350 + i * 70,
      );
      ellipse(
        1300 - xOff,
        y2 - 150 + sin(t * 0.22 + i) * 36,
        520 + i * 80,
        320 + i * 60,
      );
    }

    // Layer 3 - slightly faster, soft but visible
    let y3 = 800 + sin(frameCount * 0.0025 + 2) * 120;
    const layer3AlphaBase = 36;
    const horizAmp3 = 40;
    for (let i = 0; i < 4; i++) {
      const a = layer3AlphaBase - i * 6 + sin(t * 1.1 + i) * 5;
      fill(220, 200, 240, constrain(a, 8, 200));
      const xOff = sin(t * 0.5 + i) * horizAmp3;
      ellipse(
        600 + xOff,
        y3 + cos(t * 0.18 + i) * 28,
        400 + i * 70,
        250 + i * 50,
      );
      ellipse(
        2000 - xOff,
        y3 + 100 + cos(t * 0.16 + i) * 26,
        480 + i * 75,
        290 + i * 56,
      );
    }

    // Soft drifting sparkles to emphasize motion
    noStroke();
    for (let s = 0; s < 36; s++) {
      const seedX = (s * 97) % this.w;
      const seedY = (s * 61) % this.h;
      const sx = seedX + sin(t * 0.2 + s) * 40 + cos(t * 0.05 + s * 0.3) * 20;
      const sy = seedY + cos(t * 0.18 + s) * 30 + sin(t * 0.03 + s * 0.2) * 18;
      const a = 30 + 20 * noise(s * 0.12 + t * 0.4);
      fill(255, 255, 255, a);
      ellipse(sx, sy, 4 + noise(s) * 3, 4 + noise(s + 10) * 3);
    }
  }

  drawWorld() {
    // Draw obstacles as soft rounded rectangles with pastel colors and glowing white borders
    noStroke();
    for (let i = 0; i < this.obstacles.length; i++) {
      const o = this.obstacles[i];
      const color = this.pastelPalette[i % this.pastelPalette.length];

      // Draw glowing white border with multiple layers for ethereal effect
      for (let glow = 14; glow > 0; glow--) {
        stroke(255, 255, 255, 40 / glow);
        strokeWeight(glow);
        noFill();
        rect(o.x, o.y, o.w, o.h, o.r ?? 8);
      }

      // Draw the main pastel rectangle
      noStroke();
      fill(color[0], color[1], color[2], 180);
      rect(o.x, o.y, o.w, o.h, o.r ?? 8);
    }
  }

  // Simple circle-rect collision resolution: push player out and reflect velocity
  handleCollisions(player) {
    const pr = 10; // player radius (matches drawing)
    const restitution = 40; // bounce energy retention

    if (player == null) return;

    for (const o of this.obstacles) {
      const rx = o.x;
      const ry = o.y;
      const rw = o.w;
      const rh = o.h;

      // closest point on rectangle to circle center
      const closestX = constrain(player.x, rx, rx + rw);
      const closestY = constrain(player.y, ry, ry + rh);

      let dx = player.x - closestX;
      let dy = player.y - closestY;
      let dist2 = dx * dx + dy * dy;

      if (dist2 === 0) {
        // Circle center is exactly inside or aligned — push out along smallest penetration
        const left = abs(player.x - rx);
        const right = abs(rx + rw - player.x);
        const top = abs(player.y - ry);
        const bottom = abs(ry + rh - player.y);
        const minEdge = min(left, right, top, bottom);
        if (minEdge === left) {
          dx = 1;
          dy = 0;
        } else if (minEdge === right) {
          dx = -1;
          dy = 0;
        } else if (minEdge === top) {
          dx = 0;
          dy = 1;
        } else {
          dx = 0;
          dy = -1;
        }
        dist2 = dx * dx + dy * dy;
      }

      const dist = sqrt(dist2);
      if (dist < pr) {
        // compute normal
        const nx = dx / (dist || 1);
        const ny = dy / (dist || 1);

        // push player out of obstacle
        const overlap = pr - dist;
        player.x += nx * overlap;
        player.y += ny * overlap;

        // reflect velocity across normal and apply restitution
        if (typeof player.vx === "number" && typeof player.vy === "number") {
          const vdotn = player.vx * nx + player.vy * ny;
          player.vx = player.vx - 2 * vdotn * nx;
          player.vy = player.vy - 2 * vdotn * ny;
          player.vx *= restitution;
          player.vy *= restitution;
        }
      }
    }
  }

  drawMemories(player) {
    noStroke();

    for (const mem of this.memories) {
      const dx = mem.x - player.x;
      const dy = mem.y - player.y;
      const dist = sqrt(dx * dx + dy * dy);

      // Pulsing glow effect with sine wave
      const pulseOpacity = 200 + sin(frameCount * 0.03) * 80;
      fill(200, 180, 220, pulseOpacity);

      // Draw glowing symbol
      textSize(48);
      textAlign(CENTER, CENTER);
      text(mem.symbol, mem.x, mem.y);

      // If player is close, draw the label
      if (dist < 80) {
        const fadeIn = 1 - dist / 80;
        fill(220, 200, 240, fadeIn * 200);
        textSize(14);
        textAlign(CENTER, TOP);
        text(mem.label, mem.x, mem.y + 50);
      }
    }
  }

  drawHUD(player, camX, camY) {
    noStroke();
    fill(255, 255, 255);
    textSize(12);
    textAlign(LEFT, TOP);
    textStyle(ITALIC);
    text("drifting through memories...", 12, 12);
    textStyle(NORMAL);
  }
}
