// Звук: чиптюн на WebAudio (никаких аудиофайлов)
const Sound = (() => {
  let ctx = null, master = null, muted = false, vol = 6, trackName = null, step = 0, nextT = 0;
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);

  const TRACKS = {
    menu: {
      bpm: 104,
      lead: [72,0,76,0,79,0,76,0, 74,0,77,0,81,0,77,0, 72,0,76,0,79,0,84,0, 83,0,79,0,76,0,0,0],
      bass: [48,0,55,0,48,0,55,0, 50,0,57,0,50,0,57,0, 48,0,55,0,48,0,55,0, 43,0,50,0,43,0,50,0],
    },
    play: {
      bpm: 150,
      lead: [69,0,72,0,76,0,72,0, 74,0,77,0,81,0,77,0, 72,0,76,0,79,0,76,0, 71,0,74,0,79,0,74,0],
      bass: [45,0,45,0,52,0,45,0, 50,0,50,0,57,0,50,0, 48,0,48,0,55,0,48,0, 43,0,43,0,50,0,43,0],
    },
  };

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : vol * 0.0417;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  }

  function tone(freq, dur, type, vol, at, to) {
    if (!ctx || muted) return;
    const t0 = at ?? ctx.currentTime;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  function noise(dur, vol) {
    if (!ctx || muted) return;
    const n = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; g.gain.value = vol; s.connect(g); g.connect(master); s.start();
  }

  const SFX = {
    jump:   () => tone(280, 0.16, 'square', 0.18, null, 620),
    coin:   () => { tone(988, 0.07, 'square', 0.14); tone(1319, 0.14, 'square', 0.14, ctx && ctx.currentTime + 0.07); },
    slash:  () => noise(0.12, 0.35),
    star:   () => tone(900, 0.1, 'triangle', 0.2, null, 400),
    hit:    () => { tone(180, 0.1, 'sawtooth', 0.2, null, 80); noise(0.08, 0.3); },
    kill:   () => { tone(400, 0.2, 'square', 0.18, null, 90); noise(0.15, 0.3); },
    hurt:   () => tone(300, 0.3, 'sawtooth', 0.25, null, 70),
    block:  () => tone(1200, 0.08, 'square', 0.15, null, 700),
    eshoot: () => tone(500, 0.12, 'square', 0.1, null, 200),
    stomp:  () => tone(160, 0.12, 'square', 0.22, null, 400),
    die:    () => tone(500, 0.8, 'sawtooth', 0.25, null, 40),
    eat:    () => { tone(523, 0.06, 'square', 0.14); tone(659, 0.06, 'square', 0.14, ctx && ctx.currentTime + 0.06); tone(784, 0.12, 'square', 0.14, ctx && ctx.currentTime + 0.12); },
    select: () => tone(660, 0.05, 'square', 0.1),
    ok:     () => { tone(660, 0.06, 'square', 0.14); tone(880, 0.1, 'square', 0.14, ctx && ctx.currentTime + 0.06); },
    buy:    () => { tone(784, 0.08, 'square', 0.14); tone(1047, 0.08, 'square', 0.14, ctx && ctx.currentTime + 0.08); tone(1568, 0.16, 'square', 0.14, ctx && ctx.currentTime + 0.16); },
    deny:   () => tone(140, 0.2, 'square', 0.18),
    win:    () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.2, 'square', 0.16, ctx && ctx.currentTime + i * 0.13)),
  };

  setInterval(() => {
    if (!ctx || !trackName) return;
    const tr = TRACKS[trackName], dur = 60 / tr.bpm / 2;
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.25) {
      const s = step % tr.lead.length;
      if (tr.lead[s]) tone(midi(tr.lead[s]), dur * 0.9, 'square', 0.05, nextT);
      if (tr.bass[s]) tone(midi(tr.bass[s]), dur * 1.6, 'triangle', 0.16, nextT);
      nextT += dur; step++;
    }
  }, 60);

  return {
    init,
    sfx(name) { if (ctx && SFX[name]) SFX[name](); },
    music(name) { if (trackName !== name) { trackName = name; step = 0; nextT = 0; } },
    get muted() { return muted; },
    get vol() { return vol; },
    setVol(v) { vol = Math.max(0, Math.min(10, v)); if (master) master.gain.value = muted ? 0 : vol * 0.0417; return vol; },
    toggle() { muted = !muted; if (master) master.gain.value = muted ? 0 : vol * 0.0417; return muted; },
  };
})();
