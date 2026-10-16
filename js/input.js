// Клавиатура и мышь. Используем event.code — работает при любой раскладке (в т.ч. русской).
const Input = (() => {
  const MAP = {
    left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'], up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'],
    jump: ['Space', 'ArrowUp', 'KeyW'], attack: ['KeyJ', 'KeyZ'], shield: ['KeyK', 'KeyX'], shoot: ['KeyL', 'KeyC'],
    pause: ['Escape', 'KeyP'], ok: ['Enter', 'NumpadEnter', 'Space'], back: ['Escape', 'Backspace'], mute: ['KeyM'],
  };
  const PREVENT = new Set(Object.values(MAP).flat());
  const down = new Set(), edge = new Set();

  addEventListener('keydown', e => {
    if (PREVENT.has(e.code)) e.preventDefault();
    if (!e.repeat) edge.add(e.code);
    down.add(e.code);
    Sound.init();
  });
  addEventListener('keyup', e => down.delete(e.code));
  addEventListener('blur', () => down.clear());

  const mouse = { x: -1, y: -1, moved: false, click: false };
  function bindCanvas(canvas) {
    const pos = e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (300 / r.width);
      mouse.y = (e.clientY - r.top) * (200 / r.height);
    };
    canvas.addEventListener('pointermove', e => { pos(e); mouse.moved = true; });
    canvas.addEventListener('pointerdown', e => { pos(e); mouse.moved = true; mouse.click = true; Sound.init(); canvas.focus(); });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
  }

  return {
    mouse, bindCanvas,
    press(code) { if (!down.has(code)) edge.add(code); down.add(code); Sound.init(); },
    release(code) { down.delete(code); },
    isDown: a => MAP[a].some(k => down.has(k)),
    pressed: a => MAP[a].some(k => edge.has(k)),
    endTick() { edge.clear(); mouse.click = false; mouse.moved = false; },
  };
})();
