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
    // Ajoutez ici la logique pour enregistrer le score dans Firebase si nécessaire
            // Ajoutez ici la logique pour vérifier et mettre à jour le meilleur score
            updateBestScoreIfNecessary();
}

function updateBestScoreIfNecessary() {
    var playerScoreRef = firebase.database().ref('/scores/' + playerName + '/jeu3');
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
    window.location.href = 'finJeu3.html'; // Assurez-vous que le chemin est correct
}

});