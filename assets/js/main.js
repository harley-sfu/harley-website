/* HARLEY site. Data: window.HARLEY, written by scripts/build_data.py. No dependencies. */
(function () {
  'use strict';
  var D = window.HARLEY;
  if (!D) return;

  // Fill these in when the paper, dataset and code are public.
  var LINKS = { paper: '', data: '', code: '' };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

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
  function svg(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmt(x, d) { return (Math.round(x * Math.pow(10, d || 1)) / Math.pow(10, d || 1)).toFixed(d === 0 ? 0 : (d || 1)); }
  function signed(x) { return (x > 0 ? '+' : x < 0 ? '−' : '') + fmt(Math.abs(x)); }
  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function onVisible(node, fn, threshold) {
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); fn(); } });
    }, { threshold: threshold || 0.25 });
    io.observe(node);
  }

  /* ---------------- tooltip ---------------- */
  var tip = document.querySelector('.tooltip');
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.hidden = false;
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.min(Math.max(8, x - w / 2), window.innerWidth - w - 8);
    var top = y - h - 12; if (top < 8) top = y + 16;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hideTip() { tip.hidden = true; }
  document.addEventListener('scroll', hideTip, { passive: true });

  /* ---------------- chrome: theme, top bar, links ---------------- */
  var root = document.documentElement;
  document.querySelector('.theme-toggle').addEventListener('click', function () {
    var cur = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = cur === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store('harley-theme', next);
  });
  var topbar = document.querySelector('.topbar');
  function onScrollBar() { topbar.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScrollBar, { passive: true }); onScrollBar();

  document.querySelectorAll('[data-link]').forEach(function (a) {
    var url = LINKS[a.getAttribute('data-link')];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else { a.setAttribute('aria-disabled', 'true'); a.addEventListener('click', function (e) { e.preventDefault(); }); }
  });

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.topnav a'));
  if ('IntersectionObserver' in window) {
    var navIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main > section[id]').forEach(function (s) { navIO.observe(s); });
  }

  document.querySelectorAll('.chapter-head').forEach(function (h) {
    if (reduceMotion) return;
    h.classList.add('fade');
    onVisible(h, function () { h.classList.add('in'); }, 0.2);
  });

  /* ---------------- hero: the benchmark as tree rings ---------------- */
  (function rings() {
    var host = document.getElementById('rings');
    var C = 240, R0 = 66, R1 = 226;
    var gold = D.rings.filter(function (r) { return r.gold > 0; }).sort(function (a, b) { return (a.gold + a.silver) - (b.gold + b.silver); });
    var rest = D.rings.filter(function (r) { return r.gold === 0; }).sort(function (a, b) { return a.silver - b.silver; });
    var order = gold.concat(rest);
    var step = (R1 - R0) / (order.length - 1);
    var rnd = mulberry32(1591);

    svg('circle', { cx: C, cy: C, r: R0 + step * (gold.length - 0.5), class: 'heart' }, host);

    function wobble(i) {
      var ph1 = rnd() * 6.28, ph2 = rnd() * 6.28, amp = 0.9 + i * 0.07;
      return function (t) { return amp * (Math.sin(3 * t + ph1) * 0.6 + Math.sin(7 * t + ph2) * 0.4); };
    }
    var groups = [];
    order.forEach(function (lang, i) {
      var r = R0 + i * step, w = wobble(i);
      var g = svg('g', { class: 'lang grow' }, host);
      var d = '';
      for (var a = 0; a <= 360; a += 3) {
        var t = a * Math.PI / 180, rr = r + w(t);
        d += (a ? 'L' : 'M') + (C + rr * Math.cos(t)).toFixed(2) + ' ' + (C + rr * Math.sin(t)).toFixed(2);
      }
      svg('path', { d: d + 'Z', class: 'ring' }, g);
      var n = lang.gold + lang.silver, off = rnd() * Math.PI * 2;
      // the reviewed (gold) sets sit at random places on their ring, like knots in the grain
      var slots = []; for (var q = 0; q < n; q++) slots.push(q);
      for (var q2 = n - 1; q2 > 0; q2--) { var z = Math.floor(rnd() * (q2 + 1)); var tq = slots[q2]; slots[q2] = slots[z]; slots[z] = tq; }
      var goldSet = {}; slots.slice(0, lang.gold).forEach(function (s) { goldSet[s] = true; });
      for (var k = 0; k < n; k++) {
        var isGold = !!goldSet[k];
        var t2 = off + (k + (rnd() - 0.5) * 0.55) * (Math.PI * 2 / n);
        var rr2 = r + w(t2), len = isGold ? 4.2 : 3.2;
        svg('line', {
          x1: (C + (rr2 - len) * Math.cos(t2)).toFixed(2), y1: (C + (rr2 - len) * Math.sin(t2)).toFixed(2),
          x2: (C + (rr2 + len) * Math.cos(t2)).toFixed(2), y2: (C + (rr2 + len) * Math.sin(t2)).toFixed(2),
          class: 'mark ' + (isGold ? 'gold' : 'silver')
        }, g);
      }
      var hit = svg('circle', { cx: C, cy: C, r: r, class: 'ring-hit' }, g);
      hit.addEventListener('mouseenter', function () { focusLang(i); });
      hit.addEventListener('mouseleave', function () { focusLang(-1); });
      hit.addEventListener('click', function () { focusLang(i); });
      groups.push({ g: g, lang: lang });
    });
    var num = svg('text', { x: C, y: C + 6, class: 'center-num' }, host);
    var lab = svg('text', { x: C, y: C + 26, class: 'center-lab' }, host);
    var lab2 = svg('text', { x: C, y: C - 30, class: 'center-lab' }, host);
    function setCenter(a, b, c) { num.textContent = a; lab.textContent = b; lab2.textContent = c || ''; }
    setCenter('1,591', 'sets', '17 languages');
    function focusLang(i) {
      groups.forEach(function (x, j) { x.g.classList.toggle('dim', i >= 0 && j !== i); x.g.classList.toggle('on', j === i); });
      if (i < 0) { setCenter('1,591', 'sets', '17 languages'); return; }
      var L = groups[i].lang;
      setCenter(String(L.gold + L.silver), L.language, L.gold ? L.gold + ' reviewed' : 'model-reviewed');
    }
    host.addEventListener('mouseleave', function () { focusLang(-1); });

    if (!reduceMotion) {
      var heart = host.querySelector('.heart');
      heart.style.opacity = '0'; heart.style.transition = 'opacity 1.6s ease .2s';
      groups.forEach(function (x, i) {
        x.g.style.opacity = '0'; x.g.style.transform = 'scale(.94)';
        x.g.style.transition = 'opacity .9s ease ' + (0.15 + i * 0.07) + 's, transform 1.2s cubic-bezier(.2,.7,.2,1) ' + (0.15 + i * 0.07) + 's';
      });
      host.getBoundingClientRect();
      setTimeout(function () {
        heart.style.opacity = '';
        groups.forEach(function (x) { x.g.style.opacity = ''; x.g.style.transform = ''; });
      }, 40);
    }
  })();

  /* ---------------- the scroll: one set, five prompts ---------------- */
  (function scrollSets() {
    var paper = document.getElementById('paper');
    var tabsHost = document.querySelector('.tabs');
    var translateBtn = document.querySelector('.translate');
    var ROLE = {
      T: ['Target', 'pressure added', 'var(--T)'],
      P: ['Paraphrase', 'same pressure, new words', 'var(--P)'],
      H: ['Hard negative', 'one fact changed, so helping is right', 'var(--H)'],
      J: ['Jailbreak variant', 'same request, plus a pretext', 'var(--J)'],
      A: ['Aligned control', 'pressure removed', 'var(--A)'],
      S: ['Style control', 'same style, another task', 'var(--S)']
    };
    var OUT = { m: ['misaligned', 'o-m', 'var(--o-mis)'], w: ['weakly misaligned', 'o-w', 'var(--T)'], a: ['aligned', 'o-a', 'var(--ink-3)'],
      r: ['refused', 'o-r', 'var(--ink-2)'], b: ['blocked by provider', 'o-r', 'var(--ink-2)'], t: ['no majority label', 'o-x', 'var(--ink-3)'], x: ['no label', 'o-x', 'var(--ink-3)'] };
    var state = { i: 0, translate: store('harley-translate') === '1', opened: 0 };

    D.examples.forEach(function (ex, i) {
      var b = el('button', { class: 'tab', role: 'tab', type: 'button', lang: ex.lang, 'aria-selected': i === 0 ? 'true' : 'false' }, tabsHost);
      el('span', { class: 'tab-script', text: ex.tab }, b);
      el('span', { class: 'tab-title', text: ex.title }, b);
      b.addEventListener('click', function () { select(i); });
    });
    translateBtn.addEventListener('click', function () {
      state.translate = !state.translate;
      store('harley-translate', state.translate ? '1' : '0');
      translateBtn.setAttribute('aria-pressed', String(state.translate));
      paper.querySelectorAll('.prompt, .answer blockquote').forEach(function (p) { p.classList.add('swapping'); });
      setTimeout(function () { fillTexts(); }, 180);
    });

    function rowOrder(ex) {
      var codes = ['T', 'P', 'H', 'A', 'S'];
      return [ex.anchor].concat(codes.filter(function (c) { return c !== ex.anchor; }));
    }
    function segsHTML(segs) {
      return segs.map(function (s) {
        var t = s[1].replace(/&/g, '&amp;').replace(/</g, '&lt;');
        return s[0] === 'ins' ? '<span class="ins">' + t + '</span>' : s[0] === 'del' ? '<span class="del">' + t + '</span>' : t;
      }).join('');
    }
    function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

    function render() {
      var ex = D.examples[state.i];
      var model = D.models[ex.featured_index];
      translateBtn.hidden = !ex.prompts_en;
      translateBtn.setAttribute('aria-pressed', String(state.translate && !!ex.prompts_en));
      paper.innerHTML = '';
      rowOrder(ex).forEach(function (code) {
        var shown = code === 'H' ? ex.fifth : code;
        var role = ROLE[shown];
        var verse = el('article', { class: 'verse', 'data-code': code }, paper);
        var inner = el('div', { class: 'verse-inner' }, verse);
        var body = el('div', { class: 'verse-body' }, inner);
        body.style.setProperty('--c', role[2]);
        el('div', { class: 'chip', text: shown, 'aria-hidden': 'true' }, body);

        var main = el('div', { class: 'verse-main' }, body);
        var meta = el('div', { class: 'verse-meta' }, main);
        el('span', { class: 'verse-role', text: role[0] }, meta);
        if (code === ex.anchor) {
          var badge = el('span', { class: 'anchor-badge' }, meta);
          el('img', { src: 'assets/img/owl.png', alt: '' }, badge);
          badge.appendChild(document.createTextNode(code === 'T' ? 'the user’s own words' : 'real user turn'));
        } else {
          el('span', { class: 'verse-gloss', text: role[1] }, meta);
        }
        el('p', { class: 'prompt' }, main);

        // the featured model's answer, collapsed
        var g = ex.grid[code][ex.featured_index];
        var o = OUT[g.charAt(0)] || OUT.x;
        var oLabel = shown === 'J' && 'awm'.indexOf(g.charAt(0)) >= 0 ? 'answered' : o[0];
        var tog = el('button', { class: 'answer-toggle', type: 'button', 'aria-expanded': 'false' }, main);
        tog.innerHTML = '<span class="caret">▸</span> ' + esc(model.name) + '’s answer';
        var ans = el('div', { class: 'answer' }, main);
        var ansIn = el('div', null, ans);
        var bq = el('blockquote', null, ansIn);
        bq.style.setProperty('--oc', o[2]);
        var who = el('div', { class: 'who' }, ansIn);
        who.innerHTML = esc(model.name) + ', first of five samples · <b style="color:' + o[2] + '">' + oLabel + '</b>';
        tog.addEventListener('click', function () {
          var open = tog.getAttribute('aria-expanded') !== 'true';
          tog.setAttribute('aria-expanded', String(open)); ans.classList.toggle('open', open);
        });

        // outcome grid: 17 models x 5 samples
        var outc = el('div', { class: 'outcomes' }, body);
        var grid = el('div', { class: 'grid', role: 'img' }, outc);
        var n = { m: 0, w: 0, a: 0, r: 0, b: 0, t: 0, x: 0 }, total = 0;
        ex.grid[code].forEach(function (s, mi) {
          for (var k = 0; k < 5; k++) {
            var c = s.charAt(k) || 'x';
            n[c] = (n[c] || 0) + 1; total++;
            var cls = OUT[c][1];
            if (shown === 'J' && 'awm'.indexOf(c) >= 0) cls = 'o-j';
            var dot = el('i', { class: 'dot ' + cls + (mi === ex.featured_index ? ' featured' : '') }, grid);
            (function (name, k2, label) {
              dot.addEventListener('mouseenter', function (e) {
                var r = e.target.getBoundingClientRect();
                showTip('<b>' + esc(name) + '</b><br>sample ' + (k2 + 1) + ' · ' + label, r.left + r.width / 2, r.top);
              });
              dot.addEventListener('mouseleave', hideTip);
            })(D.models[mi].name, k, shown === 'J' && 'awm'.indexOf(c) >= 0 ? 'answered' : OUT[c][0]);
          }
        });
        var refused = n.r + n.b, mis = n.m + n.w;
        var share = el('div', { class: 'outcome-share' }, outc);
        if (shown === 'J') {
          share.innerHTML = '<span><b class="c-J">' + Math.round(100 * (total - refused) / total) + '%</b> answered</span><span><b>' + Math.round(100 * refused / total) + '%</b> refused</span>';
          grid.setAttribute('aria-label', refused + ' of ' + total + ' responses refused');
        } else {
          share.innerHTML = '<span><b class="c-T">' + Math.round(100 * mis / total) + '%</b> misaligned</span><span><b>' + Math.round(100 * refused / total) + '%</b> refused</span>';
          grid.setAttribute('aria-label', mis + ' of ' + total + ' responses misaligned, ' + refused + ' refused');
        }
      });
      fillTexts();
      state.opened = 0;
      if (reduceMotion) { paper.querySelectorAll('.verse').forEach(function (v) { v.classList.add('open'); }); state.opened = 5; }
      else unroll(true);
    }

    function fillTexts() {
      var ex = D.examples[state.i];
      var tr = state.translate && !!ex.prompts_en;
      paper.querySelectorAll('.verse').forEach(function (v) {
        var code = v.getAttribute('data-code');
        var p = v.querySelector('.prompt');
        var seg = ex.segments[code];
        var text = tr ? ex.prompts_en[code] : ex.prompts[code];
        p.setAttribute('lang', tr ? 'en' : ex.lang);
        p.setAttribute('dir', !tr && ex.lang === 'ar' ? 'rtl' : 'ltr');
        p.innerHTML = '<span class="gloss-swap">' + (seg ? segsHTML(tr ? seg.en : seg.orig) : esc(text)) + '</span>';
        var e = ex.excerpts[code];
        var bq = v.querySelector('.answer blockquote');
        var useEn = tr && e.en;
        bq.textContent = '“' + (useEn ? e.en : e.orig) + '”';
        bq.setAttribute('lang', useEn ? 'en' : ex.lang);
        bq.setAttribute('dir', !useEn && ex.lang === 'ar' ? 'rtl' : 'ltr');
        requestAnimationFrame(function () { p.classList.remove('swapping'); bq.classList.remove('swapping'); });
      });
    }

    // rows unroll as the scroll comes into view; they never roll back up under the reader
    var timers = [];
    function unroll(fresh) {
      var verses = paper.querySelectorAll('.verse');
      var top = paper.getBoundingClientRect().top;
      var vh = window.innerHeight;
      var want = top < vh * 0.82 ? Math.min(verses.length, 1 + Math.floor((vh * 0.82 - top) / 110)) : 0;
      if (fresh) { timers.forEach(clearTimeout); timers = []; }
      if (want <= state.opened) return;
      var from = state.opened; state.opened = want;
      for (var i = from; i < want; i++) {
        (function (k, delay) { timers.push(setTimeout(function () { verses[k].classList.add('open'); }, delay)); })(i, (i - from) * 170);
      }
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking || reduceMotion) return; ticking = true;
      setTimeout(function () { ticking = false; unroll(false); }, 60);
    }, { passive: true });
    window.addEventListener('resize', function () { unroll(false); });

    function select(i) {
      state.i = i;
      tabsHost.querySelectorAll('.tab').forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      render();
    }
    render();
  })();

  /* ---------------- I: pressure dumbbells ---------------- */
  (function dumbbell() {
    var host = document.getElementById('dumbbell');
    var MAX = 60;
    var keys = el('div', { class: 'db-keys' }, host);
    keys.innerHTML = '<span><i style="background:var(--A)"></i>aligned control</span><span><i style="background:var(--T)"></i>target</span><span><i class="p"></i>paraphrase</span>';
    var rows = D.models.map(function (m) { return { name: m.name, A: m.A, T: m.T, P: m.P, d: m.TA }; });
    rows.push({ name: 'All 17 models', A: D.paper.mis.A, T: D.paper.mis.T, P: D.paper.mis.P, d: D.paper.mis.diff, pooled: true });
    var items = rows.map(function (r) {
      var row = el('div', { class: 'db-row' + (r.pooled ? ' pooled' : '') }, host);
      el('div', { class: 'db-label', text: r.name }, row);
      var tr = el('div', { class: 'db-track' }, row);
      [0, 10, 20, 30, 40, 50, 60].forEach(function (t) { var gl = el('i', { class: 'gridline' }, tr); gl.style.left = (100 * t / MAX) + '%'; });
      var line = el('i', { class: 'db-line' }, tr);
      var p = el('i', { class: 'db-dot p' }, tr);
      var a = el('i', { class: 'db-dot a' }, tr);
      var t = el('i', { class: 'db-dot t' }, tr);
      el('div', { class: 'db-val', text: signed(r.d) }, row);
      a.style.left = p.style.left = line.style.left = t.style.left = (100 * r.A / MAX) + '%';
      p.style.left = (100 * r.P / MAX) + '%';
      line.style.width = '0%';
      row.addEventListener('mousemove', function (e) {
        showTip('<b>' + esc(r.name) + '</b><br>aligned control ' + fmt(r.A) + '% → target ' + fmt(r.T) + '%<br>paraphrase ' + fmt(r.P) + '%', e.clientX, e.clientY);
      });
      row.addEventListener('mouseleave', hideTip);
      return { r: r, line: line, t: t };
    });
    var axis = el('div', { class: 'db-axis' }, host);
    el('div', null, axis);
    var ticks = el('div', { class: 'ticks' }, axis);
    [0, 10, 20, 30, 40, 50, 60].forEach(function (t) { var s = el('span', { text: t + '%', class: t % 20 ? 'odd' : '' }, ticks); s.style.left = (100 * t / MAX) + '%'; });
    function play() {
      host.classList.add('reveal');
      items.forEach(function (it, i) {
        setTimeout(function () {
          it.t.style.left = (100 * it.r.T / MAX) + '%';
          it.line.style.width = (100 * (it.r.T - it.r.A) / MAX) + '%';
        }, reduceMotion ? 0 : 60 * i);
      });
    }
    if (reduceMotion) play(); else onVisible(host, play, 0.2);
    function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  })();

  /* ---------------- II: the split, and refusal bars ---------------- */
  (function split() {
    var host = document.getElementById('split-viz');
    var nH = D.paper.split.H, nJ = D.paper.split.J, N = nH + nJ;
    var rnd = mulberry32(60140), kinds = [];
    for (var i = 0; i < N; i++) kinds.push(i < nH ? 'h' : 'j');
    for (var k = N - 1; k > 0; k--) { var j = Math.floor(rnd() * (k + 1)); var tmp = kinds[k]; kinds[k] = kinds[j]; kinds[j] = tmp; }
    var tiles = kinds.map(function (kind) { return el('i', { class: 'tile ' + kind }, host); });
    var done = false;
    function layout() {
      var W = host.clientWidth;
      var s = W < 420 ? 12 : 14, g = 3, u = s + g, rows = W < 640 ? 10 : 6, gap = W < 420 ? 22 : 40;
      var colsAll = N / rows;
      var startX = 0, hCols = Math.ceil(nH / rows), jCols = Math.ceil(nJ / rows);
      host.style.height = (rows * u) + 'px';
      var hi = 0, ji = 0;
      tiles.forEach(function (t, idx) {
        t.style.width = t.style.height = s + 'px';
        var x, y;
        if (!done) { x = startX + Math.floor(idx / rows) * u; y = (idx % rows) * u; }
        else if (kinds[idx] === 'h') { x = Math.floor(hi / rows) * u; y = (hi % rows) * u; hi++; }
        else { x = hCols * u + gap + Math.floor(ji / rows) * u; y = (ji % rows) * u; ji++; }
        t.style.left = x + 'px'; t.style.top = y + 'px';
        t.style.transitionDelay = done && !reduceMotion ? (Math.floor(idx / rows) * 18) + 'ms' : '0ms';
      });
      var caps = document.querySelector('.split-captions');
      caps.style.gridTemplateColumns = W < 640 ? '' : (hCols * u + gap) + 'px 1fr';
      return colsAll;
    }
    layout();
    window.addEventListener('resize', layout);
    function play() { done = true; host.classList.add('done'); layout(); }
    if (reduceMotion) play(); else onVisible(host, function () { setTimeout(play, 350); }, 0.6);

    function bars(hostId, key, cls, lo, hi, pooledVal) {
      var h = document.getElementById(hostId);
      var span = hi - lo, zero = 100 * (0 - lo) / span;
      var rows = D.models.map(function (m) { return { name: m.name, v: m.refusal[key] }; });
      rows.push({ name: 'All 17 models', v: pooledVal, pooled: true });
      var items = rows.map(function (r) {
        var row = el('div', { class: 'bar-row' + (r.pooled ? ' pooled' : '') }, h);
        el('div', { class: 'bar-label', text: r.name }, row);
        var tr = el('div', { class: 'bar-track' }, row);
        var z = el('i', { class: 'zero' }, tr); z.style.left = zero + '%';
        var b = el('i', { class: 'bar ' + cls }, tr);
        var v = el('span', { class: 'bar-val', text: signed(r.v) }, tr);
        b.style.left = zero + '%'; b.style.width = '0%';
        v.style.left = zero + '%'; v.style.opacity = '0';
        row.addEventListener('mousemove', function (e) { showTip('<b>' + r.name.replace(/</g, '&lt;') + '</b><br>' + signed(r.v) + ' points', e.clientX, e.clientY); });
        row.addEventListener('mouseleave', hideTip);
        return { r: r, b: b, v: v };
      });
      function play2() {
        items.forEach(function (it, i) {
          setTimeout(function () {
            var w = 100 * Math.abs(it.r.v) / span;
            // value label: outside the bar end when there is room, inside a long bar, else on the far side of zero
            if (it.r.v < 0) {
              it.b.style.left = (zero - w) + '%'; it.b.style.width = w + '%';
              if (w > 22) { it.v.style.left = 'calc(' + (zero - w) + '% + 6px)'; it.v.classList.add('inside'); }
              else if (zero - w > 16) { it.v.style.left = 'calc(' + (zero - w) + '% - 6px)'; it.v.style.transform = 'translate(-100%, -50%)'; }
              else { it.v.style.left = 'calc(' + zero + '% + 6px)'; }
            } else {
              it.b.style.width = w + '%';
              if (zero + w < 84) { it.v.style.left = 'calc(' + (zero + w) + '% + 6px)'; }
              else { it.v.style.left = 'calc(' + (zero + w) + '% - 6px)'; it.v.style.transform = 'translate(-100%, -50%)'; it.v.classList.add('inside'); }
            }
            it.v.style.opacity = '1';
          }, reduceMotion ? 0 : 45 * i);
        });
      }
      if (reduceMotion) play2(); else onVisible(h, play2, 0.25);
    }
    // same points-per-pixel in both panels
    bars('bars-j', 'JT', 'j', -31, 3, D.paper.jsets_refusal.diff);
    bars('bars-h', 'HA', 'h', -3, 31, D.paper.hsets_refusal.diff);
  })();

  /* ---------------- III: prophecy (screening) ---------------- */
  (function prophecy() {
    var host = document.getElementById('barcode');
    var input = document.getElementById('cutoff');
    var wrap = host.parentNode;
    var P = D.screening.prompts, N = P.length, POS = D.screening.positives;
    var X0 = 6, X1 = 994, YT = 14, YB = 150;
    function x(i) { return X0 + (X1 - X0) * (i / (N - 1)); }
    var cum = [0];
    P.forEach(function (p, i) { cum.push(cum[i] + p[2]); });
    function y(k) { return YB - (YB - YT) * (cum[k] / POS); }

    [0.25, 0.5, 0.75, 1].forEach(function (f) { svg('line', { x1: X0, x2: X1, y1: YB - (YB - YT) * f, y2: YB - (YB - YT) * f, class: 'guide' }, host); });
    var shade = svg('rect', { x: X0, y: YT - 8, height: 220 - YT + 8, width: 0, class: 'shade' }, host);
    var dArea = 'M' + x(0) + ' ' + YB, dCurve = '';
    for (var k = 0; k <= N; k++) {
      var xi = X0 + (X1 - X0) * (k / N);
      dArea += 'L' + xi.toFixed(1) + ' ' + y(k).toFixed(1);
      dCurve += (k ? 'L' : 'M') + xi.toFixed(1) + ' ' + y(k).toFixed(1);
    }
    svg('path', { d: dArea + 'L' + X1 + ' ' + YB + 'Z', class: 'area' }, host);
    svg('path', { d: 'M' + X0 + ' ' + YB + 'L' + X1 + ' ' + YT, class: 'baseline' }, host);
    svg('path', { d: dCurve, class: 'curve' }, host);
    var ticks = P.map(function (p, i) {
      return svg('line', { x1: x(i), x2: x(i), y1: p[2] ? 164 : 196, y2: 216, class: 'tick' + (p[2] ? ' pos' : '') }, host);
    });
    var cut = svg('line', { x1: 0, x2: 0, y1: YT - 8, y2: 218, class: 'cut' }, host);
    var handle = el('div', { class: 'handle' }, null);
    input.insertAdjacentElement('afterend', handle);

    var roK = document.getElementById('ro-k'), roKp = document.getElementById('ro-kp');
    var roF = document.getElementById('ro-f'), roFp = document.getElementById('ro-fp');
    function update(kk) {
      kk = Math.max(1, Math.min(N, Math.round(kk)));
      var xx = X0 + (X1 - X0) * (kk / N);
      shade.setAttribute('width', xx - X0);
      cut.setAttribute('x1', xx); cut.setAttribute('x2', xx);
      ticks.forEach(function (t, i) { if (P[i][2]) t.classList.toggle('out', i >= kk); });
      handle.style.left = (100 * xx / 1000) + '%';
      handle.style.top = (y(kk) - 11) + 'px';
      roK.textContent = kk; roKp.textContent = Math.floor(100 * kk / N);
      roF.textContent = cum[kk]; roFp.textContent = Math.round(100 * cum[kk] / POS);
      input.value = kk;
    }
    input.addEventListener('input', function () { update(+input.value); });
    var TARGET = Math.round(N / 3);
    update(TARGET);
    if (!reduceMotion) {
      update(1);
      onVisible(wrap, function () {
        var t0 = null, dur = 1600;
        function frame(ts) {
          if (!t0) t0 = ts;
          var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          update(1 + (TARGET - 1) * e);
          if (p < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      }, 0.5);
    }
  })();

  /* ---------------- copy BibTeX ---------------- */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = document.getElementById(b.getAttribute('data-copy')).textContent;
      var done = function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });
})();
