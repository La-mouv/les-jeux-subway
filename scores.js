(function(){
  function toNumber(v){ return (typeof v === 'number') ? v : parseFloat(v) || 0; }
  function safePlayer(player){ return String(player || 'Anonyme').replace(/[.#$\[\]]/g, '_'); }

  function setMaxScore(player, gameKey, newScore) {
    return new Promise((resolve, reject) => {
      try {
        const p = safePlayer(player);
        const s = toNumber(newScore);
        const ref = firebase.database().ref('/scores/' + p + '/' + gameKey);
        ref.transaction(current => {
          const cur = toNumber(current);
          return s > cur ? s : current;
        }, (error, committed, snapshot) => {
          if (error) { reject(error); return; }
          const val = toNumber(snapshot && snapshot.val());
          resolve({ updated: val === s, value: val });
        });
      } catch (e) { reject(e); }
    });
  }

  window.ScoreUtil = { setMaxScore };
})();

