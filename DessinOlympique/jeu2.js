const playerNameDisplay = document.getElementById('playerNameDisplay');
const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
playerNameDisplay.textContent = playerName;
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.getElementById('timer');  // Elément HTML pour le timer
// Largeur unique du trait pour le guide et le dessin joueur
const STROKE_WIDTH = 8;
// Géométrie du sandwich (utilisée pour dessin + scoring)
const GUIDE = { left: 80, top: 180, width: 340, height: 130 };
let drawing = false;
let drawnPoints = [];  // Tableau pour stocker les points dessinés
let timeRemaining = 20;  // Temps restant en secondes
let timerInterval;
let clickCount = 0; // SUB'Stats: clics agrégés (mises en contact du crayon)

canvas.addEventListener('mousedown', () => {
    drawing = true;
    clickCount++;
    ctx.beginPath();
    
    // Démarrer le timer lors du premier clic de l'utilisateur
    if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000);
    }
});

canvas.addEventListener('mousemove', draw);

canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.closePath();
    clearInterval(timerInterval);  // Arrêter le timer
    alert("Vous avez levé le crayon, le jeu est terminé !");
    gameOver();
});


function updateTimer() {
    timeRemaining--;
    timerElement.textContent = timeRemaining;  // Mettre à jour l'affichage du timer

    if (timeRemaining <= 0) {
        clearInterval(timerInterval);  // Arrête le timer
        gameOver();  // Calcule le score
    }
}

