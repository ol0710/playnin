// Игровой процесс: состояние игрока, физика, герой, враги, бой.
const T = Levels.T, VW = 300, VH = 200, OY = 8;
const GRAV = 0.35, MAXFALL = 7, JUMP = -6.5;

// Состояние сессии (прогресс специально НЕ сохраняется — по ТЗ)
const State = {
  hero: 0, coins: 0, unlocked: 1, upg: { atk: 0, def: 0, hp: 0 }, MAXLVL: 10,
  reset() { this.coins = 0; this.unlocked = 1; this.upg = { atk: 0, def: 0, hp: 0 }; },
  stats() {
    const u = this.upg;
    return { maxHp: 20 + 5 * u.hp, sword: 2 + u.atk, star: 1 + Math.floor(u.atk * 0.7), defPct: u.def * 6 };
  },
  cost(k) { return 12 + 10 * this.upg[k]; },
  buy(k) {
    if (this.upg[k] >= this.MAXLVL) return false;
    const c = this.cost(k);
    if (this.coins < c) return false;
    this.coins -= c; this.upg[k]++; return true;
  },
};

function solid(L, tx, ty) {
  if (tx < 0 || tx >= L.W) return true;
  if (ty < 0 || ty >= L.ROWS) return false;
  const v = L.tiles[ty][tx];
  return v === 1 || v === 2;
}
function moveX(e, L) {
  e.hitWall = false;
  e.x += e.vx;
  const y0 = Math.floor(e.y / T), y1 = Math.floor((e.y + e.h - 0.01) / T);
  if (e.vx > 0) {
    const tx = Math.floor((e.x + e.w - 0.01) / T);
    for (let ty = y0; ty <= y1; ty++) if (solid(L, tx, ty)) { e.x = tx * T - e.w; e.vx = 0; e.hitWall = true; break; }
  } else if (e.vx < 0) {
    const tx = Math.floor(e.x / T);
    for (let ty = y0; ty <= y1; ty++) if (solid(L, tx, ty)) { e.x = (tx + 1) * T; e.vx = 0; e.hitWall = true; break; }
  }
}
function moveY(e, L) {
  e.y += e.vy; e.onGround = false;
  const x0 = Math.floor(e.x / T), x1 = Math.floor((e.x + e.w - 0.01) / T);
  if (e.vy > 0) {
    const ty = Math.floor((e.y + e.h) / T);
    for (let tx = x0; tx <= x1; tx++) if (solid(L, tx, ty)) { e.y = ty * T - e.h; e.vy = 0; e.onGround = true; break; }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y / T);
    for (let tx = x0; tx <= x1; tx++) if (solid(L, tx, ty)) { e.y = (ty + 1) * T; e.vy = 0; break; }
  }
}
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function mkEnemy(s, n) {
  const spd = 0.45 + n * 0.006;
  if (s.type === 'boss') { const hp = 22 + Math.floor(n * 1.2); return { type: 'boss', x: s.x, y: s.y - 40, w: 24, h: 40, vx: 0, vy: 0, hp, maxHp: hp, dir: -1, spd: 0.55, cd: 90, kb: 0, flash: 0, t: 0, dead: false, onGround: false }; }
  if (s.type === 'fly') return { type: 'fly', x: s.x, y: s.y, by: s.y, w: 12, h: 8, vx: 0, vy: 0, hp: 2 + Math.floor(n * 0.4), dir: Math.random() < 0.5 ? 1 : -1, spd: 0.4 + n * 0.005, ph: Math.random() * 6, kb: 0, kvx: 0, flash: 0, t: 0, dead: false };
  return { type: s.type, x: s.x, y: s.y - 14, w: 12, h: 14, vx: 0, vy: 0, hp: 3 + Math.floor(n * 0.5), dir: Math.random() < 0.5 ? 1 : -1, spd, cd: 60 + Math.random() * 60, kb: 0, flash: 0, t: 0, dead: false, onGround: false };
}

