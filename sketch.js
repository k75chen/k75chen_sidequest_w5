/*
Week 5 — Example 4: Data-driven world with JSON + Smooth Camera

Course: GBDA302 | Instructors: Dr. Karen Cochrane & David Han
Date: Feb. 12, 2026

Move: WASD/Arrows

Learning goals:
- Extend the JSON-driven world to include camera parameters
- Implement smooth camera follow using interpolation (lerp)
- Separate camera behavior from player/world logic
- Tune motion and feel using external data instead of hard-coded values
- Maintain player visibility with soft camera clamping
- Explore how small math changes affect “game feel”
*/

const VIEW_W = 800;
const VIEW_H = 480;

let worldData;
let level;
let player;

let camX = 0;
let camY = 0;

function preload() {
  worldData = loadJSON("world.json"); // load JSON before setup [web:122]
}

function setup() {
  createCanvas(VIEW_W, VIEW_H);
  textFont("sans-serif");
  textSize(14);

  level = new WorldLevel(worldData);

  const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
  player = new Player(start.x, start.y, start.speed);

  camX = player.x - width / 2;
  camY = player.y - height / 2;
}

function draw() {
  player.updateInput();

  // Keep player inside world
  player.x = constrain(player.x, 0, level.w);
  player.y = constrain(player.y, 0, level.h);

  // Resolve collisions with world obstacles (will push player out and bounce)
  if (typeof level.handleCollisions === "function")
    level.handleCollisions(player);

  // Target camera (center on player)
  let targetX = player.x - width / 2;
  let targetY = player.y - height / 2;

  // Clamp target camera safely
  const maxCamX = max(0, level.w - width);
  const maxCamY = max(0, level.h - height);
  targetX = constrain(targetX, 0, maxCamX);
  targetY = constrain(targetY, 0, maxCamY);

  // Smooth follow using the JSON knob
  const camLerp = level.camLerp; // ← data-driven now
  camX = lerp(camX, targetX, camLerp);
  camY = lerp(camY, targetY, camLerp);

  // Camera breathe offset (subtle, slowed)
  const rawBreatheSpeed = level.breatheSpeed ?? 0.4;
  const rawBreatheAmount = level.breatheAmount ?? 3;
  // scale down so JSON values remain intuitive but produce a slow, subtle motion
  const breatheSpeed = rawBreatheSpeed * 0.02;
  const breatheAmount = rawBreatheAmount * 0.6;
  const breatheX = sin(frameCount * breatheSpeed) * breatheAmount;
  const breatheY = cos(frameCount * breatheSpeed + PI / 2) * breatheAmount;

  camX += breatheX;
  camY += breatheY;

  level.drawBackground();

  push();
  translate(-camX, -camY);
  level.drawWorld();
  player.draw();
  // Draw memories within world coordinates so they follow camera transforms
  if (typeof level.drawMemories === "function") level.drawMemories(player);
  pop();

  level.drawHUD(player, camX, camY);

  // Vignette overlay: radial gradient from transparent center to dark edges
  push();
  // access raw canvas 2D context
  const ctx = drawingContext;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = sqrt(cx * cx + cy * cy);
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(10,5,20,0.7)");
  ctx.fillStyle = grad;
  noStroke();
  // draw full-screen rect with gradient
  rect(0, 0, width, height);
  pop();
}

function keyPressed() {
  if (key === "r" || key === "R") {
    const start = worldData.playerStart ?? { x: 300, y: 300, speed: 3 };
    player = new Player(start.x, start.y, start.speed);
  }
}
