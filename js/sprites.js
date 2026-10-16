// Пиксель-арт: все картинки рисуются из текстовых матриц и кода — внешних файлов нет.
const Sprites = (() => {
  function pad(r) { return (r + '................').slice(0, 16); }
  function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function make(rows, pal, fix) {
    rows = fix ? rows.map(pad) : rows;
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const c = canvas(w, h), x = c.getContext('2d');
    rows.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const col = pal[row[i]];
        if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
      }
    });
    return c;
  }
  function flip(c) {
    const f = canvas(c.width, c.height), x = f.getContext('2d');
    x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0);
    return f;
  }
  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const pair = c => [c, flip(c)]; // [вправо, влево]

  // ---------- Черепашки ----------
  const BODY = [
    '................',
    '.....bbbbbbbb...',
    '....bbbbbbbbbb..',
    '....bbwwbbwwbb..',
    '....bbwkbbwkbb..',
    '....gggggggggg..',
    '.....gggggggg...',
    '...dggggggggggd.',
    '...dgyyyyyyyygd.',
    '...dgyyyyyyyygd.',
    '...dgyyyyyyyygd.',
    '....oooooooooo..',
  ];
  const LEGS = {
    idle: ['.....ggg..ggg...', '.....ggg..ggg...', '.....ggg..ggg...', '....kkkk..kkkk..'],
    run0: ['....ggg....ggg..', '...ggg......ggg.', '...ggg.......gg.', '..kkkk......kkk.'],
    run1: ['.....gg..ggg....', '.....gg...ggg...', '....ggg....ggg..', '....kkk....kkkk.'],
    jump: ['....ggg....ggg..', '.....ggg..ggg...', '.....kkk..kkk...', '................'],
  };
  const BANDANAS = ['#2f6bff', '#ff3b3b', '#a64cff', '#ff9a1f'];
  const turtles = BANDANAS.map(b => {
    const pal = { g: '#4cc24a', d: '#2c8a3a', y: '#d9ec7a', b, w: '#fff', k: '#111', o: '#8b5a2b' };
    const o = {};
    for (const k in LEGS) o[k] = pair(make([...BODY, ...LEGS[k]], pal, true));
    return o;
  });

  // ---------- Враги ----------
  const WALK_PAL = { p: '#5a4a96', q: '#3a2f6a', r: '#d12b2b', w: '#fff', k: '#111' };
  const WALK_TOP = [
    '................', '.....pppppppp...', '....pppppppppp..', '....rrrrrrrrrr..', '....pwkpppwkpp..', '....pppppppppp..',
    '.....pppppppp...', '...ppqqqqqqqqpp.', '..pppqqqqqqqqppp', '..pppqqqqqqqqppp', '...ppqqqqqqqqpp.', '....rrrrrrrrrr..',
  ];
  const walker = [
    ['.....ppp..ppp...', '.....ppp..ppp...', '.....ppp..ppp...', '....kkkk..kkkk..'],
    ['....ppp....ppp..', '...ppp......ppp.', '...ppp......ppp.', '..kkkk......kkkk'],
  ].map(l => pair(make([...WALK_TOP, ...l], WALK_PAL, true)));

  const BAT_PAL = { m: '#b13a9a', v: '#6b2a8a', y: '#ffe14a', k: '#111' };
  const bat = [
    ['v..............v', 'vv....mmmm....vv', 'vvv..mmmmmm..vvv', '.vvvmmymmymmvvv.', '..vvmmmmmmmmvv..', '...vv.mmmm.vv...', '......m..m......'],
    ['................', '................', '......mmmm......', '....mmmmmmmm....', '..vvmmymmymmvv..', '.vvvmmmmmmmmvvv.', 'vvv...m..m...vvv', 'vv............vv'],
  ].map(r => make(r, BAT_PAL, true));

  const shooter = pair(make([
    '................', '......kkkk......', '.....mmmmmm.....', '....mmrrrrmm....', '....mmrrrrmm....', '.....mmmmmm.....',
    '...llmmmmmmll...', '..lllmmyymmlllkk', '..lllmmyymmllkkk', '..lllmmmmmmll...', '...llmmmmmmll...', '....mmmmmmmm....',
    '...kkkkkkkkkk...', '..kllkkkkkkllk..', '..kkkkkkkkkkkk..', '................',
  ], { m: '#8fa1b3', l: '#c5d2de', r: '#ff3b3b', y: '#ffd23f', k: '#222' }, true));

  // ---------- Предметы ----------
  const shell = make([
    '..oooo..', '.odddlo.', 'oddllldo', 'oddllldo', 'odddlddo', 'oddllldo', 'oddllldo', 'odddlddo', 'oddllldo', '.odddlo.', '..oooo..',
  ], { o: '#3b2a14', d: '#8a5a2b', l: '#c98f4a' });
  const heart = make(['.rr.rr.', 'rwrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff3b5c', w: '#ffc0cc' });
  const sword = make(['......ww', '.....www', '....www.', '...www..', 'w.www...', 'ww.w....', '.www....', 'bb.ww...'], { w: '#e8f0ff', b: '#a0622a' });
  const pizza = (() => {
    const c = canvas(16, 16), x = c.getContext('2d');
    for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) {
      const d = Math.hypot(i - 7.5, j - 7.5);
      if (d < 7.6) { x.fillStyle = d > 6 ? '#d9962b' : '#ffcc3d'; x.fillRect(i, j, 1, 1); }
    }
    x.fillStyle = '#d6322b';
    [[5, 5], [10, 5], [7, 9], [4, 10], [11, 10], [8, 3], [7, 12]].forEach(([a, b]) => x.fillRect(a, b, 2, 2));
    return c;
  })();

  // ---------- Тайлы (по зонам: 0 лес, 1 замок, 2 подземелье) ----------
  function noise(x, base, cols, seed, n) {
    x.fillStyle = base; x.fillRect(0, 0, 16, 16);
    const r = rng(seed);
    for (let i = 0; i < n; i++) { x.fillStyle = cols[(r() * cols.length) | 0]; x.fillRect((r() * 16) | 0, (r() * 16) | 0, 1 + ((r() * 2) | 0), 1); }
  }
  function bricks(x, base, mortar, hi) {
    x.fillStyle = base; x.fillRect(0, 0, 16, 16);
    x.fillStyle = mortar;
    for (let row = 0; row < 2; row++) {
      const y = row * 8;
      x.fillRect(0, y + 7, 16, 1);
      const off = row ? 4 : 0;
      x.fillRect((off + 7) % 16, y, 1, 7); x.fillRect((off + 15) % 16, y, 1, 7);
    }
    x.fillStyle = hi; x.fillRect(1, 1, 5, 1); x.fillRect(9, 9, 5, 1);
  }
  function tileSet(zone) {
    const fill = canvas(16, 16), top = canvas(16, 16), plat = canvas(16, 16), spike = canvas(16, 16);
    const f = fill.getContext('2d'), tp = top.getContext('2d'), pl = plat.getContext('2d'), sp = spike.getContext('2d');
    if (zone === 0) {
      noise(f, '#7a4a22', ['#5d3615', '#946033', '#6a3f1c'], 11, 26);
      noise(tp, '#7a4a22', ['#5d3615', '#946033'], 12, 18);
      tp.fillStyle = '#4cb64a'; tp.fillRect(0, 0, 16, 4);
      tp.fillStyle = '#7ddc63'; tp.fillRect(0, 0, 16, 1);
      tp.fillStyle = '#2f8a34'; tp.fillRect(0, 3, 16, 1);
      const r = rng(5); for (let i = 0; i < 6; i++) { tp.fillStyle = '#4cb64a'; tp.fillRect((r() * 16) | 0, 4, 1, 1 + ((r() * 2) | 0)); }
      pl.fillStyle = '#b07a3c'; pl.fillRect(0, 0, 16, 16);
      pl.fillStyle = '#8a5a2b'; pl.fillRect(0, 5, 16, 1); pl.fillRect(0, 10, 16, 1); pl.fillRect(4, 0, 1, 5); pl.fillRect(11, 6, 1, 4);
      pl.fillStyle = '#d9a05a'; pl.fillRect(0, 0, 16, 2); pl.fillStyle = '#5d3a17'; pl.fillRect(0, 14, 16, 2);
    } else if (zone === 1) {
      bricks(f, '#6d6d8a', '#4a4a66', '#8a8aa8');
      bricks(tp, '#6d6d8a', '#4a4a66', '#8a8aa8');
      tp.fillStyle = '#a6a6c4'; tp.fillRect(0, 0, 16, 2); tp.fillStyle = '#c4c4de'; tp.fillRect(0, 0, 16, 1);
      pl.fillStyle = '#8a8aa6'; pl.fillRect(0, 0, 16, 16);
      pl.fillStyle = '#5f5f7c'; pl.fillRect(0, 8, 16, 1); pl.fillRect(0, 14, 16, 2); pl.fillRect(8, 0, 1, 8);
      pl.fillStyle = '#c4c4de'; pl.fillRect(0, 0, 16, 2);
    } else {
      noise(f, '#2d2147', ['#3f2f63', '#1d1530', '#352858'], 21, 28);
      noise(tp, '#2d2147', ['#3f2f63', '#1d1530'], 22, 18);
      tp.fillStyle = '#4b3a7a'; tp.fillRect(0, 0, 16, 3); tp.fillStyle = '#3dd6a0'; tp.fillRect(0, 0, 16, 1);
      const r = rng(8); for (let i = 0; i < 5; i++) { tp.fillStyle = '#3dd6a0'; tp.fillRect((r() * 16) | 0, 3, 1, 1 + ((r() * 2) | 0)); }
      pl.fillStyle = '#4a3a78'; pl.fillRect(0, 0, 16, 16);
      pl.fillStyle = '#2a1f48'; pl.fillRect(0, 8, 16, 1); pl.fillRect(0, 13, 16, 3); pl.fillRect(6, 0, 1, 8);
      pl.fillStyle = '#9a7aff'; pl.fillRect(0, 0, 16, 2);
    }
    // шипы
    sp.fillStyle = '#cfd8e3';
    for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) { const w = j + 1; sp.fillRect(k * 8 + 4 - (w >> 1), 8 + j, w, 1); }
    sp.fillStyle = '#7d8a99'; for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) sp.fillRect(k * 8 + 4 + ((j + 1) >> 1) - 1, 8 + j, 1, 1);
    return { fill, top, plat, spike };
  }
  const tiles = [0, 1, 2].map(tileSet);

  // ---------- Фоны (бесшовные по горизонтали, 300x200) ----------
  const SKY = [
    [['#4aa3e8', '#bfe6ff'], ['#7d6fb8', '#e9b7d0'], ['#1c1233', '#3a2863']],
    [['#e8704a', '#ffd08a'], ['#8a3f7a', '#f08a6a'], ['#2a1030', '#5a2447']],
    [['#0b1a3d', '#27407a'], ['#140f33', '#3a2d6b'], ['#0a0818', '#1d1636']],
    [['#4a1010', '#d2602a'], ['#2d0b1c', '#a8383a'], ['#180606', '#5a1a10']],
  ];
  const skyCache = {};
  function sky(ctx, world, zone) {
    const key = world * 3 + zone;
    if (!skyCache[key]) {
      const g = ctx.createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, SKY[world][zone][0]); g.addColorStop(1, SKY[world][zone][1]);
      skyCache[key] = g;
    }
    return skyCache[key];
  }
  const starList = (() => { const r = rng(77); return Array.from({ length: 45 }, () => [(r() * 300) | 0, (r() * 120) | 0, r() < 0.3 ? 2 : 1]); })();

  function bgLayers(zone) {
    const W = 300, H = 200, far = canvas(W, H), near = canvas(W, H);
    const f = far.getContext('2d'), n = near.getContext('2d'), r = rng(100 + zone);
    const wrap = (fn, x, w) => { fn(x); if (x + w > W) fn(x - W); };
    const wave = (ctx, col, base, a1, k1, a2, k2) => {
      ctx.fillStyle = col;
      for (let x = 0; x < W; x++) {
        const y = Math.round(base + Math.sin(x / W * Math.PI * 2 * k1) * a1 + Math.sin(x / W * Math.PI * 2 * k2 + 1) * a2);
        ctx.fillRect(x, y, 1, H - y);
      }
    };
    if (zone === 0) {
      wave(f, '#5b7fb0', 118, 16, 2, 7, 5);
      f.fillStyle = 'rgba(255,255,255,.85)';
      for (let i = 0; i < 4; i++) { const cx = (r() * W) | 0, cy = 18 + ((r() * 40) | 0); wrap(x => { f.fillRect(x, cy, 26, 5); f.fillRect(x + 5, cy - 4, 14, 5); }, cx, 26); }
      wave(n, '#2f6b3a', 150, 6, 3, 3, 7);
      for (let i = 0; i < 16; i++) {
        const tx = (r() * W) | 0, th = 34 + ((r() * 34) | 0), by = 168;
        wrap(x => {
          n.fillStyle = '#4a2f18'; n.fillRect(x - 1, by - 8, 3, 10);
          for (let j = 0; j < th; j++) { const w = 1 + Math.floor(j * 0.45); n.fillStyle = j % 9 < 2 ? '#1f5a2c' : '#26703a'; n.fillRect(x - (w >> 1), by - th + j - 6, w, 1); }
        }, tx, 20);
      }
    } else if (zone === 1) {
      for (let i = 0; i < 9; i++) {
        const tx = (r() * W) | 0, w = 16 + ((r() * 14) | 0), h = 60 + ((r() * 50) | 0);
        wrap(x => {
          f.fillStyle = '#6f69a0'; f.fillRect(x, 190 - h, w, h);
          for (let c = 0; c < w; c += 6) f.fillRect(x + c, 190 - h - 5, 3, 5);
          f.fillStyle = '#ffd86b'; f.fillRect(x + (w >> 1) - 1, 190 - h + 12, 3, 6);
        }, tx, w);
      }
      for (let i = 0; i < 7; i++) {
        const tx = (r() * W) | 0, w = 14 + ((r() * 8) | 0), h = 40 + ((r() * 40) | 0);
        wrap(x => {
          n.fillStyle = '#4a456f'; n.fillRect(x, 190 - h, w, h);
          n.fillStyle = '#5c5688'; n.fillRect(x, 190 - h, w, 3);
          n.fillStyle = '#251f40'; n.fillRect(x + 4, 190 - h + 14, 4, 10); n.fillRect(x + 4, 190 - h + 12, 4, 2);
        }, tx, w);
      }
    } else {
      for (let i = 0; i < 14; i++) {
        const tx = (r() * W) | 0, h = 20 + ((r() * 55) | 0), w = 8 + ((r() * 10) | 0);
        wrap(x => { f.fillStyle = '#3a2b5e'; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(w * (1 - j / h))); f.fillRect(x - (ww >> 1), j, ww, 1); } }, tx, w);
      }
      for (let i = 0; i < 9; i++) {
        const tx = (r() * W) | 0, h = 25 + ((r() * 50) | 0), w = 12 + ((r() * 10) | 0);
        wrap(x => { n.fillStyle = '#241838'; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(w * (1 - j / h))); n.fillRect(x - (ww >> 1), j, ww, 1); } }, tx, w);
      }
      for (let i = 0; i < 10; i++) {
        const tx = (r() * W) | 0, h = 8 + ((r() * 14) | 0);
        wrap(x => { n.fillStyle = '#3dd6a0'; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(5 * (1 - j / h))); n.fillRect(x - (ww >> 1), 175 - j, ww, 1); } }, tx, 6);
      }
    }
    return { far, near };
  }
  const bgs = [0, 1, 2].map(bgLayers);

  return { turtles, walker, bat, shooter, shell, heart, sword, pizza, tiles, bgs, SKY, sky, starList, canvas, make, rng };
})();

