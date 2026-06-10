// Sonido 100% procedural con WebAudio: bleeps, explosiones de ruido, arpegios.
window.MZ = window.MZ || {};
(() => {
  let ctx = null;

  function ensure() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function beep(f0, f1, dur, type = 'square', vol = 0.07, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(f0, 1), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noise(dur = 0.3, vol = 0.15, freq = 1000, when = 0) {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(f).connect(g).connect(ctx.destination);
    s.start(t);
  }

  MZ.audio = {
    ensure,
    hit() { noise(0.07, 0.1, 1800); beep(220, 80, 0.08, 'square', 0.05); },
    crit() { beep(880, 120, 0.18, 'sawtooth', 0.09); noise(0.14, 0.18, 2500); },
    kill() { noise(0.32, 0.22, 900); beep(160, 40, 0.28, 'sawtooth', 0.07); },
    hurt() { beep(110, 55, 0.18, 'square', 0.09); noise(0.1, 0.1, 600); },
    gold() { beep(1320, 1760, 0.06, 'sine', 0.06); beep(1760, 2200, 0.07, 'sine', 0.06, 0.06); },
    pickup() { beep(660, 990, 0.09, 'triangle', 0.07); beep(990, 1320, 0.1, 'triangle', 0.07, 0.09); },
    stairs() { beep(440, 440, 0.08, 'triangle', 0.07); beep(550, 550, 0.08, 'triangle', 0.07, 0.09); beep(660, 880, 0.14, 'triangle', 0.08, 0.18); },
    death() { beep(440, 110, 0.5, 'sawtooth', 0.1); beep(220, 55, 0.7, 'square', 0.08, 0.15); noise(0.6, 0.18, 400, 0.1); },
    boss() { beep(82, 41, 0.5, 'sawtooth', 0.12); beep(110, 55, 0.5, 'square', 0.1, 0.25); noise(0.4, 0.12, 250, 0.5); },
    doomEntry() {
      // drones graves apilados + golpe: entrada a la arena del jefe
      beep(55, 55, 1.1, 'sawtooth', 0.13);
      beep(41, 41, 1.1, 'square', 0.1, 0.05);
      beep(110, 82, 0.9, 'sawtooth', 0.08, 0.15);
      noise(0.7, 0.16, 180, 0.0);
      beep(33, 27, 1.4, 'sine', 0.12, 0.3);
    },
    mate() { beep(523, 523, 0.09, 'triangle', 0.08); beep(659, 659, 0.09, 'triangle', 0.08, 0.1); beep(784, 1046, 0.16, 'triangle', 0.09, 0.2); },
    secret() { beep(784, 784, 0.07, 'sine', 0.07); beep(988, 988, 0.07, 'sine', 0.07, 0.08); beep(1175, 1568, 0.18, 'sine', 0.08, 0.16); },
  };
})();