function draw(event) {
    if(!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    drawnPoints.push({ x, y });  // Stocke les points dessinés

    ctx.lineWidth = STROKE_WIDTH;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'orange';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function traceGuidePath(g) {
    const { left, top, width, height } = GUIDE;
    const right = left + width;
    const bottom = top + height;

    // Contour du sandwich avec 3 bosses sur le haut, style icône
    g.beginPath();
    g.moveTo(left + 26, top + 30);
    g.quadraticCurveTo(left, top + 30, left, top + 60);
    g.quadraticCurveTo(left + width * 0.12, top, left + width * 0.25, top + 30);
    g.quadraticCurveTo(left + width * 0.40, top, left + width * 0.52, top + 30);
    g.quadraticCurveTo(left + width * 0.68, top, left + width * 0.78, top + 30);
    g.quadraticCurveTo(right, top + 30, right - 24, top + 52);
    g.quadraticCurveTo(right, bottom - 34, right - 24, bottom - 18);
    g.quadraticCurveTo(left + width * 0.5, bottom + 18, left + 24, bottom - 18);
    g.quadraticCurveTo(left, bottom - 34, left, top + 60);
    g.quadraticCurveTo(left, top + 30, left + 26, top + 30);
    g.closePath();

    // Ligne de garniture simple (vague douce, centrée)
    const waves = 7;
    const seg = width / waves;
    const midY = top + height * 0.58;
    g.moveTo(left + 22, midY);
    for (let i = 0; i < waves; i++) {
        const cx = left + 22 + i * seg + seg / 2;
        const cy = midY + (i % 2 === 0 ? -12 : 12);
        const x = left + 22 + (i + 1) * seg;
        g.quadraticCurveTo(cx, cy, x, midY);
    }
}

function drawGuides() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // stroke du contour + vague
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = STROKE_WIDTH;
    traceGuidePath(ctx);
    ctx.stroke();
    ctx.restore();
}



// Appeler la fonction drawGuides au démarrage
drawGuides();

const SEGMENTS_PER_CIRCLE = 100;
// Paramètres scoring plus robustes: couvre + pénalise le hors-piste
const SCORE_SAMPLE_STEP = 2; // échantillonnage des pixels pour accélérer
// Rendre le jeu un peu plus exigeant: tolérances plus serrées
const COVER_TOLERANCE = Math.max(1, Math.floor(STROKE_WIDTH / 3)); // rayon de tolérance pour recouvrement
const PREC_TOLERANCE = Math.max(1, Math.floor(STROKE_WIDTH / 4));  // rayon pour la précision
const COVER_WEIGHT = 0.5;  // importance de couvrir le guide
const PREC_WEIGHT = 0.5;   // importance de ne pas dépasser

function buildGuideMask() {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = '#000';
    g.lineWidth = STROKE_WIDTH;
    traceGuidePath(g);
    g.stroke();
    return g.getImageData(0, 0, c.width, c.height);
}

function buildPlayerMask() {
    const c = document.createElement('canvas');
    c.width = canvas.width;
    c.height = canvas.height;
    const g = c.getContext('2d');
    g.lineJoin = 'round';
    g.lineCap = 'round';
    g.strokeStyle = '#000';
    g.lineWidth = STROKE_WIDTH;
    if (drawnPoints.length > 1) {
        g.beginPath();
        g.moveTo(drawnPoints[0].x, drawnPoints[0].y);
        for (let i = 1; i < drawnPoints.length; i++) {
            g.lineTo(drawnPoints[i].x, drawnPoints[i].y);
        }
        g.stroke();
    }
    return g.getImageData(0, 0, c.width, c.height);
}

function alphaAt(img, x, y) {
    const idx = (y * img.width + x) * 4 + 3;
    return img.data[idx];
}

function hasAlphaInRadius(img, x, y, r) {
    const x0 = Math.max(0, x - r), x1 = Math.min(img.width - 1, x + r);
    const y0 = Math.max(0, y - r), y1 = Math.min(img.height - 1, y + r);
    for (let yy = y0; yy <= y1; yy++) {
        for (let xx = x0; xx <= x1; xx++) {
            if (alphaAt(img, xx, yy) > 0) return true;
        }
    }
    return false;
}

function calculateScore() {
    const guide = buildGuideMask();
    const player = buildPlayerMask();

    let guideCount = 0, guideCovered = 0;
    let playerCount = 0, playerOutside = 0;

    // Couverture du guide
    for (let y = 0; y < guide.height; y += SCORE_SAMPLE_STEP) {
        for (let x = 0; x < guide.width; x += SCORE_SAMPLE_STEP) {
            if (alphaAt(guide, x, y) > 0) {
                guideCount++;
                if (hasAlphaInRadius(player, x, y, COVER_TOLERANCE)) guideCovered++;
            }
        }
    }

    // Précision: pénaliser les pixels du joueur loin du guide
    for (let y = 0; y < player.height; y += SCORE_SAMPLE_STEP) {
        for (let x = 0; x < player.width; x += SCORE_SAMPLE_STEP) {
            if (alphaAt(player, x, y) > 0) {
                playerCount++;
                if (!hasAlphaInRadius(guide, x, y, PREC_TOLERANCE)) playerOutside++;
            }
        }
    }

    const coverRatio = guideCount ? guideCovered / guideCount : 0;
    const precisionRatio = playerCount ? 1 - playerOutside / playerCount : 0;
    const mixed = COVER_WEIGHT * coverRatio + PREC_WEIGHT * precisionRatio;
    const score = Math.max(0, Math.min(50, 50 * mixed));
    return Math.round(score * 10) / 10; // retourne un nombre (1 décimale)
}


function gameOver() {
    const score = calculateScore(); // Calcule le score
    try { if (window.SUBStats) window.SUBStats.addClicks(playerName, clickCount); } catch(e) {}
    alert(`Jeu terminé! Votre score est ${score} sur 50.`);
    
    // Mise à jour du meilleur score si nécessaire (logique similaire à celle fournie pour le jeu 1)
    updateBestScoreIfNecessary(score);
}

function updateBestScoreIfNecessary(score) {
    try {
        const s = (typeof score === 'number') ? score : parseFloat(score) || 0;
        if (!window.ScoreUtil) { redirectToGameOverPage(); return; }
        window.ScoreUtil.setMaxScore(playerName, 'jeu2', s)
          .then(({updated}) => { if (updated) alert('Nouveau meilleur score enregistré !'); })
          .finally(() => { redirectToGameOverPage(); });
    } catch(_) { redirectToGameOverPage(); }
}

function redirectToGameOverPage() {
    window.location.href = 'finJeu2.html'; // Assurez-vous que le chemin est correct
}

function isPointNearSegment(segment) {
    for (let point of drawnPoints) {
        const dx = segment.x - point.x;
        const dy = segment.y - point.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance <= MAX_DISTANCE) {
            return true;
        }
    }
    return false;
}