class Play {
  constructor(n) {
    this.n = n; State.last = n; const L = this.L = Levels.build(n);
    const st = this.st = State.stats();
    const sy = L.top[1] * T - 18;
    this.p = { x: 24, y: sy, w: 12, h: 18, vx: 0, vy: 0, face: 1, onGround: true, hp: st.maxHp, inv: 0, grace: 0, atk: 0, atkCd: 0, shotCd: 0, shield: false, coyote: 0, jumpBuf: 0, anim: 0, hit: new Set(), safe: { x: 24, y: sy } };
    this.cam = 0; this.t = 0; this.got = 0; this.mode = 'play'; this.dieT = 0; this.shake = 0;
    this.enemies = L.enemies.map(e => mkEnemy(e, n));
    this.pick = L.coins.map(c => ({ x: c.x, y: c.y, w: 6, h: 7, taken: false, ph: Math.random() * 6 }));
    this.foods = L.foods.map(f => ({ x: f.x, y: f.y, w: 10, h: 10, k: f.k, taken: false, ph: Math.random() * 6 }));
    this.isBoss = n % 10 === 0; this.praiseT = 0; this.warn = 0;
    this.drops = []; this.bullets = []; this.stars = []; this.parts = []; this.texts = [];
    this.zone = 0; this.banner = { t: 140, text: t('zone', 1, t('w' + L.world + 'z0')) };
    this.bgPrev = -1; this.bgFade = 0;
    this.dmgContact = 2 + Math.floor(n * 0.25);
    this.dmgBullet = 2 + Math.floor(n * 0.2);
    Sound.music('play');
  }

  // ---------- вспомогательное ----------
  puff(x, y, col, n = 6) {
    for (let i = 0; i < n; i++) this.parts.push({ x, y, vx: (Math.random() - 0.5) * 2.4, vy: -Math.random() * 2 - 0.3, life: 20 + Math.random() * 14, col, s: 1 + (Math.random() * 2 | 0) });
  }
  say(x, y, s, col = '#fff') { this.texts.push({ x, y, s, col, life: 40 }); }
  addFood(x, y) { const k = Math.floor(Math.random() * Sprites.foods.length); this.drops.push({ x, y, w: 10, h: 10, vx: (Math.random() - 0.5) * 1.6, vy: -3, onGround: false, ph: Math.random() * 6, food: k }); }
  eat(k) {
    const f = Sprites.foods[k], p = this.p;
    p.hp = Math.min(this.st.maxHp, p.hp + f.heal);
    Sound.sfx('eat'); this.puff(p.x + 5, p.y + 4, '#7dff7d', 6); this.say(p.x, p.y - 6, '+' + f.heal, '#7dff7d');
  }
  addCoin(x, y) { this.drops.push({ x, y, w: 6, h: 6, vx: (Math.random() - 0.5) * 2, vy: -2.5 - Math.random() * 1.5, onGround: false, ph: Math.random() * 6 }); }

  hurtPlayer(dmg, srcX, kind) {
    const p = this.p;
    if (p.inv > 0 || this.mode !== 'play') return false;
    const dirToSrc = Math.sign(srcX - (p.x + p.w / 2)) || 1;
    if (p.shield && dirToSrc === p.face && kind !== 'spike' && kind !== 'pit') { Sound.sfx('block'); this.puff(p.x + (p.face > 0 ? p.w + 3 : -3), p.y + 7, '#ffe14a', 5); p.vx = -dirToSrc * 1.2; p.inv = 10; return 'blocked'; }
    dmg = Math.max(1, Math.round(dmg * (1 - this.st.defPct / 100)));
    p.hp -= dmg; p.inv = 70; p.vx = -dirToSrc * 2.4; p.vy = -3; p.onGround = false;
    this.shake = 8; Sound.sfx('hurt'); this.say(p.x, p.y - 6, '-' + dmg, '#ff5c5c');
    if (p.hp <= 0) { p.hp = 0; this.mode = 'dying'; this.dieT = 80; p.vy = -4.5; Sound.sfx('die'); Sound.music(null); }
    return true;
  }

  hurtEnemy(e, dmg, fromX) {
    const big = e.type === 'boss';
    e.hp -= dmg; e.flash = 8; e.kb = big ? 4 : 12;
    const d = (e.x + e.w / 2 < fromX) ? -1 : 1;
    e.vx = d * (big ? 0.8 : 2.2); e.kvx = e.vx;
    this.say(e.x, e.y - 6, String(dmg));
    this.puff(e.x + e.w / 2, e.y + e.h / 2, '#fff', 5);
    if (e.hp <= 0) {
      e.dead = true; Sound.sfx('kill');
      this.puff(e.x + e.w / 2, e.y + e.h / 2, e.type === 'shoot' ? '#8fa1b3' : '#b13a9a', 14);
      const k = big ? 12 : 1 + (Math.random() * 3 | 0);
      for (let i = 0; i < k; i++) this.addCoin(e.x + e.w / 2 - 3, e.y);
      if (big) { this.addFood(e.x, e.y); this.addFood(e.x + 10, e.y); this.shake = 14; }
      else if (Math.random() < 0.12) this.addFood(e.x + e.w / 2 - 5, e.y);
    } else Sound.sfx('hit');
  }

