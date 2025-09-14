(() => {
  if (window.ChatWidget) return;

  const cfg = Object.assign({
    label: undefined,
    title: undefined,
    accent: undefined,
    bubbleSize: undefined,
    labelFontSize: undefined,
  }, window.ChatWidgetConfig || {});

  const CSS = `
    #chat-bubble-widget { position: fixed; right: 20px; bottom: 20px; z-index: 2147483647; font-family: ui-sans-serif, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji; --cw-bubble-size: 72px; --cw-label-font-size: 15px; }
    #chat-bubble-widget * { box-sizing: border-box; }

    #chat-bubble-widget .cw-bubble { 
      width: var(--cw-bubble-size); height: var(--cw-bubble-size); border-radius: 9999px; 
      display: inline-flex; align-items: center; justify-content: center; 
      background: var(--cw-accent, #0b5cff); color: #fff; border: none; cursor: pointer;
      box-shadow: 0 10px 20px rgba(0,0,0,.15), 0 2px 6px rgba(0,0,0,.08);
      transition: transform .15s ease, box-shadow .2s ease, background .2s ease;
      font-weight: 800; letter-spacing: .2px;
    }
    #chat-bubble-widget .cw-bubble.has-label { height: calc(var(--cw-bubble-size) - 12px); min-width: calc(var(--cw-bubble-size) - 4px); padding: 0 16px; }
    #chat-bubble-widget .cw-bubble .cw-label { font-size: var(--cw-label-font-size); font-family: var(--font-display, ui-sans-serif); }
    #chat-bubble-widget .cw-bubble:hover { transform: translateY(-2px); box-shadow: 0 14px 28px rgba(0,0,0,.18), 0 4px 10px rgba(0,0,0,.1); }
    #chat-bubble-widget .cw-bubble:active { transform: translateY(0); }
    #chat-bubble-widget .cw-bubble svg { width: calc(var(--cw-bubble-size) * 0.5); height: calc(var(--cw-bubble-size) * 0.5); fill: currentColor; }

    #chat-bubble-widget .cw-panel {
      position: fixed; right: 20px; bottom: 92px; width: 336px; max-width: calc(100vw - 32px);
      height: 440px; max-height: calc(100vh - 140px); background: #fff; color: #0b0f19;
      border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,0,0,.06);
      box-shadow: 0 20px 40px rgba(0,0,0,.18), 0 4px 12px rgba(0,0,0,.12);
      opacity: 0; transform: translateY(8px) scale(.98); pointer-events: none;
      transition: transform .18s ease, opacity .18s ease;
      display: flex; flex-direction: column; backdrop-filter: saturate(140%) blur(2px);
    }
    #chat-bubble-widget.open .cw-panel { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }

    #chat-bubble-widget .cw-header { height: 52px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px 0 14px; background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%); border-bottom: 1px solid rgba(0,0,0,.06); }
    #chat-bubble-widget .cw-title { font-weight: 650; font-size: 14px; color: #0b0f19; }
    #chat-bubble-widget .cw-actions { display: flex; gap: 6px; }
    #chat-bubble-widget .cw-iconbtn { width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1px solid rgba(0,0,0,.06); background: #fff; color: #111; cursor: pointer; }
    #chat-bubble-widget .cw-iconbtn:hover { background: #f6f6f6; }

    #chat-bubble-widget .cw-messages { flex: 1; padding: 12px; overflow: auto; background: #fff; }
    #chat-bubble-widget .cw-message { max-width: 80%; margin: 6px 0; padding: 8px 10px; border-radius: 12px; font-size: 14px; line-height: 1.35; box-shadow: 0 1px 0 rgba(0,0,0,.04); }
    #chat-bubble-widget .cw-message.bot { background: #f2f5ff; color: #0b1b5c; border-top-left-radius: 4px; }
    #chat-bubble-widget .cw-message.me { background: var(--cw-accent, #0b5cff); color: #fff; margin-left: auto; border-top-right-radius: 4px; }
    #chat-bubble-widget .cw-meta { display: block; margin-top: 2px; opacity: .65; font-size: 11px; }

    #chat-bubble-widget .cw-input { display: flex; align-items: center; gap: 8px; padding: 10px; border-top: 1px solid rgba(0,0,0,.06); background: #fff; }
    #chat-bubble-widget .cw-input input[type="text"] { flex: 1; height: 40px; border-radius: 10px; border: 1px solid #e5e7eb; padding: 0 12px; font-size: 14px; outline: none; }
    #chat-bubble-widget .cw-input input[type="text"]:focus { border-color: #0b5cff33; box-shadow: 0 0 0 3px #0b5cff22; }
    #chat-bubble-widget .cw-send { height: 40px; min-width: 72px; padding: 0 12px; border-radius: 10px; border: none; background: var(--cw-accent, #0b5cff); color: #fff; font-weight: 600; cursor: pointer; }
    #chat-bubble-widget .cw-send:hover { filter: brightness(1.05); }

    @media (max-width: 480px) {
      #chat-bubble-widget .cw-panel { width: calc(100vw - 24px); right: 12px; bottom: 88px; height: min(70vh, 480px); }
      #chat-bubble-widget .cw-bubble { width: calc(var(--cw-bubble-size) - 8px); height: calc(var(--cw-bubble-size) - 8px); }
      #chat-bubble-widget .cw-bubble.has-label { height: calc(var(--cw-bubble-size) - 20px); }
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-chat-widget', '');
  style.textContent = CSS;
  document.head.appendChild(style);

  const container = document.createElement('div');
  container.id = 'chat-bubble-widget';
  container.setAttribute('aria-live', 'polite');

  const titleId = 'cw-title-' + Math.random().toString(36).slice(2, 8);
  const bubbleHasLabel = !!cfg.label;
  const bubbleContent = bubbleHasLabel
    ? `<span class="cw-label">${String(cfg.label).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</span>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 2H4a2 2 0 0 0-2 2v14l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"/><circle cx="7" cy="10" r="1.5"/><circle cx="12" cy="10" r="1.5"/><circle cx="17" cy="10" r="1.5"/></svg>`;
  const panelTitle = String(cfg.title || cfg.label || 'Besoin d’aide ?').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  container.innerHTML = `
    <button class="cw-bubble${bubbleHasLabel ? ' has-label' : ''}" aria-label="Ouvrir la fenêtre de chat" aria-expanded="false">${bubbleContent}</button>
    <section class="cw-panel" role="dialog" aria-modal="false" aria-labelledby="${titleId}" aria-hidden="true">
      <header class="cw-header">
        <div class="cw-title" id="${titleId}">${panelTitle}</div>
        <div class="cw-actions">
          <button class="cw-iconbtn cw-min" aria-label="Réduire">−</button>
          <button class="cw-iconbtn cw-close" aria-label="Fermer">✕</button>
        </div>
      </header>
      <div class="cw-messages" data-ref="messages"></div>
      <form class="cw-input" data-ref="form">
        <input type="text" name="message" autocomplete="off" placeholder="Écrire un message…" data-ref="input" />
        <button type="submit" class="cw-send">Envoyer</button>
      </form>
    </section>
  `;
  document.body.appendChild(container);

  const els = {
    bubble: container.querySelector('.cw-bubble'),
    panel: container.querySelector('.cw-panel'),
    close: container.querySelector('.cw-close'),
    min: container.querySelector('.cw-min'),
    messages: container.querySelector('[data-ref="messages"]'),
    form: container.querySelector('[data-ref="form"]'),
    input: container.querySelector('[data-ref="input"]'),
  };

  const scrollBottom = () => { requestAnimationFrame(() => { els.messages.scrollTop = els.messages.scrollHeight; }); };
  const addMessage = (html, author = 'bot') => {
    const wrapper = document.createElement('div');
    wrapper.className = `cw-message ${author}`;
    wrapper.innerHTML = `${html}`;
    els.messages.appendChild(wrapper);
    scrollBottom();
  };

  // Accent override via config
  if (cfg.accent) {
    container.style.setProperty('--cw-accent', cfg.accent);
  }
  if (cfg.bubbleSize) {
    const v = typeof cfg.bubbleSize === 'number' ? `${cfg.bubbleSize}px` : String(cfg.bubbleSize);
    container.style.setProperty('--cw-bubble-size', v);
  }
  if (cfg.labelFontSize) {
    const v = typeof cfg.labelFontSize === 'number' ? `${cfg.labelFontSize}px` : String(cfg.labelFontSize);
    container.style.setProperty('--cw-label-font-size', v);
  }

  // Seed welcome message
  addMessage('Bonjour ! Bienvenue dans le chat !', 'bot');

  const open = () => {
    if (container.classList.contains('open')) return;
    container.classList.add('open');
    els.bubble.setAttribute('aria-expanded', 'true');
    els.panel.setAttribute('aria-hidden', 'false');
    setTimeout(() => els.input.focus(), 180);
  };
  const close = () => {
    if (!container.classList.contains('open')) return;
    container.classList.remove('open');
    els.bubble.setAttribute('aria-expanded', 'false');
    els.panel.setAttribute('aria-hidden', 'true');
  };
  const toggle = () => { container.classList.contains('open') ? close() : open(); };

  els.bubble.addEventListener('click', toggle);
  els.min.addEventListener('click', close);
  els.close.addEventListener('click', close);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

  // Try Firebase integration if available
  let usingFirebase = false;
  let messagesRef = null;
  try {
    if (window.firebase && typeof firebase.database === 'function') {
      messagesRef = firebase.database().ref('chat');
      usingFirebase = true;
      const myName = sessionStorage.getItem('playerName') || 'Anonyme';
      messagesRef.limitToLast(100).on('child_added', (snap) => {
        const v = snap.val() || {};
        const isMe = (v.pseudo || '') === myName;
        const safeMsg = String(v.message || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        addMessage(`<strong>${(v.pseudo || 'Invité')}</strong>: ${safeMsg}`, isMe ? 'me' : 'bot');
      });

      els.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = els.input.value.trim();
        if (!text) return;
        els.input.value = '';
        messagesRef.push({
          pseudo: myName,
          message: text,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });
      });
    }
  } catch (_) {}

  // Fallback local echo mode when no Firebase
  if (!usingFirebase) {
    els.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = els.input.value.trim();
      if (!text) return;
      addMessage(text.replace(/</g, '&lt;').replace(/>/g, '&gt;'), 'me');
      els.input.value = '';
      setTimeout(() => addMessage('Merci pour votre message !', 'bot'), 450);
    });
  }

  // Public API
  window.ChatWidget = { open, close, toggle };
})();
