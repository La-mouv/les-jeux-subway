const playerNameDisplay = document.getElementById('playerNameDisplay');
const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
playerNameDisplay.textContent = playerName;
const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.getElementById('timer');  // Elément HTML pour le timer
let drawing = false;
let drawnPoints = [];  // Tableau pour stocker les points dessinés
let timeRemaining = 20;  // Temps restant en secondes
let timerInterval;

canvas.addEventListener('mousedown', () => {
    drawing = true;
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
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    drawnPoints.push({ x, y });  // Stocke les points dessinés

    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'orange';

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function drawGuides() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const x = 120;        // position X du sandwich
    const y = 180;        // position Y du sandwich
    const width = 280;    // largeur du sandwich
    const height = 80;    // hauteur du sandwich
    const breadCurve = 30; // arrondi du pain

    ctx.beginPath();

    // --- Début à gauche, pain du haut ---
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + width / 2, y - breadCurve, x + width, y); // arc supérieur

    // --- Descente côté droit ---
    ctx.quadraticCurveTo(x + width + 10, y + height / 2, x + width, y + height);

    // --- Pain du bas (arc inférieur) ---
    ctx.quadraticCurveTo(x + width / 2, y + height + breadCurve, x, y + height);

    // --- Remontée côté gauche ---
    ctx.quadraticCurveTo(x - 10, y + height / 2, x, y);

    // --- Garniture (intérieure) ---
    const waveCount = 6;
    const waveWidth = width / waveCount;
    const waveHeight = 8;
    ctx.moveTo(x + 20, y + height / 2);
    for (let i = 0; i < waveCount; i++) {
        ctx.quadraticCurveTo(
            x + 20 + i * waveWidth + waveWidth / 2,
            y + height / 2 + (i % 2 === 0 ? waveHeight : -waveHeight),
            x + 20 + (i + 1) * waveWidth,
            y + height / 2
        );
    }

    ctx.closePath();
    ctx.stroke();
}



// Appeler la fonction drawGuides au démarrage
drawGuides();

const SEGMENTS_PER_CIRCLE = 100;
const MAX_DISTANCE = 4;  // distance maximale des points au segment

function calculateScore() {
    let matchingSegments = 0;
    let totalSegments = 0;
    const sandwichX = 100;
    const sandwichY = 120;
    const sandwichWidth = 300;
    const sandwichHeight = 100;
    const step = 5; // espacement entre les points de référence

    // Parcourir les 4 côtés du rectangle
    for (let x = sandwichX; x <= sandwichX + sandwichWidth; x += step) {
        totalSegments++;
        if (isPointNearSegment({x, y: sandwichY})) matchingSegments++;
        totalSegments++;
        if (isPointNearSegment({x, y: sandwichY + sandwichHeight})) matchingSegments++;
    }
    for (let y = sandwichY; y <= sandwichY + sandwichHeight; y += step) {
        totalSegments++;
        if (isPointNearSegment({x: sandwichX, y})) matchingSegments++;
        totalSegments++;
        if (isPointNearSegment({x: sandwichX + sandwichWidth, y})) matchingSegments++;
    }

    const score = (matchingSegments / totalSegments) * 50;
    return score.toFixed(1);
}


function gameOver() {
    const score = calculateScore(); // Calcule le score
    alert(`Jeu terminé! Votre score est ${score} sur 50.`);
    
    // Mise à jour du meilleur score si nécessaire (logique similaire à celle fournie pour le jeu 1)
    updateBestScoreIfNecessary(score);
}

function updateBestScoreIfNecessary(score) {
    var playerScoreRef = firebase.database().ref('/scores/' + playerName + '/jeu2');
    playerScoreRef.once('value', function(snapshot) {
        var bestScore = snapshot.val() || 0;
        if (score > bestScore) {
            playerScoreRef.set(score, function(error) {
                if (error) {
                    alert('Une erreur est survenue lors de la mise à jour du score.');
                } else {
                    alert('Nouveau meilleur score enregistré !');
                }
                // Maintenant que nous avons terminé, redirigez vers la page de fin du jeu
                redirectToGameOverPage();
            });
        } else {
            // Pas de nouveau meilleur score, redirigez simplement
            redirectToGameOverPage();
        }
    });
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