  // ---------- обновление ----------
  update() {
    if (this.mode === 'pause') {
      if (Input.pressed('pause')) this.mode = 'play';
      return;
    }
    if (this.mode === 'play' && Input.pressed('pause')) { this.mode = 'pause'; return; }
    if (this.mode === 'won') return;
    if (this.mode === 'praise') {
      this.t++; this.praiseT++;
      const p = this.p, L = this.L;
      p.vx = 0; p.vy = Math.min(p.vy + GRAV, MAXFALL); moveY(p, L); p.face = 1;
      this.cam += (Math.max(0, Math.min(L.W * T - VW, p.x + p.w / 2 - VW / 2)) - this.cam) * 0.12;
      if (this.praiseT === 2) this.puff(L.finishX + 56, L.top[L.W - 3] * T - 24, '#8a7aa8', 18);
      this.updateFx();
      if (this.praiseT >= 260 || (this.praiseT > 50 && Input.pressed('ok'))) this.win();
      return;
    }
    this.t++;
    const L = this.L, p = this.p;

    if (this.mode === 'dying') {
      p.vy = Math.min(p.vy + GRAV, MAXFALL); p.y += p.vy;
      if (--this.dieT <= 0) Main.go(new GameOver(this.n));
      this.updateFx();
      return;
    }

    // --- управление ---
    const l = Input.isDown('left'), r = Input.isDown('right');
    p.shield = Input.isDown('shield');
    const dir = (r ? 1 : 0) - (l ? 1 : 0);
    const speed = p.shield ? 0.6 : 1.6;
    if (dir) p.face = dir;
    const target = dir * speed, acc = p.onGround ? 0.3 : 0.2;
    if (p.vx < target) p.vx = Math.min(target, p.vx + acc); else if (p.vx > target) p.vx = Math.max(target, p.vx - acc);

    if (Input.pressed('jump')) p.jumpBuf = 6;
    p.coyote = p.onGround ? 5 : p.coyote - 1;
    if (p.jumpBuf > 0 && p.coyote > 0) { p.vy = JUMP; p.jumpBuf = 0; p.coyote = 0; p.onGround = false; Sound.sfx('jump'); }
    p.jumpBuf--;
    if (p.vy < -3 && !Input.isDown('jump') && !Input.isDown('up')) p.vy = -3;

    if (Input.pressed('attack') && p.atkCd <= 0 && !p.shield) { p.atk = 12; p.atkCd = 18; p.hit.clear(); Sound.sfx('slash'); }
    if (Input.pressed('shoot') && p.shotCd <= 0 && !p.shield) {
      p.shotCd = 22; Sound.sfx('star');
      this.stars.push({ x: p.x + p.w / 2 + p.face * 6, y: p.y + 6, w: 6, h: 6, vx: p.face * 3.4, life: 70, rot: 0 });
    }
    if (p.atk > 0) p.atk--; if (p.atkCd > 0) p.atkCd--; if (p.shotCd > 0) p.shotCd--;
    if (p.inv > 0) p.inv--; if (p.grace > 0) p.grace--;

    // --- физика ---
    p.vy = Math.min(p.vy + GRAV, MAXFALL);
    moveX(p, L); moveY(p, L);
    p.anim += Math.abs(p.vx) * 0.12;
    if (p.onGround) {
      const by = Math.floor((p.y + p.h + 1) / T);
      if (solid(L, Math.floor((p.x - 4) / T), by) && solid(L, Math.floor((p.x + p.w + 4) / T), by) && p.inv <= 0) p.safe = { x: p.x, y: p.y };
    }
    if (p.y > L.ROWS * T + 24) { // упал в пропасть
      p.inv = 0; this.hurtPlayer(this.dmgContact + 1, p.x, 'pit');
      if (this.mode === 'play') { p.x = p.safe.x; p.y = p.safe.y; p.vx = 0; p.vy = 0; p.inv = 70; }
    }
    // шипы
    if (p.inv <= 0) {
      const x0 = Math.floor((p.x + 2) / T), x1 = Math.floor((p.x + p.w - 2) / T), ty = Math.floor((p.y + p.h - 3) / T);
      for (let tx = x0; tx <= x1; tx++) if (L.tiles[ty] && L.tiles[ty][tx] === 3 && p.y + p.h > ty * T + 8) { this.hurtPlayer(this.dmgContact, tx * T + 8, 'spike'); break; }
    }

    // --- удар мечом ---
    if (p.atk > 3 && p.atk < 11) {
      const box = { x: p.face > 0 ? p.x + p.w - 1 : p.x - 23, y: p.y - 2, w: 24, h: 22 };
      for (const e of this.enemies) if (!e.dead && !p.hit.has(e) && overlap(box, e)) { p.hit.add(e); this.hurtEnemy(e, this.st.sword, p.x + p.w / 2); }
      this.bullets = this.bullets.filter(b => { if (overlap(box, b)) { this.puff(b.x, b.y, '#ffe14a', 4); Sound.sfx('block'); return false; } return true; });
    }

    // --- сюрикены ---
    this.stars = this.stars.filter(s => {
      s.x += s.vx; s.rot += 0.5; s.life--;
      if (s.life <= 0 || solid(L, Math.floor(s.x / T), Math.floor(s.y / T))) { this.puff(s.x, s.y, '#ccc', 3); return false; }
      for (const e of this.enemies) if (!e.dead && overlap({ x: s.x - 3, y: s.y - 3, w: 6, h: 6 }, e)) { this.hurtEnemy(e, this.st.star, s.x - s.vx * 4); return false; }
      return true;
    });

    // --- враги ---
    for (const e of this.enemies) if (!e.dead) this.updateEnemy(e);
    this.enemies = this.enemies.filter(e => !e.dead);

    // --- контакт героя с врагами ---
    for (const e of this.enemies) {
      if (!overlap(p, e)) continue;
      if (p.vy > 0.8 && (p.y + p.h) - e.y < 9) { // прыжок сверху
        this.hurtEnemy(e, this.st.sword, p.x + p.w / 2); p.vy = -4.8; p.grace = 12; Sound.sfx('stomp');
      } else if (p.grace <= 0) this.hurtPlayer(this.dmgContact + (e.type === 'boss' ? 2 : 0), e.x + e.w / 2, 'contact');
    }

    // --- пули врагов ---
    this.bullets = this.bullets.filter(b => {
      b.x += b.vx;
      if (solid(L, Math.floor(b.x / T), Math.floor(b.y / T)) || Math.abs(b.x - p.x) > 400) return false;
      if (overlap(p, b) && p.inv <= 0) { this.hurtPlayer(this.dmgBullet, b.x, 'bullet'); return false; }
      return true;
    });

    // --- монеты ---
    const pb = { x: p.x - 3, y: p.y - 3, w: p.w + 6, h: p.h + 6 };
    for (const c of this.pick) if (!c.taken && overlap(pb, c)) this.takeCoin(c);
    for (const f of this.foods) if (!f.taken && overlap(pb, f)) { f.taken = true; this.eat(f.k); }
    for (const d of this.drops) {
      d.vy = Math.min(d.vy + GRAV * 0.8, MAXFALL); d.vx *= 0.97; moveX(d, L); moveY(d, L);
      if (overlap(pb, d)) { d.taken = true; if (d.food !== undefined) this.eat(d.food); else this.takeCoin(d, true); }
    }
    this.drops = this.drops.filter(d => !d.taken);

    // --- зоны, камера, финиш ---
    const z = Levels.zoneAt(L, (p.x + 5) / T);
    if (z !== this.zone) { this.zone = z; this.banner = { t: 120, text: t('zone', z + 1, t('w' + L.world + 'z' + z)) }; }
    if (this.banner.t > 0) this.banner.t--;
    const want = Math.max(0, Math.min(L.W * T - VW, p.x + p.w / 2 - VW / 2 + p.face * 20));
    this.cam += (want - this.cam) * 0.12;
    this.updateFx();

    if (p.x > L.finishX) {
      if (this.isBoss && this.enemies.some(e => e.type === 'boss')) { p.x = L.finishX; p.vx = 0; this.warn = 90; }
      else this.startPraise();
    }
  }

