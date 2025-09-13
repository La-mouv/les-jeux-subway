document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startButton = document.getElementById('startButton');
    const timerDiv = document.getElementById('timer');
    let originalPoints = [];
    let placedPoints = [];
    const numberOfPoints = 5;
    const pointRadius = 10; // Rayon logique pour calculs/texte
    const pointThreshold = 20; // Seuil de distance pour considérer un point bien placé
    const displayTime = 5000; // 3 secondes
    const gameTime = 5000; // 5 secondes
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
    playerNameDisplay.textContent = playerName;
    let interval; // Pour stocker l'identifiant de l'intervalle du timer
    


    canvas.width = 400;
    canvas.height = 400;

    // Icone SUB à la place des points
    const subIcon = new Image();
    // Placez le fichier à ../images/sub.png
    subIcon.src = '../images/sub.png';
    subIcon.onerror = () => { try { subIcon.src = '../images/sub.svg'; } catch (e) {} };
    const ICON_SIZE = 36; // taille d'affichage de l'icône
    function iconReady() { return !!(subIcon.complete && subIcon.naturalWidth > 0); }

    startButton.addEventListener('click', startGame);

    function startGame() {
        originalPoints = generatePoints(numberOfPoints);
        // Si l'icône n'est pas encore prête, dessiner quand elle est chargée
        if (!iconReady()) {
            subIcon.onload = () => drawPoints(originalPoints, 'blue');
        }
        drawPoints(originalPoints, 'blue'); // Affichage immédiat (icône si prête, sinon cercle)
        startTimer(displayTime / 1000, () => {
            clearCanvas();
            startTimer(gameTime / 1000, () => {
                canvas.removeEventListener('click', placePoint);
                gameOver(); // Appel de gameOver à la fin du jeu
            });
            canvas.addEventListener('click', placePoint);
        });
    }
    

    function startTimer(duration, callback) {
        let timer = duration;
        timerDiv.textContent = timer; // Mettre à jour initialement le timer
    
        interval = setInterval(() => {
            timer--;
            timerDiv.textContent = timer; // Mettre à jour le timer à chaque seconde
    
            if (timer <= 0) {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 1000);
    }
    

    function generatePoints(num) {
        const margin = ICON_SIZE / 2; // éviter le rognage avec l'icône
        let points = [];
        for (let i = 0; i < num; i++) {
            points.push({
                x: Math.random() * (canvas.width - 2 * margin) + margin,
                y: Math.random() * (canvas.height - 2 * margin) + margin
            });
        }
        return points;
    }

    function drawPoints(points, color) {
        ctx.fillStyle = color || '#000';
        points.forEach(point => {
            drawPoint(point.x, point.y, color);
        });
    }

    function drawPoint(x, y, color) {
        // Halo parameters
        const radius = iconReady() ? ICON_SIZE * 0.85 : pointRadius * 1.8;
        const inner = Math.max(2, radius * 0.2);
        const glowColor = (color === 'red') ? 'rgba(255, 82, 82, 0.55)'
                          : (color === 'blue') ? 'rgba(51, 153, 255, 0.55)'
                          : 'rgba(0, 0, 0, 0.35)';

        // Draw radial glow halo
        ctx.save();
        const g = ctx.createRadialGradient(x, y, inner, x, y, radius);
        g.addColorStop(0, glowColor);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Icon or fallback dot on top
        if (iconReady()) {
            ctx.drawImage(subIcon, x - ICON_SIZE / 2, y - ICON_SIZE / 2, ICON_SIZE, ICON_SIZE);
        } else {
            ctx.fillStyle = (color === 'red') ? '#e74c3c' : (color === 'blue') ? '#3498db' : '#d14d42';
            ctx.beginPath();
            ctx.arc(x, y, pointRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
        ctx.restore();
    }

    function placePoint(e) {
        if (placedPoints.length >= numberOfPoints) return;
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        let newPoint = { x: x, y: y };
        placedPoints.push(newPoint);
        drawPoint(x, y, 'red'); // Icône ou cercle si fallback
    
        highlightClosestOriginalPoint(newPoint); // Met en évidence le point bleu le plus proche
    
        displayPointScore(newPoint); // Affiche le score pour le point placé
    
        if (placedPoints.length === numberOfPoints) {
            gameOver();
        }
    }
    
    function highlightClosestOriginalPoint(placedPoint) {
        let closestPoint = findClosestOriginalPoint(placedPoint);
        drawPoint(closestPoint.x, closestPoint.y, 'blue'); // Redessine le point bleu le plus proche
    }
    
    

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function calculateScore() {
        let score = 0;
        placedPoints.forEach(placedPoint => {
            let closestPoint = findClosestOriginalPoint(placedPoint);
            let distance = calculateDistance(placedPoint, closestPoint);
    
            if (distance <= pointThreshold) {
                // Score proportionnel à la distance : plus le point est proche, plus le score est élevé
                score += Math.max(0, 10 - distance);
            }
        });
        return score;
    }
    
    function findClosestOriginalPoint(placedPoint) {
        let closestPoint = null;
        let minDistance = Infinity;
    
        originalPoints.forEach(originalPoint => {
            let distance = calculateDistance(placedPoint, originalPoint);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = originalPoint;
            }
        });
    
        return closestPoint;
    }
    
    function calculateDistance(point1, point2) {
        let dx = point1.x - point2.x;
        let dy = point1.y - point2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }


    function gameOver() {
        clearInterval(interval); // Arrête le timer
        canvas.removeEventListener('click', placePoint);
        let score = calculateScore();
        alert(`Jeu terminé! Votre score est : ${score}`);
        gameStarted = false;

        
        // Ajoutez ici la logique pour vérifier et mettre à jour le meilleur score
        updateBestScoreIfNecessary();
    
        // La redirection vers la page de fin de jeu sera faite après la mise à jour du score
    }

    function updateBestScoreIfNecessary() {
        var playerScoreRef = firebase.database().ref('/scores/' + playerName + '/jeu4');
        playerScoreRef.once('value', function(snapshot) {
            var bestScore = snapshot.val() || 0;
            let score = calculateScore();
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
        window.location.href = 'finJeu4.html'; // Assurez-vous que le chemin est correct
    }
    
    
    function displayPointScore(placedPoint) {
        let closestPoint = findClosestOriginalPoint(placedPoint);
        let distance = calculateDistance(placedPoint, closestPoint);
        let pointScore = Math.max(0, 10 - distance);
        const offset = iconReady() ? ICON_SIZE / 2 : pointRadius;
        ctx.fillText(pointScore.toFixed(0), placedPoint.x + offset, placedPoint.y + offset);
    }
    

});
