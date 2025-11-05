const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const menu = document.getElementById("menu");

const upBtn = document.getElementById("upBtn");
const downBtn = document.getElementById("downBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");

let gridSize = 4;
let grid = [];
let score = 0;
let started = false;
let tileColors = ['#0ff','#0ff9','#0ff3','#0ff7','#0ff1','#0ff5'];

// initialize empty grid
function resetGrid(){
  grid = Array.from({length:gridSize},()=>Array(gridSize).fill(0));
  score = 0;
  addRandomTile();
  addRandomTile();
  drawGrid();
}

function addRandomTile(){
  let empty = [];
  for(let i=0;i<gridSize;i++){
    for(let j=0;j<gridSize;j++){
      if(grid[i][j]===0) empty.push({i,j});
    }
  }
  if(empty.length===0) return;
  let spot = empty[Math.floor(Math.random()*empty.length)];
  grid[spot.i][spot.j] = Math.random()<0.9?2:4;
}

function drawGrid(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  let cellSize = canvas.width/gridSize;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "bold 28px Orbitron";
  for(let i=0;i<gridSize;i++){
    for(let j=0;j<gridSize;j++){
      let val = grid[i][j];
      ctx.fillStyle = val? tileColors[Math.min(Math.log2(val)-1, tileColors.length-1)]:'#111';
      ctx.shadowBlur = val? 20 : 0;
      ctx.shadowColor = val? "#0ff":"#000";
      ctx.fillRect(j*cellSize+5, i*cellSize+5, cellSize-10, cellSize-10);
      if(val){
        ctx.fillStyle = "#000";
        ctx.fillText(val, j*cellSize+cellSize/2, i*cellSize+cellSize/2);
      }
    }
  }
  scoreDisplay.innerText = score;
}

// slide/merge logic
function slide(row){
  let arr = row.filter(val=>val);
  for(let i=0;i<arr.length-1;i++){
    if(arr[i]===arr[i+1]){
      arr[i]*=2;
      score+=arr[i];
      arr[i+1]=0;
    }
  }
  arr = arr.filter(val=>val);
  while(arr.length<gridSize) arr.push(0);
  return arr;
}

function move(direction){
  let moved = false;
  if(direction==='left'){
    for(let i=0;i<gridSize;i++){
      let row = grid[i];
      let newRow = slide(row);
      if(row.join()!==newRow.join()) moved=true;
      grid[i] = newRow;
    }
  } else if(direction==='right'){
    for(let i=0;i<gridSize;i++){
      let row = grid[i].slice().reverse();
      let newRow = slide(row).reverse();
      if(grid[i].join()!==newRow.join()) moved=true;
      grid[i] = newRow;
    }
  } else if(direction==='up'){
    for(let j=0;j<gridSize;j++){
      let col = [];
      for(let i=0;i<gridSize;i++) col.push(grid[i][j]);
      let newCol = slide(col);
      for(let i=0;i<gridSize;i++){
        if(grid[i][j]!==newCol[i]) moved=true;
        grid[i][j] = newCol[i];
      }
    }
  } else if(direction==='down'){
    for(let j=0;j<gridSize;j++){
      let col = [];
      for(let i=0;i<gridSize;i++) col.push(grid[i][j]);
      let newCol = slide(col.reverse()).reverse();
      for(let i=0;i<gridSize;i++){
        if(grid[i][j]!==newCol[i]) moved=true;
        grid[i][j] = newCol[i];
      }
    }
  }
  if(moved) addRandomTile();
  drawGrid();
}

// keyboard controls
window.addEventListener("keydown", e=>{
  if(!started) return;
  if(e.code==='ArrowLeft') move('left');
  if(e.code==='ArrowRight') move('right');
  if(e.code==='ArrowUp') move('up');
  if(e.code==='ArrowDown') move('down');
});

// touch controls
leftBtn.addEventListener("touchstart",()=>move('left'));
rightBtn.addEventListener("touchstart",()=>move('right'));
upBtn.addEventListener("touchstart",()=>move('up'));
downBtn.addEventListener("touchstart",()=>move('down'));

// start/restart
startBtn.onclick = () => { started=true; menu.style.display='none'; resetGrid(); };
restartBtn.onclick = () => resetGrid();
