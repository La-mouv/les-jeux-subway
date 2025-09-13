// Page de choix des jeux — affichage en grille + chat + admin reset

const messagesRef = firebase.database().ref('chat');
const chatBox = document.getElementById('chatBox');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const playerNameDisplay = document.getElementById('playerNameDisplay');
const playerName = sessionStorage.getItem('playerName') || 'Sans pseudo';
if (playerNameDisplay) playerNameDisplay.textContent = playerName;

const GAMES = (window.GAMES || []);

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
