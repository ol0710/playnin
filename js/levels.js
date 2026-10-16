// Генератор уровней: фиксированная карта для каждого номера (сид = номер уровня), 3 зоны на уровень.
const Levels = (() => {
  const T = 16, ROWS = 12, TOTAL = 40;
  // тайлы: 0 воздух, 1 земля, 2 платформа, 3 шипы

  function build(n) {
    const r = Sprites.rng(n * 7919 + 13);
    const ri = (a, b) => a + Math.floor(r() * (b - a + 1));
    const zoneW = 44 + Math.min(16, Math.floor(n / 3));
    const W = zoneW * 3;
    const tiles = Array.from({ length: ROWS }, () => new Uint8Array(W));
    const top = new Array(W).fill(ROWS); // верхняя строка земли в колонке (ROWS = пропасть)
    let gh = ROWS - 3, x = 0;
    const flat = new Array(W).fill(false);
    const pitP = 0.10 + n * 0.004, stepP = 0.28;

    const col = (cx, h) => { top[cx] = h; for (let y = h; y < ROWS; y++) tiles[y][cx] = 1; };

    while (x < W) {
      const safe = x < 8 || x >= W - 12;
      const roll = r();
      const afterPit = x > 0 && top[x - 1] === ROWS;
      if (!safe && roll < pitP && x > 0 && !afterPit) {
        const w = n >= 10 ? ri(2, 3) : 2;
        for (let i = 0; i < w && x < W - 12; i++) { top[x] = ROWS; x++; }
      } else {
        if (!safe && !afterPit && roll < pitP + stepP) gh = Math.max(ROWS - 6, Math.min(ROWS - 2, gh + (r() < 0.5 ? -1 : 1) * ri(1, 2)));
        const len = safe ? Math.min(W - x, x < 8 ? 8 - x : W - x) : ri(3, 8);
        for (let i = 0; i < len && x < W; i++) { col(x, gh); flat[x] = i > 0 && i < len - 1; x++; }
      }
    }
    for (let i = 0; i < W; i++) if (top[i] < ROWS && top[i - 1] === top[i] && top[i + 1] === top[i]) flat[i] = true; else flat[i] = false;

    // шипы на ровных участках (с 4-го уровня)
    if (n >= 4) {
      for (let cx = 14; cx < W - 14; cx++) {
        if (flat[cx] && flat[cx + 1] && flat[cx - 1] && r() < 0.015 + n * 0.0006) { tiles[top[cx] - 1][cx] = 3; if (flat[cx + 2] && r() < 0.5) tiles[top[cx + 1] - 1][cx + 1] = 3; cx += 3; }
      }
    }

    const coins = [], platforms = [];
    // парящие платформы
    for (let cx = 12; cx < W - 14;) {
      if (r() < 0.22) {
        const len = ri(3, 5);
        let mt = ROWS, pitNear = false; for (let i = -3; i < len + 4; i++) { if (top[cx + i] === ROWS) pitNear = true; if (i >= 0 && i < len) mt = Math.min(mt, top[cx + i]); }
        if (mt < ROWS && !pitNear) {
          const p = mt - 3;
          if (p >= 2) {
            let ok = true;
            for (let i = 0; i < len; i++) if (tiles[p][cx + i] || tiles[p - 1][cx + i] === 3) ok = false;
            if (ok) {
              for (let i = 0; i < len; i++) tiles[p][cx + i] = 2;
              platforms.push({ x: cx, y: p, len });
              for (let i = 0; i < len; i++) coins.push({ x: (cx + i) * T + 5, y: p * T - 10 });
              cx += len + 3; continue;
            }
          }
        }
      }
      cx += 2;
    }
    // монеты по земле и дугой над пропастями
    for (let cx = 6; cx < W - 8; cx++) {
      if (top[cx] === ROWS && top[cx - 1] < ROWS) {
        let e = cx; while (e < W && top[e] === ROWS) e++;
        for (let k = 0; k <= e - cx; k++) coins.push({ x: (cx - 0.5 + k) * T + 5, y: top[cx - 1] * T - 24 - Math.sin((k / (e - cx)) * Math.PI) * 14 });
        cx = e;
      } else if (flat[cx] && r() < 0.07) {
        const k = ri(3, 5);
        for (let i = 0; i < k && flat[cx + i]; i++) coins.push({ x: (cx + i) * T + 5, y: top[cx] * T - 12 });
        cx += k;
      }
    }

    // враги по зонам
    const enemies = [];
    const spots = [];
    for (let zi = 0; zi < 3; zi++) {
      const from = zi * zoneW + (zi === 0 ? 12 : 3), to = (zi + 1) * zoneW - (zi === 2 ? 14 : 3);
      const cnt = 3 + Math.floor(n / 5) + zi;
      const types = ['walk'];
      if (zi >= 1 || n >= 3) types.push('fly');
      if (zi === 2 || n >= 6) types.push('shoot');
      let tries = 0, placed = 0;
      while (placed < cnt && tries++ < 200) {
        const cx = ri(from, to);
        if (!(flat[cx] && flat[cx - 1] && flat[cx + 1]) || spots.some(s => Math.abs(s - cx) < 4)) continue;
        const type = types[ri(0, types.length - 1)];
        const fy = top[cx] * T;
        enemies.push({ type, x: cx * T + 2, y: type === 'fly' ? fy - ri(46, 80) : fy });
        spots.push(cx); placed++;
      }
    }
    return { n, W, ROWS, zoneW, tiles, top, enemies, coins, platforms, world: Math.floor((n - 1) / 10), finishX: (W - 5) * T };
  }

  const zoneAt = (L, cx) => Math.max(0, Math.min(2, Math.floor(cx / L.zoneW)));
  return { T, ROWS, TOTAL, build, zoneAt };
})();
