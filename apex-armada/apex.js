// maxq.games/apex-armada: clip autoplay in view, timing-tower highlight, trailer slot, screenshot lightbox.
// Everything degrades: without JS the clips keep their controls, links open the full images.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. gameplay clips: play muted while on screen (not under reduced motion), pause off screen
  const clips = document.querySelectorAll('video.loop');
  if (!reduce && 'IntersectionObserver' in window) {
    clips.forEach(v => v.removeAttribute('controls'));
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { v.preload = 'auto'; v.play().catch(() => { v.controls = true; }); }
      else v.pause();
    }), { threshold: 0.35 });
    clips.forEach(v => io.observe(v));
  }

  // 2. timing tower: light the brief on screen
  const links = [...document.querySelectorAll('.tower a')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window && links.length) {
    const seen = new Map();
    const tower = new IntersectionObserver(entries => {
      entries.forEach(e => seen.set(e.target.id, e.isIntersecting ? e.intersectionRect.height : 0));
      let best = null, h = 0;
      for (const [id, v] of seen) if (v > h) { h = v; best = id; }
      links.forEach(a => a.removeAttribute('aria-current'));
      if (best && map.get(best)) {
        const a = map.get(best);
        a.setAttribute('aria-current', 'true');
        const ol = a.closest('.tower');
        if (ol && ol.scrollWidth > ol.clientWidth) ol.scrollTo({ left: a.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
      }
    }, { rootMargin: '-25% 0px -45% 0px', threshold: [0, .25, .5, .75, 1] });
    document.querySelectorAll('.bf').forEach(s => tower.observe(s));
  }

  // 3. trailer: YouTube (privacy-enhanced) loads only on click; placeholder id = "coming soon"
  const slot = document.querySelector('[data-youtube]');
  if (slot) {
    const id = slot.dataset.youtube || '';
    const btn = slot.querySelector('.trailer__play');
    if (!/^[\w-]{11}$/.test(id)) {
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('aria-label', 'Trailer coming soon');
      const soon = document.querySelector('.trailer__soon'); if (soon) soon.hidden = false;
    } else {
      btn.addEventListener('click', () => {
        const f = document.createElement('iframe');
        f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
        f.title = 'Apex Armada trailer';
        f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
        f.allowFullscreen = true;
        btn.replaceWith(f);
        f.focus();
      });
    }
  }

  // 4. screenshot lightbox (native <dialog>: Esc and the close button work by keyboard)
  const box = document.querySelector('.lightbox');
  if (box && typeof box.showModal === 'function') {
    const img = box.querySelector('img');
    document.querySelectorAll('.gallery a, .gallery-press a.tile__media').forEach(a => a.addEventListener('click', ev => {
      ev.preventDefault();
      const t = a.querySelector('img');
      img.src = a.dataset.full || a.href;
      img.alt = t ? t.alt : '';
      box.showModal();
    }));
    box.addEventListener('click', ev => { if (ev.target === box) box.close(); });
    box.addEventListener('close', () => { img.removeAttribute('src'); });
  }
})();
