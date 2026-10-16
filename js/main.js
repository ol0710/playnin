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
  function fit() {
    const s = Math.min(innerWidth / (tv.offsetWidth + 30), innerHeight / (tv.offsetHeight + 30), 1.5);
    tv.style.transform = 'scale(' + s + ')';
  }
  addEventListener('resize', fit); fit();

  document.getElementById('knobSound').addEventListener('click', () => { Sound.init(); Sound.toggle(); });
  addEventListener('keydown', e => { if (e.code === 'KeyM' && !e.repeat) { Sound.init(); Sound.toggle(); } });

  Main.go(new Title());
  window.TNQ = { Main, State, Play, Levels, Input, Result };

  let last = performance.now(), acc = 0;
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