  takeCoin(c, drop) {
    c.taken = true; State.coins++; this.got++; Sound.sfx('coin');
    this.puff(c.x + 3, c.y + 3, '#ffd23f', 3);
  }

  updateFx() {
    this.parts = this.parts.filter(q => { q.x += q.vx; q.y += q.vy; q.vy += 0.1; return --q.life > 0; });
    this.texts = this.texts.filter(q => { q.y -= 0.4; return --q.life > 0; });
    if (this.shake > 0) this.shake--;
  }

  updateEnemy(e) {
    const L = this.L, p = this.p;
    e.t++; if (e.flash > 0) e.flash--;
    const dx = (p.x + p.w / 2) - (e.x + e.w / 2), dy = (p.y + p.h / 2) - (e.y + e.h / 2);
    if (e.type === 'fly') {
      if (e.kb > 0) { e.kb--; e.x += e.kvx; e.kvx *= 0.88; }
      else if (Math.abs(dx) < 120) { e.dir = Math.sign(dx) || e.dir; e.x += e.dir * e.spd; }
      else { if (e.t % 200 === 0) e.dir *= -1; e.x += e.dir * 0.2; }
      e.y = e.by + Math.sin(e.t * 0.06 + e.ph) * 12 + (Math.abs(dx) < 60 ? Math.min(14, Math.abs(dy) * 0.3) : 0);
      return;
    }
    if (e.kb > 0) { e.kb--; e.vx *= 0.88; }
    else if (e.type === 'walk') e.vx = e.dir * e.spd;
    else if (e.type === 'boss') { e.dir = Math.sign(dx) || e.dir; e.vx = (Math.abs(dx) < 240 && Math.abs(dx) > 14) ? e.dir * e.spd : 0; }
    else { e.vx = 0; e.dir = Math.sign(dx) || e.dir; }
    e.vy = Math.min(e.vy + GRAV, MAXFALL);
    moveX(e, L); moveY(e, L);
    if (e.type === 'boss' && e.onGround && e.vx && !solid(L, Math.floor((e.x + (e.dir > 0 ? e.w + 2 : -2)) / T), Math.floor((e.y + e.h + 2) / T))) e.x -= e.vx;
    if (e.type === 'walk' && e.kb <= 0 && e.onGround) {
      const ax = e.dir > 0 ? e.x + e.w + 1 : e.x - 1;
      if (e.hitWall || !solid(L, Math.floor(ax / T), Math.floor((e.y + e.h + 2) / T))) e.dir *= -1;
    }
    if (e.type === 'shoot' || e.type === 'boss') {
      e.cd--;
      const boss = e.type === 'boss';
      if (e.cd <= 0 && Math.abs(dx) < 170 && Math.abs(dy) < (boss ? 60 : 50)) {
        e.cd = boss ? 80 : Math.max(55, 130 - this.n * 1.5); Sound.sfx('eshoot');
        const bx = e.x + (e.dir > 0 ? e.w + 3 : -4);
        this.bullets.push({ x: bx, y: e.y + (boss ? 12 : 7), w: 5, h: 4, vx: e.dir * (boss ? 2 : 1.6) });
        if (boss) this.bullets.push({ x: bx, y: e.y + 28, w: 5, h: 4, vx: e.dir * 2 });
      }
    }
  }

