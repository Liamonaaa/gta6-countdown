const RELEASE_DATE = new Date('2026-11-19T00:00:00-05:00').getTime();

const els = {
  months: document.getElementById('months'),
  weeks: document.getElementById('weeks'),
  days: document.getElementById('days'),
  hours: document.getElementById('hours'),
  minutes: document.getElementById('minutes'),
  seconds: document.getElementById('seconds'),
};

const prev = { months: -1, weeks: -1, days: -1, hours: -1, minutes: -1, seconds: -1 };

function pad(n, w = 2) {
  return String(Math.max(0, n)).padStart(w, '0');
}

function update(el, val, key) {
  const str = pad(val);
  if (prev[key] !== val) {
    el.textContent = str;
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
    Object.values(els).forEach(e => e.textContent = '00');
    document.querySelector('.countdown-title').textContent = 'AVAILABLE NOW';
    return;
  }

  const SEC = 1000;
  const MIN = 60 * SEC;
  const HR = 60 * MIN;
  const DAY = 24 * HR;
  const WEEK = 7 * DAY;

  const nowD = new Date(now);
  const relD = new Date(RELEASE_DATE);
  let months = (relD.getFullYear() - nowD.getFullYear()) * 12 + (relD.getMonth() - nowD.getMonth());
  const anchor = new Date(nowD.getFullYear(), nowD.getMonth() + months, nowD.getDate(), nowD.getHours(), nowD.getMinutes(), nowD.getSeconds());
  if (anchor.getTime() > RELEASE_DATE) months--;
  const monthAnchor = new Date(nowD.getFullYear(), nowD.getMonth() + months, nowD.getDate(), nowD.getHours(), nowD.getMinutes(), nowD.getSeconds()).getTime();
  let rem = RELEASE_DATE - monthAnchor;

  const weeks = Math.floor(rem / WEEK); rem -= weeks * WEEK;
  const days = Math.floor(rem / DAY); rem -= days * DAY;
  const hours = Math.floor(rem / HR); rem -= hours * HR;
  const minutes = Math.floor(rem / MIN); rem -= minutes * MIN;
  const seconds = Math.floor(rem / SEC);

  update(els.months, months, 'months');
  update(els.weeks, weeks, 'weeks');
  update(els.days, days, 'days');
  update(els.hours, hours, 'hours');
  update(els.minutes, minutes, 'minutes');
  update(els.seconds, seconds, 'seconds');
}

tick();
setInterval(tick, 1000);
