// Интерфейс: кнопки (клавиатура + мышь) и все экраны вне уровня.
const UI = {
  buttons: [], next: [], sel: null,
  reset() { this.buttons = []; this.next = []; this.sel = null; },
  endFrame() { this.buttons = this.next; this.next = []; },

  button(id, label, x, y, w, h, fn, o = {}) {
    const c = Gfx.ctx, sel = this.sel === id, dis = !!o.disabled;
    this.next.push({ id, x, y, w, h, fn, dis });
    const border = dis ? '#444' : sel ? '#ffd23f' : (o.border || '#6c6cff');
    const fill = dis ? '#1c1c28' : sel ? '#3a2a6a' : (o.fill || '#1a1a33');
    Gfx.box(x, y, w, h, fill, border);
    if (label) Gfx.text(label, x + w / 2, y + Math.round((h - 8) / 2) + 1, { align: 'center', color: dis ? '#666' : sel ? '#ffd23f' : '#fff' });
    if (sel && !dis && o.arrow !== false && w > 40) Gfx.text(Math.floor(Date.now() / 300) % 2 ? '>' : ' ', x - 9, y + Math.round((h - 8) / 2) + 1, { color: '#ffd23f' });
  },

  handle(scene) {
    const m = Input.mouse, bs = this.buttons.filter(b => !b.dis);
    if (Input.pressed('back') && scene.back) { Sound.sfx('select'); scene.back(); return; }
    if (!bs.length) return;
    if (!bs.find(b => b.id === this.sel)) this.sel = bs[0].id;
    const cur = bs.find(b => b.id === this.sel);
    const go = (dx, dy) => {
      const cx = cur.x + cur.w / 2, cy = cur.y + cur.h / 2; let best = null, bd = 1e9;
      for (const b of bs) {
        if (b === cur) continue;
        const vx = b.x + b.w / 2 - cx, vy = b.y + b.h / 2 - cy;
        if (dx && Math.sign(vx) !== dx) continue; if (dy && Math.sign(vy) !== dy) continue;
        const pri = dx ? Math.abs(vx) : Math.abs(vy), sec = dx ? Math.abs(vy) : Math.abs(vx);
        if (pri < 1) continue;
        const d = pri + sec * 2.5; if (d < bd) { bd = d; best = b; }
      }
      if (best) { this.sel = best.id; Sound.sfx('select'); }
    };
    if (Input.pressed('left')) go(-1, 0); else if (Input.pressed('right')) go(1, 0);
    else if (Input.pressed('up')) go(0, -1); else if (Input.pressed('down')) go(0, 1);
    if (m.moved) { const h = bs.find(b => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h); if (h && h.id !== this.sel) { this.sel = h.id; Sound.sfx('select'); } }
    if (m.click) { const h = bs.find(b => m.x >= b.x && m.x <= b.x + b.w && m.y >= b.y && m.y <= b.y + b.h); if (h) { Sound.sfx('ok'); h.fn(); return; } }
    if (Input.pressed('ok')) { const b = bs.find(b => b.id === this.sel); if (b) { Sound.sfx('ok'); b.fn(); } }
  },
};

// ---------- общий анимированный фон меню: ночной город ----------
const MenuBg = (() => {
  const city = Sprites.canvas(300, 200), c = city.getContext('2d'), r = Sprites.rng(4242);
  for (let i = 0; i < 16; i++) {
    const x = i * 20 + ((r() * 6) | 0), w = 14 + ((r() * 8) | 0), h = 40 + ((r() * 70) | 0);
    c.fillStyle = i % 2 ? '#1a1640' : '#241d52'; c.fillRect(x, 200 - h, w, h);
    for (let wy = 200 - h + 5; wy < 192; wy += 8) for (let wx = x + 3; wx < x + w - 3; wx += 5) if (r() < 0.4) { c.fillStyle = r() < 0.8 ? '#ffd86b' : '#7be0ff'; c.fillRect(wx, wy, 2, 3); }
  }
  const stars = Array.from({ length: 40 }, () => [(r() * 300) | 0, (r() * 110) | 0, r()]);
  return {
    draw(tk) {
      const ctx = Gfx.ctx, g = ctx.createLinearGradient(0, 0, 0, 200);
      g.addColorStop(0, '#07051a'); g.addColorStop(1, '#2a1b5e'); ctx.fillStyle = g; ctx.fillRect(0, 0, 300, 200);
      for (const s of stars) { ctx.fillStyle = (tk / 20 + s[2] * 10) % 3 < 2.5 ? '#fff' : '#556'; ctx.fillRect(s[0], s[1], 1, 1); }
      ctx.fillStyle = '#fff6c8'; ctx.fillRect(22, 10, 12, 12); ctx.fillRect(20, 12, 16, 8); ctx.fillRect(24, 8, 8, 16);
      ctx.fillStyle = '#d8cf9a'; ctx.fillRect(25, 13, 3, 3); ctx.fillRect(29, 17, 2, 2);
      const off = -Math.floor((tk * 0.15) % 300);
      ctx.drawImage(city, off, 0); ctx.drawImage(city, off + 300, 0);
    },
  };
})();