  startPraise() {
    this.mode = 'praise'; this.praiseT = 0; this.p.vx = 0; this.bullets = [];
    Sound.sfx('win'); Sound.music(null);
  }

  win() {
    this.mode = 'won'; Sound.sfx('win'); Sound.music(null);
    const bonus = 5 + this.n; State.coins += bonus;
    if (this.n >= State.unlocked && this.n < Levels.TOTAL) State.unlocked = this.n + 1;
    Main.go(this.n >= Levels.TOTAL ? new Win(this.got + bonus) : new Result(this.n, this.got, bonus));
  }

  // ---------- рисование ----------
  draw() {
    const c = Gfx.ctx, L = this.L, p = this.p;
    const cam = Math.round(this.cam);
    const sx = this.shake ? Math.round((Math.random() - 0.5) * 3) : 0, sy = this.shake ? Math.round((Math.random() - 0.5) * 3) : 0;
    c.save(); c.translate(sx, sy);

    // небо + параллакс
    const zc = Levels.zoneAt(L, (cam + VW / 2) / T);
    if (zc !== this.bgPrev) { if (this.bgPrev >= 0) this.bgFade = 40; this.bgFrom = this.bgPrev < 0 ? zc : this.bgPrev; this.bgPrev = zc; }
    const drawBg = (z, alpha) => {
      c.globalAlpha = alpha;
      c.fillStyle = Sprites.sky(c, L.world, z); c.fillRect(-4, -4, VW + 8, VH + 8);
      if (Sprites.THEMES[L.world][z].stars) { c.fillStyle = '#fff'; for (const s of Sprites.starList) c.fillRect(s[0], s[1], s[2], s[2]); }
      const bg = Sprites.bgs[L.world][z];
      for (const [layer, k] of [[bg.far, 0.2], [bg.near, 0.5]]) {
        const off = -Math.floor((cam * k) % 300);
        c.drawImage(layer, off, 0); c.drawImage(layer, off + 300, 0);
      }
      const wc = Sprites.THEMES[L.world][z].water;
      if (wc) {
        c.globalAlpha = alpha * 0.92; c.fillStyle = wc; c.fillRect(-4, 178, VW + 8, 24);
        c.fillStyle = 'rgba(255,255,255,.3)'; for (let x = 0; x < VW; x += 4) c.fillRect(x, 178 + Math.round(Math.sin((x + this.t * 0.7) / 7)), 4, 1);
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(-4, 190, VW + 8, 12);
      }
      c.globalAlpha = 1;
    };
    if (this.bgFade > 0) { drawBg(this.bgFrom, 1); drawBg(zc, 1 - this.bgFade / 40); this.bgFade--; } else drawBg(zc, 1);

    // тайлы
    const x0 = Math.max(0, Math.floor(cam / T)), x1 = Math.min(L.W - 1, Math.floor((cam + VW) / T));
    for (let ty = 0; ty < L.ROWS; ty++) for (let tx = x0; tx <= x1; tx++) {
      const v = L.tiles[ty][tx]; if (!v) continue;
      const ts = Sprites.tiles[L.world][Levels.zoneAt(L, tx)];
      const img = v === 1 ? (ty > 0 && L.tiles[ty - 1][tx] === 1 ? ts.fill : ts.top) : v === 2 ? ts.plat : ts.spike;
      c.drawImage(img, tx * T - cam, ty * T + OY);
    }

    // старт A и финиш B
    this.drawSign(c, 20 - cam, L.top[1] * T + OY, 'A');
    this.drawPortal(c, L.finishX + 14 - cam, L.top[L.W - 3] * T + OY);

    // монеты
    for (const k of this.pick) if (!k.taken && k.x - cam > -8 && k.x - cam < VW + 8) Gfx.coin(k.x - cam, k.y + OY, this.t * 0.12 + k.ph);
    for (const f of this.foods) if (!f.taken && f.x - cam > -12 && f.x - cam < VW + 12) c.drawImage(Sprites.foods[f.k].img, Math.round(f.x - cam), Math.round(f.y + OY + Math.sin(this.t * 0.08 + f.ph) * 2));
    for (const d of this.drops) { if (d.food !== undefined) c.drawImage(Sprites.foods[d.food].img, Math.round(d.x - cam), Math.round(d.y + OY)); else Gfx.coin(d.x - cam, d.y + OY, this.t * 0.2 + d.ph); }

    // враги
    for (const e of this.enemies) {
      if (e.x - cam < -20 || e.x - cam > VW + 20) continue;
      if (e.flash > 0 && e.flash % 2) continue;
      let img;
      if (e.type === 'boss') {
        img = Sprites.leader[Math.abs(e.vx) > 0.1 ? Math.floor(e.t / 10) % 2 : 0][e.dir > 0 ? 0 : 1];
        c.drawImage(img, Math.round(e.x - cam - 8), Math.round(e.y + OY - 8), 40, 48);
        continue;
      }
      if (e.type === 'walk') img = Sprites.walkers[L.world][Math.floor(e.t / 10) % 2][e.dir > 0 ? 0 : 1];
      else if (e.type === 'fly') img = Sprites.bats[L.world][Math.floor(e.t / 8) % 2];
      else img = Sprites.shooter[e.dir > 0 ? 0 : 1];
      const ox = e.type === 'fly' ? -2 : -2, oy = e.type === 'fly' ? (Math.floor(e.t / 8) % 2 ? -2 : -1) : -2;
      c.drawImage(img, Math.round(e.x - cam + ox), Math.round(e.y + OY + oy));
      if (e.type === 'shoot' && e.cd < 16) { c.fillStyle = '#ffe14a'; c.fillRect(Math.round(e.x - cam + (e.dir > 0 ? e.w + 2 : -3)), Math.round(e.y + OY + 6), 2, 2); }
    }
    // пули
    for (const b of this.bullets) { c.fillStyle = '#ff5c5c'; c.fillRect(Math.round(b.x - cam), Math.round(b.y + OY), 5, 4); c.fillStyle = '#ffe14a'; c.fillRect(Math.round(b.x - cam + 1), Math.round(b.y + OY + 1), 3, 2); }
    for (const s of this.stars) this.drawStar(c, s.x - cam, s.y + OY, s.rot);

    this.drawHero(c, cam);
    if (this.mode === 'praise' && this.praiseT > 1) { const lx = L.finishX + 36, ly = L.top[L.W - 3] * T - 48 + OY; c.drawImage(Sprites.leader[0][1], Math.round(lx - cam), Math.round(ly), 40, 48); }

    for (const q of this.parts) { c.fillStyle = q.col; c.fillRect(Math.round(q.x - cam), Math.round(q.y + OY), q.s, q.s); }
    for (const q of this.texts) Gfx.text(q.s, Math.round(q.x - cam), Math.round(q.y + OY), { color: q.col });
    c.restore();
    this.drawHud(c);
  }

