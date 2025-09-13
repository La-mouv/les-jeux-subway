// Page de choix des jeux — affichage en grille + chat + admin reset

const messagesRef = firebase.database().ref('chat');
const chatBox = document.getElementById('chatBox');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
if (playerNameDisplay) playerNameDisplay.textContent = playerName;

const GAMES = [
  { key:'jeu5', title:"SUB'Collect", desc:"Cliquez sur les SUB et évitez les pièges pendant 20 s.", page:'jeuVélo/jeu5.html', bg:'images/imageJeu5.jpg' },
  { key:'jeu1', title:"Dacty'SUB", desc:"Tapez les mots à toute vitesse : rapidité = points.", page:'jeuTyping/jeu1.html', bg:'images/ImageJeu1.png' },
  { key:'jeu3', title:"SUB'Click", desc:"Cliquez le carré vert un maximum de fois en 10 s.", page:'jeuClique/jeu3.html', bg:'images/imageJeu3.jpg' },
  { key:'jeu4', title:"Memory'SUB", desc:"Mémorisez et retrouvez les cookies cachés : précision = points.", page:'jeuPoints/jeu4.html', bg:'images/imageJeu4.jpg' },
  { key:'jeu6', title:"SUB l'éclair", desc:"Cliquez pour préparer la commande dès que les feux s'éteignent. Réactivité = points.", page:'jeuF1/jeu6.html', bg:'images/imageJeu6.jpg' },
  { key:'jeu2', title:"SUB'Dessin", desc:"Dessinez le SUB d'un seul trait. Précision = points.", page:'DessinOlympique/jeu2.html', bg:'images/ImageJeu2.png' }
];

function renderGrid() {
  const grid = document.getElementById('games-grid');
  if (!grid) return;
  grid.innerHTML = GAMES.map(g => `
    <div class="game-card" data-key="${g.key}" style="background-image:url('${g.bg}')">
      <div class="content">
        <h3>${g.title}</h3>
        <p>${g.desc}</p>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-key');
      window.location.href = `jeuDetails.html?game=${encodeURIComponent(key)}`;
    });
  });
}

renderGrid();

function scrollToBottom() { if (chatBox) chatBox.scrollTop = chatBox.scrollHeight; }

function sendMessage() {
  if (!chatInput) return;
  const text = chatInput.value.trim();
  if(text) {
    chatInput.value = '';
    messagesRef.push({ pseudo: playerName, message: text, timestamp: firebase.database.ServerValue.TIMESTAMP });
  }
}

if (chatInput) chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

messagesRef.on('child_added', (data) => {
  if (!chatMessages) return;
  const message = data.val();
  const li = document.createElement('li');
  const pseudoEl = document.createElement('span');
  pseudoEl.textContent = message.pseudo;
  pseudoEl.className = 'pseudo';
  if (message.pseudo === 'Alexis') pseudoEl.style.color = 'red';
  li.appendChild(pseudoEl);
  li.appendChild(document.createTextNode(': ' + message.message));
  chatMessages.appendChild(li);
  scrollToBottom();
});

window.onload = function() {
  const name = sessionStorage.getItem('playerName');
  const resetButton = document.getElementById('resetScoresButton');
  if (name === 'Alexis' && resetButton) resetButton.style.display = 'block';
};

const resetBtn = document.getElementById('resetScoresButton');
if (resetBtn) resetBtn.addEventListener('click', function() {
  const name = sessionStorage.getItem('playerName');
  if (name === 'Alexis') {
    const password = prompt('Veuillez entrer le mot de passe pour réinitialiser les scores:');
    if (password === 'yoyoyoyo') {
      if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les scores ?')) resetAllScores();
    } else {
      alert('Mot de passe incorrect.');
    }
  } else {
    alert('Vous n’êtes pas autorisé à réinitialiser les scores.');
  }
});

function resetAllScores() {
  var scoresRef = firebase.database().ref('/scores/');
  scoresRef.once('value', function(snapshot) {
    if (snapshot.exists()) {
      snapshot.forEach(function(playerScores) {
        const name = playerScores.key;
        playerScores.forEach(function(gameScore) {
          var gameKey = gameScore.key;
          var ref = firebase.database().ref('/scores/' + name + '/' + gameKey);
          ref.set(0, function(error) { if (error) console.error('Erreur reset', name, gameKey); });
        });
      });
      alert('Tous les scores ont été réinitialisés.');
    } else {
      alert('Aucun score à réinitialiser.');
    }
  });
}

