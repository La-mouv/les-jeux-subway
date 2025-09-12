function returnToGameChoice() {
  window.location.href = '../choixDuJeu.html';
}

// Met à jour automatiquement le Hall of Fame depuis Firebase
document.addEventListener('DOMContentLoaded', () => {
  if (!window.firebase || !firebase.apps.length) {
    console.error("Firebase n'est pas initialisé sur cette page.");
    return;
  }

  const games = [
    { key: 'jeu2', label: "1 - SUB'Dessin" },
    { key: 'jeu1', label: "2 - Dacty'SUB" },
    { key: 'jeu3', label: "3 - SUB'Click" },
    { key: 'jeu4', label: "4 - Memory'SUB" },
    { key: 'jeu5', label: "5 - SUB'Collect" },
    { key: 'jeu6', label: "6 - SUB l'éclair" }
  ];

  const tbody = document.getElementById('hof-body');
  if (!tbody) return;

  // Écoute tous les changements de score pour rafraîchir le tableau
  firebase.database().ref('/scores').on('value', (snapshot) => {
    const all = snapshot.val() || {};
    const rows = games.map(({ key, label }) => {
      const best = bestForGame(all, key);
      return `<tr>
                <td>${label}</td>
                <td>${best.player}</td>
                <td>${formatScore(best.score)}</td>
              </tr>`;
    }).join('');
    tbody.innerHTML = rows;
  });
});

function bestForGame(allScores, gameKey) {
  let bestPlayer = '-';
  let bestScore = 0;
  for (const [player, scores] of Object.entries(allScores)) {
    const raw = scores && scores[gameKey];
    const val = typeof raw === 'number' ? raw : parseFloat(raw) || 0;
    if (val > bestScore) {
      bestScore = val;
      bestPlayer = player;
    }
  }
  return { player: bestPlayer, score: bestScore };
}

function formatScore(s) {
  // Harmonise l'affichage avec le reste de l'app (1 décimale)
  return Number(s).toFixed(1);
}
