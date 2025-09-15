// Utilitaires de stats SUB'Stats (Firebase Realtime Database, compat)
// Chemins:
// - /stats/players/{player}/{counter}
// - /stats/global/{counter}
// - /events/sessions/{id} -> { player, game, ts, hour, minute, iso }
// - /events/{sessionId}/{autoId} -> { userId, sessionId, gameId, eventType, ... }

// Récupère les identifiants courants stockés côté client (sessionStorage)
let CURRENT_SESSION_ID = null;
let CURRENT_GAME_ID = null;
try {
  if (typeof sessionStorage !== 'undefined') {
    CURRENT_SESSION_ID = sessionStorage.getItem('sessionId');
    CURRENT_GAME_ID = sessionStorage.getItem('gameId');
  }
} catch (_) {}

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

// Enregistre un événement détaillé dans Firebase Realtime Database
function logEvent(ev = {}) {
  try {
    const db = firebase.database();
    const timestamp = Date.now();
    const userId = ev.userId || (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('userId')) || 'Anonyme';
    const sessionId = ev.sessionId || CURRENT_SESSION_ID || 'unknown_session';
    const gameId = ev.gameId || CURRENT_GAME_ID || 'unknown_game';
    const payload = {
      userId,
      sessionId,
      gameId,
      eventType: ev.eventType || 'unknown',
      eventDetails: ev.eventDetails || '',
      score: ev.score != null ? ev.score : null,
      duration: ev.duration != null ? ev.duration : null,
      actionsCount: ev.actionsCount != null ? ev.actionsCount : null,
      abandonFlag: !!ev.abandonFlag,
      completionFlag: !!ev.completionFlag,
      timestamp,
      device: ev.device || (typeof navigator !== 'undefined' ? navigator.userAgent : 'node'),
      page: ev.page || (typeof location !== 'undefined' ? location.pathname : ''),
      error: ev.error || null,
      version: ev.version || (window.APP_VERSION || '1.0')
    };
    db.ref('/events').child(sessionId).push(payload);
  } catch (e) {
    console.warn('logEvent error', e);
  }
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
    const sessionRef = db.ref('/events/sessions').push({ player: p, game: gameKey, ...info });
    const sid = sessionRef.key;
    CURRENT_SESSION_ID = sid;
    CURRENT_GAME_ID = gameKey;
    if (typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('sessionId', sid);
        sessionStorage.setItem('gameId', gameKey);
        sessionStorage.setItem('userId', p);
      } catch (_) {}
    }
    logEvent({ userId: p, sessionId: sid, gameId: gameKey, eventType: 'game_start' });
    return sid;
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
     logEvent({ userId: p, sessionId: CURRENT_SESSION_ID, gameId: CURRENT_GAME_ID, eventType: 'click', actionsCount: n });
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
     logEvent({ userId: p, sessionId: CURRENT_SESSION_ID, gameId: CURRENT_GAME_ID, eventType: 'keypress', actionsCount: n });
  } catch(e) { console.warn('addKeypress error', e); }
}

// Export globals (attach to window for safety)
window.SUBStats = { logSessionStart, addClicks, addKeypress, logEvent };

// Auto fit-to-screen for game containers (keeps 720x720 base, scales down on small screens)
// Applies to first matching container among: #gameContainer, #game2container, #jeu3container, #jeuContainer
// Override base size with data-base-width/height if present on the container
(function setupAutoFitToScreen() {
  function findContainer() {
    return document.querySelector('#gameContainer, #game2container, #jeu3container, #jeuContainer');
  }

  function getBaseSize(el) {
    const bw = Number(el?.dataset?.baseWidth) || 720;
    const bh = Number(el?.dataset?.baseHeight) || 720;
    return { bw, bh };
  }

  function fit() {
    const el = findContainer();
    if (!el) return;
    if (el.dataset.fitScreen === 'false') return; // opt-out hook if needed
    const { bw, bh } = getBaseSize(el);
    const margin = 24; // small safety margin against viewport chrome
    const scale = Math.min(
      Math.max(0.1, (window.innerWidth - margin) / bw),
      Math.max(0.1, (window.innerHeight - margin) / bh),
      1
    );
    el.style.transformOrigin = 'center center';
    el.style.transform = 'scale(' + scale + ')';
  }

  function init() {
    // Only run on pages that actually have a matching container
    if (!findContainer()) return;
    try {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
    } catch (_) {}
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    fit();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
