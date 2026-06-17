// src/components/ChillZone.tsx
import { useState, useEffect, useCallback, useRef } from "react";

type Game = "menu" | "snake" | "tictactoe" | "wordle" | "2048";

// ─── WORDLE ──────────────────────────────────────────────────────────────────
const WORDS = ["REACT","STACK","DEBUG","CLONE","FETCH","PROXY","BUILD","CHUNK","PARSE","STATE","PROPS","HOOKS","ASYNC","AWAIT","YIELD","TYPES","CLASS","REDUX","AXIOS","VITE"];

function WordleGame() {
  const [target] = useState(() => WORDS[Math.floor(Math.random() * WORDS.length)]);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState("");
  const [status, setStatus] = useState<"playing"|"won"|"lost">("playing");
  const [shake, setShake] = useState(false);
  const [flip, setFlip] = useState<number>(-1);

  useEffect(() => {
    if (status !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") { submitGuess(); return; }
      if (e.key === "Backspace") { setCurrent(p => p.slice(0,-1)); return; }
      if (/^[a-zA-Z]$/.test(e.key) && current.length < 5) setCurrent(p => p + e.key.toUpperCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const submitGuess = () => {
    if (current.length !== 5) { setShake(true); setTimeout(() => setShake(false), 600); return; }
    const row = guesses.length;
    setFlip(row);
    const ng = [...guesses, current];
    setTimeout(() => {
      setGuesses(ng); setCurrent("");
      if (current === target) setStatus("won");
      else if (ng.length >= 6) setStatus("lost");
    }, 300);
  };

  const getTile = (guess: string, i: number) => {
    if (guess[i] === target[i]) return "correct";
    if (target.includes(guess[i])) return "present";
    return "absent";
  };

  const usedKeys: Record<string,string> = {};
  guesses.forEach(g => g.split("").forEach((ch,i) => {
    const s = getTile(g,i);
    if (!usedKeys[ch] || s === "correct") usedKeys[ch] = s;
  }));

  const keys = ["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];

  return (
    <div className="wordle-container">
      <div className="wordle-header">
        <h2 className="wordle-title">DEV<span>WORDLE</span></h2>
        <p className="wordle-sub">Guess the developer term · {6 - guesses.length} guesses left</p>
      </div>

      <div className="wordle-board">
        {Array.from({length:6}).map((_,row) => {
          const guess = guesses[row] ?? "";
          const isActive = row === guesses.length && status === "playing";
          const word = isActive ? current.padEnd(5) : guess.padEnd(5);
          const isFlipping = flip === row;
          return (
            <div key={row} className={`wordle-row ${shake && isActive ? "wordle-shake" : ""}`}>
              {Array.from({length:5}).map((_,col) => {
                const state = guess ? getTile(guess, col) : "";
                const filled = isActive && word[col]?.trim();
                return (
                  <div key={col}
                    className={`wordle-tile ${state} ${filled ? "wordle-tile-filled" : ""} ${isFlipping && guess ? "wordle-flip" : ""}`}
                    style={isFlipping ? {animationDelay:`${col*80}ms`} : {}}>
                    {word[col]?.trim() || ""}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {status !== "playing" && (
        <div className={`wordle-result ${status}`}>
          {status === "won" ? <><span>🎉</span> Brilliant! The word was <strong>{target}</strong></> : <><span>😔</span> The word was <strong>{target}</strong></>}
        </div>
      )}

      <div className="wordle-keyboard">
        {keys.map(row => (
          <div key={row} className="wordle-key-row">
            {row.split("").map(k => (
              <button key={k} className={`wordle-key ${usedKeys[k] || ""}`}
                onClick={() => status === "playing" && current.length < 5 && setCurrent(p => p+k)}>
                {k}
              </button>
            ))}
          </div>
        ))}
        <div className="wordle-key-row">
          <button className="wordle-key wordle-key-wide" onClick={() => status === "playing" && setCurrent(p => p.slice(0,-1))}>⌫ DEL</button>
          <button className="wordle-key wordle-key-wide wordle-key-enter" onClick={submitGuess}>ENTER ↵</button>
        </div>
      </div>
    </div>
  );
}

// ─── SNAKE ───────────────────────────────────────────────────────────────────
const GRID = 20; const CELL = 22;
type Pos = {x:number;y:number};

function SnakeGame() {
  const [snake, setSnake] = useState<Pos[]>([{x:10,y:10},{x:9,y:10},{x:8,y:10}]);
  const [food, setFood] = useState<Pos>({x:5,y:5});
  const [alive, setAlive] = useState(true);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [started, setStarted] = useState(false);
  const [speed, setSpeed] = useState(130);
  const dirRef = useRef<Pos>({x:1,y:0});
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const randomFood = useCallback((s:Pos[]): Pos => {
    let f:Pos;
    do { f={x:Math.floor(Math.random()*GRID),y:Math.floor(Math.random()*GRID)}; }
    while (s.some(p=>p.x===f.x&&p.y===f.y));
    return f;
  },[]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const W = GRID * CELL;
    ctx.clearRect(0,0,W,W);

    // Grid
    ctx.strokeStyle = "#ffffff05";
    ctx.lineWidth = 0.5;
    for (let i=0;i<=GRID;i++) {
      ctx.beginPath(); ctx.moveTo(i*CELL,0); ctx.lineTo(i*CELL,W); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0,i*CELL); ctx.lineTo(W,i*CELL); ctx.stroke();
    }

    // Food glow
    const grd = ctx.createRadialGradient(food.x*CELL+CELL/2,food.y*CELL+CELL/2,2,food.x*CELL+CELL/2,food.y*CELL+CELL/2,CELL);
    grd.addColorStop(0,"#ff6b6bcc"); grd.addColorStop(1,"transparent");
    ctx.fillStyle = grd;
    ctx.fillRect(food.x*CELL-CELL/2,food.y*CELL-CELL/2,CELL*2,CELL*2);
    ctx.fillStyle="#ff6b6b";
    ctx.beginPath(); ctx.arc(food.x*CELL+CELL/2,food.y*CELL+CELL/2,CELL/2-2,0,Math.PI*2); ctx.fill();

    // Snake
    snake.forEach((seg,i) => {
      const x=seg.x*CELL+2,y=seg.y*CELL+2,s=CELL-4;
      if (i===0) {
        const g=ctx.createLinearGradient(x,y,x+s,y+s);
        g.addColorStop(0,"#a78bfa"); g.addColorStop(1,"#6c63ff");
        ctx.fillStyle=g;
        ctx.shadowColor="#6c63ff"; ctx.shadowBlur=12;
      } else {
        const t=1-i/snake.length;
        ctx.fillStyle=`rgba(108,99,255,${0.3+t*0.5})`;
        ctx.shadowBlur=0;
      }
      const r=i===0?6:4;
      ctx.beginPath(); ctx.roundRect(x,y,s,s,r); ctx.fill();
    });
    ctx.shadowBlur=0;
  },[snake,food]);

  useEffect(() => {
    const onKey = (e:KeyboardEvent) => {
      const map:Record<string,Pos>={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},w:{x:0,y:-1},s:{x:0,y:1},a:{x:-1,y:0},d:{x:1,y:0}};
      const d=map[e.key];
      if (d&&!(d.x===-dirRef.current.x&&d.y===-dirRef.current.y)){dirRef.current=d;e.preventDefault();}
    };
    window.addEventListener("keydown",onKey);
    return ()=>window.removeEventListener("keydown",onKey);
  },[]);

  useEffect(() => {
    if (!alive||!started) return;
    const t=setInterval(()=>{
      setSnake(prev=>{
        const head={x:prev[0].x+dirRef.current.x,y:prev[0].y+dirRef.current.y};
        if(head.x<0||head.x>=GRID||head.y<0||head.y>=GRID||prev.some(p=>p.x===head.x&&p.y===head.y)){
          setAlive(false); return prev;
        }
        const ate=head.x===food.x&&head.y===food.y;
        const ns=ate?[head,...prev]:[head,...prev.slice(0,-1)];
        if(ate){
          setScore(s=>{const ns2=s+10+(Math.floor(s/50)*5);setBest(b=>Math.max(b,ns2));return ns2;});
          setFood(randomFood(ns));
          setSpeed(sp=>Math.max(60,sp-2));
        }
        return ns;
      });
    },speed);
    return ()=>clearInterval(t);
  },[alive,started,food,speed,randomFood]);

  const reset=()=>{
    const s=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    setSnake(s);setFood(randomFood(s));dirRef.current={x:1,y:0};
    setAlive(true);setScore(0);setSpeed(130);setStarted(true);
  };

  const dir=(d:Pos)=>{if(!(d.x===-dirRef.current.x&&d.y===-dirRef.current.y))dirRef.current=d;};

  return (
    <div className="snake-container">
      <div className="snake-header">
        <div>
          <h2 className="snake-title">🐍 Snake</h2>
          <p className="snake-sub">Use arrow keys or WASD · Speed increases with score</p>
        </div>
        <div className="snake-scores">
          <div className="snake-score-box"><span className="snake-score-label">SCORE</span><span className="snake-score-val">{score}</span></div>
          <div className="snake-score-box best"><span className="snake-score-label">BEST</span><span className="snake-score-val">{best}</span></div>
        </div>
      </div>

      <div className="snake-board-wrap">
        <canvas ref={canvasRef} width={GRID*CELL} height={GRID*CELL} className="snake-canvas" />
        {!started && (
          <div className="snake-overlay">
            <div className="snake-overlay-icon">🐍</div>
            <h3>Snake</h3>
            <p>Eat food, grow longer, don't crash!</p>
            <button className="chill-start-btn" onClick={reset}>▶ Start Game</button>
          </div>
        )}
        {!alive && (
          <div className="snake-overlay">
            <div className="snake-overlay-icon">💀</div>
            <h3>Game Over!</h3>
            <p>Score: <strong>{score}</strong></p>
            {score === best && score > 0 && <p className="snake-new-best">🏆 New Best!</p>}
            <button className="chill-start-btn" onClick={reset}>↺ Play Again</button>
          </div>
        )}
      </div>

      <div className="snake-dpad">
        <button className="snake-dpad-btn" onClick={()=>dir({x:0,y:-1})}>▲</button>
        <div className="snake-dpad-row">
          <button className="snake-dpad-btn" onClick={()=>dir({x:-1,y:0})}>◀</button>
          <div className="snake-dpad-center" />
          <button className="snake-dpad-btn" onClick={()=>dir({x:1,y:0})}>▶</button>
        </div>
        <button className="snake-dpad-btn" onClick={()=>dir({x:0,y:1})}>▼</button>
      </div>
    </div>
  );
}

// ─── TIC TAC TOE ─────────────────────────────────────────────────────────────
function TicTacToe() {
  const [board,setBoard]=useState<(string|null)[]>(Array(9).fill(null));
  const [xTurn,setXTurn]=useState(true);
  const [wins,setWins]=useState({X:0,O:0});
  const [winLine,setWinLine]=useState<number[]|null>(null);

  const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  const getWinner=(b:(string|null)[])=>{
    for(const [a,c,d] of lines) if(b[a]&&b[a]===b[c]&&b[a]===b[d]) return {w:b[a],l:[a,c,d]};
    return null;
  };
  const result=getWinner(board);
  const winner=result?.w;
  const isDraw=!winner&&board.every(Boolean);

  const click=(i:number)=>{
    if(board[i]||winner||isDraw) return;
    const b=[...board]; b[i]=xTurn?"X":"O";
    setBoard(b); setXTurn(!xTurn);
    const r=getWinner(b);
    if(r){setWinLine(r.l as number[]);setWins(w=>({...w,[r.w!]:w[r.w as "X"|"O"]+1}));}
  };

  const reset=()=>{setBoard(Array(9).fill(null));setXTurn(true);setWinLine(null);};

  return (
    <div className="ttt-container">
      <div className="ttt-header">
        <h2 className="ttt-title">Tic Tac Toe</h2>
        <div className="ttt-scores">
          <div className={`ttt-player ${xTurn&&!winner&&!isDraw?"ttt-player-active":""} ttt-x`}>
            <span>✕</span><span>Player X</span><span className="ttt-score">{wins.X}</span>
          </div>
          <div className="ttt-vs">VS</div>
          <div className={`ttt-player ${!xTurn&&!winner&&!isDraw?"ttt-player-active":""} ttt-o`}>
            <span>○</span><span>Player O</span><span className="ttt-score">{wins.O}</span>
          </div>
        </div>
      </div>

      <div className="ttt-status">
        {winner ? `${winner} wins! 🎉` : isDraw ? "Draw! 🤝" : `${xTurn?"✕":"○"}'s turn`}
      </div>

      <div className="ttt-board">
        {board.map((cell,i)=>(
          <button key={i} className={`ttt-cell ${cell==="X"?"ttt-x":"ttt-o"} ${winLine?.includes(i)?"ttt-win":""}`}
            onClick={()=>click(i)}>
            {cell==="X"?"✕":cell==="O"?"○":""}
          </button>
        ))}
      </div>

      {(winner||isDraw)&&<button className="chill-start-btn" onClick={reset}>↺ Play Again</button>}
    </div>
  );
}

// ─── 2048 ─────────────────────────────────────────────────────────────────────
type B2 = number[][];

const tileColors:Record<number,{bg:string,color:string}>={
  0:{bg:"#1a1a2e",color:"transparent"},
  2:{bg:"#1f1f3a",color:"#9ca3af"},
  4:{bg:"#2a2a4a",color:"#d1d5db"},
  8:{bg:"#6c63ff",color:"#fff"},
  16:{bg:"#5a52cc",color:"#fff"},
  32:{bg:"#ff6b6b",color:"#fff"},
  64:{bg:"#ef4444",color:"#fff"},
  128:{bg:"#f59e0b",color:"#fff"},
  256:{bg:"#fbbf24",color:"#fff"},
  512:{bg:"#10b981",color:"#fff"},
  1024:{bg:"#00d4ff",color:"#fff"},
  2048:{bg:"linear-gradient(135deg,#6c63ff,#00d4ff)",color:"#fff"},
};

function init2048():B2{const b=Array.from({length:4},()=>Array(4).fill(0));add(b);add(b);return b;}
function add(b:B2){const e:number[][]=[];b.forEach((r,i)=>r.forEach((v,j)=>{if(!v)e.push([i,j]);}));if(!e.length)return;const[i,j]=e[Math.floor(Math.random()*e.length)];b[i][j]=Math.random()<0.9?2:4;}
function slide(r:number[]):[number[],number]{const f=r.filter(Boolean);let sc=0;const m:number[]=[];let i=0;while(i<f.length){if(i+1<f.length&&f[i]===f[i+1]){m.push(f[i]*2);sc+=f[i]*2;i+=2;}else{m.push(f[i]);i++;}}while(m.length<4)m.push(0);return[m,sc];}

function move2048(b:B2,dir:string):[B2,number]{
  const n=b.map(r=>[...r]);let sc=0;
  const rot=(m:B2)=>m[0].map((_,i)=>m.map(r=>r[i]).reverse());
  const rotB=(m:B2)=>m[0].map((_,i)=>m.map(r=>r[r.length-1-i]));
  let mat=dir==="up"?rot(n):dir==="down"?rotB(n):n;
  if(dir==="right")mat=mat.map(r=>[...r].reverse());
  const moved=mat.map(r=>{const[s,c]=slide(r);sc+=c;return s;});
  let final=dir==="right"?moved.map(r=>[...r].reverse()):moved;
  if(dir==="up")final=rotB(final);if(dir==="down")final=rot(final);
  add(final);return[final,sc];
}

function Game2048(){
  const [board,setBoard]=useState<B2>(init2048);
  const [score,setScore]=useState(0);
  const [best,setBest]=useState(0);
  const [won,setWon]=useState(false);

  const doMove=useCallback((dir:string)=>{
    setBoard(prev=>{
      const[nb,sc]=move2048(prev,dir);
      setScore(s=>{const ns=s+sc;setBest(b=>Math.max(b,ns));return ns;});
      if(nb.flat().includes(2048))setWon(true);
      return nb;
    });
  },[]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      const map:Record<string,string>={ArrowUp:"up",ArrowDown:"down",ArrowLeft:"left",ArrowRight:"right"};
      if(map[e.key]){doMove(map[e.key]);e.preventDefault();}
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[doMove]);

  const max=Math.max(...board.flat());

  return (
    <div className="g2048-container">
      <div className="g2048-header">
        <div>
          <h2 className="g2048-title">2048</h2>
          <p className="g2048-sub">Combine tiles to reach <strong>2048</strong></p>
        </div>
        <div className="g2048-scores">
          <div className="g2048-score"><span>SCORE</span><strong>{score}</strong></div>
          <div className="g2048-score best"><span>BEST</span><strong>{best}</strong></div>
        </div>
      </div>

      {won && <div className="g2048-won">🎉 You reached 2048! Keep going?</div>}

      <div className="g2048-board">
        {board.flat().map((v,i)=>{
          const tc=tileColors[v]||{bg:"linear-gradient(135deg,#6c63ff,#00d4ff)",color:"#fff"};
          const fs=v>=1024?16:v>=100?20:v>=10?22:26;
          return(
            <div key={i} className={`g2048-tile ${v?"g2048-tile-filled":""}`}
              style={{background:tc.bg,color:tc.color,fontSize:fs,boxShadow:v>=8?`0 0 20px ${tc.bg}55`:"none"}}>
              {v||""}
            </div>
          );
        })}
      </div>

      <div className="g2048-dpad">
        <button className="snake-dpad-btn" onClick={()=>doMove("up")}>▲</button>
        <div className="snake-dpad-row">
          <button className="snake-dpad-btn" onClick={()=>doMove("left")}>◀</button>
          <div className="snake-dpad-center">{max}</div>
          <button className="snake-dpad-btn" onClick={()=>doMove("right")}>▶</button>
        </div>
        <button className="snake-dpad-btn" onClick={()=>doMove("down")}>▼</button>
      </div>

      <button className="chill-start-btn" onClick={()=>{setBoard(init2048());setScore(0);setWon(false);}}>↺ New Game</button>
    </div>
  );
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
const GAMES=[
  {id:"wordle",icon:"🟩",name:"DevWordle",desc:"Guess the dev term in 6 tries",color:"#538d4e"},
  {id:"snake",icon:"🐍",name:"Snake",desc:"Eat, grow, don't crash",color:"#6c63ff"},
  {id:"tictactoe",icon:"✕○",name:"Tic Tac Toe",desc:"Local two-player battle",color:"#00d4ff"},
  {id:"2048",icon:"2K",name:"2048",desc:"Slide tiles to combine",color:"#f59e0b"},
];

export default function ChillZone(){
  const[game,setGame]=useState<Game>("menu");

  if(game!=="menu"){
    return(
      <div className="chill-game-view">
        <div className="chill-game-topbar">
          <button className="chill-back-btn" onClick={()=>setGame("menu")}>← Chill Zone</button>
          <span className="chill-game-name">{GAMES.find(g=>g.id===game)?.icon} {GAMES.find(g=>g.id===game)?.name}</span>
        </div>
        <div className="chill-game-content">
          {game==="wordle"&&<WordleGame/>}
          {game==="snake"&&<SnakeGame/>}
          {game==="tictactoe"&&<TicTacToe/>}
          {game==="2048"&&<Game2048/>}
        </div>
      </div>
    );
  }

  return(
    <div className="main-content">
      <div className="main-header">
        <div><h1>Chill Zone 🎮</h1><p>Take a break · Play games · Recharge</p></div>
      </div>
      <div className="chill-menu-grid">
        {GAMES.map(g=>(
          <button key={g.id} className="chill-menu-card" onClick={()=>setGame(g.id as Game)}
            style={{"--card-color":g.color} as React.CSSProperties}>
            <div className="chill-card-icon">{g.icon}</div>
            <div className="chill-card-info">
              <h3>{g.name}</h3>
              <p>{g.desc}</p>
            </div>
            <span className="chill-card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}