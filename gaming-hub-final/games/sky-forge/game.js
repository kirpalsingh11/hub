// Sky-Forge - fixed game.js
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const hpDisplay = document.getElementById("hp");
const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const upBtn = document.getElementById("upBtn");

// Player
let player = {
  x:240,
  y:400,
  w:22,
  h:22,
  dx:0,
  vy:0,
  speed:4,
  jumpPower:10,
  onGround:true,
  hp:100
};

// Platform list
let platforms = [];
let score = 0;
let started = false;
const gravity = 0.55;
const scrollSpeed = 0.7; // how fast platforms move upwards
const PLATFORM_COUNT = 12;
const PLATFORM_WIDTH_MIN = 80;
const PLATFORM_WIDTH_MAX = 140;

// Initialize platforms with tighter spacing
function generatePlatforms(){
  platforms = [];
  const spacing = Math.floor(canvas.height / (PLATFORM_COUNT - 1));
  for(let i = 0; i < PLATFORM_COUNT; i++){
    const w = PLATFORM_WIDTH_MIN + Math.random()*(PLATFORM_WIDTH_MAX-PLATFORM_WIDTH_MIN);
    const x = Math.max(0, Math.min(canvas.width - w, Math.random()*(canvas.width - w)));
    const y = canvas.height - i * spacing; // evenly spaced downwards
    platforms.push({ x, y, w, h:12 });
  }
}

// Draw everything
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // platforms
  ctx.fillStyle = "#0ff";
  for(const p of platforms){
    ctx.shadowBlur = 14;
    ctx.shadowColor = "#0ff";
    ctx.fillRect(p.x, p.y, p.w, p.h);
  }
  ctx.shadowBlur = 0;

  // player
  ctx.fillStyle = "#ff8c00";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff8c00";
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;
}

// Update loop
function update(){
  if(!started) return;

  // horizontal movement
  player.x += player.dx * player.speed;
  if(player.x < 0) player.x = 0;
  if(player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // gravity + vertical movement
  player.vy += gravity;
  player.y += player.vy;

  // platform collision (simple, only when falling)
  player.onGround = false;
  for(const p of platforms){
    if(
      player.x + player.w > p.x &&
      player.x < p.x + p.w &&
      player.y + player.h >= p.y &&
      player.y + player.h <= p.y + Math.max(12, Math.abs(player.vy)) &&
      player.vy >= 0
    ){
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  // scroll platforms upward (auto-ascend feel)
  for(const p of platforms){
    p.y -= scrollSpeed;
  }

  // remove any platform that moved off the top and add a new platform at bottom
  // also award a small score when a platform scrolls off (player effectively climbed)
  for(let i = platforms.length - 1; i >= 0; i--){
    if(platforms[i].y + platforms[i].h < -10){
      // remove
      platforms.splice(i, 1);
      // add new platform near bottom
      const w = PLATFORM_WIDTH_MIN + Math.random()*(PLATFORM_WIDTH_MAX-PLATFORM_WIDTH_MIN);
      const x = Math.max(0, Math.min(canvas.width - w, Math.random()*(canvas.width - w)));
      const y = canvas.height + Math.random() * 80;
      platforms.push({ x, y, w, h:12 });
      score += 5; // small reward for progression
    }
  }

  // if player falls below bottom -> lose some HP and respawn near top (not instant death)
  if(player.y > canvas.height + 40){
    // penalty instead of immediate death
    player.hp -= 30;
    if(player.hp <= 0){
      player.hp = 0;
      return gameOver();
    } else {
      // respawn the player near top so they have a chance to keep going
      player.y = 40;
      player.vy = 0;
      // give small horizontal safety offset
      player.x = Math.max(10, Math.min(canvas.width - player.w - 10, player.x));
    }
  }

  // update score slowly with time
  score += 0.02;

  draw();
  updateUI();
  requestAnimationFrame(update);
}

// UI update
function updateUI(){
  hpDisplay.innerText = Math.max(0, Math.floor(player.hp));
  scoreDisplay.innerText = Math.floor(score);
}

// Jump
function doJump(){
  if(player.onGround){
    player.vy = -player.jumpPower;
    player.onGround = false;
  }
}

// Start/reset/gameOver
function startGame(){
  menu.style.display = "none";
  started = true;
  player.hp = 100;
  player.x = canvas.width/2 - player.w/2;
  player.y = canvas.height - 100;
  player.vy = 0;
  player.dx = 0;
  score = 0;
  generatePlatforms();
  updateUI();
  update();
}

function resetGame(){
  startGame();
}

function gameOver(){
  started = false;
  // create a restart button that calls startGame() directly
  menu.style.display = "block";
  menu.innerHTML = `
    <h1 style="color:#f04;text-shadow:0 0 15px #f04;">GAME OVER</h1>
    <p style="color:#0ff;">Score: ${Math.floor(score)}</p>
    <button onclick="startGame()">Restart</button>
  `;
}

// input handlers
window.addEventListener("keydown", (e) => {
  if(!started) return;
  if(e.code === "ArrowLeft") player.dx = -1;
  if(e.code === "ArrowRight") player.dx = 1;
  if(e.code === "ArrowUp") doJump();
});
window.addEventListener("keyup", (e) => {
  if(e.code === "ArrowLeft" || e.code === "ArrowRight") player.dx = 0;
});

// touch controls (virtual arrows)
leftBtn.addEventListener("touchstart", ()=>{ player.dx = -1; });
leftBtn.addEventListener("touchend", ()=>{ player.dx = 0; });
rightBtn.addEventListener("touchstart", ()=>{ player.dx = 1; });
rightBtn.addEventListener("touchend", ()=>{ player.dx = 0; });
upBtn.addEventListener("touchstart", ()=>{ doJump(); });

// hook start/restart buttons that exist initially in the page UI
startBtn.onclick = startGame;
if (restartBtn) restartBtn.onclick = resetGame;

// ensure canvas resizes (optional)
window.addEventListener("resize", () => {
  // here we keep canvas fixed size from index.html; if you want fluid canvas,
  // set canvas.width = window.innerWidth and canvas.height = window.innerHeight
});
