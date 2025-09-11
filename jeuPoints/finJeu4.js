
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        restartGame();
    }
  });
  
  function returnToGameChoice() {
      window.location.href = '../choixDuJeu.html';
  }
  
  function restartGame() {
      window.location.href = 'jeu4.html'; // Assurez-vous que le chemin est correct
  }
  
  function loadLeaderboard() {
      const leaderboardElement = document.getElementById('leaderboardJeu4');
      firebase.database().ref('/scores').orderByChild('jeu4').limitToLast(5).on('value', (snapshot) => {
        const scores = snapshot.val();
        if (scores) {
          const sortedScores = Object.keys(scores).map(player => ({ player, score: scores[player]['jeu4'] })).sort((a, b) => b.score - a.score);
          displayLeaderboard(sortedScores, leaderboardElement);
        }
      });
    }
    
    function displayLeaderboard(scores, element) {
      const leaderboardHtml = scores.map((score, index) => `<p>${index + 1}. ${score.player} - ${parseFloat(score.score).toFixed(1)}</p>`).join('');
      element.innerHTML = leaderboardHtml;
    }
    
    // Appeler cette fonction à la fin du jeu ou lors du chargement de la page de fin
    loadLeaderboard();
    
  