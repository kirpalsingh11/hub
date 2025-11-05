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
const shootBtn = document.getElementById("shootBtn");

// player
let player = {x:canvas.width/2-20, y:canvas.height-80, w:40, h:40, dx:0, speed:0, targetSpeed:8, hp:100};
let bullets = [];
let enemies = [];
let score = 0;
let started = false;
let paused = false;
let spawnTimer = 0;

// reset game
function resetGame(){
    player.x = canvas.width/2-20;
    player.dx = 0;
    player.speed = 0;
    player.hp = 100;
    bullets = [];
    enemies = [];
    score = 0;
    spawnTimer = 0;
}

// draw functions
function drawPlayer(){
    ctx.shadowBlur=20;
    ctx.shadowColor="#0ff";
    ctx.fillStyle="#0ff";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur=0;
}

function drawBullets(){
    ctx.fillStyle="#0ff";
    ctx.shadowBlur=10;
    ctx.shadowColor="#0ff";
    bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));
    ctx.shadowBlur=0;
}

function drawEnemies(){
    ctx.fillStyle="#f04";
    ctx.shadowBlur=15;
    ctx.shadowColor="#f04";
    enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.w,e.h));
    ctx.shadowBlur=0;
}

function drawHP(){
    ctx.fillStyle="#0ff";
    ctx.fillRect(20,20,player.hp*2,20);
    ctx.strokeStyle="#0ff";
    ctx.strokeRect(20,20,200,20);
}

// spawn enemy
function spawnEnemy(){
    enemies.push({x:Math.random()*(canvas.width-50), y:-50, w:50, h:50, dy:3});
}

// update loop
function update(){
    if(!started || paused) return;

    ctx.clearRect(0,0,canvas.width,canvas.height);

    // smooth movement
    player.x += player.speed;
    player.speed += (player.dx - player.speed) * 0.2; // easing

    // keep player in bounds
    if(player.x<0) player.x=0;
    if(player.x+player.w>canvas.width) player.x=canvas.width-player.w;

    // bullets
    bullets.forEach((b,i)=>{
        b.y -= b.dy;
        if(b.y < -10) bullets.splice(i,1);
    });

    // spawn enemies
    spawnTimer++;
    if(spawnTimer%60===0) spawnEnemy();

    // enemies
    enemies.forEach((e,ei)=>{
        e.y += e.dy;

        // enemy passed bottom -> lose HP
        if(e.y>canvas.height){
            player.hp -= 10;
            enemies.splice(ei,1);
            if(player.hp <= 0) gameOver();
        }

        // collision with player
        if(player.x<e.x+e.w && player.x+player.w>e.x && player.y<e.y+e.h && player.y+player.h>e.y){
            gameOver();
        }

        // collision with bullets
        bullets.forEach((b,bi)=>{
            if (
                b.x < e.x + e.w &&
                b.x + b.w > e.x &&
                b.y < e.y + e.h &&
                b.y + b.h > e.y
            ) {
                enemies.splice(ei,1); // destroy enemy
                bullets.splice(bi,1); // destroy bullet
                score += 10;
            }
        });
    });

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawHP();

    scoreDisplay.innerText = Math.floor(score);
    score += 0.1;

    requestAnimationFrame(update);
}

// shooting
function shoot(){
    bullets.push({x:player.x+player.w/2-5, y:player.y-10, w:10, h:20, dy:12});
}

// game start / over
function startGame(){ 
    menu.style.display = "none"; 
    started = true; 
    paused = false; 
    resetGame(); 
    bgm.play(); 
    update();
}

function gameOver(){ 
    started=false; 
    bgm.pause(); 
    menu.style.display="block"; 
    menu.innerHTML = `<h1 style="color:#f04;text-shadow:0 0 15px #f04;">GAME OVER</h1>
    <p style="color:#0ff;">Score: ${Math.floor(score)}</p>
    <button id='restartBtn'>Restart</button>`; 
    document.getElementById("restartBtn").onclick=()=>{startGame();};
}

// UI buttons
pauseBtn.onclick=()=>{
    paused=!paused;
    pauseBtn.innerText=paused?"Resume":"Pause";
    if(!paused) update();
};

musicBtn.onclick=()=>{
    if(bgm.paused){ bgm.play(); musicBtn.innerText="Music: On";} 
    else{ bgm.pause(); musicBtn.innerText="Music: Off";}
};

// keyboard controls
window.addEventListener("keydown", e=>{
    if(e.code==="ArrowLeft") player.dx=-player.targetSpeed;
    if(e.code==="ArrowRight") player.dx=player.targetSpeed;
    if(e.code==="ArrowUp" || e.code==="Space") shoot();
});
window.addEventListener("keyup", e=>{
    if(e.code==="ArrowLeft" || e.code==="ArrowRight") player.dx=0;
});

// touch controls
leftBtn.addEventListener("touchstart", ()=>{player.dx=-player.targetSpeed;});
leftBtn.addEventListener("touchend", ()=>{player.dx=0;});
rightBtn.addEventListener("touchstart", ()=>{player.dx=player.targetSpeed;});
rightBtn.addEventListener("touchend", ()=>{player.dx=0;});
shootBtn.addEventListener("touchstart", shoot);
shootBtn.addEventListener("touchend", ()=>{});

// start button hookup
startBtn.onclick = () => { startGame(); };