class Scene { constructor() { this.tk = 0; } update() { this.tk++; } }

// ---------- Титульный экран ----------
class Title extends Scene {
  draw() {
    const c = Gfx.ctx; MenuBg.draw(this.tk);
    const bob = Math.round(Math.sin(this.tk / 12) * 2);
    Gfx.text(t('title1'), 150, 22 + bob, { size: 16, align: 'center', color: '#52e05a', shadow: '#0a3a10' });
    Gfx.text(t('title2'), 150, 42 + bob, { size: 16, align: 'center', color: '#ffd23f', shadow: '#5a3a00' });
    for (let i = 0; i < 4; i++) {
      const set = Sprites.turtles[i], f = Math.floor(this.tk / 8 + i) % 2;
      Gfx.sprite((Math.floor(this.tk / 8) + i) % 4 === 0 ? set.jump[0] : set[f ? 'run0' : 'run1'][0], 46 + i * 56, 62 + (i % 2) * 2, 2);
    }
    Gfx.sprite(Sprites.splinter[0], 14, 118, 2);
    UI.button('play', t('play'), 80, 112, 140, 17, () => Main.go(new Select()));
    UI.button('lang', t('lang', I18N.lang.toUpperCase()), 80, 133, 140, 17, () => I18N.next());
    UI.button('snd', t('sound', t(Sound.muted ? 'off' : 'on')), 80, 154, 140, 17, () => Sound.toggle());
    Gfx.text(t('nosave'), 150, 180, { align: 'center', color: '#9a9ac8' });
    Gfx.box(268, 4, 28, 14, '#c0201f', '#fff'); Gfx.text(t('age'), 282, 7, { align: 'center' });
    Sound.music('menu');
  }
}

// ---------- Выбор героя ----------
class Select extends Scene {
  back() { Main.go(new Title()); }
  draw() {
    MenuBg.draw(this.tk);
    Gfx.text(t('choose'), 150, 12, { size: 8, align: 'center', color: '#ffd23f' });
    for (let i = 0; i < 4; i++) {
      const x = 14 + i * 71, sel = UI.sel === 'h' + i;
      UI.button('h' + i, '', x, 30, 64, 78, () => { State.hero = i; Main.go(new MapScene()); }, { arrow: false });
      const set = Sprites.turtles[i], f = Math.floor(this.tk / 8) % 2;
      Gfx.sprite(sel ? set[f ? 'run0' : 'run1'][0] : set.idle[0], x + 12, 40, 2);
      Gfx.text(t('hero' + i), x + 32, 92, { align: 'center', color: sel ? '#ffd23f' : '#fff' });
    }
    ['c1', 'c2', 'c3', 'c4', 'c5'].forEach((k, i) => Gfx.text(t(k), 150, 122 + i * 11, { align: 'center', color: k === 'c5' ? '#9ad0ff' : '#c8c8ff' }));
    Gfx.text(t('back') + ': ESC', 150, 184, { align: 'center', color: '#8a8ab8' });
  }
}

// ---------- Карта уровней ----------
const WORLD_COL = ['#ff9a1f', '#3fe07a', '#4ab8ff', '#ff4a5a'];
class MapScene extends Scene {
  constructor() { super(); Sound.music('menu'); }
  back() { Main.go(new Title()); }
  draw() {
    MenuBg.draw(this.tk);
    const sl = /^l\d+$/.test(UI.sel || '') ? +UI.sel.slice(1) : State.unlocked, sw = Math.floor((Math.min(sl, 40) - 1) / 10);
    Gfx.text(t('levels') + ': ' + t('wn' + sw), 150, 8, { size: 8, align: 'center', color: WORLD_COL[sw] });
    Gfx.coin(244, 8, this.tk * 0.1); Gfx.text(String(State.coins), 254, 8);
    for (let n = 1; n <= Levels.TOTAL; n++) {
      const x = 12 + ((n - 1) % 10) * 28, y = 26 + Math.floor((n - 1) / 10) * 28, locked = n > State.unlocked, done = n < State.unlocked;
      UI.button('l' + n, locked ? '?' : String(n), x, y, 24, 24, () => Main.go(new Play(n)), { disabled: locked, arrow: false, fill: done ? '#143a1c' : undefined, border: WORLD_COL[Math.floor((n - 1) / 10)] });
    }
    const row = [['shop', t('shop'), () => Main.push(new Shop())], ['bank', t('bank'), () => Main.push(new Bank())], ['ad', t('ad', AD_REWARD), () => Main.push(new AdScene())]];
    const ws = row.map(r => Gfx.width(r[1]) + 14), total = ws.reduce((a, b) => a + b, 0) + 8 * (row.length - 1);
    let x = 150 - total / 2;
    row.forEach((r, i) => { UI.button(r[0], r[1], Math.round(x), 150, ws[i], 18, r[2]); x += ws[i] + 8; });
    Gfx.text(t('nosave'), 150, 182, { align: 'center', color: '#7a7aa8' });
  }
}

