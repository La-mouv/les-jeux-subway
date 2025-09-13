document.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
      restartGame();
  }
});

function restartGame() {
    // Assurez-vous d'ajuster l'URL pour correspondre à l'emplacement de votre fichier jeu2.html
    window.location.href = 'jeu2.html';
}

function returnToGameChoice() {
    window.location.href = '../choixDuJeu.html';
}


function loadLeaderboard() {
    const leaderboardElement = document.getElementById('leaderboardJeu2');
    firebase.database().ref('/scores').orderByChild('jeu2').limitToLast(10).on('value', (snapshot) => {
      const scores = snapshot.val();
      if (scores) {
        const sortedScores = Object.keys(scores).map(player => ({ player, score: scores[player]['jeu2'] })).sort((a, b) => b.score - a.score);
        displayLeaderboard(sortedScores, leaderboardElement);
      }
    });
  }
  
  function displayLeaderboard(scores, element) {
    const top = scores.slice(0,10);
    const rows = top.map((s, i) => `<tr><td>${i+1}</td><td>${s.player}</td><td>${parseFloat(s.score).toFixed(1)}</td></tr>`).join('');
    element.innerHTML = `<div class=\"lb-box\"><table class=\"lb-table\"><thead><tr><th>Classement</th><th>Joueurs</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  
  // Appeler cette fonction à la fin du jeu ou lors du chargement de la page de fin
  loadLeaderboard();
  
