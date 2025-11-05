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

let car = { x: canvas.width/2, y: canvas.height - 200, w: 50, h: 30, dx: 0 };
let speed = 6;
let roadWidth = 300;
let score = 0;
let obstacles = [];
let orbs = [];
let started = false;
let paused = false;

function resetGame() {
  car.x = canvas.width/2;
  score = 0;
  obstacles = [];
  orbs = [];
}

function drawCar() {
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#0ff";
  ctx.fillStyle = "#0ff";
  ctx.fillRect(car.x, car.y, car.w, car.h);
  ctx.shadowBlur = 0;
}

function drawRoad() {
  ctx.strokeStyle = "#0ff";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#0ff";
  ctx.beginPath();
  ctx.moveTo(canvas.width/2 - roadWidth/2, 0);
  ctx.lineTo(canvas.width/2 - roadWidth/2, canvas.height);
  ctx.moveTo(canvas.width/2 + roadWidth/2, 0);
  ctx.lineTo(canvas.width/2 + roadWidth/2, canvas.height);
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function spawnObstacle() {
  let w = 40 + Math.random()*30;
  obstacles.push({ x: canvas.width/2 - roadWidth/2 + Math.random()*roadWidth - w, y: -50, w, h: w });
}

function spawnOrb() {
  let r = 10;
  orbs.push({ x: canvas.width/2 - roadWidth/2 + Math.random()*roadWidth, y: -50, r });
}

function update() {
  if (!started || paused) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawRoad();

  car.x += car.dx;
  if(car.x < canvas.width/2 - roadWidth/2) car.x = canvas.width/2 - roadWidth/2;
  if(car.x + car.w > canvas.width/2 + roadWidth/2) car.x = canvas.width/2 + roadWidth/2 - car.w;

  // spawn obstacles/orbs
  if(Math.random() < 0.02) spawnObstacle();
  if(Math.random() < 0.015) spawnOrb();

  // move and draw
  for(let o of obstacles){
    o.y += speed;
    ctx.fillStyle = "#f04";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#f04";
    ctx.fillRect(o.x,o.y,o.w,o.h);
    if(car.x < o.x + o.w && car.x + car.w > o.x && car.y < o.y + o.h && car.y + car.h > o.y){
      gameOver();
    }
  }
  for(let orb of orbs){
    orb.y += speed;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.r,0,Math.PI*2);
    ctx.fillStyle="#0ff";
    ctx.shadowBlur = 10;
    ctx.shadowColor="#0ff";
    ctx.fill();
    if(car.x < orb.x+orb.r && car.x+car.w > orb.x-orb.r && car.y < orb.y+orb.r && car.y+car.h > orb.y-orb.r){
      score += 10;
      orbs.splice(orbs.indexOf(orb),1);
    }
  }

  obstacles = obstacles.filter(o => o.y < canvas.height+o.h);
  orbs = orbs.filter(o => o.y < canvas.height+10);

  drawCar();
  score += 0.1;
  scoreDisplay.innerText = Math.floor(score);

  requestAnimationFrame(update);
}

function gameOver(){
  started = false;
  bgm.pause();
  menu.style.display = "block";
  menu.innerHTML = `<h1 style="color:#f04;text-shadow:0 0 15px #f04;">GAME OVER</h1>
    <p style="color:#0ff;">Score: ${Math.floor(score)}</p>
    <button id='restartBtn'>Restart</button>`;
  document.getElementById("restartBtn").onclick = ()=>{
    resetGame();
    startGame();
  };
}

function startGame(){
  menu.style.display = "none";
  started = true;
  paused = false;
  bgm.play();
  resetGame();
  update();
}

startBtn.onclick = startGame;
pauseBtn.onclick = ()=>{
  paused = !paused;
  pauseBtn.innerText = paused?"Resume":"Pause";
  if(!paused) update();
};
musicBtn.onclick = ()=>{
  if(bgm.paused){ bgm.play(); musicBtn.innerText="Music: On"; }
  else{ bgm.pause(); musicBtn.innerText="Music: Off"; }
};

window.addEventListener("keydown", e=>{
  if(e.code==="ArrowLeft") car.dx = -8;
  else if(e.code==="ArrowRight") car.dx = 8;
});
window.addEventListener("keyup", e=>{
  if(e.code==="ArrowLeft" || e.code==="ArrowRight") car.dx = 0;
});
canvas.addEventListener("touchstart", e=>{
  const touchX = e.touches[0].clientX;
  if(touchX < canvas.width/2) car.dx=-8;
  else car.dx=8;
});
canvas.addEventListener("touchend", e=>{ car.dx=0; });
