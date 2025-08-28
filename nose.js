const cells = Array.from(document.querySelectorAll('.cell'));
const statusDisplay = document.getElementById('status');
const restartButton = document.getElementById('restart-button');
const startsComputer = document.getElementById('starts-computer');
const difficultySel = document.getElementById('difficulty');

let gameActive = true;
const HUMAN = 'X', CPU = 'O';
let gameState = Array(9).fill('');

// líneas ganadoras
const winning = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function getWinner(s){
  for (const line of winning) {
    const [a,b,c] = line;
    if (s[a] && s[a] === s[b] && s[a] === s[c]) return { player: s[a], line };
  }
  return null;
}
function isDraw(s){ return !s.includes('') && !getWinner(s); }
function setStatus(t, html=false){ html ? statusDisplay.innerHTML = t : statusDisplay.textContent = t; }
function highlight(line){ line.forEach(i => cells[i].classList.add('win')); }
function disableAll(){ cells.forEach(c => c.classList.add('disabled')); }
function enableAll(){ cells.forEach(c => c.classList.remove('disabled')); }
function emptiesOf(s){ return s.map((v,i)=>v===''?i:null).filter(i=>i!==null); }

// --- Dificultad: tasas de “error” ---
function mistakeRate() {
  switch (difficultySel?.value) {
    case 'easy':   return 0.65; // se equivoca MUCHO
    case 'normal': return 0.25; // se equivoca a veces
    case 'pro':    return 0.0;  // perfecto
    default:       return 0.25;
  }
}

// Elige una jugada “buena” (gana/bloquea/centro/esquinas/lateral)
function bestMoveHeuristic(state) {
  const empty = emptiesOf(state);

  // 1) ¿Puedo ganar ahora?
  for (const i of empty) {
    const t = state.slice(); t[i] = CPU;
    if (getWinner(t)) return i;
  }
  // 2) ¿Debo bloquear al humano?
  for (const i of empty) {
    const t = state.slice(); t[i] = HUMAN;
    if (getWinner(t)) return i;
  }
  // 3) Centro
  if (state[4] === '') return 4;

  // 4) Esquinas
  const corners = [0,2,6,8].filter(i => state[i] === '');
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

  // 5) Laterales
  return empty[Math.floor(Math.random() * empty.length)];
}

// Aplica dificultad: a veces ignora la jugada óptima y elige otra
function bestMoveWithDifficulty(state) {
  const empty = emptiesOf(state);
  if (empty.length === 0) return null;

  // Si está en “pro”, siempre óptima
  if (mistakeRate() === 0) return bestMoveHeuristic(state);

  // Con cierta probabilidad, hace una jugada “no óptima”
  if (Math.random() < mistakeRate()) {
    // Evitar regalar victoria inmediata del humano si es posible:
    // intentamos elegir una aleatoria que NO permita al humano ganar al toque.
    const safeChoices = empty.filter(i => {
      const t = state.slice(); t[i] = CPU;
      // si tras mi jugada el humano tiene victoria inmediata en 1 paso, descartamos
      return !emptiesOf(t).some(h => {
        const th = t.slice(); th[h] = HUMAN;
        return !!getWinner(th);
      });
    });
    const pool = safeChoices.length ? safeChoices : empty;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Si no tocó equivocarse, jugada óptima
  return bestMoveHeuristic(state);
}

function checkEnd() {
  const win = getWinner(gameState);
  if (win) {
    gameActive = false; 
    highlight(win.line);
    if (win.player === HUMAN) {
        setStatus('¡Ganaste! 🎉');
        // 🚀 confeti
        confetti({
            particleCount: 120,
            spread: 70,
            origin: { y: 0.6 }
        });
    } else {
        setStatus('Perdiste 😅');
    }
    disableAll();
    return true;
}

  if (isDraw(gameState)) {
    gameActive = false; setStatus('Empate 🤝'); disableAll(); return true;
  }
  return false;
}

function cpuPlay() {
  if (!gameActive) return;
  const i = bestMoveWithDifficulty(gameState);
  if (i === null) return;
  gameState[i] = CPU; cells[i].textContent = CPU;
  checkEnd();
}

function humanPlay(idx) {
  if (!gameActive || gameState[idx] !== '') return;
  gameState[idx] = HUMAN; cells[idx].textContent = HUMAN;
  if (checkEnd()) return;
  setTimeout(cpuPlay, 220);
}

function restart() {
  gameActive = true;
  gameState = Array(9).fill('');
  cells.forEach(c => { c.textContent = ''; c.classList.remove('win','disabled'); });
  enableAll();

  if (startsComputer && startsComputer.checked) {
    setStatus('Turno de la compu…');
    setTimeout(cpuPlay, 220);
  } else {
    setStatus('Tu turno (jugás con <strong>X</strong>)', true);
  }
}

cells.forEach((c,i)=>c.addEventListener('click', () => humanPlay(i)));
restartButton.addEventListener('click', restart);
startsComputer.addEventListener('change', restart);
difficultySel?.addEventListener('change', restart);

// inicio
restart();

