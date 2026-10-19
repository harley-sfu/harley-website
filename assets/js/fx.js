/* HARLEY: two small touches on top of main.js, which they decorate but never change.
   A ship sails to the tree as you scroll and a serpent circles the rings.
   Off for prefers-reduced-motion and for ?calm in the URL. */
(function () {
  'use strict';
  if (/[?&]calm\b/.test(location.search) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, body = document.body;
  root.classList.add('fx-on');
  var SNS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  /* ---------------- colours follow the theme ---------------- */
  var P = {};
  function readPalette() {
    P.A = getComputedStyle(body).getPropertyValue('--A').trim();
    var t = root.getAttribute('data-theme');
    P.dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  }
  readPalette();
  new MutationObserver(function () { setTimeout(readPalette, 40); }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  var mq = matchMedia('(prefers-color-scheme: dark)');
  if (mq.addEventListener) mq.addEventListener('change', readPalette);

  /* ---------------- the voyage: a little ship sails the page, bound for the tree ---------------- */
  var topbar = document.querySelector('.topbar');
  var cv = document.createElement('canvas');
  cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true'); body.appendChild(cv);
  var ctx = cv.getContext('2d'), W = 0, H = 96, DPR = Math.min(2, window.devicePixelRatio || 1), voy = 0;
  function resize() { W = innerWidth; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  resize(); addEventListener('resize', resize);

  function drawVoyage(now) {
    var y0 = topbar.getBoundingClientRect().bottom + 8;
    var max = document.documentElement.scrollHeight - innerHeight;
    voy += ((max > 0 ? clamp(scrollY / max, 0, 1) : 0) - voy) * 0.08;
    var islandX = W - 24, shipX = 16 + voy * (islandX - 46);
    var wood = P.dark ? '#d8c3a0' : '#5a3f22';
    // the wake
    ctx.save(); ctx.globalAlpha = .55; ctx.strokeStyle = P.A; ctx.lineWidth = 1.4; ctx.beginPath();
    for (var x = 0; x <= shipX - 8; x += 4) {
      var y = y0 + Math.sin(x * .05 - now * .004) * 1.6;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
    // the island and its tree
    ctx.save(); ctx.globalAlpha = .9;
    ctx.fillStyle = P.dark ? '#8f7a55' : '#b9a077';
    ctx.beginPath(); ctx.ellipse(islandX, y0 + 2, 15, 5, 0, Math.PI, 0); ctx.fill();
    ctx.strokeStyle = P.dark ? '#a98a63' : '#6d4d2b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(islandX, y0 - 1); ctx.quadraticCurveTo(islandX + 2, y0 - 8, islandX - 1, y0 - 14); ctx.stroke();
    ctx.fillStyle = P.dark ? '#7fae5f' : '#5d8a45';
    [[-5, -16, 6], [4, -17, 6.5], [0, -21, 6]].forEach(function (b) { ctx.beginPath(); ctx.arc(islandX + b[0], y0 + b[1], b[2], 0, TAU); ctx.fill(); });
    ctx.restore();
    // the ship
    var bob = Math.sin(now * .004) * 1.3, tilt = Math.sin(now * .003) * .08;
    ctx.save(); ctx.translate(shipX, y0 - 1 + bob); ctx.rotate(tilt);
    ctx.fillStyle = wood;
    ctx.beginPath(); ctx.moveTo(-10, -1); ctx.lineTo(10, -1); ctx.lineTo(6, 4); ctx.lineTo(-7, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = wood; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, -14); ctx.stroke();
    ctx.fillStyle = '#f6efe0'; ctx.lineWidth = .8;
    ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(0, -9.5, 6, -12); ctx.lineTo(6, -4); ctx.quadraticCurveTo(0, -1.5, -6, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(6 + Math.sin(now * .012) * 1.5, -12.6); ctx.lineTo(0, -11.4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  /* ---------------- a serpent circles the rings ---------------- */
  var rings = document.getElementById('rings'), stepSnake = null, heroOn = true;
  if (rings) {
    new IntersectionObserver(function (es) { heroOn = es[0].isIntersecting; }).observe(rings);
    var snake = document.createElementNS(SNS, 'g'), segs = [], NSEG = 34, SPACING = 3;
    snake.setAttribute('class', 'fx-snake'); snake.setAttribute('aria-hidden', 'true'); rings.appendChild(snake);
    for (var s = NSEG - 1; s >= 0; s--) {
      var c = document.createElementNS(SNS, 'circle');
      c.setAttribute('r', (7.5 * (1 - s / NSEG * .8)).toFixed(2));
      c.setAttribute('class', s === 0 ? 'fx-snake-head' : 'fx-snake-seg');
      snake.appendChild(c); segs[s] = c;
    }
    var eye = document.createElementNS(SNS, 'circle'); eye.setAttribute('r', '1.7'); eye.setAttribute('class', 'fx-snake-eye'); snake.appendChild(eye);
    var tongue = document.createElementNS(SNS, 'path'); tongue.setAttribute('class', 'fx-snake-tongue'); snake.appendChild(tongue);
    var trail = [], ang = rand(0, TAU), lunge = 0;
    stepSnake = function (now, dt) {
      if (Math.random() < .002) lunge = 1;
      lunge *= .97;
      ang += (.0045 + lunge * .02) * dt * (1 + .4 * Math.sin(now * .0006));
      var r = 238 + 9 * Math.sin(ang * 6 + now * .001);
      trail.unshift([240 + r * Math.cos(ang), 240 + r * Math.sin(ang)]);
      if (trail.length > NSEG * SPACING + 2) trail.length = NSEG * SPACING + 2;
      for (var k = 0; k < NSEG; k++) {
        var p = trail[Math.min(k * SPACING, trail.length - 1)];
        segs[k].setAttribute('cx', p[0].toFixed(1)); segs[k].setAttribute('cy', p[1].toFixed(1));
      }
      var h = trail[0], b = trail[Math.min(3, trail.length - 1)], dir = Math.atan2(h[1] - b[1], h[0] - b[0]);
      eye.setAttribute('cx', (h[0] + Math.cos(dir) * 2.5 + Math.cos(dir - Math.PI / 2) * 3).toFixed(1));
      eye.setAttribute('cy', (h[1] + Math.sin(dir) * 2.5 + Math.sin(dir - Math.PI / 2) * 3).toFixed(1));
      if (Math.sin(now * .004) > .82) {
        var tx = h[0] + Math.cos(dir) * 15, ty = h[1] + Math.sin(dir) * 15, mx = h[0] + Math.cos(dir) * 8, my = h[1] + Math.sin(dir) * 8;
        tongue.setAttribute('d', 'M' + mx.toFixed(1) + ' ' + my.toFixed(1) + 'L' + tx.toFixed(1) + ' ' + ty.toFixed(1) +
          'M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'l' + (Math.cos(dir - .5) * 4).toFixed(1) + ' ' + (Math.sin(dir - .5) * 4).toFixed(1) +
          'M' + tx.toFixed(1) + ' ' + ty.toFixed(1) + 'l' + (Math.cos(dir + .5) * 4).toFixed(1) + ' ' + (Math.sin(dir + .5) * 4).toFixed(1));
      } else tongue.setAttribute('d', '');
    };
  }

  /* ---------------- one loop for both ---------------- */
  var last = performance.now();
  function frame(now) {
    var dt = Math.min(3, (now - last) / 16.67); last = now;
    ctx.clearRect(0, 0, W, H);
    if (!root.classList.contains('creatures-voyage')) drawVoyage(now);   // creatures.js sails it in the top bar instead
    if (stepSnake && heroOn) stepSnake(now, dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
