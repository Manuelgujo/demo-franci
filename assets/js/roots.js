/* Radici del papavero: continuano gli steli del disegno nell'hero (stesso verde
   salvia, stesso tratto, due rampicanti intrecciati con foglie a contorno e
   viticci a spirale). Scorrendo la pagina crescono in background; risalendo si
   ritirano. Puro decoro: aria-hidden, nessun puntatore, nascoste con
   prefers-reduced-motion e in stampa. Il disegno e' generato a runtime (seme
   fisso: stessa forma a ogni visita) e si adatta a larghezza e altezza pagina. */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const NS = 'http://www.w3.org/2000/svg';
  const layer = document.createElement('div');
  layer.className = 'roots';
  layer.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('fill', 'none');
  layer.appendChild(svg);
  document.body.appendChild(layer);

  let W = 0, docH = 0, startX = 0, startY = 0;
  let mains = [], items = [], layerG = null;
  let cur = 0, target = 0, running = false, built = false;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const rad = (d) => (d * Math.PI) / 180;

  function rng(seed) {                       // mulberry32: casuale ma ripetibile
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function toPath(pts) {                     // Catmull-Rom -> curve di Bezier
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, pts.length - 1)];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
           (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
           p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }

  function addD(cls, d) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', cls);
    p.setAttribute('d', d);
    (layerG || svg).appendChild(p);
    const len = p.getTotalLength();
    p.style.strokeDasharray = len + ' ' + (len + 2);
    p.style.strokeDashoffset = len;
    p.style.visibility = 'hidden';
    return { el: p, len: len };
  }
  function addPath(cls, pts) { const o = addD(cls, toPath(pts)); o.pts = pts; return o; }

  /* Viticcio: parte inclinato, segue una curva morbida e finisce in una spirale. */
  function tendril(x, y, th, side, length, rand, small) {
    const pts = [[x, y]];
    const n = small ? 8 : 11, curlN = small ? 7 : 9;
    const step = length / n;
    for (let i = 0; i < n; i++) {
      th += side * 0.05 + Math.sin(i * 1.1 + rand() * 2) * 0.08;
      x += Math.cos(th) * step; y += Math.sin(th) * step;
      pts.push([clamp(x, 6, W - 6), y]);
    }
    const turn = -side, k = small ? 0.7 : 1;
    let s2 = step * 0.6;
    for (let i = 0; i < curlN; i++) {
      th += turn * (0.5 + i * 0.12);
      s2 *= 0.84;
      x += Math.cos(th) * s2 * k; y += Math.sin(th) * s2 * k;
      pts.push([clamp(x, 6, W - 6), y]);
    }
    return pts;
  }

  /* Foglia a contorno (mandorla, non riempita) con piccolo picciolo e nervatura. */
  function leaf(x, y, phi, L, rand) {
    const f = (v) => v.toFixed(1);
    const c = Math.cos(phi), s = Math.sin(phi), nx = -s, ny = c;
    const st = 9 + rand() * 6;
    const bx = x + c * st, by = y + s * st;
    const w = L * (0.30 + rand() * 0.08), bend = L * (rand() - 0.5) * 0.18;
    const tx = bx + c * L + nx * bend, ty = by + s * L + ny * bend;
    const P = (a, b) => f(bx + c * L * a + nx * b) + ' ' + f(by + s * L * a + ny * b);
    const outline = 'M' + f(bx) + ' ' + f(by) +
      'C' + P(0.22, w) + ' ' + P(0.68, w * 0.95) + ' ' + f(tx) + ' ' + f(ty) +
      'C' + P(0.68, -w * 0.95) + ' ' + P(0.22, -w) + ' ' + f(bx) + ' ' + f(by) + 'Z';
    const vein = 'M' + f(x) + ' ' + f(y) + 'L' + f(bx) + ' ' + f(by) +
      'Q' + P(0.5, bend * 0.6) + ' ' + f(bx + c * L * 0.82 + nx * bend * 0.8) + ' ' + f(by + s * L * 0.82 + ny * bend * 0.8);
    return { outline: outline, vein: vein };
  }

  function build() {
    layer.style.height = '0px';
    W = document.documentElement.clientWidth;
    docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    layer.style.height = docH + 'px';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + docH);
    svg.setAttribute('width', W); svg.setAttribute('height', docH);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    mains = []; items = []; layerG = null;

    const mobile = W < 640;
    // Punto di partenza: il fondo degli steli nel disegno dell'hero
    // (nel disegno i due steli finiscono a circa il 33% e il 41% della larghezza)
    const art = document.querySelector('.hero-art svg');
    let aX, bX;
    if (art) {
      const r = art.getBoundingClientRect();
      aX = r.left + window.scrollX + r.width * 0.333;
      bX = r.left + window.scrollX + r.width * 0.41;
      startY = r.bottom + window.scrollY - r.height * 0.03;
    } else {
      aX = W * 0.86 - 14; bX = W * 0.86 + 14; startY = 90;
    }
    const endY = docH - 30;
    if (endY - startY < 200) { built = false; return; }

    // sfumatura d'ingresso: le radici "emergono" dalla dissolvenza degli steli
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    defs.innerHTML =
      '<linearGradient id="rootfade" gradientUnits="userSpaceOnUse" x1="0" y1="' + (startY - 30) + '" x2="0" y2="' + (startY + 110) + '">' +
      '<stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>' +
      '<mask id="rootmask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + docH + '">' +
      '<rect x="0" y="0" width="' + W + '" height="' + docH + '" fill="url(#rootfade)"/></mask>';
    svg.appendChild(defs);
    const g = document.createElementNS(ns, 'g');
    g.setAttribute('mask', 'url(#rootmask)');
    svg.appendChild(g);
    layerG = g;

    const rand = rng(20240611);
    const stepY = 30;
    const wave = mobile ? 230 : 300;           // lunghezza d'onda dell'intreccio
    const amp = mobile ? 20 : 30;              // ampiezza dell'intreccio
    const gap0 = Math.abs(bX - aX) / 2;
    const cx0 = (aX + bX) / 2;
    const sway = W * (mobile ? 0.10 : 0.13);
    const A = [], B = [];
    for (let y = startY, i = 0; y <= endY; y += stepY, i++) {
      const t = (y - startY) / (endY - startY);
      const centre = cx0 + (W * (mobile ? 0.62 : 0.66) - cx0) * smooth(clamp(t * 1.8)) +
        (Math.sin(i * 0.30) * sway + Math.sin(i * 0.10 + 1) * sway * 0.5) * smooth(clamp(t * 7));
      const g_ = gap0 + (amp - gap0) * smooth(clamp((y - startY) / 220));
      const ph = ((y - startY) / wave) * Math.PI * 2;
      const off = g_ * Math.cos(ph);
      A.push([clamp(centre - off, 12, W - 12), y]);
      B.push([clamp(centre + off, 12, W - 12), y]);
    }
    mains.push(addPath('r-main', A), addPath('r-main', B));

    // Viticci e foglie lungo i due steli, alternati
    const gap = mobile ? 92 : 66;
    let side = 1, v = 0;
    for (let y = startY + 36; y < endY - 90; y += gap * (0.8 + rand() * 0.5)) {
      const pts = v ? B : A;
      const idx = clamp(Math.round((y - startY) / stepY), 1, pts.length - 2);
      const bx = pts[idx][0], by = pts[idx][1];
      const th = Math.atan2(pts[idx + 1][1] - pts[idx - 1][1], pts[idx + 1][0] - pts[idx - 1][0]);
      if (rand() < 0.5) {                       // foglia
        const L = (mobile ? 36 : 48) + rand() * (mobile ? 16 : 24);
        const lf = leaf(bx, by, th + side * rad(38 + rand() * 24), L, rand);
        items.push({ attachY: by, span: 150, parts: [
          Object.assign(addD('r-lf', lf.vein), { from: 0, to: 0.55 }),
          Object.assign(addD('r-lf', lf.outline), { from: 0.3, to: 1 })] });
      } else {                                  // viticcio a spirale
        const len = (mobile ? 60 : 80) + rand() * (mobile ? 40 : 70);
        const tp = addPath('r-br', tendril(bx, by, th + side * rad(50 + rand() * 25), side, len, rand, false));
        tp.from = 0; tp.to = 1;
        items.push({ attachY: by, span: 230, parts: [tp] });
      }
      side = rand() < 0.7 ? -side : side;
      v = 1 - v;
    }
    built = true;
    cur = target = progress();
    draw(cur);
  }

  function progress() {
    const vh = window.innerHeight;
    const tip = window.scrollY + vh * 0.74;
    const maxTip = Math.max(docH - vh * 0.26, startY + 1);
    return clamp((tip - startY) / (maxTip - startY));
  }

  function setDraw(p, v) {
    const f = clamp(v);
    p.el.style.visibility = f > 0.004 ? 'visible' : 'hidden';
    p.el.style.strokeDashoffset = (p.len * (1 - f)).toFixed(1);
  }

  function draw(f) {
    if (!built) return;
    const yTip = startY + f * (docH - 30 - startY);
    for (let i = 0; i < mains.length; i++) setDraw(mains[i], f);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const l = smooth(clamp((yTip - it.attachY) / it.span));
      for (let j = 0; j < it.parts.length; j++) {
        const pt = it.parts[j];
        setDraw(pt, (l - pt.from) / (pt.to - pt.from));
      }
    }
  }

  function loop() {
    const d = target - cur;
    if (Math.abs(d) < 0.0004) { cur = target; draw(cur); running = false; return; }
    cur += d * 0.2;                              // piccola inerzia: crescita morbida
    draw(cur);
    requestAnimationFrame(loop);
  }
  function kick() {
    if (!built) return;
    target = progress();
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  let t = null;
  function rebuildSoon() {
    clearTimeout(t);
    t = setTimeout(function () {
      const w = document.documentElement.clientWidth;
      layer.style.height = '0px';
      const h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      layer.style.height = docH + 'px';
      if (!built || w !== W || Math.abs(h - docH) > 40) build();
    }, 200);
  }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', rebuildSoon);
  if ('ResizeObserver' in window) new ResizeObserver(rebuildSoon).observe(document.body);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(rebuildSoon);
  build();
  window.addEventListener('load', build);
})();
