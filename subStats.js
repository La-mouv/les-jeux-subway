(function(){
  var container = document.getElementById('subStats');
  if (!container) return;

  function render(statsPlayers, sessions) {
    var byPlayer = statsPlayers || {};
    var entries = Object.entries(byPlayer);
    var num = function(v){ return (typeof v === 'number') ? v : parseFloat(v) || 0; };
    var topBy = function(key){
      return entries.reduce(function(best, pair){
        var p = pair[0], s = pair[1];
        var v = num(s && s[key]);
        return v > best.value ? { player: p, value: v } : best;
      }, { player: '-', value: 0 });
    };

    var clicksChamp = topBy('clicks_total');
    var sessionsChamp = topBy('sessions_started');
    var keypressChamp = topBy('keypress_total');

    var late = { player: '-', minutes: -1 };
    var early = { player: '-', minutes: 24 * 60 + 1 };
    if (sessions) {
      Object.values(sessions).forEach(function(ev){
        var mins = num(ev.minutesSinceMidnight != null ? ev.minutesSinceMidnight : (ev.hour * 60 + ev.minute));
        var p = ev.player || '-';
        if (mins > late.minutes) late = { player: p, minutes: mins };
        if (mins < early.minutes) early = { player: p, minutes: mins };
      });
    }

    var fmtTime = function(m){
      if (m < 0 || m > 24 * 60) return '-';
      var h = Math.floor(m / 60); var mi = m % 60;
      return (String(h).padStart(2,'0') + ':' + String(mi).padStart(2,'0'));
    };

    var html = ''
      + '<table id="table" border="1">'
      + '<thead>'
      + '<tr><th colspan="3">SUB\'Stats</th></tr>'
      + '<tr><th>Description</th><th>Joueur</th><th>Valeur</th></tr>'
      + '</thead>'
      + '<tbody>'
      + '<tr><td>Plus de clics 🖱️🔥</td><td>' + clicksChamp.player + '</td><td>' + clicksChamp.value + '</td></tr>'
      + '<tr><td>Plus de parties jouées 🏢⏱️</td><td>' + sessionsChamp.player + '</td><td>' + sessionsChamp.value + '</td></tr>'
      + '<tr><td>Joue le plus tard 🌙😴</td><td>' + late.player + '</td><td>' + fmtTime(late.minutes) + '</td></tr>'
      + '<tr><td>Commence le plus tôt 🐓📅</td><td>' + early.player + '</td><td>' + fmtTime(early.minutes) + '</td></tr>'
      + '<tr><td>Plus de frappes clavier ⌨️💥</td><td>' + keypressChamp.player + '</td><td>' + keypressChamp.value + '</td></tr>'
      + '</tbody></table>';
    container.innerHTML = html;
  }

  var db = firebase.database();
  var latestStats = null, latestSessions = null;
  var update = function(){ render(latestStats, latestSessions); };
  db.ref('/stats/players').on('value', function(snap){ latestStats = snap.val() || {}; update(); });
  db.ref('/events/sessions').limitToLast(500).on('value', function(snap){ latestSessions = snap.val() || {}; update(); });
})();
