(function(){
  var db = firebase.database();

  var ui = {
    cards: document.getElementById('kpi-cards'),
    topGames: document.getElementById('topGames'),
    topGamesTitle: document.getElementById('topGamesTitle'),
    refreshBtn: document.getElementById('refreshBtn'),
    suggestionsList: document.getElementById('suggestionsList'),
    // filters
    periodStartA: document.getElementById('periodStartA'),
    periodEndA: document.getElementById('periodEndA'),
    periodStartB: document.getElementById('periodStartB'),
    periodEndB: document.getElementById('periodEndB'),
    applyPeriodBtn: document.getElementById('applyPeriodBtn'),
    // period outputs
    uniquePerDay: document.getElementById('uniquePerDay'),
    sessionsPerDay: document.getElementById('sessionsPerDay'),
    retentionFunnel: document.getElementById('retentionFunnel')
  };

  if (!ui.cards) return;

  // Chargement et périmètre d'analyse
  var LIMIT_SESSIONS = 2000;   // sessions pour calculs (rétention, actifs, top jeux)
  var MAX_SESSIONS_FOR_EVENTS = 400; // sessions pour durée moyenne (événements)
  var LIVE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

  function num(v){ return typeof v === 'number' ? v : parseFloat(v) || 0; }
  function fmtPct(n){ return isFinite(n) ? (n*100).toFixed(1) + '%' : '-'; }
  function dayKey(ts){ var d = new Date(num(ts)); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function humanDuration(ms){ if (!ms || !isFinite(ms) || ms < 0) return '0:00'; var s = Math.round(ms/1000); var m = Math.floor(s/60); var r = s%60; return m+':'+String(r).padStart(2,'0'); }
  function toISODate(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function prettyDay(dk){ try { var p = dk.split('-'); return (p[2]+'/'+p[1]); } catch(_) { return dk; } }
  function startOfDayTs(iso){ var p = iso.split('-').map(Number); return new Date(p[0], p[1]-1, p[2], 0,0,0,0).getTime(); }
  function endOfDayTs(iso){ var p = iso.split('-').map(Number); return new Date(p[0], p[1]-1, p[2], 23,59,59,999).getTime(); }
  function within(ts, startIso, endIso){ var t = num(ts); return t >= startOfDayTs(startIso) && t <= endOfDayTs(endIso); }
  function daysBetween(startIso, endIso){
    var out = []; var p1 = startIso.split('-').map(Number); var p2 = endIso.split('-').map(Number);
    var cur = new Date(p1[0], p1[1]-1, p1[2]); var end = new Date(p2[0], p2[1]-1, p2[2]);
    while (cur.getTime() <= end.getTime()) { out.push(toISODate(cur)); cur.setDate(cur.getDate()+1); }
    return out;
  }

  function renderCards(kpis){
    var cards = [
      { label: 'Joueurs en live (5 min)', value: kpis.livePlayers != null ? kpis.livePlayers : '...' },
      { label: 'Moy. parties / joueur (A)', value: isFinite(kpis.avgSessionsPerPlayerPeriodA) ? (kpis.avgSessionsPerPlayerPeriodA||0).toFixed(2) : '...' },
      { label: 'Durée moyenne session', value: kpis.avgSessionDurReadable },
      { label: 'Total joueurs', value: kpis.totalPlayersAllTime },
      { label: 'Actifs (aujourd\'hui)', value: kpis.activeToday }
    ];
    ui.cards.innerHTML = cards.map(function(c){
      return '<div class="metric"><div class="label">' + c.label + '</div>' +
             '<div class="value">' + c.value + '</div></div>';
    }).join('');
  }

  function gameTitle(key){
    try {
      var m = (window.GAMES_BY_KEY && window.GAMES_BY_KEY[key]);
      return (m && m.title) || key || 'inconnu';
    } catch(_) { return key || 'inconnu'; }
  }

  function renderTopGames(list){
    ui.topGames.innerHTML = list.map(function(it){ return '<li>' + gameTitle(it.game) + ' — ' + it.count + '</li>'; }).join('');
  }

  // Retention J+1/J+7/J+30 retirées des KPI; funnel conservé.

  var STATE = {
    sessions: {},
    sessionIdsSorted: [],
    mapDayToPlayers: {},
    mapDayToSessionCount: {},
    allPlayersSet: new Set(),
    yearHint: (new Date()).getFullYear()
  };

  function buildIndices(sessions){
    var ids = Object.keys(sessions);
    ids.sort(function(a,b){ return num(sessions[a].ts) - num(sessions[b].ts); });
    STATE.sessions = sessions;
    STATE.sessionIdsSorted = ids;
    STATE.mapDayToPlayers = {};
    STATE.mapDayToSessionCount = {};
    STATE.allPlayersSet = new Set();
    ids.forEach(function(id){
      var s = sessions[id] || {};
      var dk = dayKey(s.ts || Date.now());
      var p = s.player || 'Anonyme';
      (STATE.mapDayToPlayers[dk] = STATE.mapDayToPlayers[dk] || new Set()).add(p);
      STATE.mapDayToSessionCount[dk] = (STATE.mapDayToSessionCount[dk] || 0) + 1;
      STATE.allPlayersSet.add(p);
    });
    if (ids.length) {
      var last = sessions[ids[ids.length-1]];
      var d = new Date(num(last.ts));
      if (!isNaN(d.getTime())) STATE.yearHint = d.getFullYear();
    }
  }

  function computeAvgSessionsPerPlayerInRange(startIso, endIso){
    var unique = new Set(); var count = 0;
    STATE.sessionIdsSorted.forEach(function(id){
      var s = STATE.sessions[id];
      if (within(s.ts, startIso, endIso)) { unique.add(s.player || 'Anonyme'); count++; }
    });
    return unique.size ? (count/unique.size) : 0;
  }

  function computeTopGamesInRange(startIso, endIso){
    var byGame = {};
    STATE.sessionIdsSorted.forEach(function(id){
      var s = STATE.sessions[id] || {};
      if (!within(s.ts, startIso, endIso)) return;
      var g = s.game || 'unknown';
      byGame[g] = (byGame[g] || 0) + 1;
    });
    return Object.entries(byGame).map(function(e){ return { game: e[0], count: e[1] }; })
      .sort(function(a,b){ return b.count - a.count; })
      .slice(0,3);
  }

  function computeLivePlayersApprox(){
    var now = Date.now(); var set = new Set();
    STATE.sessionIdsSorted.forEach(function(id){
      var s = STATE.sessions[id];
      if (num(s.ts) >= (now - LIVE_WINDOW_MS)) set.add(s.player || 'Anonyme');
    });
    return set.size;
  }

  function renderPeriodA(startIso, endIso){
    // per-day uniques and sessions
    var days = daysBetween(startIso, endIso);
    var uniquesLis = [];
    var sessionsLis = [];
    days.forEach(function(iso){
      var players = STATE.mapDayToPlayers[iso] || new Set();
      uniquesLis.push('<li>'+prettyDay(iso)+': <strong>'+players.size+'</strong></li>');
      var sc = STATE.mapDayToSessionCount[iso] || 0;
      sessionsLis.push('<li>'+prettyDay(iso)+': <strong>'+sc+'</strong></li>');
    });
    if (ui.uniquePerDay) ui.uniquePerDay.innerHTML = uniquesLis.join('');
    if (ui.sessionsPerDay) ui.sessionsPerDay.innerHTML = sessionsLis.join('');

    // retention funnel: base = day 0
    var baseIso = days[0];
    var baseSet = STATE.mapDayToPlayers[baseIso] || new Set();
    var funnelHtml = [];
    days.forEach(function(iso, idx){
      var cur = STATE.mapDayToPlayers[iso] || new Set();
      var inter = 0; if (baseSet.size){ baseSet.forEach(function(p){ if (cur.has(p)) inter++; }); }
      var pct = baseSet.size ? (inter/baseSet.size) : 0;
      funnelHtml.push('<div class="step"><div class="title">'+prettyDay(iso)+'</div><div class="sub">'+inter+' / '+baseSet.size+' ('+fmtPct(pct)+')'+'</div></div>');
    });
    if (ui.retentionFunnel) ui.retentionFunnel.innerHTML = funnelHtml.join('');

    // average sessions per player in A
    var avgA = computeAvgSessionsPerPlayerInRange(startIso, endIso);
    return avgA;
  }

  function loadAndRender(){
    renderCards({ totalPlayersAllTime: '...', activeToday: '...' });
    renderTopGames([]);
    // quick details supprimé

    var p1 = db.ref('/stats/players').once('value').then(function(s){
      var v = s.val() || {}; return Object.keys(v).length;
    });
    var p2 = db.ref('/events/sessions').limitToLast(LIMIT_SESSIONS).once('value').then(function(snap){ return snap.val() || {}; });

    Promise.all([p1, p2]).then(function(res){
      var totalPlayersAllTime = res[0];
      var sessions = res[1];
      buildIndices(sessions);

      // Defaults for periods (fill inputs if empty)
      var y = STATE.yearHint;
      function setIfEmpty(el, val){ if (el && !el.value) el.value = val; }
      setIfEmpty(ui.periodStartA, y+'-09-15');
      setIfEmpty(ui.periodEndA,   y+'-09-19');
      setIfEmpty(ui.periodStartB, y+'-09-15');
      setIfEmpty(ui.periodEndB,   y+'-09-29');

      // Actifs today
      var todayKey = dayKey(Date.now());
      var activeToday = (STATE.mapDayToPlayers[todayKey] || new Set()).size;

      // Period A computations
      var startA = ui.periodStartA ? ui.periodStartA.value : (y+'-09-15');
      var endA   = ui.periodEndA ? ui.periodEndA.value   : (y+'-09-19');
      var avgA = renderPeriodA(startA, endA);

      // Top games for Period B
      var startB = ui.periodStartB ? ui.periodStartB.value : (y+'-09-15');
      var endB   = ui.periodEndB ? ui.periodEndB.value   : (y+'-09-29');
      var topGamesArr = computeTopGamesInRange(startB, endB);
      if (ui.topGamesTitle) ui.topGamesTitle.textContent = 'Top 3 jeux (volume — ' + prettyDay(startB) + '→' + prettyDay(endB) + ')';

      // Approx live players
      var livePlayers = computeLivePlayersApprox();

      // Average session duration (sample)
      var ids = STATE.sessionIdsSorted;
      var lastForEvents = ids.slice(-MAX_SESSIONS_FOR_EVENTS);
      var promises = lastForEvents.map(function(id){
        return db.ref('/events/' + id).limitToLast(300).once('value').then(function(s){ return { id: id, events: s.val() || {} }; });
      });

      Promise.all(promises).then(function(results){
        var durations = [];
        results.forEach(function(r){
          var minTs = Infinity, maxTs = -Infinity, count = 0;
          Object.values(r.events).forEach(function(ev){
            var ts = num(ev && ev.timestamp);
            if (!ts) return;
            count++;
            if (ts < minTs) minTs = ts;
            if (ts > maxTs) maxTs = ts;
          });
          if (count > 0 && isFinite(minTs) && isFinite(maxTs) && maxTs >= minTs) {
            durations.push(maxTs - minTs);
          }
        });
        var avgMs = durations.length ? (durations.reduce(function(a,b){ return a + b; }, 0) / durations.length) : 0;

        renderCards({
          totalPlayersAllTime: totalPlayersAllTime,
          activeToday: activeToday,
          avgSessionDurReadable: humanDuration(avgMs),
          avgSessionsPerPlayerPeriodA: avgA,
          livePlayers: livePlayers
        });
        renderTopGames(topGamesArr);
        // quick details supprimé
      });
    }).catch(function(err){ console.error('Dashboard load error', err); });
  }

  ui.refreshBtn && ui.refreshBtn.addEventListener('click', loadAndRender);
  loadAndRender();

  // Apply period filters
  ui.applyPeriodBtn && ui.applyPeriodBtn.addEventListener('click', function(){
    // Recalculer l'ensemble des métriques avec les nouvelles périodes
    loadAndRender();
  });

  // Suggestions feed
  function esc(s){
    return String(s || '').replace(/[&<>"']/g, function(c){
      switch(c){
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return c;
      }
    });
  }
  function fmtDate(ts){ var n = num(ts); if (!n || !isFinite(n)) return '-'; var d = new Date(n); try { return d.toLocaleString('fr-FR'); } catch(_) { return d.toISOString(); } }
  if (ui.suggestionsList) {
    db.ref('/suggestions').limitToLast(200).on('value', function(snap){
      var val = snap.val() || {};
      var arr = Object.values(val).sort(function(a,b){ return num(b.ts) - num(a.ts); });
      ui.suggestionsList.innerHTML = arr.map(function(it){
        return '<li>' +
          '<div class="suggestion-meta"><strong>' + esc(it.player || 'Anonyme') + '</strong> — ' + fmtDate(it.ts) + '</div>' +
          '<div>' + esc(it.text || '') + '</div>' +
        '</li>';
      }).join('');
    });
  }
})();
