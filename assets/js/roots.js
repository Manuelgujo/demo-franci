/* Radici del papavero: partono dal fondo del disegno nell'hero e, scorrendo
   la pagina, crescono in background; risalendo si ritirano. Puro decoro:
   aria-hidden, nessun puntatore, nascoste con prefers-reduced-motion e in stampa.
   Il disegno e' generato a runtime (seme fisso: stessa forma a ogni visita)
   e si adatta a larghezza e altezza della pagina. */
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
  let main = null, branches = [], dots = [];
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

  function addPath(cls, pts) {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('class', cls);
    p.setAttribute('d', toPath(pts));
    svg.appendChild(p);
    const len = p.getTotalLength();
    p.style.strokeDasharray = len + ' ' + (len + 2);
    p.style.strokeDashoffset = len;
    p.style.visibility = 'hidden';
    return { el: p, len: len, pts: pts };
  }

  /* Un ramo: parte inclinato verso il basso, si raddrizza come una radice che
     cerca terreno, e finisce con un ricciolo (whimsical). */
  function growBranch(x, y, side, length, rand, small) {
    const pts = [[x, y]];
    let th = side > 0 ? rad(18 + rand() * 30) : rad(180 - (18 + rand() * 30));
    const n = small ? 9 : 14, curlN = small ? 7 : 9;
    const step = length / n;
    for (let i = 0; i < n; i++) {
      th += (rad(90) - th) * 0.07 + Math.sin(i * 1.3 + rand() * 2) * 0.09;
      x += Math.cos(th) * step; y += Math.sin(th) * step;
      pts.push([clamp(x, 6, W - 6), y]);
    }
    let r = small ? 9 : 14, turn = side > 0 ? -1 : 1, s2 = step * 0.55;
    for (let i = 0; i < curlN; i++) {          // ricciolo finale: curva sempre piu' stretta
      th += turn * (0.55 + i * 0.11);
      s2 *= 0.84;
      x += Math.cos(th) * s2 * (r / 12 + 0.4); y += Math.sin(th) * s2 * (r / 12 + 0.4);
      pts.push([clamp(x, 6, W - 6), y]);
    }
    return pts;
  }

  function build() {
    layer.style.height = '0px';
    W = document.documentElement.clientWidth;
    docH = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    layer.style.height = docH + 'px';
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + docH);
    svg.setAttribute('width', W); svg.setAttribute('height', docH);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    branches = []; dots = [];

    const mobile = W < 640;
    const art = document.querySelector('.hero-art');
    if (art) {
      const r = art.getBoundingClientRect();
      startX = r.left + window.scrollX + r.width * 0.42;
      startY = r.bottom + window.scrollY - r.height * 0.05;
    } else {
      startX = W * 0.86; startY = 90;
    }
    const endY = docH - 30;
    if (endY - startY < 200) { built = false; return; }

    const rand = rng(20240611);
    const sway = W * (mobile ? 0.10 : 0.13);
    const pts = [];
    const stepY = 36;
    for (let y = startY, i = 0; y <= endY; y += stepY, i++) {
      const t = (y - startY) / (endY - startY);
      const drift = (W * (mobile ? 0.62 : 0.66) - startX) * smooth(clamp(t * 1.8));
      const x = startX + drift + Math.sin(i * 0.33) * sway * Math.min(1, t * 6) + Math.sin(i * 0.11 + 1) * sway * 0.5;
      pts.push([clamp(x, 14, W - 14), y]);
    }
    main = addPath('r-main', pts);

    // Ramificazioni lungo il tronco principale, alternate a destra e a sinistra
    const gap = mobile ? 230 : 185;
    let side = 1;
    for (let y = startY + 160; y < endY - 120; y += gap * (0.8 + rand() * 0.5)) {
      const idx = clamp(Math.round((y - startY) / stepY), 0, pts.length - 1);
      const bx = pts[idx][0], by = pts[idx][1];
      const len = (mobile ? 90 : 150) + rand() * (mobile ? 90 : 170);
      const bp = growBranch(bx, by, side, len, rand, false);
      const br = addPath('r-br', bp);
      br.attachY = by; br.span = 260; br.twigs = [];
      // un rametto con ricciolo, a meta' ramo, sul lato opposto
      const k = Math.floor(bp.length * 0.5);
      const tw = addPath('r-tw' + (rand() > 0.6 ? ' sage' : ''),
        growBranch(bp[k][0], bp[k][1], -side, (mobile ? 40 : 55) + rand() * 40, rand, true));
      br.twigs.push(tw);
      if (rand() > 0.35) {                      // pallino-seme alla punta di alcuni rametti
        const c = document.createElementNS(NS, 'circle');
        const e = tw.pts[tw.pts.length - 1];
        c.setAttribute('cx', e[0].toFixed(1)); c.setAttribute('cy', e[1].toFixed(1)); c.setAttribute('r', '3.2');
        svg.appendChild(c); tw.dot = c;
      }
      branches.push(br);
      side = -side;
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
    setDraw(main, f);
    for (let i = 0; i < branches.length; i++) {
      const b = branches[i];
      const lb = smooth(clamp((yTip - b.attachY) / b.span));
      setDraw(b, lb);
      for (let j = 0; j < b.twigs.length; j++) {
        const t = b.twigs[j];
        const lt = smooth(clamp((lb - 0.5) / 0.5));
        setDraw(t, lt);
        if (t.dot) t.dot.classList.toggle('on', lt > 0.97);
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
