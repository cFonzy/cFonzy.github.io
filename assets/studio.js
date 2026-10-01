// maxq.games studio page: the launch telemetry readout follows the scroll.
// Decorative only (aria-hidden); the page works fully without it.
(() => {
  const hud = document.querySelector('.telemetry');
  if (!hud) return;
  const out = {};
  hud.querySelectorAll('[data-tm]').forEach(el => { out[el.dataset.tm] = el; });
  const stages = [...document.querySelectorAll('[data-t]')];
  const names = { liftoff: 'LIFTOFF', maxq: 'MAX Q', game: 'STAGE SEP', comms: 'ORBIT' };
  // rough ascent profile of a small orbital rocket: [t s, altitude km, speed km/h]
  const profile = [[0, 0, 0], [71, 12.5, 1650], [151, 62, 7400], [530, 210, 27400]];
  const interp = (x, xs, ys) => {
    if (x <= xs[0]) return ys[0];
    for (let i = 1; i < xs.length; i++) {
      if (x <= xs[i]) return ys[i - 1] + (ys[i] - ys[i - 1]) * (x - xs[i - 1]) / (xs[i] - xs[i - 1]);
    }
    return ys[ys.length - 1];
  };
  const pT = profile.map(p => p[0]), pAlt = profile.map(p => p[1]), pVel = profile.map(p => p[2]);
  const pad = n => String(Math.floor(n)).padStart(2, '0');

  let anchors = [];
  const measure = () => {
    const vh = innerHeight;
    // a stage's clock reads its own T when its top edge sits 30% down the screen
    anchors = stages.map((el, i) => ({
      y: i === 0 ? 0 : el.getBoundingClientRect().top + scrollY - vh * 0.3,
      t: +el.dataset.t, id: el.id
    }));
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
    const s = atEnd ? anchors[anchors.length - 1].y : scrollY;
    const t = interp(s, anchors.map(a => a.y), anchors.map(a => a.t));
    let ev = anchors[0].id;
    for (const a of anchors) if (s >= a.y - 1) ev = a.id;
    const q = Math.exp(-Math.pow((t - 71) / 42, 2));
    out.t.textContent = `${pad(t / 3600)}:${pad((t % 3600) / 60)}:${pad(t % 60)}`;
    out.alt.textContent = `${interp(t, pT, pAlt).toFixed(1)} KM`;
    out.vel.textContent = `${Math.round(interp(t, pT, pVel)).toLocaleString('en-US')} KM/H`;
    out.q.style.width = `${(q * 100).toFixed(1)}%`;
    out.qlabel.textContent = q > 0.93 ? 'MAX' : (t < 71 ? 'RISING' : 'FALLING');
    hud.classList.toggle('is-max', q > 0.93);
    out.ev.textContent = names[ev] || '';
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('load', () => { measure(); update(); });
  measure();
  update();
})();
