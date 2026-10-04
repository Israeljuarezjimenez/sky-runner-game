const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('bestScore');
const livesEl = document.getElementById('lives');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('messageOverlay');

const width = canvas.width;
const height = canvas.height;
const keys = {};

let score = 0;
let bestScore = Number(localStorage.getItem('sky-runner-best') || 0);
let lives = 3;
let gameRunning = false;
let lastTime = 0;
let spawnTimer = 0;

const player = {
  x: 90,
  y: height / 2,
  size: 28,
  speed: 320,
};

const stars = [];
const obstacles = [];

bestScoreEl.textContent = bestScore;

function setOverlay(title, text) {
  overlay.innerHTML = `
    <div class="dialog-box">
      <p class="eyebrow light">Bienvenido</p>
      <h2>${title}</h2>
      <p>${text}</p>
    </div>
  `;
}

function resetGame() {
  score = 0;
  lives = 3;
  stars.length = 0;
  obstacles.length = 0;
  player.x = 90;
  player.y = height / 2;
  spawnTimer = 0;
  scoreEl.textContent = '0';
  livesEl.textContent = String(lives);
  overlay.classList.add('visible');
  setOverlay('Sky Runner', 'Recoge estrellas y evita los asteroides.');
  gameRunning = false;
}

function startGame() {
  resetGame();
  gameRunning = true;
  overlay.classList.remove('visible');
  requestAnimationFrame(gameLoop);
}

function spawnStar() {
  const size = 10 + Math.random() * 8;
  stars.push({
    x: width + 20,
    y: 50 + Math.random() * (height - 120),
    size,
    speed: 200 + Math.random() * 140,
  });
}

function spawnObstacle() {
  const size = 16 + Math.random() * 22;
  obstacles.push({
    x: width + 20,
    y: 50 + Math.random() * (height - 120),
    size,
    speed: 230 + Math.random() * 180,
    drift: (Math.random() - 0.5) * 100,
  });
}

function handleInput(dt) {
  if (!gameRunning) return;

  if (keys.ArrowLeft || keys.a) player.x -= player.speed * dt;
  if (keys.ArrowRight || keys.d) player.x += player.speed * dt;
  if (keys.ArrowUp || keys.w) player.y -= player.speed * dt;
  if (keys.ArrowDown || keys.s) player.y += player.speed * dt;

  player.x = Math.max(20, Math.min(width - player.size - 20, player.x));
  player.y = Math.max(20, Math.min(height - player.size - 20, player.y));
}