// ---------- Графические помощники (холст 300x200 в масштабе x3) ----------
const Gfx = {
  ctx: null,
  FONT: '"Press Start 2P", monospace',
  text(s, x, y, o = {}) {
    const c = this.ctx, size = o.size || 8;
    c.font = size + 'px ' + this.FONT; c.textBaseline = 'top';
    c.textAlign = o.align || 'left';
    if (o.shadow !== false) { c.fillStyle = o.shadow || '#000'; c.fillText(s, x + 1, y + 1); }
    c.fillStyle = o.color || '#fff'; c.fillText(s, x, y);
  },
  width(s, size = 8) { this.ctx.font = size + 'px ' + this.FONT; return this.ctx.measureText(s).width; },
  wrap(s, maxW, size = 8) {
    const words = s.split(' '), lines = []; let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (this.width(test, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
    }
    if (cur) lines.push(cur);
    return lines;
  },
  box(x, y, w, h, fill, border) { // рамка с «срезанными» углами
    const c = this.ctx;
    c.fillStyle = border; c.fillRect(x + 1, y, w - 2, h); c.fillRect(x, y + 1, w, h - 2);
    c.fillStyle = fill; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  },
  sprite(img, x, y, scale = 1) {
    this.ctx.drawImage(img, Math.round(x), Math.round(y), img.width * scale, img.height * scale);
  },
  coin(x, y, t) {
    const c = this.ctx, w = Math.max(1, Math.round(Math.abs(Math.cos(t)) * 6));
    x = Math.round(x); y = Math.round(y);
    c.fillStyle = '#b8860b'; c.fillRect(x + 3 - (w >> 1) - 1, y, w + 2, 7);
    c.fillStyle = '#ffd23f'; c.fillRect(x + 3 - (w >> 1), y + 1, w, 5);
    if (w > 2) { c.fillStyle = '#fff3a0'; c.fillRect(x + 3 - (w >> 1), y + 1, 1, 3); }
  },
};
