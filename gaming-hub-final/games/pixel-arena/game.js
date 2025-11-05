const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreDisplay = document.getElementById("score");
const hpDisplay = document.getElementById("hp");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");

const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const shootBtn = document.getElementById("shootBtn");

let player = {x:250, y:250, w:20, h:20, dx:0, dy:0, speed:4, hp:100};
let bullets = [];
let enemies = [];
let score = 0;
let started = false;
let spawnTimer = 0;

// reset
function resetGame(){
    player.x=250; player.y=250; player.hp=100;
    bullets=[]; enemies=[]; score=0; spawnTimer=0;
    updateUI();
}

// update UI
function updateUI(){
    scoreDisplay.innerText = score;
    hpDisplay.innerText = player.hp;
}

// draw
function drawPlayer(){
    ctx.fillStyle="#0ff";
    ctx.shadowBlur=20; ctx.shadowColor="#0ff";
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur=0;
}

function drawBullets(){
    ctx.fillStyle="#0ff";
    bullets.forEach(b=>ctx.fillRect(b.x,b.y,b.w,b.h));
}

function drawEnemies(){
    ctx.fillStyle="#f04";
    enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.w,e.h));
}

// spawn enemy
function spawnEnemy(){
    enemies.push({x:Math.random()*480, y:Math.random()*20, w:20, h:20, dx:0, dy:2+Math.random()*2});
}

// shooting
function shoot(){
    bullets.push({x:player.x+player.w/2-5, y:player.y-10, w:10, h:10, dy:6});
}

// update loop
function update(){
    if(!started) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);

    player.x += player.dx*player.speed;
    player.y += player.dy*player.speed;

    if(player.x<0) player.x=0;
    if(player.x+player.w>canvas.width) player.x=canvas.width-player.w;
    if(player.y<0) player.y=0;
    if(player.y+player.h>canvas.height) player.y=canvas.height-player.h;

    bullets.forEach((b,i)=>{ b.y-=b.dy; if(b.y<0) bullets.splice(i,1); });

    spawnTimer++;
    if(spawnTimer%60===0) spawnEnemy();

    enemies.forEach((e,ei)=>{
        e.y += e.dy;

        // collision with player
        if(player.x<e.x+e.w && player.x+player.w>e.x && player.y<e.y+e.h && player.y+player.h>e.y){
            player.hp -=10; enemies.splice(ei,1);
            if(player.hp<=0) gameOver();
        }

        // collision with bullets
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
    updateUI();
    requestAnimationFrame(update);
}

// start / game over
function startGame(){ menu.style.display='none'; started=true; resetGame(); update(); }
function gameOver(){ started=false; menu.style.display='block'; menu.innerHTML=`<h1 style="color:#f04;">GAME OVER</h1><p style="color:#0ff;">Score: ${score}</p><button id='restartBtn'>Restart</button>`; document.getElementById('restartBtn').onclick=()=>startGame(); }

// keyboard controls
window.addEventListener("keydown", e=>{
    if(!started) return;
    if(e.code==='ArrowLeft') player.dx=-1;
    if(e.code==='ArrowRight') player.dx=1;
    if(e.code==='ArrowUp') player.dy=-1;
    if(e.code==='ArrowDown') player.dy=1;
    if(e.code==='Space') shoot();
});
window.addEventListener("keyup", e=>{
    if(e.code==='ArrowLeft'||e.code==='ArrowRight') player.dx=0;
    if(e.code==='ArrowUp'||e.code==='ArrowDown') player.dy=0;
});

// touchscreen
leftBtn.addEventListener("touchstart",()=>player.dx=-1);
leftBtn.addEventListener("touchend",()=>player.dx=0);
rightBtn.addEventListener("touchstart",()=>player.dx=1);
rightBtn.addEventListener("touchend",()=>player.dx=0);
upBtn.addEventListener("touchstart",()=>player.dy=-1);
upBtn.addEventListener("touchend",()=>player.dy=0);
downBtn.addEventListener("touchstart",()=>player.dy=1);
downBtn.addEventListener("touchend",()=>player.dy=0);
shootBtn.addEventListener("touchstart",shoot);

// buttons
startBtn.onclick = ()=>startGame();
restartBtn.onclick = ()=>resetGame();