function updateEntities(dt) {
  for (let i = stars.length - 1; i >= 0; i--) {
    stars[i].x -= stars[i].speed * dt;
    if (stars[i].x + stars[i].size < 0) {
      stars.splice(i, 1);
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacles[i].speed * dt;
    obstacles[i].y += Math.sin((Date.now() / 1000) + i) * obstacles[i].drift * dt;
    if (obstacles[i].x + obstacles[i].size < 0) {
      obstacles.splice(i, 1);
    }
  }
}

function checkCollisions() {
  for (let i = stars.length - 1; i >= 0; i--) {
    const star = stars[i];
    if (
      player.x < star.x + star.size &&
      player.x + player.size > star.x &&
      player.y < star.y + star.size &&
      player.y + player.size > star.y
    ) {
      stars.splice(i, 1);
      score += 10;
      scoreEl.textContent = String(score);
      bestScore = Math.max(bestScore, score);
      localStorage.setItem('sky-runner-best', String(bestScore));
      bestScoreEl.textContent = String(bestScore);
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    if (
      player.x < obs.x + obs.size &&
      player.x + player.size > obs.x &&
      player.y < obs.y + obs.size &&
      player.y + player.size > obs.y
    ) {
      obstacles.splice(i, 1);
      lives -= 1;
      livesEl.textContent = String(lives);
      if (lives <= 0) {
        endGame();
        return;
      }
    }
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#050c18');
  sky.addColorStop(0.4, '#111827');
  sky.addColorStop(1, '#0b1220');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 40; i++) {
    const x = ((i * 79) + (Date.now() / 28) % 220) % (width + 60);
    const y = (i * 41) % (height - 30);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = 'rgba(34, 211, 238, 0.14)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(100 + i * 170, 120 + (i % 2) * 50, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  ctx.fillStyle = '#8b5cf6';
  ctx.fillRect(player.x, player.y, player.size, player.size);

  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(player.x + 6, player.y + 6, player.size - 12, player.size - 12);
}

function drawStar(star) {
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(star.x, star.y - star.size);
  ctx.lineTo(star.x + star.size * 0.28, star.y - star.size * 0.28);
  ctx.lineTo(star.x + star.size, star.y - star.size * 0.1);
  ctx.lineTo(star.x + star.size * 0.42, star.y + star.size * 0.12);
  ctx.lineTo(star.x + star.size * 0.65, star.y + star.size);
  ctx.lineTo(star.x, star.y + star.size * 0.45);
  ctx.lineTo(star.x - star.size * 0.65, star.y + star.size);
  ctx.lineTo(star.x - star.size * 0.42, star.y + star.size * 0.12);
  ctx.lineTo(star.x - star.size, star.y - star.size * 0.1);
  ctx.lineTo(star.x - star.size * 0.28, star.y - star.size * 0.28);
  ctx.closePath();
  ctx.fill();
}

function drawObstacle(obs) {
  ctx.fillStyle = '#f87171';
  ctx.beginPath();
  ctx.arc(obs.x + obs.size / 2, obs.y + obs.size / 2, obs.size / 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fecaca';
  ctx.fillRect(obs.x + obs.size * 0.28, obs.y + obs.size * 0.25, 5, 5);
  ctx.fillRect(obs.x + obs.size * 0.55, obs.y + obs.size * 0.62, 5, 5);
}

function drawWorld() {
  drawBackground();
  stars.forEach(drawStar);
  obstacles.forEach(drawObstacle);
  drawPlayer();
}

function endGame() {
  gameRunning = false;
  overlay.classList.add('visible');
  setOverlay('Juego terminado', `Puntuación final: ${score}. Pulsa espacio para jugar otra vez.`);
}

function gameLoop(timestamp) {
  if (!gameRunning) return;

  const dt = Math.min((timestamp - lastTime) / 1000 || 0.016, 0.03);
  lastTime = timestamp;

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnStar();
    if (Math.random() > 0.42) {
      spawnObstacle();
    }
    spawnTimer = 0.8 + Math.random() * 0.7;
  }

  handleInput(dt);
  updateEntities(dt);
  checkCollisions();
  drawWorld();

  if (gameRunning) {
    requestAnimationFrame(gameLoop);
  }
}

function setDirectionState(key, pressed) {
  keys[key] = pressed;
  if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown') {
    keys[key.toLowerCase()] = pressed;
  }
}

window.addEventListener('keydown', (event) => {
  const key = event.key;
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'd', 'w', 's', 'A', 'D', 'W', 'S'].includes(key)) {
    event.preventDefault();
  }

  setDirectionState(key, true);
  setDirectionState(key.toLowerCase(), true);

  if (event.code === 'Space' && !gameRunning) {
    startGame();
  }
});

window.addEventListener('keyup', (event) => {
  setDirectionState(event.key, false);
  setDirectionState(event.key.toLowerCase(), false);
});

startBtn.addEventListener('click', startGame);

const touchButtons = document.querySelectorAll('[data-key]');
touchButtons.forEach((button) => {
  const key = button.dataset.key;
  const press = (event) => {
    event.preventDefault();
    setDirectionState(key, true);
  };
  const release = (event) => {
    event.preventDefault();
    setDirectionState(key, false);
  };

  button.addEventListener('pointerdown', press);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointerleave', release);
  button.addEventListener('pointercancel', release);
});

resetGame();
drawWorld();
