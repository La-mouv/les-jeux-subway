const messagesRef = firebase.database().ref('chat');
const chatBox = document.getElementById('chatBox'); // conteneur avec défilement
const chatMessages = document.getElementById('chatMessages'); // UL pour les messages
const chatInput = document.getElementById('chatInput');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
playerNameDisplay.textContent = playerName;

  function loadLeaderboards() {
    loadLeaderboardForGame('jeu1', 'leaderboardJeu1');
    loadLeaderboardForGame('jeu2', 'leaderboardJeu2');
    loadLeaderboardForGame('jeu3', 'leaderboardJeu3');
    loadLeaderboardForGame('jeu4', 'leaderboardJeu4');
    loadLeaderboardForGame('jeu5', 'leaderboardJeu5');
    loadLeaderboardForGame('jeu6', 'leaderboardJeu6');
  }
  
  function loadLeaderboardForGame(gameRef, leaderboardElementId) {
    const leaderboardElement = document.getElementById(leaderboardElementId);
    firebase.database().ref('/scores').orderByChild(gameRef).limitToLast(10).on('value', (snapshot) => {
      const scores = snapshot.val();
      if (scores) {
        const sortedScores = Object.keys(scores).map(player => ({ player, score: scores[player][gameRef] })).sort((a, b) => b.score - a.score);
        displayLeaderboard(sortedScores, leaderboardElement);
      }
    });
  }
  
  function displayLeaderboard(scores, element) {
    const top = scores.slice(0, 10);
    const leaderboardHtml = top.map((score, index) => 
      `<p class="${index === 0 ? 'winner' : 'other'}">${index + 1}. ${score.player} - ${parseFloat(score.score).toFixed(1)}</p>`
    ).join('');
    element.innerHTML = leaderboardHtml;
  }
  

  // Appeler ces fonctions au chargement de la page
  loadLeaderboards();
  loadHallOfFameInline();
  loadSubStatsInline();
  
  function startGame(gamePage, gameKey) {
    try {
      const player = sessionStorage.getItem('playerName') || 'Sans pseudo';
      if (window.SUBStats && firebase) {
        window.SUBStats.logSessionStart(player, gameKey);
      }
    } catch (e) { console.warn('logSessionStart failed', e); }
    window.location.href = gamePage;
  }
  
  let currentGame = 0;

function move(step) {
  const games = document.querySelectorAll('.game-leaderboard');
  const totalGames = games.length;

  currentGame = (currentGame + step + totalGames) % totalGames;
  document.getElementById('game-slider').style.transform = `translateX(${-100 * currentGame}%)`;
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}


// Envoyer un message
function sendMessage() {
  const text = chatInput.value.trim();
  if(text) {
    chatInput.value = '';
    messagesRef.push({ pseudo: playerName, message: text, timestamp: firebase.database.ServerValue.TIMESTAMP });
  }
}

// Écouter la touche Entrée dans le champ de saisie
chatInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendMessage();
  }
});

// Écouter les messages
  messagesRef.on('child_added', (data) => {
  const message = data.val();
  const messageElement = document.createElement('li');
  // Créez un span pour le pseudo et appliquez la classe "pseudo"
  const pseudoElement = document.createElement('span');
  pseudoElement.textContent = message.pseudo;
  pseudoElement.className = 'pseudo';

      // Vérifiez si le pseudo est 'Alexis' et appliquez une couleur différente
    if (message.pseudo === 'Alexis') {
        pseudoElement.style.color = 'red';
    } else {
        pseudoElement.className = 'pseudo';
    }
  messageElement.appendChild(pseudoElement);
  messageElement.appendChild(document.createTextNode(": " + message.message));
  chatMessages.appendChild(messageElement);

  scrollToBottom();
});

window.onload = function() {
  const playerName = sessionStorage.getItem('playerName');
  const resetButton = document.getElementById('resetScoresButton');

  if (playerName === 'Alexis') {
      resetButton.style.display = 'block'; // Afficher le bouton
  }
};

document.getElementById('resetScoresButton').addEventListener('click', function() {
  const playerName = sessionStorage.getItem('playerName');
  
  if (playerName === 'Alexis') {
      const password = prompt('Veuillez entrer le mot de passe pour réinitialiser les scores:');
      if (password === 'yoyoyoyo') {  // Remplacez 'VotreMotDePasse' par le mot de passe réel
          if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les scores ?')) {
              resetAllScores();
          }
      } else {
          alert('Mot de passe incorrect.');
      }
  } else {
      alert('Vous n’êtes pas autorisé à réinitialiser les scores.');
  }
});

function resetAllScores() {
  // Accéder au noeud 'scores' dans Firebase et le réinitialiser
  var scoresRef = firebase.database().ref('/scores/');
  scoresRef.once('value', function(snapshot) {
      if (snapshot.exists()) {
          // Parcourir tous les joueurs et réinitialiser les scores pour chaque jeu
          snapshot.forEach(function(playerScores) {
              const playerName = playerScores.key;
              playerScores.forEach(function(gameScore) {
                  var gameKey = gameScore.key;
                  var playerGameScoreRef = firebase.database().ref('/scores/' + playerName + '/' + gameKey);
                  playerGameScoreRef.set(0, function(error) {
                      if (error) {
                          console.error('Erreur lors de la réinitialisation du score pour ' + playerName + ' au ' + gameKey);
                      }
                  });
              });
          });
          alert('Tous les scores ont été réinitialisés.');
      } else {
          alert('Aucun score à réinitialiser.');
      }
  });
}

