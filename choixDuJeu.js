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

// Suggestions — bouton + modal + envoi Firebase
(function initSuggestions(){
  try {
    var btn = document.getElementById('suggestion-btn');
    if (!btn) return;

    function ensureModal(){
      var modal = document.getElementById('suggestionModal');
      if (modal) return modal;
      // Crée le modal si absent (au cas où le HTML est injecté après)
      var wrapper = document.createElement('div');
      wrapper.innerHTML = '\n<div id="suggestionModal" class="modal hidden" aria-hidden="true" role="dialog" aria-labelledby="suggestionTitle">\n  <div class="modal-dialog">\n    <h3 id="suggestionTitle">Suggestions des utilisateurs</h3>\n    <p>Avez-vous des suggestions ? Idée de jeu, bug, etc.</p>\n    <textarea id="suggestionText" placeholder="vos avis ou suggestions..." maxlength="500"></textarea>\n    <div class="modal-actions">\n      <button id="suggestionCancel" class="btn" type="button">Annuler</button>\n      <button id="suggestionSubmit" class="btn" type="button">Envoyer</button>\n    </div>\n  </div>\n</div>';
      document.body.appendChild(wrapper.firstChild);
      return document.getElementById('suggestionModal');
    }

    function bindModalHandlers(){
      var modal = ensureModal();
      var txt = document.getElementById('suggestionText');
      var cancel = document.getElementById('suggestionCancel');
      var submit = document.getElementById('suggestionSubmit');
      if (!modal || !txt || !cancel || !submit) return;

      function openModal(){ modal.classList.remove('hidden'); modal.setAttribute('aria-hidden','false'); setTimeout(function(){ txt.focus(); }, 50); }
      function closeModal(){ modal.classList.add('hidden'); modal.setAttribute('aria-hidden','true'); }

      // Evite le double-binding si on réappelle bind
      if (!modal._bound) {
        cancel.addEventListener('click', closeModal);
        document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeModal(); });
        submit.addEventListener('click', function(){
          var text = (txt.value || '').trim();
          if (!text) { alert('Merci de saisir une suggestion.'); return; }
          try {
            var entry = {
              text: text,
              player: playerName || 'Anonyme',
              ts: firebase.database.ServerValue.TIMESTAMP,
              page: 'choixDuJeu'
            };
            firebase.database().ref('/suggestions').push(entry)
              .then(function(){ txt.value = ''; closeModal(); alert('Merci pour votre suggestion !'); })
              .catch(function(){ alert('Une erreur est survenue. Réessayez plus tard.'); });
          } catch (e) { alert('Sauvegarde indisponible pour le moment.'); }
        });
        modal._bound = true;
      }
      return openModal;
    }

    btn.addEventListener('click', function(){
      var open = bindModalHandlers();
      if (typeof open === 'function') open();
    });
  } catch (_) {}
})();
