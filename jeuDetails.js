(function(){
  const params = new URLSearchParams(location.search);
  const key = params.get('game');

  const GAMES = {
    jeu5: { title:"SUB'Collect", desc:"Cliquez sur les SUB et évitez les pièges pendant 20 s.", page:'jeuVélo/jeu5.html', bg:'images/imageJeu5.jpg' },
    jeu1: { title:"Dacty'SUB", desc:"Tapez les mots à toute vitesse : rapidité = points.", page:'jeuTyping/jeu1.html', bg:'images/ImageJeu1.png' },
    jeu3: { title:"SUB'Click", desc:"Cliquez le carré vert un maximum de fois en 10 s.", page:'jeuClique/jeu3.html', bg:'images/imageJeu3.jpg' },
    jeu4: { title:"Memory'SUB", desc:"Mémorisez et retrouvez les cookies cachés : précision = points.", page:'jeuPoints/jeu4.html', bg:'images/imageJeu4.jpg' },
    jeu6: { title:"SUB l'éclair", desc:"Cliquez pour préparer la commande dès que les feux s'éteignent. Réactivité = points.", page:'jeuF1/jeu6.html', bg:'images/imageJeu6.jpg' },
    jeu2: { title:"SUB'Dessin", desc:"Dessinez le SUB d'un seul trait. Précision = points.", page:'DessinOlympique/jeu2.html', bg:'images/ImageJeu2.png' }
  };

  const meta = GAMES[key] || GAMES.jeu1;
  document.getElementById('game-title').textContent = meta.title;
  document.getElementById('game-desc').textContent = meta.desc;
  // Hero image removed per design; keep page clean.

  // Applique le fond de la page comme les écrans de fin
  var container = document.getElementById('details-container');
  if (container && meta && meta.bg) {
    container.style.backgroundImage = "linear-gradient(rgba(255,255,255,.85), rgba(255,255,255,.85)), url('" + meta.bg + "')";
  }

  // Leaderboard top 10
  const el = document.getElementById('leaderboard');
  firebase.database().ref('/scores').orderByChild(key).limitToLast(10).on('value', (snap) => {
    const scores = snap.val();
    if (!scores) { el.textContent = 'Aucun score pour le moment.'; return; }
    const sorted = Object.keys(scores).map(p => ({ player:p, score: scores[p][key] }))
      .filter(x => x.score != null)
      .sort((a,b) => b.score - a.score).slice(0,10);
    const rows = sorted.map((s,i)=>`<tr><td>${i+1}</td><td>${s.player}</td><td>${parseFloat(s.score).toFixed(1)}</td></tr>`).join('');
    el.innerHTML = `<div class="lb-box"><table class="lb-table"><thead><tr><th>Classement</th><th>Joueurs</th><th>Score</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  });

  document.getElementById('back-btn').addEventListener('click', ()=>{ window.location.href = 'choixDuJeu.html'; });
  document.getElementById('play-btn').addEventListener('click', ()=>{
    try {
      const player = sessionStorage.getItem('playerName') || 'Sans pseudo';
      if (window.SUBStats && firebase) window.SUBStats.logSessionStart(player, key);
    } catch(_){ }
    window.location.href = meta.page;
  });
})();
