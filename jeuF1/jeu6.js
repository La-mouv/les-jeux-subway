document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const gameContainer = document.getElementById('gameContainer'); // Référence au conteneur du jeu
    const lightColumns = document.querySelectorAll('.light-column');
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
    playerNameDisplay.textContent = playerName;

    let gameStarted = false;
    let startTime;
    let endTime;
    let timeoutHandle; // Pour conserver le handle du timeout et pouvoir l'annuler si nécessaire
    let intervalHandle; // Pour conserver le handle de l'intervalle du chronomètre


    function startGame() {
        gameStarted = false;
        sequenceLights(() => {
            // Lorsque tous les feux sont allumés, attendez un délai aléatoire puis éteignez-les et commencez le jeu
            const randomDelay = Math.random() * (3000 - 200) + 200;
            timeoutHandle = setTimeout(() => {
                turnLightsOff();
                gameStarted = true;
                startTime = new Date().getTime(); // Enregistre le moment où le jeu commence (feux éteints)
            }, randomDelay);
        });
    }

    function sequenceLights(callback) {
        const lightColumns = document.querySelectorAll('.light-column');
    
        lightColumns.forEach((column, index) => {
            setTimeout(() => {
                // Logique pour allumer les feux d'une colonne
                column.querySelectorAll('.light').forEach(light => {
                    light.classList.remove('off');
                    light.classList.add('red');
                });
    
                // Si c'est la dernière colonne, exécutez le callback après un court délai
                if (index === lightColumns.length - 1) {
                    setTimeout(callback, 1000); // ajustez ce délai si nécessaire
                }
            }, index * 1000); // Allume chaque colonne avec 1 seconde d'intervalle
        });
    }
    
    function turnLightsOff() {
        const lightColumns = document.querySelectorAll('.light-column');
        
        lightColumns.forEach(column => {
            column.querySelectorAll('.light').forEach(light => {
                light.classList.remove('red');
                light.classList.add('off');
            });
        });
    
        // Démarrer le chronomètre
        startTimer();
    }

    function startTimer() {
        let hundredths = 0; // Centièmes de seconde
        const timerDisplay = document.getElementById('timerDisplay');
        intervalHandle = setInterval(() => {
            hundredths += 1;
            const seconds = Math.floor(hundredths / 100);
            const remainingHundredths = hundredths % 100;
            // Mettre à jour l'affichage du chronomètre
            timerDisplay.textContent = `${seconds.toString().padStart(2, '0')}:${remainingHundredths.toString().padStart(2, '0')}`;
        }, 10); // Mettre à jour tous les 10 millisecondes (1 centième de seconde)
    }
    
    function stopTimer() {
        clearInterval(intervalHandle); // Arrêter le chronomètre
    }

    function calculateScore() {
        if (!gameStarted) {
            return 0; // Clic trop tôt, le jeu n'a pas commencé
        }
        endTime = new Date().getTime();
        const reactionTime = (endTime - startTime) / 10; // Temps de réaction en centièmes de seconde
        const score = Math.max(0, 100 - reactionTime); // Soustrait le temps de réaction de 100, score minimum est 0
        return score;
    }

    function gameOver() {
        stopTimer();
        clearTimeout(timeoutHandle); // Annule le timeout si le joueur clique trop tôt
        const score = calculateScore();


        // Affichez le score ou le message de fin de jeu ici, par exemple :
        alert(`Votre score est : ${score}`);
        gameStarted = false; // Réinitialise l'état du jeu

        updateBestScoreIfNecessary(score);
    }

    function updateBestScoreIfNecessary(currentScore) {
        var playerScoreRef = firebase.database().ref('/scores/' + playerName + '/jeu6');
        playerScoreRef.once('value', function(snapshot) {
            var bestScore = snapshot.val() || 0;
            if (currentScore > bestScore) {
                playerScoreRef.set(currentScore, function(error) {
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
        window.location.href = 'finJeu6.html'; // Assurez-vous que le chemin est correct
    }

    // Démarrer le jeu lorsque le bouton est cliqué
    startButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Empêche le clic de se propager au conteneur
        startGame();
    });

    // Gestionnaire de clic pour le gameContainer
    gameContainer.addEventListener('click', () => {
        if (gameStarted) {
            gameOver();
        } else {
            alert('Trop tôt ! Game over.');
            gameOver();
        }
    });
});
