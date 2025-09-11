document.addEventListener('DOMContentLoaded', (event) => {
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
    playerNameDisplay.textContent = playerName;

let score = 0;
let timeLeft = 20;
let gameInterval;
let level = 1;
let imagesOnBoard = [];

document.getElementById('startButton').addEventListener('click', startGame);

function startGame() {
    score = 0;
    timeLeft = 20;
    const startButton = document.getElementById('startButton');
    startButton.style.display = 'none'; // ou startButton.remove(); pour le supprimer complètement
    console.log("Le jeu commence !");
    level = 1;
    imagesOnBoard = [];
    updateScore();
    gameBoard.innerHTML = '';
    initializeImages();
    gameInterval = setInterval(updateTimer, 1000); // Ajoute cet intervalle
}

function initializeImages() {
    // Vider le tableau de jeu et la liste des images
    gameBoard.innerHTML = '';
    imagesOnBoard = [];

    // Logique pour ajouter des images
    let images = ['Bike.png'];
    if (level >= 2) images.push('Ballon.png');
    if (level >= 3) images.push('Skateboard.png');
    if (level >= 4) images.push('Scooter.png');

    images.forEach(image => {
        addImage(image);
    });
}

function addImage(imageName) {
    let position;
    do {
        position = {
            left: Math.random() * (gameBoard.offsetWidth - 50),
            top: Math.random() * (gameBoard.offsetHeight - 50)
        };
    } while (isOverlapping(position));

    const imgElement = document.createElement('img');
    imgElement.src = `./Images/${imageName}`;
    imgElement.classList.add('gameImage');
    imgElement.style.left = `${position.left}px`;
    imgElement.style.top = `${position.top}px`;
    imgElement.onclick = () => {
        handleImageClick(imageName);
        levelUp();
    };
    gameBoard.appendChild(imgElement);
    imagesOnBoard.push({ imgElement, position });
}

function isOverlapping(newPosition) {
    return imagesOnBoard.some(({ position }) => {
        return Math.abs(position.left - newPosition.left) < 50 &&
               Math.abs(position.top - newPosition.top) < 50;
    });
}

function handleImageClick(imageName) {
    switch(imageName) {
        case 'Bike.png':
            score += 2;
            break;
        case 'Ballon.png':
            score -= 1;
            break;
        case 'Skateboard.png':
            score -= 2;
            break;
        case 'Scooter.png':
            score -= 4;
            break;
    }
    updateScore();
}

function levelUp() {
    level++;
    initializeImages();
}

function updateScore() {
    document.getElementById('score').textContent = score;
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
        document.getElementById('timer').textContent = timeLeft;
    } else {
        clearInterval(gameInterval);
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
    var playerScoreRef = firebase.database().ref('/scores/' + playerName + '/jeu5');
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
    window.location.href = 'finJeu5.html'; // Assurez-vous que le chemin est correct
}
});