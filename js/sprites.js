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

  // ---------- Вкусности: подбираешь — лечишься ----------
  const foods = (() => {
    const pizza10 = (() => {
      const c = canvas(10, 10), x = c.getContext('2d');
      for (let j = 0; j < 10; j++) for (let i = 0; i < 10; i++) { const d = Math.hypot(i - 4.5, j - 4.5); if (d < 4.9) { x.fillStyle = d > 3.7 ? '#d9962b' : '#ffcc3d'; x.fillRect(i, j, 1, 1); } }
      x.fillStyle = '#d6322b'; [[3, 3], [6, 3], [4, 6], [6, 6]].forEach(([a, b]) => x.fillRect(a, b, 2, 1));
      return c;
    })();
    const F = (rows, pal, heal, name) => ({ img: make(rows, pal), heal, name });
    return [
      { img: pizza10, heal: 8, name: 'pizza' },
      F(['..tttttt..', '.ttsttstt.', '.tttttttt.', 'gggggggggg', 'mmmmmmmmmm', 'yyyyyyyyyy', '.bbbbbbbb.', '..bbbbbb..', '..........', '..........'], { t: '#e0a040', s: '#fff0c0', g: '#4cc24a', m: '#6a3a1e', y: '#ffd23f', b: '#c98a3a' }, 10, 'burger'),
      F(['...dddd...', '..dppppd..', '.dpwppwpd.', '.dpp..ppd.', '.dp....pd.', '.dpp..ppd.', '.dppwppwd.', '..dppppd..', '...dddd...', '..........'], { d: '#c98a3a', p: '#ff6fae', w: '#fff' }, 4, 'donut'),
      F(['...pppp...', '..pppppp..', '.pppwpppp.', '..pppppp..', '..cxcxcx..', '...cxcxc..', '....cxc...', '.....c....', '..........', '..........'], { p: '#ff9ad0', w: '#fff', c: '#e8b060', x: '#b07a3c' }, 5, 'icecream'),
      F(['....ww....', '...wwww...', '..wwwwww..', '.wwwwwwww.', '.wwnnnnww.', 'wwwnnnnwww', 'wwwnnnnwww', 'wwwwwwwwww', '..........', '..........'], { w: '#fff6e0', n: '#1a2a1a' }, 6, 'onigiri'),
      F(['....rr....', '...pppp...', '..pppppp..', '.pppppppp.', '.cccccccc.', '..cwcwcw..', '..cccccc..', '...cccc...', '..........', '..........'], { r: '#ff3b3b', p: '#ff9ad0', c: '#d6322b', w: '#fff' }, 4, 'cupcake'),
    ];
  })();

  // ---------- Враги из мира черепашек ----------
  const LEGS_N = [
    ['.....ppp..ppp...', '.....ppp..ppp...', '.....ppp..ppp...', '....kkkk..kkkk..'],
    ['....ppp....ppp..', '...ppp......ppp.', '...ppp......ppp.', '..kkkk......kkkk'],
  ];
  const ninja = pal => LEGS_N.map(l => pair(make([...WALK_TOP, ...l], pal, true)));
  const walkers = [
    walker,
    null, null,
    ninja({ p: '#8a1f1f', q: '#3a0f0f', r: '#111', w: '#fff', k: '#111' }),
  ];
  const MOUSER_TOP = [
    '................', '................', '....gggggggg....', '...gggggggggg...', '..ggrrggggrrgg..', '..ggrrggggrrgg..',
    '..gggggggggggg..', '..gwwwwwwwwwwg..', '..gkwkwkwkwkwg..', '..gggggggggggg..', '...dgggggggggd..', '....dddddddd....',
  ];
  const MOUSER_LEGS = [
    ['...dd......dd...', '...dd......dd...', '...dd......dd...', '..kkk......kkk..'],
    ['....dd....dd....', '...dd......dd...', '...dd......dd...', '..kkk......kkk..'],
  ];
  const mouser = MOUSER_LEGS.map(l => pair(make([...MOUSER_TOP, ...l], { g: '#9aa5b1', d: '#5f6b78', r: '#ff3b3b', w: '#fff', k: '#222' }, true)));
  walkers[1] = walkers[2] = mouser;

  const DRONE_PAL = { d: '#6b7886', r: '#ff3b3b', e: '#ffe14a', k: '#222' };
  const drone = [
    ['.rrrrr....rrrrr.', '.....kkkkkk.....', '....dddddddd....', '....ddreerdd....', '....dddddddd....', '.....dd..dd.....', '................', '................'],
    ['..rrr......rrr..', '.....kkkkkk.....', '....dddddddd....', '....ddreerdd....', '....dddddddd....', '.....dd..dd.....', '................', '................'],
  ].map(r => make(r, DRONE_PAL, true));
  const bats = [drone, bat, drone, drone];

  // Главарь клана: шипастый шлем, броня, плащ
  const LEADER_TOP = [
    '..k..........k..', '..kk........kk..', '...kkkkkkkkkk...', '...ssssssssss...', '...skrrssrrks...', '...sskkkkkkss...',
    '....ssssssss....', '..cssssssssssc..', '.cccsbbbbbbsccc.', '.cccsbbbbbbsccc.', '.ccc.ssssss.ccc.', '..cc.ssssss.cc..',
  ];
  const LEADER_LEGS = [
    ['.....sss..sss...', '.....sss..sss...', '.....sss..sss...', '....kkkk..kkkk..'],
    ['....sss....sss..', '...sss......sss.', '...sss......sss.', '..kkkk......kkkk'],
  ];
  const leader = LEADER_LEGS.map(l => pair(make([...LEADER_TOP, ...l], { s: '#c5d2de', k: '#222', r: '#ff3b3b', c: '#6a2a9a', b: '#b32a22' }, true)));

  // ---------- Темы локаций: 4 мира x 3 зоны ----------
  const THEMES = [
    [ // Мир 1: город
      { sky: ['#0b1030', '#3a3a8a'], stars: true, t: { type: 'brick', base: '#7a3b2e', acc: '#4f241b', hi: '#a8553f', strip: '#555a66', stripHi: '#8a909c' }, pl: { base: '#6a6f7c', line: '#454955', hi: '#9aa0ae' },
        bg: { kind: 'city', far: '#1c2250', near: '#141a3c', edge: '#2a3270', win: ['#ffd86b', '#ffd86b', '#7be0ff'] } },
      { sky: ['#1a0f2e', '#6b2a6a'], stars: false, t: { type: 'noise', base: '#3a3a44', acc: '#2a2a32', hi: '#4a4a56', strip: '#6a6a78', stripHi: '#9a9aae' }, pl: { base: '#5a4a6a', line: '#3a2f4a', hi: '#8a7aa0' },
        bg: { kind: 'city', far: '#2a1040', near: '#1c0b2e', edge: '#4a2070', win: ['#ffd86b', '#ff7ad9'], neon: ['#ff3ea5', '#3ee8ff', '#9dff3e'] } },
      { sky: ['#3a1d12', '#6a3a20'], stars: false, t: { type: 'check', base: '#e8e0cc', acc: '#c0302a', hi: '#fff', strip: '#fff6dd', stripHi: '#ffffff' }, pl: { base: '#b07a3c', line: '#8a5a2b', hi: '#d9a05a' },
        bg: { kind: 'pizzeria', far: '#7a3a22', stripe: '#8a4429', band: '#4a2a1a' } },
    ],
    [ // Мир 2: канализация
      { sky: ['#16241c', '#2e4a3a'], stars: false, t: { type: 'brick', base: '#5a6b52', acc: '#3b4a36', hi: '#7e9374', strip: '#3fa05a', stripHi: '#7aff5a' }, pl: { base: '#6b7a5a', line: '#46543a', hi: '#9ab08a' },
        bg: { kind: 'pipes', far: '#3a4a38', mortar: '#2a3628', dark: '#1a2418', pipe: '#6b7a5a', pipeHi: '#8da07a', drip: '#7aff5a' } },
      { sky: ['#0e1a1a', '#1e3a3a'], stars: false, t: { type: 'brick', base: '#4a5a60', acc: '#2f3b40', hi: '#6a7f87', strip: '#2a9fa0', stripHi: '#6af0f0' }, pl: { base: '#5a7a85', line: '#3a525c', hi: '#8fc0cc' },
        bg: { kind: 'pipes', far: '#2c3f45', mortar: '#1f2e33', dark: '#101b1f', pipe: '#4f7f8a', pipeHi: '#7fc0cc', drip: '#4ae8ff' } },
      { sky: ['#0a1a0a', '#1c4a1c'], stars: false, t: { type: 'noise', base: '#2d3a22', acc: '#1d2815', hi: '#445a30', strip: '#5ad13a', stripHi: '#9aff6a' }, pl: { base: '#4a6a32', line: '#2f4620', hi: '#8ad05a' },
        bg: { kind: 'cave', far: '#1f3a1c', near: '#142a14', glow: '#7aff3a' } },
    ],
    [ // Мир 3: логово врагов
      { sky: ['#1b2a4a', '#d8905a'], stars: false, t: { type: 'wood', base: '#7a5a38', acc: '#4f3a22', hi: '#a8824f', strip: '#8a8f99', stripHi: '#c0c6d0' }, pl: { base: '#8a8f99', line: '#5a606c', hi: '#c0c6d0' },
        bg: { kind: 'crates', far: '#34406a', crate: '#a8742f', crateDark: '#6a4a1e', win: ['#ffd86b'] } },
      { sky: ['#0b2030', '#1d5a6a'], stars: false, t: { type: 'metal', base: '#6a7f90', acc: '#3f5160', hi: '#a8bccb', strip: '#5fcff0', stripHi: '#b8f0ff' }, pl: { base: '#7a95a8', line: '#4a6070', hi: '#c0e0f0' },
        bg: { kind: 'tech', far: '#12303c', line: '#1b4a5a', light: '#7be0ff', pipe: '#3a5f6e', pipeHi: '#9fd8e8' } },
      { sky: ['#200808', '#6a1a1a'], stars: false, t: { type: 'metal', base: '#5a4a52', acc: '#33262e', hi: '#8a7480', strip: '#ff4a3a', stripHi: '#ffa08a' }, pl: { base: '#7a5a64', line: '#4a343c', hi: '#c08a96' },
        bg: { kind: 'tech', far: '#2e1218', line: '#4a1c26', light: '#ff4a3a', pipe: '#6a3a44', pipeHi: '#c07a86' } },
    ],
    [ // Мир 4: остров додзё
      { sky: ['#7ac0a0', '#e8f4c0'], stars: false, t: { type: 'noise', base: '#6a4a2a', acc: '#4f3418', hi: '#8a6538', strip: '#4cb64a', stripHi: '#7ddc63' }, pl: { base: '#b07a3c', line: '#8a5a2b', hi: '#d9a05a' },
        bg: { kind: 'bamboo', far: '#9fd0a8', stalkFar: '#6faa80', stalk: '#2f8a45', stalkHi: '#5fc070', node: '#1f5a2e', leaf: '#3fa858' } },
      { sky: ['#f0a060', '#ffe0a0'], stars: false, t: { type: 'wood', base: '#8a2a22', acc: '#5a1a14', hi: '#c04a38', strip: '#e8c060', stripHi: '#fff0a0' }, pl: { base: '#b33a2e', line: '#6a1f18', hi: '#e8c060' },
        bg: { kind: 'pagoda', far: '#c88a6a', wall: '#e8d2a0', roof: '#b32a22', gold: '#ffd23f' } },
      { sky: ['#2a0808', '#ff6a2a'], stars: false, t: { type: 'noise', base: '#2a1a18', acc: '#4a2a22', hi: '#1a0f0e', strip: '#ff7a2a', stripHi: '#ffd23f' }, pl: { base: '#5a3a30', line: '#2a1a16', hi: '#ff7a2a' },
        bg: { kind: 'volcano', far: '#3a1410', near: '#1c0a08', glow: '#ff7a2a' } },
    ],
  ];

  // ---------- Тайлы ----------
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
  function tileSet(th, seed) {
    const T_ = th.t, fill = canvas(16, 16), top = canvas(16, 16), plat = canvas(16, 16), spike = canvas(16, 16);
    const f = fill.getContext('2d'), tp = top.getContext('2d'), pl = plat.getContext('2d'), sp = spike.getContext('2d');
    const paint = x => {
      if (T_.type === 'brick') bricks(x, T_.base, T_.acc, T_.hi);
      else if (T_.type === 'noise') noise(x, T_.base, [T_.acc, T_.hi], seed, 26);
      else if (T_.type === 'check') { for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { x.fillStyle = (i + j) % 2 ? T_.acc : T_.base; x.fillRect(i * 8, j * 8, 8, 8); } }
      else if (T_.type === 'metal') {
        x.fillStyle = T_.base; x.fillRect(0, 0, 16, 16); x.fillStyle = T_.acc; x.fillRect(0, 7, 16, 2); x.fillRect(7, 0, 2, 16);
        x.fillStyle = T_.hi; [[1, 1], [13, 1], [1, 13], [13, 13]].forEach(([a, b]) => x.fillRect(a, b, 2, 2));
      } else {
        x.fillStyle = T_.base; x.fillRect(0, 0, 16, 16); x.fillStyle = T_.acc; x.fillRect(0, 5, 16, 1); x.fillRect(0, 10, 16, 1); x.fillRect(5, 0, 1, 5); x.fillRect(11, 6, 1, 4);
        x.fillStyle = T_.hi; x.fillRect(0, 0, 16, 1);
      }
    };
    paint(f); paint(tp);
    tp.fillStyle = T_.strip; tp.fillRect(0, 0, 16, 4);
    tp.fillStyle = T_.stripHi; tp.fillRect(0, 0, 16, 1);
    tp.fillStyle = 'rgba(0,0,0,.25)'; tp.fillRect(0, 3, 16, 1);
    const r = rng(seed + 3); for (let i = 0; i < 5; i++) { tp.fillStyle = T_.strip; tp.fillRect((r() * 16) | 0, 4, 1, 1 + ((r() * 2) | 0)); }
    pl.fillStyle = th.pl.base; pl.fillRect(0, 0, 16, 16);
    pl.fillStyle = th.pl.line; pl.fillRect(0, 8, 16, 1); pl.fillRect(0, 14, 16, 2); pl.fillRect(8, 0, 1, 8);
    pl.fillStyle = th.pl.hi; pl.fillRect(0, 0, 16, 2);
    sp.fillStyle = '#cfd8e3';
    for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) { const w = j + 1; sp.fillRect(k * 8 + 4 - (w >> 1), 8 + j, w, 1); }
    sp.fillStyle = '#7d8a99'; for (let k = 0; k < 2; k++) for (let j = 0; j < 8; j++) sp.fillRect(k * 8 + 4 + ((j + 1) >> 1) - 1, 8 + j, 1, 1);
    return { fill, top, plat, spike };
  }
  const tiles = THEMES.map((w, wi) => w.map((th, zi) => tileSet(th, 11 + wi * 17 + zi * 5)));

  // ---------- Небо ----------
  const skyCache = {};
  function sky(ctx, world, zone) {
    const key = world * 3 + zone;
    if (!skyCache[key]) {
      const g = ctx.createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, THEMES[world][zone].sky[0]); g.addColorStop(1, THEMES[world][zone].sky[1]);
      skyCache[key] = g;
    }
    return skyCache[key];
  }
  const starList = (() => { const r = rng(77); return Array.from({ length: 45 }, () => [(r() * 300) | 0, (r() * 120) | 0, r() < 0.3 ? 2 : 1]); })();

  // ---------- Фоны (бесшовные по горизонтали, 300x200) ----------
  function bgLayers(th, seed) {
    const W = 300, H = 200, far = canvas(W, H), near = canvas(W, H);
    const f = far.getContext('2d'), n = near.getContext('2d'), r = rng(seed), b = th.bg;
    const ri = (a, c) => a + Math.floor(r() * (c - a + 1));
    const wrap = (fn, x, w) => { fn(x); if (x + w > W) fn(x - W); };
    const wave = (ctx, col, base, a1, k1, a2, k2) => {
      ctx.fillStyle = col;
      for (let x = 0; x < W; x++) {
        const y = Math.round(base + Math.sin(x / W * Math.PI * 2 * k1) * a1 + Math.sin(x / W * Math.PI * 2 * k2 + 1) * a2);
        ctx.fillRect(x, y, 1, H - y);
      }
    };
    const windows = (ctx, x, y, w, h, cols) => {
      for (let wy = y + 4; wy < y + h - 4; wy += 7) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < 0.35) { ctx.fillStyle = cols[ri(0, cols.length - 1)]; ctx.fillRect(wx, wy, 2, 3); }
    };
    const tri = (ctx, cx, base, h, w, col) => { ctx.fillStyle = col; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(w * (j / h))); ctx.fillRect(cx - (ww >> 1), base - h + j, ww, 1); } };
    const hang = (ctx, cx, h, w, col) => { ctx.fillStyle = col; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(w * (1 - j / h))); ctx.fillRect(cx - (ww >> 1), j, ww, 1); } };

    switch (b.kind) {
      case 'city':
        for (let i = 0; i < 9; i++) { const x = ri(0, W - 1), w = ri(16, 30), h = ri(60, 110); wrap(xx => { f.fillStyle = b.far; f.fillRect(xx, 190 - h, w, h); windows(f, xx, 190 - h, w, h, b.win); }, x, w); }
        for (let i = 0; i < 7; i++) {
          const x = ri(0, W - 1), w = ri(16, 26), h = ri(40, 80), k = r();
          wrap(xx => {
            n.fillStyle = b.near; n.fillRect(xx, 190 - h, w, h); n.fillStyle = b.edge; n.fillRect(xx, 190 - h, w, 2);
            if (k < 0.35) { n.fillStyle = '#2a2018'; n.fillRect(xx + 4, 190 - h - 8, 2, 8); n.fillRect(xx + w - 6, 190 - h - 8, 2, 8); n.fillStyle = '#4a3a28'; n.fillRect(xx + 2, 190 - h - 18, w - 4, 10); n.fillStyle = '#6a5238'; n.fillRect(xx + 2, 190 - h - 18, w - 4, 2); }
            else if (k < 0.7) { n.fillStyle = b.edge; n.fillRect(xx + (w >> 1), 190 - h - 14, 1, 14); n.fillStyle = '#ff3b3b'; n.fillRect(xx + (w >> 1) - 1, 190 - h - 16, 3, 2); }
            if (b.neon) { n.fillStyle = b.neon[ri(0, b.neon.length - 1)]; n.fillRect(xx + 3, 190 - h + 10, w - 6, 6); n.fillStyle = 'rgba(255,255,255,.6)'; n.fillRect(xx + 4, 190 - h + 11, w - 8, 1); }
            else windows(n, xx, 190 - h, w, h, b.win);
          }, x, w);
        }
        break;
      case 'pizzeria':
        f.fillStyle = b.far; f.fillRect(0, 0, W, H);
        f.fillStyle = b.stripe; for (let x = 0; x < W; x += 12) f.fillRect(x, 0, 6, H);
        f.fillStyle = b.band; f.fillRect(0, 120, W, 80); f.fillStyle = '#1a0e08'; f.fillRect(0, 120, W, 2);
        for (let i = 0; i < 5; i++) {
          const x = i * 60 + 20;
          f.fillStyle = '#2a1a10'; f.fillRect(x - 1, 41, 22, 28); f.fillStyle = '#ffe9b0'; f.fillRect(x, 42, 20, 26);
          f.fillStyle = '#d9962b'; f.fillRect(x + 4, 47, 12, 12); f.fillStyle = '#ffcc3d'; f.fillRect(x + 5, 48, 10, 10);
          f.fillStyle = '#d6322b'; f.fillRect(x + 7, 50, 2, 2); f.fillRect(x + 11, 53, 2, 2); f.fillRect(x + 8, 55, 2, 2);
        }
        for (let i = 0; i < 5; i++) {
          const x = i * 60 + 30, l = 22 + (i % 2) * 8;
          n.fillStyle = '#111'; n.fillRect(x, 0, 1, l); n.fillStyle = '#ffd86b'; n.fillRect(x - 5, l, 11, 5);
          n.fillStyle = 'rgba(255,216,107,.18)'; n.fillRect(x - 14, l + 5, 29, 30);
        }
        break;
      case 'pipes':
        f.fillStyle = b.far; f.fillRect(0, 0, W, H);
        f.fillStyle = b.mortar; for (let y = 0; y < H; y += 10) { f.fillRect(0, y, W, 1); for (let x = ((y / 10) % 2) * 10; x < W; x += 20) f.fillRect(x, y, 1, 10); }
        for (let i = 0; i < 5; i++) { const x = i * 60 + 15; f.fillStyle = b.dark; f.fillRect(x, 70, 30, 130); f.fillRect(x + 3, 64, 24, 6); f.fillRect(x + 7, 60, 16, 4); }
        for (const y of [30, 62]) {
          n.fillStyle = b.pipe; n.fillRect(0, y, W, 9); n.fillStyle = b.pipeHi; n.fillRect(0, y + 1, W, 2); n.fillStyle = 'rgba(0,0,0,.35)'; n.fillRect(0, y + 7, W, 2);
          for (let x = 20; x < W; x += 60) { n.fillStyle = b.pipeHi; n.fillRect(x, y - 2, 5, 13); }
        }
        for (let i = 0; i < 10; i++) { const x = ri(0, W - 1), y0 = ri(0, 1) ? 39 : 71, len = ri(8, 28); n.fillStyle = b.drip; n.fillRect(x, y0, 1, len); n.fillRect(x, y0 + len, 1, 2); }
        break;
      case 'cave':
        for (let i = 0; i < 14; i++) wrap(xx => hang(f, xx, ri(20, 75), ri(8, 18), b.far), ri(0, W - 1), 18);
        for (let i = 0; i < 9; i++) wrap(xx => hang(n, xx, ri(25, 75), ri(12, 22), b.near), ri(0, W - 1), 22);
        for (let i = 0; i < 10; i++) { const x = ri(0, W - 1), h = ri(8, 22); wrap(xx => { n.fillStyle = b.glow; for (let j = 0; j < h; j++) { const ww = Math.max(1, Math.round(5 * (1 - j / h))); n.fillRect(xx - (ww >> 1), 175 - j, ww, 1); } }, x, 6); }
        break;
      case 'tech':
        f.fillStyle = b.far; f.fillRect(0, 0, W, H);
        f.fillStyle = b.line; for (let x = 0; x < W; x += 20) f.fillRect(x, 0, 1, H); for (let y = 0; y < H; y += 20) f.fillRect(0, y, W, 1);
        for (let i = 0; i < 22; i++) { f.fillStyle = b.light; f.fillRect(ri(0, 14) * 20 + 8, ri(0, 9) * 20 + 8, 3, 3); }
        for (let i = 0; i < 8; i++) {
          const x = ri(0, W - 1), ly = ri(10, 150);
          wrap(xx => { n.fillStyle = b.pipe; n.fillRect(xx, 0, 8, H); n.fillStyle = b.pipeHi; n.fillRect(xx + 1, 0, 2, H); for (let y = 10; y < H; y += 32) { n.fillStyle = b.pipeHi; n.fillRect(xx - 1, y, 10, 3); } n.fillStyle = b.light; n.fillRect(xx + 3, ly, 2, 2); }, x, 8);
        }
        break;
      case 'crates':
        for (let i = 0; i < 6; i++) { const x = i * 50, h = ri(60, 100); f.fillStyle = b.far; f.fillRect(x, 190 - h, 44, h); windows(f, x, 190 - h, 44, h, b.win); }
        f.fillStyle = b.far; for (let i = 0; i < 3; i++) { const x = ri(10, 290); f.fillRect(x, 40, 2, 150); f.fillRect(x, 40, 30, 2); f.fillRect(x + 28, 40, 1, 14); }
        for (let i = 0; i < 12; i++) {
          const x = ri(0, W - 1), st = ri(1, 3);
          wrap(xx => {
            for (let k = 0; k < st; k++) {
              const y = 190 - (k + 1) * 18;
              n.fillStyle = b.crate; n.fillRect(xx, y, 18, 18); n.fillStyle = b.crateDark; n.fillRect(xx, y, 18, 2); n.fillRect(xx, y + 16, 18, 2); n.fillRect(xx, y, 2, 18); n.fillRect(xx + 16, y, 2, 18);
              for (let d = 0; d < 14; d++) n.fillRect(xx + 2 + d, y + 2 + d, 1, 1);
            }
          }, x, 18);
        }
        break;
      case 'bamboo':
        wave(f, b.far, 120, 14, 2, 6, 5);
        for (let i = 0; i < 22; i++) { f.fillStyle = b.stalkFar; f.fillRect(ri(0, W - 1), 0, 2, H); }
        f.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 3; i++) f.fillRect(0, ri(90, 160), W, 10);
        for (let i = 0; i < 14; i++) {
          const x = ri(0, W - 1), y1 = ri(30, 120), y2 = ri(30, 120), o = ri(8, 20);
          wrap(xx => {
            n.fillStyle = b.stalk; n.fillRect(xx, 0, 4, H); n.fillStyle = b.stalkHi; n.fillRect(xx, 0, 1, H);
            n.fillStyle = b.node; for (let y = o; y < H; y += 24) n.fillRect(xx - 1, y, 6, 2);
            n.fillStyle = b.leaf; n.fillRect(xx + 4, y1, 10, 2); n.fillRect(xx - 10, y2, 10, 2);
          }, x, 14);
        }
        break;
      case 'pagoda':
        wave(f, b.far, 110, 20, 2, 8, 4);
        for (let i = 0; i < 3; i++) {
          const x = i * 100 + ri(0, 30);
          wrap(xx => {
            for (let tier = 0; tier < 3; tier++) {
              const y = 190 - (tier + 1) * 26, w = 44 - tier * 10, ox = xx + (44 - w) / 2;
              n.fillStyle = b.wall; n.fillRect(ox + 4, y + 10, w - 8, 16);
              n.fillStyle = '#2a0a08'; n.fillRect(ox + (w >> 1) - 2, y + 13, 4, 8);
              n.fillStyle = b.roof; n.fillRect(ox - 4, y + 6, w + 8, 4); n.fillRect(ox, y + 2, w, 4);
              n.fillStyle = b.gold; n.fillRect(ox - 4, y + 9, w + 8, 1);
            }
            n.fillStyle = b.gold; n.fillRect(xx + 21, 190 - 3 * 26 - 8, 2, 8);
          }, x, 52);
        }
        break;
      case 'volcano':
        for (let i = 0; i < 5; i++) { const x = i * 70 + ri(0, 20), h = ri(70, 120), w = ri(80, 110); wrap(xx => { tri(f, xx, 190, h, w, b.far); f.fillStyle = b.glow; f.fillRect(xx - 3, 190 - h, 6, 3); }, x, w); }
        for (let i = 0; i < 16; i++) { f.fillStyle = b.glow; f.fillRect(ri(0, W - 1), ri(10, 100), 1, 1); }
        for (let i = 0; i < 12; i++) { const x = ri(0, W - 1), h = ri(15, 45), w = ri(10, 22); wrap(xx => tri(n, xx, 196, h, w, b.near), x, w); }
        for (let i = 0; i < 8; i++) { n.fillStyle = b.glow; n.fillRect(ri(0, W - 12), ri(170, 196), ri(4, 10), 1); }
        break;
    }
    return { far, near };
  }
  const bgs = THEMES.map((w, wi) => w.map((th, zi) => bgLayers(th, 100 + wi * 31 + zi * 7)));

  return { turtles, walkers, bats, leader, shooter, shell, heart, sword, pizza, foods, tiles, bgs, THEMES, sky, starList, canvas, make, rng };
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
