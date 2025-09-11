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
    const radii = [50, 50, 50, 50, 50];  // Rayons des cercles
    const centers = [  // Coordonnées des centres des cercles
        {x: 150, y: 150},
        {x: 250, y: 150},
        {x: 350, y: 150},
        {x: 200, y: 200},
        {x: 300, y: 200}
    ];
    const colors = ['#0000ff', '#000000', '#ff0000', '#ffff00', '#008000'];  // Couleurs des anneaux olympiques

    for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = colors[i];  // Définir la couleur du trait pour chaque cercle
        ctx.lineWidth = 5;  // Augmenter la largeur du trait pour une meilleure visibilité
        ctx.beginPath();
        ctx.arc(centers[i].x, centers[i].y, radii[i], 0, Math.PI * 2);
        ctx.stroke();
    }
}


// Appeler la fonction drawGuides au démarrage
drawGuides();

const SEGMENTS_PER_CIRCLE = 100;
const MAX_DISTANCE = 4;  // distance maximale des points au segment

function calculateScore() {
    let matchingSegments = 0;
    let totalSegments = 0;

    const radii = [50, 50, 50, 50, 50];
    const centers = [
        {x: 150, y: 150},
        {x: 250, y: 150},
        {x: 350, y: 150},
        {x: 200, y: 200},
        {x: 300, y: 200}
    ];

    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < SEGMENTS_PER_CIRCLE; j++) {
            const angle = (j / SEGMENTS_PER_CIRCLE) * (Math.PI * 2);
            const segmentX = centers[i].x + radii[i] * Math.cos(angle);
            const segmentY = centers[i].y + radii[i] * Math.sin(angle);
            totalSegments++;

            if (isPointNearSegment({ x: segmentX, y: segmentY })) {
                matchingSegments++;
            }
        }
    }

    const score = (matchingSegments / totalSegments) * 50;
    return score.toFixed(1); // Retourner le score calculé
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
