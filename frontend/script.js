const API = 'https://connect4solver.onrender.com/api';
const COLS = 7, ROWS = 6;
const DEPTH = { easy: 2, medium: 4, hard: 6 };

const $ = id => document.getElementById(id);
const cellEl = [];            // cellEl[r][c] -> div.cell

let board, colsHeight, history, moves, busy, gameOver;
let settings = { humanColor: 'red', humanFirst: true, depth: DEPTH.medium };
let scores = loadScores();

const aiColor = () => settings.humanColor === 'red' ? 'yellow' : 'red';
const snapshot = () => board.map(row => row.slice());

/* ---------- board construction ---------- */
function buildBoard() {
	const boardEl = $('board');
	boardEl.innerHTML = '';
	for (let c = 0; c < COLS; c++) {
		const col = document.createElement('div');
		col.className = 'col';
		col.addEventListener('click', () => clickCol(c));
		for (let r = 0; r < ROWS; r++) {
			const cell = document.createElement('div');
			cell.className = 'cell';
			(cellEl[r] ||= [])[c] = cell;
			col.appendChild(cell);
		}
		boardEl.appendChild(col);
	}
}

function paint(r, c, internal, animate) {
	const cell = cellEl[r][c];
	cell.innerHTML = '';
	cell.classList.remove('win');
	if (internal === '.') return;
	const color = internal === 'R' ? settings.humanColor : aiColor();
	const disc = document.createElement('div');
	disc.className = 'disc ' + color + (animate ? ' drop' : '');
	disc.style.setProperty('--d', r + 1);
	cell.appendChild(disc);
}

function render() {
	for (let r = 0; r < ROWS; r++)
		for (let c = 0; c < COLS; c++)
			paint(r, c, board[r][c], false);
}

/* ---------- networking ---------- */
async function post(body) {
	const res = await fetch(API, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	return res.json();
}

const ERRORS = {
	601: 'Column is full',
	602: 'Invalid move',
	603: 'Board is corrupted',
	604: 'Board is full',
	605: 'Piece count mismatch',
	606: 'Game is already over'
};

/* ---------- gameplay ---------- */
async function clickCol(c) {
	if (busy || gameOver) return;
	if (colsHeight[c] >= ROWS) { flash('Column is full'); return; }
	busy = true;

	const sent = snapshot();                 // board BEFORE our move (server drops our piece)
	const hr = ROWS - 1 - colsHeight[c];
	board[hr][c] = 'R';
	colsHeight[c]++;
	paint(hr, c, 'R', true);
	setStatus('AI thinking…');

	let res;
	try {
		res = await post({ col_num: c + 1, board: sent, depth: settings.depth, human_first: settings.humanFirst });
	} catch {
		board[hr][c] = '.'; colsHeight[c]--; paint(hr, c, '.', false);
		flash('Network error'); setStatus('Your turn…'); busy = false;
		return;
	}

	if (res.status !== 200) {
		board[hr][c] = '.'; colsHeight[c]--; paint(hr, c, '.', false);
		flash(ERRORS[res.status] || 'Error'); setStatus('Your turn…'); busy = false;
		return;
	}

	colsHeight = res.cols_height_human.slice();
	moves++; renderMoves();

	if (res.game_status !== -1) {            // our move ended the game; AI did not reply
		pushHistory();
		endGame(res.game_status, hr, c);
		busy = false;
		return;
	}

	const [ar, ac] = res.ai_piece;
	board[ar][ac] = 'Y';
	colsHeight = res.cols_height_ai.slice();
	paint(ar, ac, 'Y', true);
	moves++; renderMoves();
	pushHistory();

	if (res.game_status_now !== -1) endGame(res.game_status_now, ar, ac);
	else setStatus('Your turn…');
	busy = false;
}

function endGame(status, r, c) {
	gameOver = true;
	document.body.classList.add('over');
	if (status === 0) { setStatus('Draw'); scores.draws++; }
	else if (status === 1) { setStatus('You win! 🎉'); scores.you++; highlightWin(r, c, 'R'); }
	else if (status === 2) { setStatus('AI wins'); scores.ai++; highlightWin(r, c, 'Y'); }
	saveScores(); renderScores();
}

// find the winning run of 4 through the last-placed cell and glow it
function highlightWin(r, c, ch) {
	const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
	for (const [dr, dc] of dirs) {
		const cells = [[r, c]];
		for (const s of [1, -1]) {
			let rr = r + dr * s, cc = c + dc * s;
			while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === ch) {
				cells.push([rr, cc]); rr += dr * s; cc += dc * s;
			}
		}
		if (cells.length >= 4) {
			// ponytail: runs are ~always exactly 4; first 4 is fine for the glow
			cells.slice(0, 4).forEach(([wr, wc]) => cellEl[wr][wc].classList.add('win'));
			return;
		}
	}
}

