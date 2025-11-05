const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const hpDisplay = document.getElementById("hp");
const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const musicBtn = document.getElementById("musicBtn");
const menu = document.getElementById("menu");
const bgm = document.getElementById("bgm");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const jumpBtn = document.getElementById("jumpBtn");

// player
let player = {x:100,y:0,w:40,h:40,dx:0,dy:0,onGround:false,hp:100};
let gravity = 1.2;
let jumpPower = -18;
let speed = 8; // smooth speed per frame
let platforms = [];
let enemies = [];
let orbs = [];
let score = 0;
let paused = false;
let started = false;
let damageCooldown = false;

function resetGame(){
  player.x = 100;
  player.y = canvas.height-150;
  player.dx = 0;
  player.dy = 0;
  player.hp = 100;
  score = 0;
  damageCooldown = false;
  platforms = [];
  enemies = [];
  orbs = [];
  generatePlatforms();
  generateEnemies();
}

function generatePlatforms(){
  for(let i=0;i<12;i++){
    platforms.push({x:i*250+50,y:canvas.height-100-(i%3)*50,w:200,h:20});
  }
}

function generateEnemies(){
  for(let i=0;i<6;i++){
    enemies.push({x:300+i*300,y:canvas.height-140,h:40,w:40,dir:1});
  }
}

function drawPlayer(){
  ctx.shadowBlur=20;
  ctx.shadowColor="#0ff";
  ctx.fillStyle="#0ff";
  ctx.fillRect(player.x,player.y,player.w,player.h);
  ctx.shadowBlur=0;
}

function drawPlatforms(){
  ctx.strokeStyle="#0ff";
  ctx.lineWidth=3;
  ctx.shadowBlur=10;
  ctx.shadowColor="#0ff";
  platforms.forEach(p=>ctx.strokeRect(p.x,p.y,p.w,p.h));
  ctx.shadowBlur=0;
}

function drawEnemies(){
  ctx.fillStyle="#f04";
  ctx.shadowBlur=15;
  ctx.shadowColor="#f04";
  enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.w,e.h));
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

function update(){
  if(!started || paused) return;

  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawPlatforms();
  drawEnemies();
  drawOrbs();

  // apply movement
  player.x += player.dx;
  player.y += player.dy;
  player.dy += gravity;

  player.onGround = false;
  // platform collisions
  platforms.forEach(p=>{
    if(player.x+player.w > p.x && player.x < p.x+p.w &&
       player.y+player.h >= p.y && player.y+player.h <= p.y+player.dy+1 && player.dy>=0){
      player.y = p.y - player.h;
      player.dy = 0;
      player.onGround = true;
    }
  });

  // enemy movement & collision
  enemies.forEach(e=>{
    e.x += e.dir*2;
    if(e.x<0 || e.x+e.w>canvas.width) e.dir*=-1;
    if(player.x<e.x+e.w && player.x+player.w>e.x &&
       player.y<e.y+e.h && player.y+player.h>e.y){
      if(!damageCooldown){
        player.hp -= 10;
        damageCooldown=true;
        setTimeout(()=>{damageCooldown=false;},500);
        if(player.hp<=0) gameOver();
      }
    }
  });

  // spawn orbs on platforms
  if(Math.random()<0.01){
    let p=platforms[Math.floor(Math.random()*platforms.length)];
    orbs.push({x:p.x+Math.random()*p.w,y:p.y-10});
  }

  orbs.forEach((o,i)=>{
    if(player.x<o.x+10 && player.x+player.w>o.x-10 && player.y<o.y+10 && player.y+player.h>o.y-10){
      score+=10;
      orbs.splice(i,1);
    }
  });

  // prevent leaving canvas horizontally
  if(player.x < 0) player.x = 0;
  if(player.x + player.w > canvas.width) player.x = canvas.width - player.w;

  // check falling
  if(player.y > canvas.height){
    gameOver();
  }

  drawPlayer();
  hpDisplay.innerText = player.hp;
  scoreDisplay.innerText = Math.floor(score);
  score+=0.1;

  requestAnimationFrame(update);
}

function jump(){ if(player.onGround) player.dy = jumpPower; }

function gameOver(){
  started=false;
  bgm.pause();
  menu.style.display="block";
  menu.innerHTML = `<h1 style="color:#f04;text-shadow:0 0 15px #f04;">GAME OVER</h1>
    <p style="color:#0ff;">Score: ${Math.floor(score)}</p>
    <button id='restartBtn'>Restart</button>`;
  document.getElementById("restartBtn").onclick = ()=>{resetGame(); startGame();}
}

function startGame(){
  menu.style.display="none";
  started=true;
  paused=false;
  bgm.play();
  resetGame();
  update();
}

// UI
startBtn.onclick = startGame;
pauseBtn.onclick = ()=>{
  paused=!paused;
  pauseBtn.innerText = paused?"Resume":"Pause";
  if(!paused) update();
};
musicBtn.onclick = ()=>{
  if(bgm.paused){ bgm.play(); musicBtn.innerText="Music: On";}
  else{ bgm.pause(); musicBtn.innerText="Music: Off";}
};

// keyboard movement
window.addEventListener("keydown",e=>{
  if(e.code==="ArrowLeft") player.dx = -speed;
  if(e.code==="ArrowRight") player.dx = speed;
  if(e.code==="ArrowUp") jump();
});
window.addEventListener("keyup",e=>{
  if(e.code==="ArrowLeft" || e.code==="ArrowRight") player.dx = 0;
});

// touch arrows
leftBtn.addEventListener("touchstart",()=>{player.dx=-speed;});
leftBtn.addEventListener("touchend",()=>{player.dx=0;});
rightBtn.addEventListener("touchstart",()=>{player.dx=speed;});
rightBtn.addEventListener("touchend",()=>{player.dx=0;});
jumpBtn.addEventListener("touchstart", jump);
jumpBtn.addEventListener("touchend", ()=>{});
