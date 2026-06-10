// Juice: partículas aditivas, anillos, flashes, screen shake, daño flotante, slowmo.
window.MZ = window.MZ || {};
(() => {
  let app, layer, TEX;
  const parts = [];   // {spr, vx, vy, life, maxLife, kind, grow}
  let shakePow = 0;
  let flashSpr = null;

  function spawnSpr(tex, x, y, tint, scale, blend) {
    const s = new PIXI.Sprite(tex);
    s.anchor.set(0.5);
    s.position.set(x, y);
    s.tint = tint;
    s.scale.set(scale);
    s.blendMode = blend || 'add';
    layer.addChild(s);
    return s;
  }

  MZ.fx = {
    init(application, fxLayer, textures) {
      app = application; layer = fxLayer; TEX = textures;
      flashSpr = new PIXI.Sprite(PIXI.Texture.WHITE);
      flashSpr.alpha = 0;
      app.stage.addChild(flashSpr);
    },

    explode(x, y, color, n = 18, spd = 3, scale = 1) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (0.3 + Math.random()) * spd;
        const s = spawnSpr(TEX.glow, x, y, color, (0.15 + Math.random() * 0.3) * scale);
        parts.push({ spr: s, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 300 + Math.random() * 400, maxLife: 700, kind: 'p' });
      }
    },

    ring(x, y, color, big) {
      const s = spawnSpr(TEX.ring, x, y, color, 0.3);
      parts.push({ spr: s, vx: 0, vy: 0, life: 400, maxLife: 400, kind: 'ring', grow: big ? 0.14 : 0.07 });
    },

    sparkle(x, y, color) {
      this.explode(x, y, color, 8, 1.5, 0.7);
      this.ring(x, y, color);
    },

    trail(x, y, color) {
      const s = spawnSpr(TEX.glow, x, y, color, 0.35);
      parts.push({ spr: s, vx: 0, vy: 0, life: 250, maxLife: 250, kind: 'p' });
    },

    bolt(from, to, color) {
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const s = spawnSpr(TEX.glow, from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, color, 0.25);
        parts.push({ spr: s, vx: 0, vy: 0, life: 150 + i * 18, maxLife: 350, kind: 'p' });
      }
    },

    floatText(x, y, str, color, size = 14) {
      const t = new PIXI.Text({
        text: str,
        style: { fill: color, fontSize: size, fontFamily: 'monospace', fontWeight: 'bold', stroke: { color: 0x000000, width: 3 } },
      });
      t.anchor.set(0.5);
      t.position.set(x, y);
      layer.addChild(t);
      parts.push({ spr: t, vx: 0, vy: -0.5, life: 850, maxLife: 850, kind: 'text' });
    },

    flash(alpha, color = 0xffffff) {
      if (!flashSpr) return;
      flashSpr.tint = color;
      flashSpr.alpha = Math.max(flashSpr.alpha, alpha);
    },

    shake(p) { shakePow = Math.max(shakePow, p); },

    shakeOffset() {
      if (shakePow < 0.3) return { x: 0, y: 0 };
      return { x: (Math.random() * 2 - 1) * shakePow, y: (Math.random() * 2 - 1) * shakePow };
    },

    slowmo(ms) {
      MZ.timeScale = 0.3;
      setTimeout(() => { MZ.timeScale = 1; }, ms);
    },

    update(dt) {
      shakePow *= Math.pow(0.88, dt / 16.7);
      if (flashSpr) {
        flashSpr.width = app.screen.width;
        flashSpr.height = app.screen.height;
        flashSpr.alpha *= Math.pow(0.8, dt / 16.7);
        if (flashSpr.alpha < 0.01) flashSpr.alpha = 0;
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.life <= 0) {
          p.spr.destroy();
          parts.splice(i, 1);
          continue;
        }
        const k = dt / 16.7;
        p.spr.x += p.vx * k;
        p.spr.y += p.vy * k;
        p.spr.alpha = p.life / p.maxLife;
        if (p.kind === 'ring') p.spr.scale.set(p.spr.scale.x + p.grow * k);
        if (p.kind === 'p') { p.vx *= Math.pow(0.95, k); p.vy *= Math.pow(0.95, k); }
      }
    },

    clear() {
      for (const p of parts) p.spr.destroy();
      parts.length = 0;
    },
  };
})();