/* ---------- history / undo ---------- */
function pushHistory() {
	history.push({ board: snapshot(), colsHeight: colsHeight.slice(), moves });
}

function undo() {
	if (busy || history.length <= 1) return;   // keep the opening snapshot
	history.pop();
	const s = history[history.length - 1];
	board = s.board.map(row => row.slice());
	colsHeight = s.colsHeight.slice();
	moves = s.moves;
	gameOver = false;
	document.body.classList.remove('over');
	render(); renderMoves(); setStatus('Your turn…');
}

/* ---------- new game ---------- */
async function newGame() {
	readSettings();
	board = Array.from({ length: ROWS }, () => Array(COLS).fill('.'));
	colsHeight = Array(COLS).fill(0);
	history = []; moves = 0; gameOver = false; busy = false;
	document.body.classList.remove('over');
	render(); renderMoves();

	if (settings.humanFirst) {
		setStatus('Your turn…');
		pushHistory();
		return;
	}

	setStatus('AI thinking…'); busy = true;
	try {
		const res = await post({ col_num: null, board: snapshot(), depth: settings.depth, human_first: false });
		if (res.status === 200) {
			const [ar, ac] = res.ai_piece;
			board[ar][ac] = 'Y';
			colsHeight = res.cols_height_ai.slice();
			paint(ar, ac, 'Y', true);
			moves++; renderMoves();
		} else flash(ERRORS[res.status] || 'Error');
	} catch { flash('Network error'); }
	setStatus('Your turn…'); busy = false;
	pushHistory();
}

/* ---------- settings / scores / ui ---------- */
function readSettings() {
	settings.humanColor = $('color').value;
	settings.humanFirst = $('first').value === 'you';
	settings.depth = DEPTH[$('difficulty').value];
}

function loadScores() {
	try { return JSON.parse(localStorage.getItem('c4-scores')) || { you: 0, ai: 0, draws: 0 }; }
	catch { return { you: 0, ai: 0, draws: 0 }; }
}
function saveScores() { localStorage.setItem('c4-scores', JSON.stringify(scores)); }

function renderScores() {
	$('s-you').textContent = scores.you;
	$('s-ai').textContent = scores.ai;
	$('s-draw').textContent = scores.draws;
}
function renderMoves() { $('move-count').textContent = moves; }
function setStatus(t) { $('status').textContent = t; }

function applyTheme(t) {
	document.body.classList.toggle('light', t === 'light');
	$('theme').textContent = t === 'light' ? '🌙 Dark' : '☀️ Light';
	localStorage.setItem('c4-theme', t);
}

let flashTimer;
function flash(msg) {
	$('message').textContent = msg;
	clearTimeout(flashTimer);
	flashTimer = setTimeout(() => { $('message').textContent = ''; }, 2200);
}

/* ---------- init ---------- */
buildBoard();
renderScores();
applyTheme(localStorage.getItem('c4-theme') || 'dark');
$('new').addEventListener('click', newGame);
$('undo').addEventListener('click', undo);
$('theme').addEventListener('click', () =>
	applyTheme(document.body.classList.contains('light') ? 'dark' : 'light'));
$('color').addEventListener('change', () => { settings.humanColor = $('color').value; render(); });
newGame();
