// Точка входа: цикл 60 Гц, переключение экранов.
const Main = {
  scene: null, stack: [],
  go(s) { UI.reset(); this.stack.length = 0; this.scene = s; },
  push(s) { this.stack.push({ scene: this.scene, sel: UI.sel }); UI.reset(); this.scene = s; },
  pop() { const e = this.stack.pop(); if (e) { UI.reset(); this.scene = e.scene; UI.sel = e.sel; } },
};

(function boot() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  Gfx.ctx = ctx;
  Input.bindCanvas(canvas);

  // масштаб ТВ под размер окна
  const tv = document.getElementById('tv');
  const touch = document.documentElement.classList.contains('touch');
  function fit() {
    const m = touch ? 0 : 24;
    const s = Math.min(innerWidth / (tv.offsetWidth + m), innerHeight / (tv.offsetHeight + m), 1.5);
    tv.style.transform = 'translate(-50%, -50%) scale(' + s + ')';
  }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 200)); fit();

  // ---- ручки ТВ: верхняя — канал (уровень), нижняя — громкость ----
  const knobCh = document.getElementById('knobCh'), knobVol = document.getElementById('knobVol');
  const lblCh = document.getElementById('lblCh'), lblVol = document.getElementById('lblVol');
  let osd = { text: '', kind: '', t: 0 };
  const pad2 = n => String(n).padStart(2, '0');
  function turnKnobs() {
    const ch = State.last || 1;
    knobCh.firstElementChild.style.transform = 'rotate(' + Math.round(-135 + (ch - 1) / 39 * 270) + 'deg)';
    knobVol.firstElementChild.style.transform = 'rotate(' + Math.round(-135 + Sound.vol / 10 * 270) + 'deg)';
    lblCh.textContent = '- CH ' + pad2(ch) + ' +';
    lblVol.textContent = '- VOL ' + Sound.vol + ' +';
  }
  function volume(d) {
    Sound.init(); Sound.setVol(Sound.vol + d); Sound.sfx('select');
    osd = { kind: 'vol', t: 110 }; turnKnobs();
  }
  function channel(d) {
    Sound.init();
    const s = Main.scene, n = Math.max(1, State.unlocked);
    if (s instanceof Title || s instanceof Select) return;
    const cur = s instanceof Result ? Math.min(s.n + 1, n) : (s.n || State.last || 1);
    const next = ((cur - 1 + d + n * 40) % n) + 1;
    osd = { kind: 'ch', num: next, t: 110 };
    if (n > 1 && next !== cur || !(s instanceof Play)) { Sound.sfx('ok'); Main.go(new Play(next)); }
    turnKnobs();
  }
  const clickKnob = (el, fn) => {
    el.addEventListener('click', e => { const r = el.getBoundingClientRect(); fn(e.detail && e.clientX < r.left + r.width / 2 ? -1 : 1); canvas.focus(); });
    el.addEventListener('contextmenu', e => { e.preventDefault(); fn(-1); });
    el.addEventListener('wheel', e => { e.preventDefault(); fn(e.deltaY < 0 ? 1 : -1); }, { passive: false });
  };
  clickKnob(knobCh, channel); clickKnob(knobVol, volume);
  addEventListener('keydown', e => {
    if (e.code === 'KeyM' && !e.repeat) { Sound.init(); Sound.toggle(); }
    else if (e.code === 'BracketRight' || e.code === 'PageUp') { e.preventDefault(); if (!e.repeat) channel(1); }
    else if (e.code === 'BracketLeft' || e.code === 'PageDown') { e.preventDefault(); if (!e.repeat) channel(-1); }
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') { e.preventDefault(); volume(1); }
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') { e.preventDefault(); volume(-1); }
  });
  turnKnobs();

  // ---- сенсорные кнопки ----
  if (touch) {
    const tap = {
      pause: () => { Input.press('Escape'); setTimeout(() => Input.release('Escape'), 60); },
      back: () => { Input.press('Escape'); setTimeout(() => Input.release('Escape'), 60); },
      'ch+': () => channel(1), 'ch-': () => channel(-1), 'vol+': () => volume(1), 'vol-': () => volume(-1),
      fs: () => { const d = document, el = d.documentElement; try { (d.fullscreenElement ? d.exitFullscreen() : (el.requestFullscreen || el.webkitRequestFullscreen).call(el)); } catch (e) {} },
    };
    for (const btn of document.querySelectorAll('#touch button')) {
      const k = btn.dataset.k, a = btn.dataset.tap;
      if (k) {
        const up = e => { Input.release(k); btn.classList.remove('on'); };
        btn.addEventListener('pointerdown', e => { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (_) {} Input.press(k); btn.classList.add('on'); });
        for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) btn.addEventListener(ev, up);
      } else if (a) {
        btn.addEventListener('pointerdown', e => { e.preventDefault(); Sound.init(); tap[a](); });
      }
      btn.addEventListener('contextmenu', e => e.preventDefault());
    }
    addEventListener('blur', () => document.querySelectorAll('#touch button.on').forEach(b => b.classList.remove('on')));
  }
  let sceneCls = '';
  function syncScene() {
    const s = Main.scene, c = s instanceof Play ? 'scene-play' : s instanceof Title ? 'scene-title' : 'scene-menu';
    if (c !== sceneCls) { document.body.classList.remove('scene-play', 'scene-title', 'scene-menu'); document.body.classList.add(c); sceneCls = c; }
    if (touch && c === 'scene-play' && s.mode === 'play' && innerHeight > innerWidth) s.mode = 'pause';
  }

  function drawOsd() {
    if (osd.t <= 0) return;
    osd.t--; const c = ctx, x = 292;
    if (osd.kind === 'ch') Gfx.text(t('ch') + ' ' + pad2(osd.num), x, 18, { align: 'right', color: '#7dff7d', shadow: '#063' });
    else {
      Gfx.text(t('vol'), x, 16, { align: 'right', color: '#7dff7d', shadow: '#063' });
      for (let i = 0; i < 10; i++) { c.fillStyle = i < Sound.vol ? '#7dff7d' : '#1d4a2a'; c.fillRect(x - 59 + i * 6, 27, 5, 6); }
    }
  }

  Main.go(new Title());
  window.TNQ = { Main, State, Play, Levels, Input, Result, channel, volume };

  let last = performance.now(), acc = 0, knobSync = -1;
  const STEP = 1000 / 60;
  function frame(now) {
    acc += Math.min(100, now - last); last = now;
    while (acc >= STEP) {
      UI.handle(Main.scene);
      Main.scene.update();
      Input.endTick();
      acc -= STEP;
    }
    ctx.setTransform(3, 0, 0, 3, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    Main.scene.draw();
    if (knobSync !== State.last) { knobSync = State.last; turnKnobs(); }
    drawOsd(); syncScene();
    UI.endFrame();
    requestAnimationFrame(frame);
  }
  // пауза при потере фокуса
  addEventListener('blur', () => { const s = Main.scene; if (s instanceof Play && s.mode === 'play') s.mode = 'pause'; });

  const start = () => requestAnimationFrame(t0 => { last = t0; frame(t0); });
  if (document.fonts && document.fonts.load) {
    Promise.race([document.fonts.load('8px "Press Start 2P"'), new Promise(r => setTimeout(r, 1500))]).then(start, start);
  } else start();
})();
