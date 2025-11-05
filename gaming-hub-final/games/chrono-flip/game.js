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

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const flipBtn = document.getElementById("flipBtn");

// player
let player = {x:canvas.width/2, y:canvas.height-100, w:40, h:40, dx:0, dy:0, gravity:1};
let obstacles = [];
let orbs = [];
let score = 0;
let speed = 8;
let paused = false;
let started = false;

// reset game
function resetGame(){
  player.x = canvas.width/2;
  player.y = canvas.height-100;
  player.dx = 0;
  player.dy = 0;
  player.gravity = 1;
  obstacles = [];
  orbs = [];
  score = 0;
}

// draw
function drawPlayer(){
  ctx.shadowBlur=20;
  ctx.shadowColor="#0ff";
  ctx.fillStyle="#0ff";
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.shadowBlur=0;
}

function drawObstacles(){
  ctx.fillStyle="#f04";
  ctx.shadowBlur=15;
  ctx.shadowColor="#f04";
  obstacles.forEach(o=>ctx.fillRect(o.x,o.y,o.w,o.h));
  ctx.shadowBlur=0;
}

function drawOrbs(){
  ctx.fillStyle="#0ff";
  ctx.shadowBlur=10;
  ctx.shadowColor="#0ff";
  orbs.forEach(o=>{
    ctx.beginPath();
    ctx.arc(o.x,o.y,10,0,Math.PI*2);
    ctx.fill();
  });
  ctx.shadowBlur=0;
}

// spawn obstacles
function spawnObstacle(){
  obstacles.push({x:Math.random()*(canvas.width-50), y:player.gravity>0? -50: canvas.height+50, w:50, h:50, dir:player.gravity>0?1:-1});
}

function spawnOrb(){
  orbs.push({x:Math.random()*(canvas.width-20), y:player.gravity>0? -20: canvas.height+20, dir:player.gravity>0?1:-1});
}

function update(){
  if(!started || paused) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // move player
  player.x += player.dx;

  // boundaries
  if(player.x<0) player.x=0;
  if(player.x+player.w>canvas.width) player.x=canvas.width-player.w;

  // obstacles
  obstacles.forEach((o,i)=>{
    o.y += 6*o.dir;
    if(o.y>canvas.height || o.y< -50) obstacles.splice(i,1);
    // collision
    if(player.x<o.x+o.w && player.x+player.w>o.x && player.y<o.y+o.h && player.y+player.h>o.y){
      gameOver();
    }
  });

  // orbs
  orbs.forEach((o,i)=>{
    o.y += 6*o.dir;
    if(o.y>canvas.height || o.y< -20) orbs.splice(i,1);
    if(player.x<o.x+10 && player.x+player.w>o.x-10 && player.y<o.y+10 && player.y+player.h>o.y-10){
      score+=10;
      orbs.splice(i,1);
    }
  });

  // spawn periodically
  if(Math.random()<0.02) spawnObstacle();
  if(Math.random()<0.015) spawnOrb();

  drawPlayer();
  drawObstacles();
  drawOrbs();

  scoreDisplay.innerText = Math.floor(score);
  score+=0.1;

  requestAnimationFrame(update);
}

function flipGravity(){ player.gravity *= -1; player.dy = 0; player.y += player.gravity>0? 10:-10; }

// UI functions
function startGame(){ menu.style.display="none"; started=true; paused=false; resetGame(); bgm.play(); update();}
function gameOver(){ started=false; bgm.pause(); menu.style.display="block"; menu.innerHTML=`<h1 style="color:#f04;text-shadow:0 0 15px #f04;">GAME OVER</h1><p style="color:#0ff;">Score: ${Math.floor(score)}</p><button id='restartBtn'>Restart</button>`; document.getElementById("restartBtn").onclick=()=>{startGame();};}

startBtn.onclick=startGame;
pauseBtn.onclick=()=>{
  paused=!paused;
  pauseBtn.innerText=paused?"Resume":"Pause";
  if(!paused) update();
};
musicBtn.onclick=()=>{
  if(bgm.paused){ bgm.play(); musicBtn.innerText="Music: On";} 
  else{ bgm.pause(); musicBtn.innerText="Music: Off";}
};

// keyboard
window.addEventListener("keydown", e=>{
  if(e.code==="ArrowLeft") player.dx=-speed;
  if(e.code==="ArrowRight") player.dx=speed;
  if(e.code==="ArrowUp") flipGravity();
});
window.addEventListener("keyup", e=>{
  if(e.code==="ArrowLeft" || e.code==="ArrowRight") player.dx=0;
});

// touch
leftBtn.addEventListener("touchstart", ()=>{player.dx=-speed;});
leftBtn.addEventListener("touchend", ()=>{player.dx=0;});
rightBtn.addEventListener("touchstart", ()=>{player.dx=speed;});
rightBtn.addEventListener("touchend", ()=>{player.dx=0;});
flipBtn.addEventListener("touchstart", flipGravity);
flipBtn.addEventListener("touchend", ()=>{});
