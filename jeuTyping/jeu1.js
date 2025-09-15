document.addEventListener('DOMContentLoaded', (event) => {
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const typingInput = document.getElementById('typingInput');
    const wordToType = document.getElementById('wordToType');
    const scoreDisplay = document.getElementById('score');
    const timerDisplay = document.getElementById('timer');
    const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
    playerNameDisplay.textContent = playerName;
    const allWords = [
  "Teriyaki", "Tikka", "Thon", "BMT", "Brooklyn", "Chipotle", "Southwest", "Meatball", "Sandwich", "Artists", "Footlong", "Fresh", "Cookies Lovers", "SUB15", "SUB30", "Veggie", "Bacon", "Ranch", "Sweet Onion", "Parmesan", "Jalapeno", "Tomate", "Brownie", "BBQ", "1965", "Connecticut", "Peter Buck", "Subway", "Fred DeLuca", "Sub Like Me", "Steak & Cheese", "Pastrami", "sous-marin", "Convention 2025", "Puy du Fou", "GP Explorer" ];    
    let words = [];
    let currentWordIndex = 0;
    let score = 0;
    let gameStarted = false;
    let keypressCount = 0; // SUB'Stats: total frappes clavier
    let timer;
    let timeLeft = 500; // Ajoutez cette variable globalement si elle n'est pas déjà présente

    
    
    function updateScore() {
        // Plus le joueur tape vite, plus le multiplicateur est élevé
        let timeMultiplier = timeLeft / 100; // Utilisez une base de 100 pour un multiplicateur compréhensible
        let pointsForWord = 1 + timeMultiplier; // Assurez-vous qu'au moins 1 point est donné par mot
        score += pointsForWord;
        scoreDisplay.textContent = score.toFixed(0); // Arrondir le score pour ne pas avoir de décimales
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    function selectRandomWords(wordList, numWords) {
        shuffleArray(wordList);
        return wordList.slice(0, numWords);
    }

    function updateWordToType() {
        wordToType.textContent = words[currentWordIndex];
        // Réinitialiser le timer pour le mot actuel à 5 secondes
        timeLeft = 500; // 300 centièmes de seconde pour 5 secondes
        timerDisplay.textContent = formatTime(timeLeft);
        clearTimeout(timer);
        timer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = formatTime(timeLeft);
            if (timeLeft === 0) {
                clearInterval(timer);
                moveToNextWord();
            }
        }, 10); // mise à jour du timer tous les centièmes de seconde
    }

    function formatTime(centiseconds) {
        let seconds = Math.floor(centiseconds / 100);
        let centis = centiseconds % 100;
        return `Temps restant : ${seconds}.${centis < 10 ? '0' : ''}${centis}s`;
    }

    function moveToNextWord() {
        currentWordIndex = (currentWordIndex + 1) % words.length;
        typingInput.value = ''; // Ajout de cette ligne pour effacer le texte commencé
        if (currentWordIndex === 0) {
            // Fin du jeu, tous les mots ont été essayés
            gameOver();
        } else {
            updateWordToType();
        }
    }
    

    function gameOver() {
        alert(`Jeu terminé! Votre score est : ${score}`);
        gameStarted = false;
        typingInput.disabled = true;
    
        // Ajoutez ici la logique pour vérifier et mettre à jour le meilleur score
        updateBestScoreIfNecessary();
        // Stats: cumul des frappes clavier
        try { if (window.SUBStats) window.SUBStats.addKeypress(playerName, keypressCount); } catch(e) {}
    
        // La redirection vers la page de fin de jeu sera faite après la mise à jour du score
    }
    
    function updateBestScoreIfNecessary() {
        try {
            if (!window.ScoreUtil) { redirectToGameOverPage(); return; }
            window.ScoreUtil.setMaxScore(playerName, 'jeu1', score)
              .then(({updated}) => { if (updated) alert('Nouveau meilleur score enregistré !'); })
              .finally(() => { redirectToGameOverPage(); });
        } catch(_) { redirectToGameOverPage(); }
    }
    
    function redirectToGameOverPage() {
        window.location.href = 'finJeu1.html'; // Assurez-vous que le chemin est correct
    }
    
    

    function startGame() {
        if (!gameStarted) {
            gameStarted = true;
            keypressCount = 0;
            words = selectRandomWords(allWords, 10); // Choix de 10 mots aléatoires
            currentWordIndex = 0;
            score = 0;
            typingInput.disabled = false;
            typingInput.value = '';
            typingInput.focus();
            updateWordToType();
            scoreDisplay.textContent = score;
        }
    }

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !gameStarted) {
            startGame();
        }
        if (gameStarted) { keypressCount++; }
    });

    typingInput.addEventListener('input', function() {
        if (typingInput.value.trim().toLowerCase() === words[currentWordIndex].toLowerCase()) {
            clearInterval(timer);
            updateScore(); // Mettre à jour le score en fonction de la vitesse de frappe
            moveToNextWord();
        }
    });

    // Désactiver le champ de saisie au début
    typingInput.disabled = true;
});