// ---------- Прокачка навыков ----------
const SKILLS = [['atk', 'sk_atk'], ['def', 'sk_def'], ['hp', 'sk_hp']];
class Shop extends Scene {
  constructor() { super(); this.msg = ''; this.msgT = 0; }
  back() { Main.pop(); }
  draw() {
    const c = Gfx.ctx; MenuBg.draw(this.tk);
    Gfx.text(t('shop'), 150, 8, { align: 'center', color: '#ffd23f' });
    Gfx.coin(236, 8, this.tk * 0.1); Gfx.text(String(State.coins), 246, 8);
    const st = State.stats();
    const info = { atk: t('atk_info', st.sword, st.star), def: t('def_info', st.defPct), hp: t('hp_info', st.maxHp) };
    const icons = { atk: Sprites.sword, def: Sprites.shell, hp: Sprites.heart };
    SKILLS.forEach(([k, name], i) => {
      const y = 28 + i * 40, lv = State.upg[k], max = lv >= State.MAXLVL;
      UI.button('s' + k, '', 14, y, 272, 34, () => { if (State.buy(k)) { Sound.sfx('buy'); } else { Sound.sfx('deny'); this.msg = max ? '' : t('nomoney'); this.msgT = 90; } }, { arrow: false });
      Gfx.sprite(icons[k], 22, y + 8, k === 'def' ? 1 : 2);
      Gfx.text(t(name), 44, y + 5);
      Gfx.text(info[k], 44, y + 21, { color: '#9ad0ff' });
      for (let p = 0; p < State.MAXLVL; p++) { c.fillStyle = p < lv ? '#52e05a' : '#2c2c4a'; c.fillRect(150 + p * 6, y + 6, 5, 7); }
      Gfx.text(max ? t('max') : t('lv', lv, State.MAXLVL), 150, y + 21, { color: '#c8c8ff' });
      if (!max) { const cost = State.cost(k); Gfx.coin(236, y + 21, this.tk * 0.1); Gfx.text(String(cost), 246, y + 21, { color: State.coins >= cost ? '#ffd23f' : '#ff7a7a' }); }
    });
    UI.button('back', t('back'), 100, 152, 100, 16, () => this.back());
    if (this.msgT > 0) { this.msgT--; Gfx.text(this.msg, 150, 176, { align: 'center', color: '#ff7a7a' }); }
  }
}

// ---------- Банк (демо-покупки, реальные деньги не используются) ----------
const PACKS = [[50, '$0.99'], [150, '$2.49'], [500, '$6.99']];
class Bank extends Scene {
  constructor() { super(); this.msg = ''; this.msgT = 0; }
  back() { Main.pop(); }
  draw() {
    MenuBg.draw(this.tk);
    Gfx.text(t('bank'), 150, 8, { align: 'center', color: '#ffd23f' });
    Gfx.coin(236, 8, this.tk * 0.1); Gfx.text(String(State.coins), 246, 8);
    PACKS.forEach(([n, price], i) => {
      const y = 28 + i * 30;
      UI.button('p' + i, '', 40, y, 220, 24, () => { State.coins += n; Sound.sfx('buy'); this.msg = t('bought', n); this.msgT = 120; }, { arrow: false });
      for (let k = 0; k <= i; k++) Gfx.coin(50 + k * 9, y + 8, this.tk * 0.1 + k);
      Gfx.text(t('pack', n), 90, y + 8);
      Gfx.text(price, 250, y + 8, { align: 'right', color: '#52e05a' });
    });
    Gfx.wrap(t('demo'), 270).forEach((l, i) => Gfx.text(l, 150, 122 + i * 10, { align: 'center', color: '#ffb36b' }));
    UI.button('back', t('back'), 100, 152, 100, 16, () => this.back());
    if (this.msgT > 0) { this.msgT--; Gfx.text(this.msg, 150, 178, { align: 'center', color: '#52e05a' }); }
  }
}

