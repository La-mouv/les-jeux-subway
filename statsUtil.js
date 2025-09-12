// Utilitaires de stats SUB'Stats (Firebase Realtime Database, compat)
// Chemins:
// - /stats/players/{player}/{counter}
// - /stats/global/{counter}
// - /events/sessions/{id} -> { player, game, ts, hour, minute, iso }

function nowInfo() {
  const d = new Date();
  return {
    ts: d.getTime(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    iso: d.toISOString(),
    minutesSinceMidnight: d.getHours() * 60 + d.getMinutes(),
  };
}

function safePlayer(player) {
  return (player || 'Anonyme').replace(/[.#$\[\]]/g, '_');
}

function inc(ref, delta) {
  return ref.transaction(cur => (typeof cur === 'number' ? cur : 0) + delta);
}

// Sessions
function logSessionStart(player, gameKey) {
  try {
    const p = safePlayer(player);
    const info = nowInfo();
    const db = firebase.database();
    const base = db.ref('/stats');
    inc(base.child('players').child(p).child('sessions_started'), 1);
    inc(base.child('global').child('total_sessions'), 1);
    // Mémoriser bornes tôt/tard par joueur (minutes depuis minuit)
    const mins = info.minutesSinceMidnight;
    db.ref('/stats/players/' + p + '/latest_minutes').transaction(v => {
      v = typeof v === 'number' ? v : -1;
      return Math.max(v, mins);
    });
    db.ref('/stats/players/' + p + '/earliest_minutes').transaction(v => {
      v = typeof v === 'number' ? v : 24 * 60 + 1;
      return Math.min(v, mins);
    });
    // Event session
    db.ref('/events/sessions').push({ player: p, game: gameKey, ...info });
  } catch(e) {
    console.warn('logSessionStart error', e);
  }
}

// Clics
function addClicks(player, count) {
  try {
    const p = safePlayer(player);
    const n = Math.max(0, Number(count) || 0);
    const db = firebase.database();
    inc(db.ref('/stats/players/' + p + '/clicks_total'), n);
    inc(db.ref('/stats/global/total_clicks'), n);
  } catch(e) { console.warn('addClicks error', e); }
}

// Clavier
function addKeypress(player, count) {
  try {
    const p = safePlayer(player);
    const n = Math.max(0, Number(count) || 0);
    const db = firebase.database();
    inc(db.ref('/stats/players/' + p + '/keypress_total'), n);
    inc(db.ref('/stats/global/total_keypress'), n);
  } catch(e) { console.warn('addKeypress error', e); }
}

// Export globals (attach to window for safety)
window.SUBStats = { logSessionStart, addClicks, addKeypress };

