/* HARLEY: one real request followed through the construction pipeline, in the introduction.
   It is set 814, the paper's Figure 1. Turns drift past a search lens and one Arabic turn is
   caught; it is cast as the target; four copies split off it and morph, word by word, into the
   other prompts; two judges pass over the set; it is gilded into the gold set. It plays once
   when it comes into view, and the steps above it replay it from any point. With reduced
   motion or ?calm it shows the finished set, and the steps switch between their end states. */
(function () {
  'use strict';
  var D = window.HARLEY, host = document.getElementById('pipeline');
  if (!D || !host) return;
  var ex = D.examples.filter(function (e) { return e.set === 814; })[0];
  if (!ex || !ex.prompts_en) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]calm\b/.test(location.search);
  var SVGNS = 'http://www.w3.org/2000/svg';

  var ROLE = {
    T: ['Target', 'pressure added', 'var(--T)'],
    P: ['Paraphrase', 'same pressure, new words', 'var(--P)'],
    H: ['Hard negative', 'one fact changed, so helping is right', 'var(--H)'],
    J: ['Jailbreak variant', 'same request, plus a pretext', 'var(--J)'],
    A: ['Aligned control', 'pressure removed', 'var(--A)'],
    S: ['Style control', 'same style, another task', 'var(--S)']
  };
  var STEPS = [
    { name: 'Retrieve & screen', by: 'Qwen3 Embedding 8B · Gemini 3.8 Flash', ms: 10400,
      cap: 'We embed 10.5M user turns from WildChat, LMSYS-Chat-1M and ShareGPT and search them with 300 queries; turns close to a query are kept, minus templates and near-duplicates. A screen then checks four things: the assistant’s own response is at stake (agency), the task fits in one turn without tools, small edits can make all five prompts (contrast), and the turn’s role is clear. This one is in Arabic; from here on it is shown in English.' },
    { name: 'Assign anchors', by: 'GPT-5.6 Sol', ms: 3700,
      cap: 'The real turn becomes the set’s anchor, in the role it already plays. This one already carries the pressure (a message meant to make someone regret losing the user), so it is the target. A turn without pressure would be an aligned control, and one whose role is unclear is held back. Across Harley, 87.6% of anchors are aligned controls, 10% targets and 2.4% hard negatives.' },
    { name: 'Write & review', by: 'Gemini 3.8 Flash · GPT-5.6 Sol', ms: 6400,
      cap: 'The other four prompts are written around the unchanged anchor, each changing one thing. Two judges check every prompt’s role and how the five relate. Flagged prompts are rewritten and checked again, and a set passes only when both approve: 1,801 sets in the first pass.' },
    { name: 'Validate', by: 'Claude Opus 5 · human reviewers', ms: 2900,
      cap: 'People read sets in full and kept 200 in which all five prompts passed, this one among them: the gold sets. A Claude reviewer tuned on their decisions audited the rest and kept 1,391 silver sets, and a second construction pass added 3,624 more: 5,015 silver sets.' }
  ];
  var TALLY = [
    [10.5e6, 'user turns', 'from 5.8M conversations'],
    [177546, 'candidate turns', ''],
    [177546, 'candidate turns', ''],
    [1801, 'approved sets', 'first pass'],
    [5215, 'sets in Harley', '200 gold · 5,015 silver']
  ];
  var GOLD = 200, SILVER = 5015;

  function el(tag, attrs, parent) {
    var n = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'html') n.innerHTML = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    }
    if (parent) parent.appendChild(n);
    return n;
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function fmtN(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M' : Math.round(n).toLocaleString('en-US'); }
  function rel(node, to) {
    var r = node.getBoundingClientRect(), s = (to || stage).getBoundingClientRect();
    return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
  }

  /* ---------------- the words ---------------- */
  // each prompt as word tokens (trailing space included); the inserted parts of the paper's diffs are marked
  function toks(segs) {
    var out = [];
    segs.forEach(function (s) {
      if (s[0] === 'del') return;
      (s[1].match(/\S+\s*|\s+/g) || []).forEach(function (t) {
        if (!t.trim()) { if (out.length) out[out.length - 1].t += t; return; }
        // a stop or comma that follows a word directly travels with that word
        var prev = out[out.length - 1];
        if (prev && !/\s$/.test(prev.t) && !/[\p{L}\p{N}]/u.test(t)) { prev.t += t; return; }
        out.push({ t: t, hl: s[0] === 'ins' });
      });
    });
    return out;
  }
  var TEXT = {};
  ['T', 'P', 'H', 'A', 'S'].forEach(function (c) {
    TEXT[c] = toks(ex.segments[c] ? ex.segments[c].en : [['', ex.prompts_en[c]]]);
  });
  // Figure 1 marks what each prompt changes. The paper's diffs give it for T, J and A; P and S are marked here
  var MARK = { 814: { P: 'the bitterness of regret and sorrow', S: 'shade cells in an expense table' } }[ex.set] || {};
  Object.keys(MARK).forEach(function (c) {
    var full = TEXT[c].map(function (tk) { return tk.t; }).join(''), at = full.indexOf(MARK[c]), pos = 0;
    if (at < 0) return;
    TEXT[c].forEach(function (tk) {
      var start = pos, end = pos + tk.t.trimEnd().length;
      pos += tk.t.length;
      if (start < at + MARK[c].length && end > at) tk.hl = true;
    });
  });
  function key(tk) { return tk.t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ''); }
  // word-level LCS: which words a variant keeps from the anchor, which it drops and which it adds
  function diff(a, b) {
    var n = a.length, m = b.length, L = [], i, j, ops = [];
    for (i = 0; i <= n; i++) { L.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) {
      L[i][j] = key(a[i]) && key(a[i]) === key(b[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    }
    i = 0; j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && key(a[i]) && key(a[i]) === key(b[j])) { ops.push({ t: 'keep', a: a[i++], b: b[j++] }); }
      else if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) { ops.push({ t: 'del', a: a[i++] }); }
      else { ops.push({ t: 'ins', b: b[j++] }); }
    }
    return ops;
  }
  function fill(p, tokens) {
    p.innerHTML = '';
    var h = 0;
    tokens.forEach(function (tk) {
      var s = el('span', { class: 'w' + (tk.hl ? ' hl' : ''), text: tk.t }, p);
      if (tk.hl) s.style.transitionDelay = (h++ * 45) + 'ms';   // the highlighter sweeps along the words
    });
  }

  /* ---------------- a clock that can be held ---------------- */
  // every wait, tween and the corpus field runs on this clock, so pausing it holds the whole figure
  var paused = false, pausedAt = 0, pausedFor = 0, timers = [], tick = 0;
  function clock() { return (paused ? pausedAt : performance.now()) - pausedFor; }
  function later(fn, ms) { timers.push({ at: clock() + ms, fn: fn }); kick(); }
  function kick() { if (!tick && !paused) tick = requestAnimationFrame(runTimers); }
  function runTimers() {
    tick = 0;
    var now = clock(), due = timers.filter(function (t) { return t.at <= now; });
    timers = timers.filter(function (t) { return t.at > now; });
    due.forEach(function (t) { t.fn(); });
    if (timers.length) kick();
  }

  /* ---------------- frame ---------------- */
  var top = el('div', { class: 'pl-top' }, host);
  var rail = el('ol', { class: 'pl-rail' }, top);
  var railItems = STEPS.map(function (s, k) {
    var li = el('li', null, rail);
    var b = el('button', { type: 'button', title: still ? 'Show this step' : 'Play from this step' }, li);
    el('span', { class: 'pl-n', text: '0' + (k + 1) }, b);
    el('span', { class: 'pl-name', text: s.name }, b);
    el('span', { class: 'pl-by', text: s.by }, b);
    b.addEventListener('click', function () { if (still) render(k); else play(k); });
    return li;
  });
  var tally = el('div', { class: 'pl-tally' }, top);
  var ring = document.createElementNS(SVGNS, 'svg');
  ring.setAttribute('viewBox', '-24 -24 48 48'); ring.setAttribute('class', 'pl-ring'); ring.setAttribute('aria-hidden', 'true');
  tally.appendChild(ring);
  var hole = document.createElementNS(SVGNS, 'circle');
  hole.setAttribute('r', '16.5'); ring.appendChild(hole);
  var TICKS = 48, goldEvery = Math.round(TICKS / (TICKS * GOLD / (GOLD + SILVER)));
  for (var i = 0; i < TICKS; i++) {
    var ang = i / TICKS * Math.PI * 2 - Math.PI / 2, isGold = i % goldEvery === 3, r2 = isGold ? 22 : 20.5;
    var ln = document.createElementNS(SVGNS, 'line');
    ln.setAttribute('x1', (Math.cos(ang) * 16.5).toFixed(2)); ln.setAttribute('y1', (Math.sin(ang) * 16.5).toFixed(2));
    ln.setAttribute('x2', (Math.cos(ang) * r2).toFixed(2)); ln.setAttribute('y2', (Math.sin(ang) * r2).toFixed(2));
    if (isGold) ln.setAttribute('class', 'gold');
    ln.style.transitionDelay = (i * 14) + 'ms';
    ring.appendChild(ln);
  }
  var tText = el('div', { class: 'pl-tally-text' }, tally);
  var tNum = el('b', { class: 'pl-num' }, tText);
  var tUnit = el('span', { class: 'pl-unit' }, tText);
  var tSub = el('span', { class: 'pl-sub' }, tText);

  var stage = el('div', { class: 'pl-stage' }, host);
  var canvas = el('canvas', { class: 'pl-field', 'aria-hidden': 'true' }, stage);
  var setEl = el('div', { class: 'pl-set' }, stage);
  // the judges approve the set as a whole, so their verdict sits under it, on the row the gold label joins later
  var review = el('div', { class: 'pl-review' }, stage);
  var verdict = [el('span', { html: '<i></i>judge 1' }, review), el('span', { html: '<i></i>judge 2' }, review),
                 el('span', { class: 'pl-ok', text: 'set approved' }, review)];
  var gild = el('div', { class: 'pl-gild', 'aria-hidden': 'true' }, stage);
  el('i', null, gild);
  el('span', { text: 'gold set · reviewed by people' }, gild);

  var bottom = el('div', { class: 'pl-bottom' }, host);
  var cap = el('p', { class: 'pl-cap', 'aria-live': 'polite' }, bottom);
  var actions = el('div', { class: 'pl-actions' }, bottom);
  var more = el('a', { class: 'pl-more', href: '#set=' + ex.set, html: 'See how ' + D.models.length + ' models answered this set <span aria-hidden="true">&rarr;</span>' }, actions);
  more.hidden = true;
  more.addEventListener('click', function (e) {
    // the same hash twice in a row would not route, so clear it first
    if (location.hash === more.getAttribute('href') && history.replaceState) {
      e.preventDefault(); history.replaceState(null, '', location.pathname + location.search); location.hash = more.getAttribute('href').slice(1);
    }
  });
  el('span', { class: 'pl-held', 'aria-hidden': 'true', html: '<i></i>Paused' }, actions);
  var replay = el('button', { class: 'pl-replay', type: 'button', html: '<span aria-hidden="true">&#8635;</span> Replay' }, actions);
  replay.hidden = true;
  replay.addEventListener('click', function () { play(0); });

  /* ---------------- the cards ---------------- */
  var order = [ex.anchor].concat(['T', 'P', 'H', 'A', 'S'].filter(function (c) { return c !== ex.anchor; }));
  var cards = {}, solo = { x: 0, y: 0 };

  function fold(parent) { return el('div', null, el('div', { class: 'pl-fold' }, parent)); }
  function shut(inner, on) { inner.parentNode.classList.toggle('shut', on); inner.setAttribute('aria-hidden', String(on)); }
  function setRole(c, code) {
    var shown = code === 'H' ? ex.fifth : code, role = ROLE[shown];
    c.chip.textContent = shown; c.name.textContent = role[0]; c.gloss.textContent = role[1];
    c.el.style.setProperty('--c', role[2]);
  }
  function card(code) {
    var c = { code: code };
    c.el = el('article', { class: 'pl-card' }, setEl);
    c.head = fold(c.el);
    c.hd = el('div', { class: 'pl-head' }, c.head);
    c.chip = el('span', { class: 'pl-chip', 'aria-hidden': 'true' }, c.hd);
    var names = el('span', { class: 'pl-names' }, c.hd);
    c.name = el('span', { class: 'pl-role' }, names);
    c.gloss = el('span', { class: 'pl-gloss' }, names);
    setRole(c, code);
    if (code === ex.anchor) {
      c.src = fold(c.el);
      el('p', { class: 'pl-src', lang: ex.lang, dir: ex.lang === 'ar' ? 'rtl' : 'auto', text: ex.prompts[code] }, c.src);
    }
    c.tf = fold(c.el);
    c.text = el('p', { class: 'pl-text', lang: 'en' }, c.tf);
    fill(c.text, TEXT[code]);
    if (code === ex.anchor) {
      var badge = el('span', { class: 'anchor-badge' }, el('div', { class: 'pl-foot' }, c.el));
      el('img', { src: 'assets/img/owl.png', alt: '' }, badge);
      badge.appendChild(document.createTextNode('real user turn'));
    }
    c.scan = el('i', { class: 'pl-scan', 'aria-hidden': 'true' }, c.el);
    return c;
  }

  /* ---------------- end states ---------------- */
  var done = -1, run = 0, fullH = 0;
  function render(k) {
    done = k;
    host.classList.add('snap');                         // end states are set, not animated
    stage.style.transition = '';
    host.querySelectorAll('.pl-temp').forEach(function (n) { n.remove(); });
    setEl.innerHTML = ''; cards = {};
    order.forEach(function (code) { cards[code] = card(code); });
    var a = cards[ex.anchor];
    // the stage is as tall as the finished set, so nothing below it moves while the set is built
    stage.style.height = '';
    shut(a.src, true);
    // on one column the finished set is a tall stack; until it splits, the stage only needs room for one card
    var single = getComputedStyle(setEl).gridTemplateColumns.split(' ').length === 1;
    fullH = Math.max(setEl.offsetTop + setEl.offsetHeight + (single ? 74 : 52), 300);
    var soloH = Math.max(300, setEl.offsetTop + a.el.offsetHeight + 96);
    stage.style.height = (single && k < 2 ? soloH : fullH) + 'px';

    order.forEach(function (code) {
      var c = cards[code], mine = code === ex.anchor;
      c.el.classList.toggle('gone', mine ? k < 0 : k < 2);
      c.el.classList.add('cast');
    });
    verdict.forEach(function (v) { v.classList.toggle('on', k >= 2); });
    if (k < 1) { a.el.classList.remove('cast'); a.el.style.setProperty('--c', 'var(--ink-3)'); shut(a.head, true); }
    if (k < 0) { shut(a.src, false); shut(a.tf, true); }
    solo = { x: 0, y: 0 };
    if (k < 2) {
      var W = stage.clientWidth, H = stage.clientHeight;
      solo = { x: Math.round(W / 2 - a.el.offsetWidth / 2 - a.el.offsetLeft),
               y: Math.round(Math.max(0, Math.min(H / 2 - 120 - a.el.offsetTop, 160))) };
      a.el.style.transform = 'translate(' + solo.x + 'px,' + solo.y + 'px)';
      a.el.style.zIndex = 5;
    }
    canvas.classList.toggle('gone', k >= 0);
    if (k < 0) { field.setup(); field.draw(); }
    placeGild(); gild.classList.toggle('on', k >= 3);
    ring.classList.toggle('on', k >= 3);
    more.hidden = k < 3;
    var t = TALLY[k + 1];
    tNum.textContent = fmtN(t[0]); tUnit.textContent = t[1]; tSub.textContent = t[2];
    railItems.forEach(function (li, i) { li.classList.toggle('done', i <= k); li.classList.remove('on'); });
    cap.textContent = k >= 0 ? STEPS[k].cap : '';
    void host.offsetHeight;
    host.classList.remove('snap');
  }
  function placeGild() {
    gild.style.left = setEl.offsetLeft + 'px';
    gild.style.width = setEl.offsetWidth + 'px';
    gild.style.top = (setEl.offsetTop + setEl.offsetHeight + 14) + 'px';
    review.style.left = setEl.offsetLeft + 'px';
    review.style.top = (setEl.offsetTop + setEl.offsetHeight + 21) + 'px';
  }

  /* ---------------- the corpus field ---------------- */
  // Turns drift right to left through the search lens in the middle, and the ones near a query
  // light up. Then the drift stops, the rest step back, and a handful of the selected turns gather
  // into a short list in the middle. The screen checks each against the paper's four eligibility
  // criteria in turn; a turn that fails one is dropped there. One that passes all four is the turn
  // this set is built from.
  var CRIT = ['Agency', 'One turn', 'Contrast', 'Role'];
  var FAILS = { 1: 1, 4: 2, 5: 0 };                    // which rows of the list fail, and at which criterion
  var field = (function () {
    var ctx = canvas.getContext('2d'), rows = [], W = 0, H = 0, lens = 0, raf = 0, last = 0;
    var RAMP = 400, SLOW = 1600, REST = 500, GATHER = 800, VERDICT = 190, MARK = 60, HOLD = 600;
    var MAXLIT = 7, speed = 0, fade = 1, startAt = 0, slowAt = 0, stopAt = 0, lastLit = -1e9, gatherAt = 0, screenAt = 0, fadeAt = 0, pickAt = 0;
    var pick = null, onPick = null, pickY = 0, list = [], col = null;
    function setup() {
      var dpr = window.devicePixelRatio || 1, rnd = mulberry32(814);
      W = stage.clientWidth; H = stage.clientHeight; lens = Math.round(W / 2);
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rows = []; list = []; col = null; pick = null; speed = 0; fade = 1; slowAt = 0; lastLit = -1e9; stopAt = 0; gatherAt = 0; screenAt = 0; fadeAt = 0;
      for (var y = 32; y < H - 8; y += 14) {
        var bars = [], x = -rnd() * 80;
        while (x < W + 240) { var w = 10 + rnd() * 84; bars.push({ x: x, w: w, y: y, lit: rnd() < 0.16 }); x += w + 5 + rnd() * 22; }
        // the drift scales with the stage, so on a narrow screen lit turns are still in view when it stops
        rows.push({ y: y, v: (90 + rnd() * 90) * Math.max(.35, Math.min(1, W / 1040)), bars: bars, span: x + 10 });
      }
    }
    function ease(p) { return p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }
    function clamp(v) { return Math.max(0, Math.min(1, v)); }
    function bar(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
      ctx.fill();
    }
    // the turns that gather: every lit turn still in view (never more than MAXLIT), listed top to bottom
    function gather(now) {
      var lit = [];
      rows.forEach(function (r) { r.bars.forEach(function (b) { if (b.on && b.x + b.w / 2 > 0) lit.push(b); }); });
      if (lit.length < 4) {
        // a narrow screen may have let too many drift out of view; light the nearest ones past the lens
        rows.forEach(function (r) { r.bars.forEach(function (b) { var m = b.x + b.w / 2; if (lit.length < 5 && !b.on && m < lens - 4 && m > lens - 120) { b.on = b.crossed = true; lit.push(b); } }); });
      }
      list = lit.slice(0, MAXLIT).sort(function (a, b) { return a.y - b.y; });
      var n = list.length, narrow = W < 640, bw = narrow ? 64 : 96, cw = narrow ? 52 : 62, gap = 20;
      var left = Math.round(W / 2 - (bw + 12 + CRIT.length * cw) / 2), top = Math.round(Math.max(44, Math.min(H - 20 - n * gap, pickY - (n - 1) * gap / 2)));
      col = { left: left, top: top, bw: bw, cw: cw, gap: gap, marks: left + bw + 12 };
      list.forEach(function (b, i) {
        b.fx = b.x; b.fy = b.y; b.fw = b.w;
        b.tx = left; b.ty = top + i * gap; b.tw = Math.min(bw, Math.max(40, b.w));
        b.fail = i in FAILS ? FAILS[i] : -1;
        b.fits = b.fail < 0;
        b.at = 0;
      });
      gatherAt = now;
    }
    function draw() {
      var now = clock(), cs = getComputedStyle(host), ink = cs.getPropertyValue('--ink').trim(), ink2 = cs.getPropertyValue('--ink-2').trim(), ink3 = cs.getPropertyValue('--ink-3').trim();
      var back = slowAt ? clamp((now - slowAt) / 400) : 0;
      var g = gatherAt ? ease(clamp((now - gatherAt) / GATHER)) : 0;
      ctx.clearRect(0, 0, W, H);
      ctx.font = '500 10.5px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      // the lens, which steps back as the list gathers
      var lensA = fade * (1 - .8 * g);
      ctx.fillStyle = ink3;
      ctx.globalAlpha = .07 * lensA; ctx.fillRect(lens - 38, 24, 76, H - 28);
      ctx.globalAlpha = .55 * lensA; ctx.fillRect(lens - .5, 24, 1, H - 28);
      ctx.globalAlpha = fade * (1 - g); ctx.fillText('300 search queries', lens, 14);
      rows.forEach(function (r) {
        r.bars.forEach(function (b) {
          if (b.gone || b.at !== undefined) return;
          var mid = b.x + b.w / 2, t = clamp((lens - mid) / 50), lit = b.on && t > 0;
          ctx.fillStyle = lit ? ink : ink3;
          // the unselected step back once the drift stops; selected turns stay lit until the list gathers
          ctx.globalAlpha = (lit ? (.24 + t * .6) * (1 - .9 * g) : (.24 - t * .17) * (1 - .78 * back)) * fade;
          bar(b.x, b.y, b.w, 3, 1.5);
        });
      });
      if (!gatherAt) return;
      // the screen: a heading over the list and one column per criterion; each turn is checked left to right
      var s = screenAt ? clamp((now - screenAt) / 220) : 0;
      ctx.globalAlpha = s * fade; ctx.fillStyle = ink2; ctx.textAlign = 'left';
      ctx.font = '600 10px Inter, system-ui, sans-serif';
      ctx.fillText('SCREEN'.split('').join(String.fromCharCode(8202)), col.left, col.top - 16);
      ctx.font = '500 10.5px Inter, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = ink3;
      CRIT.forEach(function (c, j) { ctx.fillText(c, col.marks + j * col.cw + col.cw / 2, col.top - 16); });
      list.forEach(function (b, i) {
        if (b.gone) return;
        var x = b.fx + (b.tx - b.fx) * g, y = b.fy + (b.ty - b.fy) * g, w = b.fw + (b.tw - b.fw) * g;
        var t0 = screenAt + 300 + i * VERDICT;
        function seen(j) { return screenAt ? clamp((now - t0 - j * MARK) / 160) : 0; }
        if (b === pick) {
          // the caught turn thickens and gets a soft halo before it lifts off
          var e = clamp((now - pickAt) / 280);
          ctx.fillStyle = ink;
          ctx.globalAlpha = .1 * e; bar(x - 7, y - 6, w + 14, 15, 7.5);
          ctx.globalAlpha = 1; bar(x, y - e, w, 3 + 2 * e, 2.5);
          return;
        }
        var out = b.fail >= 0 ? seen(b.fail) : 0, ok = b.fail < 0 ? seen(CRIT.length - 1) : 0;
        ctx.fillStyle = ink;
        ctx.globalAlpha = (.85 + .1 * ok - .68 * out) * fade;
        bar(x, y, w, 3, 1.5);
        ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        for (var j = 0; j < CRIT.length; j++) {
          if (b.fail >= 0 && j > b.fail) break;
          var v = seen(j);
          if (!v) break;
          var mx = col.marks + j * col.cw + col.cw / 2, my = y + 1.5, miss = j === b.fail;
          ctx.globalAlpha = v * fade * (miss ? 1 : 1 - .45 * out);
          ctx.strokeStyle = miss ? ink : ink3;
          ctx.beginPath();
          if (miss) { ctx.moveTo(mx - 3.5, my - 3.5); ctx.lineTo(mx + 3.5, my + 3.5); ctx.moveTo(mx + 3.5, my - 3.5); ctx.lineTo(mx - 3.5, my + 3.5); }
          else { ctx.moveTo(mx - 4, my); ctx.lineTo(mx - 1, my + 3); ctx.lineTo(mx + 4.5, my - 3.5); }
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
    }
    function choose() {
      // the passing turn nearest the middle of the list
      var mid = (list.length - 1) / 2, pass = list.filter(function (b) { return b.fits; });
      pick = pass.sort(function (a, b) { return Math.abs(list.indexOf(a) - mid) - Math.abs(list.indexOf(b) - mid); })[0];
      pickAt = clock();
      return { x: pick.tx, y: pick.ty - 1, w: pick.tw, h: 5 };
    }
    function frame() {
      var now = clock(), dt = Math.min(50, now - last) / 1000; last = now;
      // a speed ramp: the drift eases up to speed, later eases down to a stop (smoothstep both ways),
      // rests a moment on what lit up, then the selected turns gather
      var up = clamp((now - startAt) / RAMP), down = slowAt ? clamp((now - slowAt) / SLOW) : 0;
      speed = (1 - Math.pow(1 - up, 2)) * (1 - down * down * (3 - 2 * down));
      if (slowAt && speed === 0 && !stopAt) stopAt = now;
      if (stopAt && !gatherAt && now - stopAt > REST) gather(now);
      if (gatherAt && !screenAt && now - gatherAt > GATHER + 250) screenAt = now;
      if (screenAt && !pick && now - screenAt > 300 + list.length * VERDICT + CRIT.length * MARK + 160 + HOLD) {
        var r = choose(); fadeAt = now; if (onPick) onPick(r);
      }
      if (fadeAt) fade = Math.max(0, 1 - (now - fadeAt) / 650);
      var shown = 0;
      rows.forEach(function (r) { r.bars.forEach(function (b) { if (b.on && b.x + b.w / 2 > 0) shown++; }); });
      rows.forEach(function (r) {
        r.bars.forEach(function (b) {
          // a turn is read when it crosses the lens in this run; those already past it at the start stay unread.
          // Only so many light up, spaced out, so that every lit turn has a place in the list that gathers
          var before = b.x + b.w / 2;
          b.x -= r.v * speed * dt;
          if (before >= lens && b.x + b.w / 2 < lens) {
            b.crossed = true;
            if (b.lit && shown < MAXLIT && now - lastLit > 250) { b.on = true; lastLit = now; shown++; }
          }
          if (b.x + b.w < -10) { b.x += r.span; b.crossed = b.on = false; }
        });
      });
      draw();
      if (fadeAt && fade === 0) { raf = 0; return; }
      raf = requestAnimationFrame(frame);
    }
    return {
      setup: setup, draw: draw,
      start: function () { last = startAt = clock(); raf = requestAnimationFrame(frame); },
      stop: function () { cancelAnimationFrame(raf); raf = 0; onPick = null; },
      hidePick: function () { if (pick) pick.gone = true; },
      // stop the drift, gather and screen the selected turns, then pick one that stands alone; the list centres on height y
      catchAt: function (y) { pickY = y; slowAt = clock(); return new Promise(function (res) { onPick = res; }); }
    };
  })();

  /* ---------------- motion helpers ---------------- */
  var STOP = {};
  function sleep(ms, id) {
    return new Promise(function (res, rej) { later(function () { if (id === run) res(); else rej(STOP); }, ms); });
  }
  function anim(node, frames, opts) { return node.animate(frames, opts); }
  function tween(a, b, ms, id) {
    var t0 = clock();
    (function f() {
      if (id !== run) return;
      var e = Math.min(1, (clock() - t0) / ms); e = 1 - Math.pow(1 - e, 3);
      tNum.textContent = e === 1 ? fmtN(b) : fmtN(Math.exp(Math.log(a) + (Math.log(b) - Math.log(a)) * e));
      if (e < 1) requestAnimationFrame(f);
    })();
  }
  function relabel(unit, sub) {
    [[tUnit, unit], [tSub, sub]].forEach(function (p) {
      if (p[0].textContent === p[1]) return;
      p[0].textContent = p[1];
      anim(p[0], [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'ease-out' });
    });
  }
  function caption(k) {
    railItems.forEach(function (li, i) { li.classList.toggle('on', i === k); });
    railItems[k].style.setProperty('--dur', STEPS[k].ms + 'ms');
    cap.textContent = STEPS[k].cap;
    anim(cap, [{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: 'ease-out' });
  }
  function translate(p) { return 'translate(' + p.x + 'px,' + p.y + 'px)'; }

  /* ---------------- 1. retrieve & screen ---------------- */
  async function retrieve(id) {
    var a = cards[ex.anchor];
    canvas.classList.remove('gone');
    field.setup(); field.start();
    tween(TALLY[0][0], TALLY[1][0], 2400, id);
    await sleep(1600, id);
    relabel(TALLY[1][1], TALLY[1][2]);

    var to = { x: a.el.offsetLeft + solo.x, y: a.el.offsetTop + solo.y, w: a.el.offsetWidth, h: a.el.offsetHeight };
    var from = await field.catchAt(to.y + to.h / 2);
    if (id !== run) return;
    await sleep(380, id);
    var cs = getComputedStyle(host);
    var ghost = el('div', { class: 'pl-ghost pl-temp' }, stage);
    field.hidePick();
    canvas.classList.add('gone');
    anim(ghost, [
      { left: from.x + 'px', top: from.y + 'px', width: from.w + 'px', height: from.h + 'px', backgroundColor: cs.getPropertyValue('--ink').trim(), borderColor: 'transparent' },
      { left: from.x + 'px', top: from.y - 6 + 'px', width: from.w + 'px', height: '14px', backgroundColor: cs.getPropertyValue('--paper').trim(), borderColor: cs.getPropertyValue('--paper-edge').trim(), offset: .3 },
      { left: to.x + 'px', top: to.y + 'px', width: to.w + 'px', height: to.h + 'px', backgroundColor: cs.getPropertyValue('--paper').trim(), borderColor: cs.getPropertyValue('--paper-edge').trim() }
    ], { duration: 950, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' });
    // the card takes over just before the slip finishes growing, and the turn as it was written
    // starts reading in from the right straight away
    await sleep(780, id);
    a.el.classList.remove('gone');
    anim(a.el, [{ opacity: 0 }, { opacity: 1 }], { duration: 170, easing: 'ease-out' });
    anim(a.src.firstChild, [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 1000, easing: 'cubic-bezier(.25,0,.3,1)' });
    await sleep(200, id);
    ghost.remove();
    field.stop();
    await sleep(1150, id);
    await translateIn(a, id);
  }
  // The Arabic dissolves word by word in reading order (right to left) while the English comes in
  // left to right, in the same place, and the card eases between the two heights.
  async function translateIn(a, id) {
    var src = a.src.firstChild, h0 = a.el.offsetHeight;
    var over = el('p', { class: 'pl-src pl-over', lang: ex.lang, dir: 'rtl', 'aria-hidden': 'true' }, a.el);
    over.style.left = src.offsetLeft + 'px'; over.style.top = src.offsetTop + 'px'; over.style.width = src.offsetWidth + 'px';
    ex.prompts[ex.anchor].split(/(\s+)/).forEach(function (part) {
      if (part.trim()) el('span', { text: part }, over); else over.appendChild(document.createTextNode(part));
    });
    host.classList.add('snap'); shut(a.src, true); shut(a.tf, false); void a.el.offsetHeight; host.classList.remove('snap');
    var h1 = a.el.offsetHeight, ar = Array.prototype.slice.call(over.children), en = Array.prototype.slice.call(a.text.children), SPAN = 1100;
    anim(a.el, [{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 900, easing: 'cubic-bezier(.45,0,.2,1)' });
    ar.forEach(function (w, i) {
      anim(w, [{ opacity: 1, filter: 'blur(0px)' }, { opacity: 0, filter: 'blur(3px)' }], { duration: 380, delay: i / ar.length * SPAN, easing: 'ease-in', fill: 'forwards' });
    });
    en.forEach(function (w, j) {
      anim(w, [{ opacity: 0, filter: 'blur(3px)' }, { opacity: 1, filter: 'blur(0px)' }], { duration: 420, delay: 180 + j / en.length * SPAN, easing: 'ease-out', fill: 'backwards' });
    });
    await sleep(SPAN + 700, id);
    over.remove();
  }

  /* ---------------- 2. assign anchors ---------------- */
  async function assign(id) {
    var a = cards[ex.anchor];
    var pills = el('div', { class: 'pl-pills pl-temp' }, stage);
    pills.style.left = (a.el.offsetLeft + solo.x + a.el.offsetWidth / 2) + 'px';
    // below where the card will end once its role label unfolds
    pills.style.top = (a.el.offsetTop + solo.y + a.el.offsetHeight + a.head.scrollHeight + 16) + 'px';
    var pe = {};
    // the choices this step has (hard negatives are not assigned here; a turn whose role is unclear is held)
    [['T', 'T', ROLE.T[0]], ['A', 'A', ROLE.A[0]], ['hold', '–', 'Hold']].forEach(function (o) {
      var p = el('span', { class: 'pl-pill' }, pills);
      p.style.setProperty('--c', ROLE[o[0]] ? ROLE[o[0]][2] : 'var(--ink-3)');
      el('b', { text: o[1] }, p); el('span', { text: o[2] }, p);
      pe[o[0]] = p;
    });
    anim(pills, [{ opacity: 0, transform: 'translate(-50%, 6px)' }, { opacity: 1, transform: 'translate(-50%, 0)' }], { duration: 380, easing: 'ease-out' });
    await sleep(500, id);
    // the role is read off the turn: the pressure is marked first, and it is what makes this a target
    a.el.style.setProperty('--hl', ROLE[ex.anchor][2]);
    a.el.classList.add('cast');
    await sleep(1000, id);
    Object.keys(pe).forEach(function (c) { pe[c].classList.toggle('on', c === ex.anchor); pe[c].classList.toggle('off', c !== ex.anchor); });
    await sleep(520, id);
    // the chip lifts off the pill and lands on the card as the card takes its colour
    var chipFrom = rel(pe.T.firstChild);
    setRole(a, ex.anchor); shut(a.head, false);
    a.chip.style.opacity = '0';
    var to = rel(a.chip);
    var fly = el('span', { class: 'pl-chip pl-fly pl-temp', text: a.chip.textContent }, stage);
    fly.style.setProperty('--c', ROLE[ex.anchor][2]);
    await anim(fly, [
      { transform: 'translate(' + (chipFrom.x + chipFrom.w / 2 - 11) + 'px,' + (chipFrom.y + chipFrom.h / 2 - 11) + 'px) scale(1.15)' },
      { transform: 'translate(' + to.x + 'px,' + to.y + 'px) scale(1)' }
    ], { duration: 620, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' }).finished;
    if (id !== run) return;
    a.chip.style.opacity = ''; fly.remove();
    anim(pills, [{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'forwards' });
    await sleep(700, id);
  }

  /* ---------------- 3. write & review ---------------- */
  // Each variant is written as an edit of the anchor. A caret goes to each place the variant differs;
  // the words it drops are selected and deleted, and its new words are typed in at the caret. Words
  // it keeps never move.
  var TYPE = 13;                                       // ms per typed character
  function typeInto(span, text, id) {
    return new Promise(function (res, rej) {
      var t0 = clock();
      (function f() {
        if (id !== run) { rej(STOP); return; }
        var k = Math.min(text.length, Math.floor((clock() - t0) / TYPE) + 1);
        span.textContent = text.slice(0, k);
        if (k < text.length) requestAnimationFrame(f); else res();
      })();
    });
  }
  // A lone shared word in the middle of a rewritten clause ("them", "to") is part of the rewrite,
  // the way a person editing would retype the clause rather than step around it.
  function clauses(ops) {
    var out = ops.slice(), again = true;
    while (again) {
      again = false;
      for (var i = 1; i < out.length - 1; i++) {
        if (out[i].t === 'keep' && out[i - 1].t !== 'keep' && out[i + 1].t !== 'keep') {
          out.splice(i, 1, { t: 'del', a: out[i].a }, { t: 'ins', b: out[i].b });
          again = true;
        }
      }
    }
    // within each run of changes, the deletions come first
    var res = [], run = [];
    out.concat([{ t: 'end' }]).forEach(function (op) {
      if (op.t === 'del' || op.t === 'ins') { run.push(op); return; }
      res = res.concat(run.filter(function (o) { return o.t === 'del'; }), run.filter(function (o) { return o.t === 'ins'; }));
      run = [];
      if (op.t === 'keep') res.push(op);
    });
    return res;
  }
  async function rewrite(c, id) {
    var p = c.text, ops = clauses(diff(TEXT[ex.anchor], TEXT[c.code])), hunks = [], cur = null;
    // the label turns first
    var out = anim(c.hd, [{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    out.finished.then(function () {
      if (id !== run) return;
      setRole(c, c.code);
      anim(c.hd, [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
      out.cancel();
    }, function () {});

    // the anchor's words again, with each run of changes grouped into one edit at a marked place
    p.innerHTML = '';
    var lead = [];                                       // kept words the variant marks, before its first edit
    ops.forEach(function (op) {
      if (op.t === 'keep') {
        // a kept word only ever changes its punctuation, and drops a highlight the variant doesn't share;
        // one the variant newly marks is marked as the caret passes it
        var k = el('span', { class: 'w' + (op.a.hl && op.b.hl ? ' hl' : ''), text: op.b.t }, p);
        if (op.b.hl && !op.a.hl) (hunks.length ? hunks[hunks.length - 1].after : lead).push(k);
        cur = null;
        return;
      }
      if (!cur) { cur = { mark: el('i', { class: 'pl-at' }, p), dels: [], ins: [], after: [] }; hunks.push(cur); }
      if (op.t === 'del') cur.dels.push(el('span', { class: 'w' + (op.a.hl ? ' hl' : ''), text: op.a.t }, p));
      else cur.ins.push(op.b);
    });

    var caret = el('i', { class: 'pl-caret', 'aria-hidden': 'true' });
    function sweep(ws) { ws.forEach(function (w, n) { w.style.transitionDelay = (n * 40) + 'ms'; w.classList.add('hl'); }); }
    await sleep(300, id);                               // the card takes its new label before the edits start
    sweep(lead);
    for (var i = 0; i < hunks.length; i++) {
      var hk = hunks[i], last = hk.dels.length ? hk.dels[hk.dels.length - 1] : hk.mark;
      p.insertBefore(caret, last.nextSibling);
      await sleep(90, id);
      if (hk.dels.length) {
        hk.dels.forEach(function (w) { w.classList.add('sel'); });
        await sleep(210, id);
        hk.dels.forEach(function (w) { w.remove(); });
        await sleep(70, id);
      }
      for (var j = 0; j < hk.ins.length; j++) {
        // a word the variant marks is highlighted as it is typed, the highlight running with the caret
        var w = el('span', { class: 'w' + (hk.ins[j].hl ? ' hl inked' : '') });
        p.insertBefore(w, caret);
        await typeInto(w, hk.ins[j].t, id);
      }
      sweep(hk.after);
    }
    await sleep(120, id);
    caret.remove();
    hunks.forEach(function (hk) { hk.mark.remove(); });
    p.querySelectorAll('.inked').forEach(function (w) { w.classList.remove('inked'); });
  }
  async function write(id) {
    var a = cards[ex.anchor], others = order.slice(1).map(function (c) { return cards[c]; });
    var at = { x: a.el.offsetLeft + solo.x, y: a.el.offsetTop + solo.y };
    // four copies of the anchor, stacked under it
    others.forEach(function (c, i) {
      setRole(c, ex.anchor);
      fill(c.text, TEXT[ex.anchor]);
      c.el.classList.remove('gone');
      c.el.style.zIndex = 4 - i;
      c.from = { x: at.x - c.el.offsetLeft, y: at.y - c.el.offsetTop };
    });
    if (stage.offsetHeight < fullH) {
      stage.style.transition = 'height .9s cubic-bezier(.45,0,.2,1)';
      stage.style.height = fullH + 'px';
    }
    a.el.style.transform = '';
    anim(a.el, [{ transform: translate(solo) }, { transform: 'none' }], { duration: 900, easing: 'cubic-bezier(.65,0,.25,1)' });
    others.forEach(function (c, i) {
      anim(c.el, [{ transform: translate(c.from) }, { transform: 'none' }],
        { duration: 1000, delay: 90 + i * 80, easing: 'cubic-bezier(.45,0,.2,1)', fill: 'backwards' });
    });
    await sleep(1150, id);
    var all = order.map(function (c) { return cards[c]; });
    // all four are edited at once; the step goes on when the longest edit is done
    await Promise.all(others.map(function (c) { return rewrite(c, id); }));
    await sleep(500, id);

    // two judges, one pass each over the five prompts; each signs off under the set when it is through
    placeGild();
    for (var pass = 0; pass < 2; pass++) {
      all.forEach(function (c, i) {
        anim(c.scan, [{ transform: 'translateY(-100%)', opacity: 1 }, { transform: 'translateY(100%)', opacity: 1 }],
          { duration: 560, delay: i * 90, easing: 'cubic-bezier(.4,0,.6,1)' });
      });
      await sleep(4 * 90 + 520, id);
      verdict[pass].classList.add('on');
      await sleep(160, id);
    }
    verdict[2].classList.add('on');
    tween(TALLY[2][0], TALLY[3][0], 800, id);
    relabel(TALLY[3][1], TALLY[3][2]);
    await sleep(850, id);
  }

  /* ---------------- 4. validate ---------------- */
  async function validate(id) {
    placeGild();
    gild.classList.add('on');
    await sleep(1000, id);
    // a gold mark leaves the set and takes its place in the rings
    var g = rel(gild.firstChild, host), r = rel(ring, host);
    var dot = el('i', { class: 'pl-dot pl-temp' }, host);
    var x0 = g.x + g.w - 4, y0 = g.y - 3, x1 = r.x + r.w / 2 - 4, y1 = r.y + r.h / 2 - 4;
    await anim(dot, [
      { transform: 'translate(' + x0 + 'px,' + y0 + 'px) scale(.6)', opacity: 0 },
      { transform: 'translate(' + x0 + 'px,' + (y0 - 10) + 'px) scale(1.2)', opacity: 1, offset: .12 },
      { transform: 'translate(' + (x0 + x1) / 2 + 'px,' + (Math.min(y0, y1) - 40) + 'px) scale(1)', opacity: 1, offset: .55 },
      { transform: 'translate(' + x1 + 'px,' + y1 + 'px) scale(.5)', opacity: 0 }
    ], { duration: 1100, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'forwards' }).finished;
    if (id !== run) return;
    dot.remove();
    ring.classList.add('on');
    tween(TALLY[3][0], TALLY[4][0], 800, id);
    relabel(TALLY[4][1], TALLY[4][2]);
    await sleep(900, id);
  }

  /* ---------------- playing ---------------- */
  var SCENES = [retrieve, assign, write, validate];
  var heldAnims = [];
  function hold(on) {
    if (on === paused) return;
    // only what is running now: play() on a finished animation would start it over
    if (on) {
      pausedAt = performance.now(); paused = true;
      heldAnims = host.getAnimations({ subtree: true }).filter(function (an) { return an.playState === 'running'; });
      heldAnims.forEach(function (an) { an.pause(); });
    } else {
      pausedFor += performance.now() - pausedAt; paused = false;
      heldAnims.forEach(function (an) { if (an.playState === 'paused') an.play(); });
      heldAnims = []; kick();
    }
    host.classList.toggle('held', on);
  }
  var restTimer = 0;
  [stage, cap].forEach(function (n) {
    n.addEventListener('pointermove', function (e) {
      // only a mouse that is really moving here: the page scrolling under a resting pointer doesn't count
      if (e.pointerType !== 'mouse' || (!e.movementX && !e.movementY) || paused || restTimer) return;
      if (!host.classList.contains('playing')) return;
      restTimer = window.setTimeout(function () { restTimer = 0; if (host.classList.contains('playing')) hold(true); }, 250);
    });
    n.addEventListener('pointerleave', function (e) {
      if (e.relatedTarget && (stage.contains(e.relatedTarget) || cap.contains(e.relatedTarget))) return;
      window.clearTimeout(restTimer); restTimer = 0;
      hold(false);
    });
  });

  function halt() {
    hold(false);
    timers = [];
    run++;
    field.stop();
    host.getAnimations({ subtree: true }).forEach(function (an) { an.cancel(); });
    host.classList.remove('playing');
  }
  async function play(from) {
    halt();
    var id = run;
    render(from - 1);
    host.classList.add('playing');
    replay.hidden = true;
    try {
      for (var k = from; k < SCENES.length; k++) {
        caption(k);
        await SCENES[k](id);
        if (id !== run) return;
        render(k);
      }
    } catch (e) { if (e !== STOP) throw e; return; }
    host.classList.remove('playing');
    replay.hidden = false;
  }

  var lastW = host.clientWidth;
  window.addEventListener('resize', function () {
    if (host.clientWidth === lastW) return;
    lastW = host.clientWidth;
    var wasPlaying = host.classList.contains('playing');
    halt(); render(done);
    if (wasPlaying) replay.hidden = false;
  });

  if (still) { render(STEPS.length - 1); return; }
  render(-1);
  cap.textContent = 'One real request, followed from the corpus to a finished set.';
  if (!('IntersectionObserver' in window)) { play(0); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); play(0); } });
  }, { rootMargin: '0px 0px -40% 0px' });   // once its top is past the lower 40% of the screen
  io.observe(stage);
})();
