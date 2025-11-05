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
const downBtn = document.getElementById("downBtn");

// player setup
let player = {x:240, y:400, w:20, h:20, dx:0, dy:0, speed:4, hp:100};
let enemies = [];
let items = [];
let score = 0;
let started = false;
let spawnTimer = 0;

// draw everything
function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // player
    ctx.fillStyle="#0ff";
    ctx.shadowBlur=20; ctx.shadowColor="#0ff";
    ctx.fillRect(player.x,player.y,player.w,player.h);
    ctx.shadowBlur=0;
    // enemies
    ctx.fillStyle="#f04";
    enemies.forEach(e=>ctx.fillRect(e.x,e.y,e.w,e.h));
    // items
    ctx.fillStyle="#ff0";
    items.forEach(it=>ctx.fillRect(it.x,it.y,it.w,it.h));
}

// spawn enemies/items
function spawnEnemy(){ enemies.push({x:Math.random()*480, y:-20, w:20, h:20, dy:2+Math.random()*2}); }
function spawnItem(){ items.push({x:Math.random()*480, y:-20, w:15, h:15, dy:1.5+Math.random()}); }

// update game
function update(){
    if(!started) return;

    player.x += player.dx*player.speed;
    player.y += player.dy*player.speed;
    // bounds
    if(player.x<0) player.x=0;
    if(player.x+player.w>canvas.width) player.x=canvas.width-player.w;
    if(player.y<0) player.y=0;
    if(player.y+player.h>canvas.height) player.y=canvas.height-player.h;

    // spawn
    spawnTimer++;
    if(spawnTimer%80===0) spawnEnemy();
    if(spawnTimer%200===0) spawnItem();

    // update enemies
    enemies.forEach((e,ei)=>{
        e.y+=e.dy;
        if(e.y>500) enemies.splice(ei,1);
        if(player.x<e.x+e.w && player.x+player.w>e.x && player.y<e.y+e.h && player.y+player.h>e.y){
            player.hp -=10;
            enemies.splice(ei,1);
            if(player.hp<=0) gameOver();
        }
    });

    // update items
    items.forEach((it,ii)=>{
        it.y += it.dy;
        if(it.y>500) items.splice(ii,1);
        if(player.x<it.x+it.w && player.x+player.w>it.x && player.y<it.y+it.h && player.y+player.h>it.y){
            score +=5;
            items.splice(ii,1);
        }
    });

    draw();
    updateUI();
    requestAnimationFrame(update);
}

// update UI
function updateUI(){ hpDisplay.innerText=player.hp; scoreDisplay.innerText=score; }

// start/reset
function startGame(){ menu.style.display='none'; started=true; player.hp=100; score=0; enemies=[]; items=[]; spawnTimer=0; update(); updateUI();}
function resetGame(){ startGame(); }
function gameOver(){ started=false; menu.style.display='block'; menu.innerHTML=`<h1 style="color:#f04;">GAME OVER</h1><p style="color:#0ff;">Score: ${score}</p><button id='restartBtn'>Restart</button>`; document.getElementById('restartBtn').onclick=()=>startGame(); }

// keyboard
window.addEventListener("keydown", e=>{
    if(!started) return;
    if(e.code==='ArrowLeft') player.dx=-1;
    if(e.code==='ArrowRight') player.dx=1;
    if(e.code==='ArrowUp') player.dy=-1;
    if(e.code==='ArrowDown') player.dy=1;
});
window.addEventListener("keyup", e=>{
    if(e.code==='ArrowLeft'||e.code==='ArrowRight') player.dx=0;
    if(e.code==='ArrowUp'||e.code==='ArrowDown') player.dy=0;
});

// touchscreen
leftBtn.addEventListener("touchstart",()=>player.dx=-1); leftBtn.addEventListener("touchend",()=>player.dx=0);
rightBtn.addEventListener("touchstart",()=>player.dx=1); rightBtn.addEventListener("touchend",()=>player.dx=0);
upBtn.addEventListener("touchstart",()=>player.dy=-1); upBtn.addEventListener("touchend",()=>player.dy=0);
downBtn.addEventListener("touchstart",()=>player.dy=1); downBtn.addEventListener("touchend",()=>player.dy=0);

// buttons
startBtn.onclick = ()=>startGame();
restartBtn.onclick = ()=>resetGame();