// ---------- Реклама (имитация ролика, награда монетами) ----------
const AD_REWARD = 20, AD_TICKS = 300;
class AdScene extends Scene {
  update() { super.update(); }
  back() { if (this.tk >= AD_TICKS) this.close(); }
  close() { State.coins += AD_REWARD; Sound.sfx('buy'); Main.pop(); }
  draw() {
    const c = Gfx.ctx, tk = this.tk;
    for (let i = 0; i < 12; i++) { c.fillStyle = (i + Math.floor(tk / 10)) % 2 ? '#b3211c' : '#e8453c'; c.fillRect(i * 25, 0, 25, 200); }
    Gfx.box(30, 30, 240, 122, '#fff4d6', '#2a1a00');
    const by = Math.round(Math.sin(tk / 8) * 4);
    Gfx.sprite(Sprites.pizza, 60, 60 + by, 4);
    Gfx.text(t('ad_brand'), 150, 44, { color: '#b3211c', shadow: false });
    Gfx.wrap(t('ad_slogan'), 118).forEach((l, i) => Gfx.text(l, 140, 70 + i * 12, { color: '#2a1a00', shadow: false }));
    Gfx.text(t('ad_title'), 6, 6, { color: '#fff' });
    if (tk < AD_TICKS) {
      Gfx.text(t('ad_wait', Math.ceil((AD_TICKS - tk) / 60)), 150, 168, { align: 'center', color: '#fff' });
      const c2 = Gfx.ctx; c2.fillStyle = '#000'; c2.fillRect(50, 182, 200, 6); c2.fillStyle = '#ffd23f'; c2.fillRect(51, 183, Math.round(198 * tk / AD_TICKS), 4);
    } else UI.button('close', t('ad_close', AD_REWARD), 80, 164, 140, 20, () => this.close());
  }
}

// ---------- Итоги уровня + меню прокачки между уровнями ----------
class Result extends Scene {
  constructor(n, got, bonus) { super(); this.n = n; this.got = got; this.bonus = bonus; Sound.music('menu'); }
  back() { Main.go(new MapScene()); }
  draw() {
    MenuBg.draw(this.tk);
    Gfx.text(t('done', this.n), 150, 12, { align: 'center', color: '#52e05a' });
    Gfx.text(t('earned', this.got), 150, 30, { align: 'center' });
    Gfx.text(t('bonus', this.bonus), 150, 42, { align: 'center', color: '#ffd23f' });
    Gfx.text(t('total', State.coins), 150, 54, { align: 'center', color: '#9ad0ff' });
    const items = [['next', t('next'), () => Main.go(new Play(this.n + 1))], ['shop', t('shop'), () => Main.push(new Shop())], ['bank', t('bank'), () => Main.push(new Bank())], ['ad', t('ad', AD_REWARD), () => Main.push(new AdScene())], ['map', t('map'), () => Main.go(new MapScene())]];
    items.forEach((it, i) => UI.button(it[0], it[1], 80, 72 + i * 22, 140, 18, it[2]));
  }
}

class GameOver extends Scene {
  constructor(n) { super(); this.n = n; Sound.music(null); }
  back() { Main.go(new MapScene()); }
  draw() {
    MenuBg.draw(this.tk);
    Gfx.text(t('gameover'), 150, 30, { size: 16, align: 'center', color: '#ff4a4a', shadow: '#400' });
    const items = [['retry', t('retry'), () => Main.go(new Play(this.n))], ['shop', t('shop'), () => Main.push(new Shop())], ['map', t('map'), () => Main.go(new MapScene())]];
    items.forEach((it, i) => UI.button(it[0], it[1], 80, 80 + i * 24, 140, 18, it[2]));
    Gfx.text(t('total', State.coins), 150, 160, { align: 'center', color: '#9ad0ff' });
  }
}

class Win extends Scene {
  constructor(got) { super(); this.got = got; Sound.music('menu'); }
  back() { Main.go(new MapScene()); }
  draw() {
    MenuBg.draw(this.tk);
    Gfx.text(t('win'), 150, 24, { size: 16, align: 'center', color: '#ffd23f', shadow: '#5a3a00' });
    Gfx.text(t('win_text'), 150, 52, { align: 'center', color: '#52e05a' });
    for (let i = 0; i < 4; i++) Gfx.sprite(Sprites.turtles[i][(Math.floor(this.tk / 6) % 2) ? 'jump' : 'idle'][0], 46 + i * 56, 80 + Math.round(Math.abs(Math.sin(this.tk / 10 + i)) * -8), 2);
    UI.button('map', t('map'), 80, 140, 140, 18, () => Main.go(new MapScene()));
  }
}
