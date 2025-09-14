(function(){
  var db = firebase.database();

  var ui = {
    cards: document.getElementById('kpi-cards'),
    topGames: document.getElementById('topGames'),
    quick: document.getElementById('quickDetails'),
    refreshBtn: document.getElementById('refreshBtn')
  };

  if (!ui.cards) return;

  // Chargement et périmètre d'analyse
  var LIMIT_SESSIONS = 1200;   // sessions pour calculs (rétention, actifs, top jeux)
  var MAX_SESSIONS_FOR_EVENTS = 400; // sessions pour durée moyenne (événements)

  function num(v){ return typeof v === 'number' ? v : parseFloat(v) || 0; }
  function fmtPct(n){ return isFinite(n) ? (n*100).toFixed(1) + '%' : '-'; }
  function dayKey(ts){ var d = new Date(num(ts)); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function humanDuration(ms){ if (!ms || !isFinite(ms) || ms < 0) return '0:00'; var s = Math.round(ms/1000); var m = Math.floor(s/60); var r = s%60; return m+':'+String(r).padStart(2,'0'); }

  function renderCards(kpis){
    var cards = [
      { label: 'Total joueurs', value: kpis.totalPlayersAllTime },
      { label: 'Actifs (aujourd\'hui)', value: kpis.activeToday },
      { label: 'Rétention J+1', value: fmtPct(kpis.retention1d) },
      { label: 'Rétention J+7', value: fmtPct(kpis.retention7d) },
      { label: 'Rétention J+30', value: fmtPct(kpis.retention30d) },
      { label: 'Durée moyenne session', value: kpis.avgSessionDurReadable },
      { label: 'Moy. parties / joueur', value: (kpis.avgSessionsPerPlayer||0).toFixed(2) }
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

  function renderQuick(details){
    ui.quick.innerHTML = [
      'Fenêtre: dernières ' + details.sessionWindow + ' sessions',
      'Sessions considérées pour durée: ' + details.eventsWindow + ' dernières'
    ].map(function(t){ return '<li>' + t + '</li>'; }).join('');
  }

  function computeRetention(todaySet, pastSet){
    var denom = pastSet.size || 0; if (!denom) return 0;
    var inter = 0; pastSet.forEach(function(p){ if (todaySet.has(p)) inter++; });
    return inter / denom;
  }

  function loadAndRender(){
    renderCards({ totalPlayersAllTime: '...', activeToday: '...' });
    renderTopGames([]);
    renderQuick({ sessionWindow: LIMIT_SESSIONS, eventsWindow: MAX_SESSIONS_FOR_EVENTS });

    // 1) Total joueurs (tous temps) via /stats/players
    var p1 = db.ref('/stats/players').once('value').then(function(s){
      var v = s.val() || {}; return Object.keys(v).length;
    });

    // 2) Sessions récentes
    var p2 = db.ref('/events/sessions').limitToLast(LIMIT_SESSIONS).once('value').then(function(snap){ return snap.val() || {}; });

    Promise.all([p1, p2]).then(function(res){
      var totalPlayersAllTime = res[0];
      var sessions = res[1];
      var ids = Object.keys(sessions);
      ids.sort(function(a,b){ return num(sessions[a].ts) - num(sessions[b].ts); });

      // Actifs par jour, top jeux, moy. parties / joueur
      var mapDayToPlayers = {}; // dayKey -> Set(players)
      var todayKey = dayKey(Date.now());
      var uniquePlayers = new Set();
      var sessionsPerPlayer = {}; // player -> count
      var byGame = {}; // game -> count

      ids.forEach(function(id){
        var s = sessions[id] || {};
        var dk = dayKey(s.ts || Date.now());
        var p = s.player || 'Anonyme';
        var g = s.game || 'unknown';
        (mapDayToPlayers[dk] = mapDayToPlayers[dk] || new Set()).add(p);
        uniquePlayers.add(p);
        sessionsPerPlayer[p] = (sessionsPerPlayer[p] || 0) + 1;
        byGame[g] = (byGame[g] || 0) + 1;
      });

      var activeToday = (mapDayToPlayers[todayKey] || new Set()).size;

      function playersAt(offsetDays){
        var t = new Date();
        t.setDate(t.getDate() - offsetDays);
        return mapDayToPlayers[dayKey(t.getTime())] || new Set();
      }

      var retention1d = computeRetention(mapDayToPlayers[todayKey] || new Set(), playersAt(1));
      var retention7d = computeRetention(mapDayToPlayers[todayKey] || new Set(), playersAt(7));
      var retention30d = computeRetention(mapDayToPlayers[todayKey] || new Set(), playersAt(30));

      var totalSessions = ids.length;
      var avgSessionsPerPlayer = uniquePlayers.size ? (totalSessions / uniquePlayers.size) : 0;

      var topGamesArr = Object.entries(byGame).map(function(e){ return { game: e[0], count: e[1] }; })
        .sort(function(a,b){ return b.count - a.count; })
        .slice(0,3);

      // 3) Durée moyenne d\'une session (échantillon)
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

        // Rendu final
        renderCards({
          totalPlayersAllTime: totalPlayersAllTime,
          activeToday: activeToday,
          retention1d: retention1d,
          retention7d: retention7d,
          retention30d: retention30d,
          avgSessionDurReadable: humanDuration(avgMs),
          avgSessionsPerPlayer: avgSessionsPerPlayer
        });
        renderTopGames(topGamesArr);
        renderQuick({ sessionWindow: LIMIT_SESSIONS, eventsWindow: MAX_SESSIONS_FOR_EVENTS });
      });
    }).catch(function(err){ console.error('Dashboard load error', err); });
  }

  ui.refreshBtn && ui.refreshBtn.addEventListener('click', loadAndRender);
  loadAndRender();
})();