  drawDialog(c) {
    const key = this.isBoss ? 'prb' + (this.n / 10 - 1) : 'pr' + (this.n % 8);
    const lines = Gfx.wrap(t(key), 244);
    Gfx.box(14, 132, 272, 62, 'rgba(10,6,24,.94)', '#ff3b3b');
    Gfx.text(t('leader') + ':', 22, 137, { color: '#ff5c5c' });
    let rem = Math.floor((this.praiseT - 6) / 2.2);
    lines.forEach((l, i) => { if (rem > 0) Gfx.text(l.slice(0, rem), 22, 150 + i * 11, { color: '#fff' }); rem -= l.length + 1; });
  }

  drawSign(c, x, gy, ch) {
    x = Math.round(x); gy = Math.round(gy);
    c.fillStyle = '#5d3a17'; c.fillRect(x + 7, gy - 22, 3, 22);
    c.fillStyle = '#d9a05a'; c.fillRect(x, gy - 30, 17, 12); c.fillStyle = '#8a5a2b'; c.fillRect(x, gy - 30, 17, 1); c.fillRect(x, gy - 19, 17, 1);
    Gfx.text(ch, x + 5, gy - 28, { color: '#3b2a14', shadow: false });
  }
  drawPortal(c, x, gy) {
    x = Math.round(x); gy = Math.round(gy);
    c.fillStyle = '#6d6d8a'; c.fillRect(x - 14, gy - 40, 6, 40); c.fillRect(x + 12, gy - 40, 6, 40); c.fillRect(x - 14, gy - 46, 32, 6);
    const ph = Math.floor(this.t / 5) % 4;
    const cols = ['#7be0ff', '#a98bff', '#ff8be0', '#fff2a0'];
    for (let i = 0; i < 5; i++) { c.fillStyle = cols[(i + ph) % 4]; c.fillRect(x - 8 + i, gy - 40 + i, 20 - i * 2, 40 - i); }
    this.drawSign(c, x - 8, gy - 36, 'B');
  }
  drawStar(c, x, y, rot) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.rotate(rot);
    c.fillStyle = '#e8f0ff'; c.fillRect(-4, -1, 8, 2); c.fillRect(-1, -4, 2, 8);
    c.fillStyle = '#7d8a99'; c.fillRect(-1, -1, 2, 2); c.restore();
  }

  drawHero(c, cam) {
    const p = this.p, set = Sprites.turtles[State.hero];
    if (p.inv > 0 && p.inv % 6 < 3 && this.mode === 'play') return;
    const fi = p.face > 0 ? 0 : 1;
    let img = set.idle[fi];
    if (!p.onGround) img = set.jump[fi];
    else if (Math.abs(p.vx) > 0.2) img = set[Math.floor(p.anim) % 2 ? 'run0' : 'run1'][fi];
    const px = Math.round(p.x - cam) - 4, py = Math.round(p.y) + OY - 6;
    c.drawImage(img, px, py);
    // щит
    if (p.shield) c.drawImage(Sprites.shell, px + (p.face > 0 ? 15 : -3), py + 8);
    // оружие: катана (синий), сай (красный), боевой посох (фиолетовый), нунчаки (оранжевый)
    if (p.atk > 0) {
      const prog = 1 - p.atk / 12, hero = State.hero;
      c.save(); c.translate(px + 10 + p.face * 6, py + 14); c.scale(p.face, 1); c.rotate(-1.3 + 2.4 * prog);
      if (hero === 0) {
        c.fillStyle = '#7b4a1e'; c.fillRect(0, -1, 5, 3); c.fillStyle = '#ffd23f'; c.fillRect(5, -2, 1, 5);
        c.fillStyle = '#e8f0ff'; c.fillRect(6, -1, 17, 2); c.fillStyle = '#9fb0c8'; c.fillRect(6, 1, 17, 1);
      } else if (hero === 1) {
        c.fillStyle = '#7b4a1e'; c.fillRect(0, -1, 5, 3); c.fillStyle = '#c0c8d8'; c.fillRect(5, -4, 1, 9); c.fillRect(6, -4, 5, 1); c.fillRect(6, 4, 5, 1); c.fillRect(6, -1, 14, 2);
      } else if (hero === 2) {
        c.fillStyle = '#a8703a'; c.fillRect(-6, -1, 32, 2); c.fillStyle = '#5a3a1a'; c.fillRect(-6, -1, 3, 2); c.fillRect(23, -1, 3, 2);
      } else {
        c.fillStyle = '#c98a3a'; c.fillRect(0, -1, 9, 3); c.fillStyle = '#7b4a1e'; c.fillRect(2, -1, 1, 3); c.fillStyle = '#ccc'; c.fillRect(9, 0, 5, 1);
        c.fillStyle = '#c98a3a'; c.fillRect(14, -1, 9, 3); c.fillStyle = '#7b4a1e'; c.fillRect(20, -1, 1, 3);
      }
      c.restore();
      c.save(); c.globalAlpha = 0.45 * (1 - prog); c.fillStyle = '#fff';
      c.fillRect(px + (p.face > 0 ? 16 : -4), py + 6 + Math.round(prog * 10), 8, 2); c.restore();
    }
  }

  drawHud(c) {
    const p = this.p, st = this.st;
    // здоровье
    Gfx.box(4, 4, 74, 11, '#220a14', '#ffffff');
    const w = Math.round(68 * p.hp / st.maxHp);
    c.fillStyle = p.hp / st.maxHp < 0.3 ? '#ff3b3b' : '#52e05a'; c.fillRect(7, 7, w, 5);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(7, 7, w, 1);
    c.drawImage(Sprites.heart, 84, 4);
    // монеты
    Gfx.coin(4, 20, this.t * 0.1); Gfx.text(String(State.coins), 14, 19);
    // уровень
    Gfx.text(t('hud_level', this.n), VW - 4, 5, { align: 'right' });
    // прогресс A → B
    const bx = 108, bw = 84, prog = Math.max(0, Math.min(1, this.p.x / this.L.finishX));
    c.fillStyle = '#000'; c.fillRect(bx, 8, bw, 4); c.fillStyle = '#ffd23f'; c.fillRect(bx + 1, 9, Math.round((bw - 2) * prog), 2);
    Gfx.text('A', bx - 9, 5, { size: 8, color: '#ffd23f' }); Gfx.text('B', bx + bw + 3, 5, { color: '#ffd23f' });
    c.fillStyle = ['#2f6bff', '#ff3b3b', '#a64cff', '#ff9a1f'][State.hero]; c.fillRect(bx + Math.round((bw - 4) * prog), 6, 4, 8);
    // подсказка / баннер зоны
    if (this.n === 1 && this.t < 420) {
      Gfx.text(t('hint'), VW / 2, 62, { align: 'center', color: '#ffd23f' });
      Gfx.text(t('c1'), VW / 2, 76, { align: 'center' }); Gfx.text(t('c2'), VW / 2, 86, { align: 'center' }); Gfx.text(t('c3'), VW / 2, 96, { align: 'center' }); Gfx.text(t('c5'), VW / 2, 108, { align: 'center', color: '#9ad0ff' });
    }
    if (this.banner.t > 0) {
      const a = Math.min(1, this.banner.t / 20);
      const bw = Math.ceil(Gfx.width(this.banner.text) + 16);
      c.globalAlpha = a; Gfx.box(Math.round(VW / 2 - bw / 2), 34, bw, 16, 'rgba(0,0,0,.65)', '#ffd23f');
      Gfx.text(this.banner.text, VW / 2, 38, { align: 'center', color: '#ffd23f' }); c.globalAlpha = 1;
    }
    const bs = this.enemies.find(e => e.type === 'boss');
    if (bs && Math.abs(bs.x - this.p.x) < 300) {
      Gfx.text(t('leader'), VW / 2, 16, { align: 'center', color: '#ff5c5c' });
      Gfx.box(80, 26, 140, 7, '#220a14', '#ffffff'); c.fillStyle = '#ff3b3b'; c.fillRect(82, 28, Math.max(0, Math.round(136 * bs.hp / bs.maxHp)), 3);
    }
    if (this.warn > 0) { this.warn--; Gfx.text(t('killboss'), VW / 2, 70, { align: 'center', color: '#ff5c5c' }); }
    if (this.mode === 'praise' && this.praiseT > 6) this.drawDialog(c);
    if (this.mode === 'pause') {
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, VW, VH);
      Gfx.text(t('pause'), VW / 2, 60, { size: 16, align: 'center', color: '#ffd23f' });
      UI.button('resume', t('resume'), 85, 95, 130, 18, () => { this.mode = 'play'; });
      UI.button('quit', t('quit'), 85, 120, 130, 18, () => { Main.go(new MapScene()); });
    }
  }
}