// Hall of Fame inline (fin du slider, sans clic)
function loadHallOfFameInline() {
  const container = document.getElementById('hallOfFame2');
  if (!container) return;

  const games = [
    { key: 'jeu2', label: "SUB'Dessin" },
    { key: 'jeu1', label: "Dacty'SUB" },
    { key: 'jeu3', label: "SUB'Click" },
    { key: 'jeu4', label: "Memory'SUB" },
    { key: 'jeu5', label: "SUB'Collect" },
    { key: 'jeu6', label: "SUB l'éclair" }
  ];

  const render = (all) => {
    const rows = games.map(({ key, label }) => {
      const best = bestForGame(all, key);
      return `<tr><td>${label}</td><td>${best.player}</td><td>${formatScore(best.score)}</td></tr>`;
    }).join('');
    container.innerHTML = `
      <div class="hof-inline-card">
        <table class="hof-inline-table">
          <thead>
            <tr class="hof-title-row"><th colspan="3">Hall of Fame</th></tr>
            <tr><th>Jeu</th><th>Joueur</th><th>Score</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  firebase.database().ref('/scores').on('value', (snapshot) => {
    render(snapshot.val() || {});
  });
}

function bestForGame(allScores, gameKey) {
  let bestPlayer = '-';
  let bestScore = 0;
  for (const [player, scores] of Object.entries(allScores || {})) {
    const raw = scores && scores[gameKey];
    const val = typeof raw === 'number' ? raw : parseFloat(raw) || 0;
    if (val > bestScore) {
      bestScore = val;
      bestPlayer = player;
    }
  }
  return { player: bestPlayer, score: bestScore };
}

function formatScore(s) { return Number(s).toFixed(1); }

// SUB'Stats inline
function loadSubStatsInline() {
  const container = document.getElementById('subStats');
  if (!container) return;

  function render(statsPlayers, sessions) {
    const byPlayer = statsPlayers || {};
    const entries = Object.entries(byPlayer);
    const num = (v) => (typeof v === 'number' ? v : parseFloat(v) || 0);
    const topBy = (key) => entries.reduce((best, [p, s]) => {
      const v = num(s && s[key]);
      return v > best.value ? { player: p, value: v } : best;
    }, { player: '-', value: 0 });

    const clicksChamp = topBy('clicks_total');
    const sessionsChamp = topBy('sessions_started');
    const keypressChamp = topBy('keypress_total');

    // total clics global enlevé (doublon avec "plus de clics")

    let late = { player: '-', minutes: -1 };
    let early = { player: '-', minutes: 24 * 60 + 1 };
    if (sessions) {
      Object.values(sessions).forEach(ev => {
        const mins = num(ev.minutesSinceMidnight != null ? ev.minutesSinceMidnight : (ev.hour * 60 + ev.minute));
        const p = ev.player || '-';
        if (mins > late.minutes) late = { player: p, minutes: mins };
        if (mins < early.minutes) early = { player: p, minutes: mins };
      });
    } else {
      entries.forEach(([p, s]) => {
        const lateM = num(s && s.latest_minutes);
        const earlyM = num(s && s.earliest_minutes);
        if (lateM > late.minutes) late = { player: p, minutes: lateM };
        if (earlyM < early.minutes) early = { player: p, minutes: earlyM };
      });
    }

    const fmtTime = (m) => {
      if (m < 0 || m > 24 * 60) return '-';
      const h = Math.floor(m / 60); const mi = m % 60;
      return `${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
    };

    container.innerHTML = `
      <div class="hof-inline-card">
        <table class="hof-inline-table">
          <thead>
            <tr class="hof-title-row"><th colspan="3">SUB'Stats</th></tr>
            <tr><th>Description</th><th>Joueur</th><th>Valeur</th></tr>
          </thead>
          <tbody>
            <tr><td>Plus de clics 🖱️🔥</td><td>${clicksChamp.player}</td><td>${clicksChamp.value}</td></tr>
            <tr><td>Plus de parties jouées 🏢⏱️</td><td>${sessionsChamp.player}</td><td>${sessionsChamp.value}</td></tr>
            <tr><td>Joue le plus tard 🌙😴</td><td>${late.player}</td><td>${fmtTime(late.minutes)}</td></tr>
            <tr><td>Commence le plus tôt 🐓📅</td><td>${early.player}</td><td>${fmtTime(early.minutes)}</td></tr>
            <tr><td>Plus de frappes clavier ⌨️💥</td><td>${keypressChamp.player}</td><td>${keypressChamp.value}</td></tr>
          </tbody>
        </table>
      </div>`;
  }

  const db = firebase.database();
  let latestStats = null, latestSessions = null;
  const update = () => render(latestStats, latestSessions);
  db.ref('/stats/players').on('value', (snap) => { latestStats = snap.val() || {}; update(); });
  db.ref('/events/sessions').limitToLast(500).on('value', (snap) => { latestSessions = snap.val() || {}; update(); });
}
