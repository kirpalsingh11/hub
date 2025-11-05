const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const musicBtn = document.getElementById("musicBtn");
const menu = document.getElementById("menu");
const bgm = document.getElementById("bgm");

let player = { x: 100, y: canvas.height - 150, w: 40, h: 40, dy: 0, onGround: false };
let gravity = 1;
let jumpPower = -18;
let groundHeight = 100;
let obstacles = [];
let orbs = [];
let gameSpeed = 6;
let score = 0;
let paused = false;
let started = false;

function resetGame() {
  player.y = canvas.height - groundHeight - player.h;
  player.dy = 0;
  obstacles = [];
  orbs = [];
  score = 0;
}

function drawPlayer() {
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#0ff";
  ctx.fillStyle = "#0ff";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
}

function drawGround() {
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 3;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#0ff";
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - groundHeight);
  ctx.lineTo(canvas.width, canvas.height - groundHeight);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function spawnObstacle() {
  let w = 40 + Math.random() * 30;
  obstacles.push({ x: canvas.width, y: canvas.height - groundHeight - w, w, h: w });
}

function spawnOrb() {
  let y = canvas.height - groundHeight - 150 - Math.random() * 100;
  orbs.push({ x: canvas.width, y, r: 10 });
}

function update() {
  if (!started || paused) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGround();

  player.y += player.dy;
  player.dy += gravity;

  if (player.y + player.h >= canvas.height - groundHeight) {
    player.y = canvas.height - groundHeight - player.h;
    player.dy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // spawn
  if (Math.random() < 0.02) spawnObstacle();
  if (Math.random() < 0.015) spawnOrb();

  // move and draw
  for (let o of obstacles) {
    o.x -= gameSpeed;
    ctx.fillStyle = "#f04";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#f04";
    ctx.fillRect(o.x, o.y, o.w, o.h);
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      gameOver();
    }
  }

  for (let orb of orbs) {
    orb.x -= gameSpeed;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
    ctx.fillStyle = "#0ff";
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#0ff";
    ctx.fill();
    if (
      player.x < orb.x + orb.r &&
      player.x + player.w > orb.x - orb.r &&
      player.y < orb.y + orb.r &&
      player.y + player.h > orb.y - orb.r
    ) {
      score += 10;
      orbs.splice(orbs.indexOf(orb), 1);
    }
  }

  obstacles = obstacles.filter(o => o.x + o.w > 0);
  orbs = orbs.filter(o => o.x + o.r > 0);

  drawPlayer();
  score += 0.1;
  scoreDisplay.innerText = Math.floor(score);

  requestAnimationFrame(update);
}

function jump() {
  if (player.onGround) player.dy = jumpPower;
}

function gameOver() {
  started = false;
  bgm.pause();
  menu.style.display = "block";
  menu.innerHTML = `<h1 style="color:#f04;text-shadow:0 0 15px #f04;">GAME OVER</h1>
  <p style="color:#0ff;">Score: ${Math.floor(score)}</p>
  <button id='restartBtn'>Restart</button>`;
  document.getElementById("restartBtn").onclick = () => {
    resetGame();
    startGame();
  };
}

function startGame() {
  menu.style.display = "none";
  started = true;
  paused = false;
  bgm.play();
  resetGame();
  update();
}

startBtn.onclick = startGame;
pauseBtn.onclick = () => {
  paused = !paused;
  pauseBtn.innerText = paused ? "Resume" : "Pause";
  if (!paused) update();
};

musicBtn.onclick = () => {
  if (bgm.paused) {
    bgm.play();
    musicBtn.innerText = "Music: On";
  } else {
    bgm.pause();
    musicBtn.innerText = "Music: Off";
  }
};

window.addEventListener("keydown", e => {
  if (e.code === "Space") jump();
});
canvas.addEventListener("touchstart", jump);
