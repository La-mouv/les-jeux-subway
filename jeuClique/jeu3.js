document.addEventListener('DOMContentLoaded', (event) => {
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
    playerNameDisplay.textContent = playerName;


document.getElementById('clickArea').addEventListener('click', handleGame);

let score = 0;
let isGameRunning = false;
let timeLeft = 10; 
let timerInterval;

function handleGame() {
    if (!isGameRunning) {
        startGame();
    } else {
        incrementScore();
    }
}

function startGame() {
    isGameRunning = true;
    score = 0;
    timeLeft = 10;
    document.getElementById('score').textContent = score;
    document.getElementById('timer').textContent = timeLeft;
    document.getElementById('clickArea');
    timerInterval = setInterval(updateTimer, 1000);
}

function incrementScore() {
    score++;
    document.getElementById('score').textContent = score;
}

function updateTimer() {
    timeLeft--;
    document.getElementById('timer').textContent = timeLeft;

    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGame();
    }
}

function endGame() {
    isGameRunning = false;
    alert(`Jeu terminé ! Votre score est : ${score}`);
    // Stats: cumul des clics
    try { if (window.SUBStats) window.SUBStats.addClicks(playerName, score); } catch(e) {}
    // Ajoutez ici la logique pour enregistrer le score dans Firebase si nécessaire
            // Ajoutez ici la logique pour vérifier et mettre à jour le meilleur score
            updateBestScoreIfNecessary();
}

function updateBestScoreIfNecessary() {
    try {
        if (!window.ScoreUtil) { redirectToGameOverPage(); return; }
        window.ScoreUtil.setMaxScore(playerName, 'jeu3', score)
          .then(({updated}) => { if (updated) alert('Nouveau meilleur score enregistré !'); })
          .finally(() => { redirectToGameOverPage(); });
    } catch(_) { redirectToGameOverPage(); }
}

function redirectToGameOverPage() {
    window.location.href = 'finJeu3.html'; // Assurez-vous que le chemin est correct
}

});
