// Release: Nov 19, 2026 — using ET (Rockstar HQ timezone)
const RELEASE_DATE = new Date('2026-11-19T00:00:00-05:00').getTime();
const ORIGIN_DATE = new Date('2025-05-06T00:00:00-05:00').getTime(); // Trailer 2 drop as progress origin

const $ = id => document.getElementById(id);

const els = {
  d: $('days'), h: $('hours'), m: $('minutes'), s: $('seconds'),
  md: $('mDays'), mh: $('mHours'), mm: $('mMinutes'), ms: $('mSeconds'),
  pf: $('progressFill'), pl: $('progressLabel'),
};

const prev = { d: -1, h: -1, m: -1, s: -1 };

const pad = (n, w = 2) => String(Math.max(0, n)).padStart(w, '0');

function setNum(el, val, key, width = 2) {
  if (!el) return;
  if (prev[key] !== val) {
    el.textContent = pad(val, width);
    el.classList.remove('flip');
    void el.offsetWidth;
    el.classList.add('flip');
    prev[key] = val;
  }
}

function tick() {
  const now = Date.now();
  let diff = RELEASE_DATE - now;

  if (diff <= 0) {
    ['d','h','m','s'].forEach(k => { if (els[k]) els[k].textContent = k === 'd' ? '000' : '00'; });
    if (els.md) els.md.textContent = '000';
    ['mh','mm','ms'].forEach(k => { if (els[k]) els[k].textContent = '00'; });
    if (els.pf) els.pf.style.width = '100%';
    if (els.pl) {
      const dict = window.__dict;
      els.pl.textContent = (dict && dict["cd.released"]) || '100% — released';
    }
    return;
  }

  const SEC = 1000, MIN = 60 * SEC, HR = 60 * MIN, DAY = 24 * HR;
  const d = Math.floor(diff / DAY); diff -= d * DAY;
  const h = Math.floor(diff / HR);  diff -= h * HR;
  const m = Math.floor(diff / MIN); diff -= m * MIN;
  const s = Math.floor(diff / SEC);

  setNum(els.d, d, 'd', 3);
  setNum(els.h, h, 'h');
  setNum(els.m, m, 'm');
  setNum(els.s, s, 's');

  if (els.md) els.md.textContent = pad(d, 3);
  if (els.mh) els.mh.textContent = pad(h);
  if (els.mm) els.mm.textContent = pad(m);
  if (els.ms) els.ms.textContent = pad(s);

  // Progress bar (ORIGIN → RELEASE)
  const total = RELEASE_DATE - ORIGIN_DATE;
  const elapsed = Date.now() - ORIGIN_DATE;
  const pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
  if (els.pf) els.pf.style.width = pct.toFixed(2) + '%';
  if (els.pl) {
    const dict = window.__dict;
    const tmpl = (dict && dict["cd.complete"]) || "{p}% complete";
    els.pl.textContent = tmpl.replace("{p}", pct.toFixed(1));
  }
}

function scheduleTick() {
  tick();
  const now = Date.now();
  const delay = 1000 - (now % 1000) + 8;
  setTimeout(scheduleTick, delay);
}
scheduleTick();

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) tick();
});

// ===== Sticky mini-bar on scroll =====
const miniBar = document.getElementById('miniBar');
let lastY = 0;
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (y > 400) miniBar.classList.add('show');
  else miniBar.classList.remove('show');
  lastY = y;
}, { passive: true });

// ===== Mouse parallax (hero only) =====
const parallaxEls = document.querySelectorAll('[data-parallax]');
const hero = document.getElementById('hero');
let raf = 0;
let tx = 0, ty = 0, cx = 0, cy = 0;

hero?.addEventListener('mousemove', (e) => {
  const r = hero.getBoundingClientRect();
  tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
  ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  if (!raf) raf = requestAnimationFrame(animateParallax);
});
hero?.addEventListener('mouseleave', () => {
  tx = 0; ty = 0;
  if (!raf) raf = requestAnimationFrame(animateParallax);
});

function animateParallax() {
  cx += (tx - cx) * 0.08;
  cy += (ty - cy) * 0.08;
  parallaxEls.forEach(el => {
    const k = parseFloat(el.dataset.parallax) || 0.2;
    el.style.transform = `translate3d(${cx * k * 18}px, ${cy * k * 18}px, 0)`;
  });
  if (Math.abs(cx - tx) > 0.001 || Math.abs(cy - ty) > 0.001) {
    raf = requestAnimationFrame(animateParallax);
  } else {
    raf = 0;
  }
}

// ===== Reveal on scroll =====
const revealTargets = document.querySelectorAll('.section, .marquee');
revealTargets.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('in');
      io.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
revealTargets.forEach(el => io.observe(el));

// ===== Stat counter =====
const statNums = document.querySelectorAll('.stat-num');
const statFinal = new WeakMap();

function activeSuffix(el) {
  return el.dataset.activeSuffix !== undefined
    ? el.dataset.activeSuffix
    : (el.dataset.suffix || '');
}

const statIO = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    const el = en.target;
    const target = parseInt(el.dataset.target, 10) || 0;
    const dur = 1400;
    const start = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function step(now) {
      const t = Math.min(1, (now - start) / dur);
      const v = Math.floor(target * ease(t));
      el.textContent = v + activeSuffix(el);
      if (t < 1) requestAnimationFrame(step);
      else {
        el.textContent = target + activeSuffix(el);
        statFinal.set(el, true);
      }
    }
    requestAnimationFrame(step);
    statIO.unobserve(el);
  });
}, { threshold: 0.5 });
statNums.forEach(el => statIO.observe(el));

// On lang change, refresh already-counted stats with new suffix
document.addEventListener('langchange', () => {
  statNums.forEach(el => {
    if (statFinal.get(el)) {
      const target = parseInt(el.dataset.target, 10) || 0;
      el.textContent = target + activeSuffix(el);
    }
  });
});
