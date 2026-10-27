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
  function tipFor(node, html) { var r = node.getBoundingClientRect(); showTip(html, r.left + r.width / 2, r.top); }
  document.addEventListener('scroll', hideTip, { passive: true });
  document.addEventListener('click', hideTip);
  // what the tooltip shows, read out for keyboard and screen-reader users
  var live = el('div', { class: 'sr-only', 'aria-live': 'polite' }, document.body);
  function say(text) { live.textContent = text; }
  var hooks = {};

  /* ---------------- chrome: theme, top bar, links ---------------- */
  // Light and dark: follows the system until the reader picks one; the pick is remembered.
  var root = document.documentElement;
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  var themeButtons = document.querySelectorAll('[data-set-theme]');
  function currentTheme() { return root.getAttribute('data-theme') || (systemDark.matches ? 'dark' : 'light'); }
  function syncThemeButtons() {
    var cur = currentTheme();
    themeButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-theme') === cur)); });
  }
  themeButtons.forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-set-theme');
      root.setAttribute('data-theme', t);
      store('harley-theme', t);
      syncThemeButtons();
    });
  });
  if (systemDark.addEventListener) systemDark.addEventListener('change', syncThemeButtons);
  syncThemeButtons();
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

  /* ---------------- hero: the benchmark as tree rings ---------------- */
  (function rings() {
    var host = document.getElementById('rings');
    var C = 240, R0 = 66, R1 = 226;
    var gold = D.rings.filter(function (r) { return r.gold > 0; }).sort(function (a, b) { return (a.gold + a.silver) - (b.gold + b.silver); });
    var rest = D.rings.filter(function (r) { return r.gold === 0; }).sort(function (a, b) { return a.silver - b.silver; });
    var order = gold.concat(rest);
    var step = (R1 - R0) / (order.length - 1);
    var rnd = mulberry32(D.paper.sets);

    svg('circle', { cx: C, cy: C, r: R0 + step * (gold.length - 0.5), class: 'heart' }, host);

    var groups = [];
    order.forEach(function (lang, i) {
      var r = R0 + i * step;
      var g = svg('g', { class: 'lang grow' }, host);
      svg('circle', { cx: C, cy: C, r: r, class: 'ring' }, g);
      var n = lang.gold + lang.silver, off = rnd() * Math.PI * 2;
      // the reviewed (gold) sets sit at random places on their ring, like knots in the grain
      var slots = []; for (var q = 0; q < n; q++) slots.push(q);
      for (var q2 = n - 1; q2 > 0; q2--) { var z = Math.floor(rnd() * (q2 + 1)); var tq = slots[q2]; slots[q2] = slots[z]; slots[z] = tq; }
      var goldSet = {}; slots.slice(0, lang.gold).forEach(function (s) { goldSet[s] = true; });
      // a ring's marks are drawn as one path per colour, not one element per set: thousands of
      // separate lines made every hover restyle and repaint each of them
      var d = { gold: [], silver: [] };
      for (var k = 0; k < n; k++) {
        var isGold = !!goldSet[k];
        var t2 = off + (k + (rnd() - 0.5) * 0.55) * (Math.PI * 2 / n);
        var len = isGold ? 4.2 : 3.2, cs = Math.cos(t2), sn = Math.sin(t2);
        d[isGold ? 'gold' : 'silver'].push('M' + (C + (r - len) * cs).toFixed(2) + ' ' + (C + (r - len) * sn).toFixed(2) +
          'L' + (C + (r + len) * cs).toFixed(2) + ' ' + (C + (r + len) * sn).toFixed(2));
      }
      if (d.silver.length) svg('path', { d: d.silver.join(''), class: 'mark silver' }, g);
      if (d.gold.length) {
        // under each gold mark, a paper-coloured gap in the silver, so the gold reads on a dense ring
        svg('path', { d: d.gold.join(''), class: 'mark knock' }, g);
        svg('path', { d: d.gold.join(''), class: 'mark gold' }, g);
      }
      var hit = svg('circle', { cx: C, cy: C, r: r, class: 'ring-hit' }, g);
      hit.addEventListener('mouseenter', function () { focusLang(i); });
      hit.addEventListener('mouseleave', function () { focusLang(-1); });
      hit.addEventListener('click', function () { focusLang(i); });
      groups.push({ g: g, lang: lang });
    });
    var num = svg('text', { x: C, y: C + 6, class: 'center-num' }, host);
    var lab = svg('text', { x: C, y: C + 26, class: 'center-lab' }, host);
    var lab2 = svg('text', { x: C, y: C - 28, class: 'center-lab center-sub' }, host);
    function setCenter(a, b, c) { num.textContent = a; lab.textContent = b; lab2.textContent = c || ''; }
    function resetCenter() {
      setCenter(D.paper.sets.toLocaleString('en-US'), 'sets', D.paper.languages + ' languages');
    }
    resetCenter();
    function focusLang(i) {
      groups.forEach(function (x, j) { x.g.classList.toggle('dim', i >= 0 && j !== i); x.g.classList.toggle('on', j === i); });
      if (i < 0) { resetCenter(); return; }
      var L = groups[i].lang;
      setCenter(String(L.gold + L.silver), L.language, L.gold ? L.gold + ' gold set' + (L.gold === 1 ? '' : 's') : 'silver sets only');
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
    // English leads the tabs; the other sets keep their order
    D.examples.sort(function (a, b) { return (b.lang === 'en') - (a.lang === 'en'); });
    var state = { i: 0, translate: store('harley-translate') === '1' };

    D.examples.forEach(function (ex, i) {
      var b = el('button', { class: 'tab', role: 'tab', type: 'button', lang: ex.lang, 'aria-selected': i === 0 ? 'true' : 'false' }, tabsHost);
      el('span', { class: 'tab-script', text: ex.tab }, b);
      el('span', { class: 'tab-title', text: ex.title }, b);
      b.addEventListener('click', function () { select(i); setHash('set=' + ex.set); });
    });
    translateBtn.addEventListener('click', function () {
      state.translate = !state.translate;
      store('harley-translate', state.translate ? '1' : '0');
      translateBtn.setAttribute('aria-pressed', String(state.translate));
      fillTexts();
      if (reduceMotion) return;
      // the new text settles in with a short fade
      paper.querySelectorAll('.prompt, .answer blockquote').forEach(function (n) {
        n.classList.remove('tr-in'); void n.offsetWidth; n.classList.add('tr-in');
      });
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
      rowOrder(ex).forEach(function (code, vi) {
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
        var link = el('button', { class: 'verse-link', type: 'button', title: 'Copy a link to this prompt', 'aria-label': 'Copy a link to the ' + role[0].toLowerCase() + ' prompt' }, meta);
        link.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3.2-3.2a4.5 4.5 0 0 0-6.4-6.4L11.7 6"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3.2 3.2a4.5 4.5 0 0 0 6.4 6.4l1.5-1.5"/></svg><span>Copy link</span>';
        (function (link, url) {
          link.addEventListener('click', function () {
            var full = location.href.split('#')[0] + '#' + url;
            setHash(url);
            var done = function () { link.classList.add('copied'); link.lastChild.textContent = 'Copied'; setTimeout(function () { link.classList.remove('copied'); link.lastChild.textContent = 'Copy link'; }, 1400); };
            if (navigator.clipboard) navigator.clipboard.writeText(full).then(done, done); else done();
          });
        })(link, 'set=' + ex.set + '&v=' + shown);
        el('p', { class: 'prompt' }, main);

        // the featured model's answer, collapsed
        var g = ex.grid[code][ex.featured_index];
        var o = OUT[g.charAt(0)] || OUT.x;
        var tog = el('button', { class: 'answer-toggle', type: 'button', 'aria-expanded': 'false' }, main);
        tog.innerHTML = '<span class="caret">▸</span> ' + esc(model.name) + '’s answer';
        var ans = el('div', { class: 'answer' }, main);
        var ansIn = el('div', null, ans);
        var bq = el('blockquote', null, ansIn);
        bq.style.setProperty('--oc', o[2]);
        var who = el('div', { class: 'who' }, ansIn);
        who.innerHTML = esc(model.name) + ', first of five samples · <b style="color:' + o[2] + '">' + o[0] + '</b>';
        tog.addEventListener('click', function () {
          var open = tog.getAttribute('aria-expanded') !== 'true';
          tog.setAttribute('aria-expanded', String(open)); ans.classList.toggle('open', open);
          wake();
        });

        // outcome grid: 17 models x 5 samples
        var outc = el('div', { class: 'outcomes' + (vi === 0 ? ' annotated' : '') }, body);
        // the first grid gets axis labels, so new readers learn to read the rest
        if (vi === 0) el('div', { class: 'grid-axis', 'aria-hidden': 'true', html: '<span>17 models</span><i></i>' }, outc);
        // a small pointer over the featured model's column, whose answer sits under the prompt
        var mark = el('div', { class: 'featured-mark', 'aria-hidden': 'true' }, outc);
        mark.style.setProperty('--col', ex.featured_index);
        el('span', null, mark);
        var grid = el('div', { class: 'grid', role: 'group', tabindex: '0' }, outc);
        if (vi === 0) el('span', { class: 'grid-side', 'aria-hidden': 'true', text: '5 samples' }, outc);
        var n = { m: 0, w: 0, a: 0, r: 0, b: 0, t: 0, x: 0 }, total = 0, info = [];
        ex.grid[code].forEach(function (s, mi) {
          for (var k = 0; k < 5; k++) {
            var c = s.charAt(k) || 'x';
            n[c] = (n[c] || 0) + 1; total++;
            el('i', { class: 'dot ' + OUT[c][1] + (mi === ex.featured_index ? ' feat' : '') }, grid);
            info.push([D.models[mi].name, k, OUT[c][0]]);
          }
        });
        gridReader(grid, info);
        // pointing at the answer button lights up that model's column
        ['mouseenter', 'focus'].forEach(function (ev) { tog.addEventListener(ev, function () { outc.classList.add('feat-on'); }); });
        ['mouseleave', 'blur'].forEach(function (ev) { tog.addEventListener(ev, function () { outc.classList.remove('feat-on'); }); });
        var refused = n.r + n.b, mis = n.m + n.w;
        var share = el('div', { class: 'outcome-share' }, outc);
        // a jailbreak's responses are judged against its target's request
        share.innerHTML = '<span><b class="c-T">' + Math.round(100 * mis / total) + '%</b> are misaligned' + (shown === 'J' ? ' (judged against the target)' : '') + '</span><span><b>' + Math.round(100 * refused / total) + '%</b> are refused</span>';
        grid.setAttribute('aria-label', mis + ' of ' + total + ' responses misaligned' + (shown === 'J' ? ' when judged against the target' : '') + ', ' + refused + ' refused. The marked column is ' + model.name + '. Arrow keys step through them.');
        // tie the percentages to the dots just above them
        share.insertAdjacentHTML('afterbegin', '<span class="share-of">Of these ' + total + ' answers:</span>');
      });
      fillTexts();
    }

    // Each grid is one tab stop. The mouse, a tap or the arrow keys pick a dot (left/right: model, up/down: sample);
    // taps snap to the nearest dot, since the dots are too small to hit with a finger.
    function gridReader(grid, info) {
      var dots = grid.children, cur = -1;
      function show(i, speak) {
        if (cur >= 0) dots[cur].classList.remove('active');
        cur = Math.max(0, Math.min(info.length - 1, i));
        var f = info[cur];
        dots[cur].classList.add('active');
        tipFor(dots[cur], '<b>' + esc(f[0]) + '</b><br>sample ' + (f[1] + 1) + ' · ' + f[2]);
        if (speak) say(f[0] + ', sample ' + (f[1] + 1) + ', ' + f[2]);
      }
      function clear() { if (cur >= 0) dots[cur].classList.remove('active'); hideTip(); }
      function at(e) {
        var r = grid.getBoundingClientRect(), pitch = dots[5].offsetLeft - dots[0].offsetLeft || 10;
        var c = Math.floor((e.clientX - r.left + 1) / pitch), k = Math.floor((e.clientY - r.top + 1) / pitch);
        return c < 0 || c > 16 || k < 0 || k > 4 ? -1 : c * 5 + k;
      }
      grid.addEventListener('mousemove', function (e) { var i = at(e); if (i >= 0 && i !== cur) show(i); });
      grid.addEventListener('mouseleave', function () { if (document.activeElement !== grid) { clear(); cur = -1; } });
      grid.addEventListener('click', function (e) { var i = at(e); if (i >= 0) { e.stopPropagation(); show(i, true); } });
      grid.addEventListener('focus', function () { if (grid.matches(':focus-visible')) show(cur < 0 ? 0 : cur, true); });
      grid.addEventListener('blur', clear);
      grid.addEventListener('keydown', function (e) {
        var step = { ArrowRight: 5, ArrowLeft: -5, ArrowDown: 1, ArrowUp: -1 }[e.key];
        if (e.key === 'Home') step = -info.length; else if (e.key === 'End') step = info.length; else if (e.key === 'Escape') { clear(); return; }
        if (step === undefined) return;
        e.preventDefault();
        show(cur < 0 ? 0 : cur + step, true);
      });
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
        p.innerHTML = seg ? segsHTML(tr ? seg.en : seg.orig) : esc(text);
        var e = ex.excerpts[code];
        var bq = v.querySelector('.answer blockquote');
        var useEn = tr && e.en;
        bq.textContent = '“' + (useEn ? e.en : e.orig) + '”';
        bq.setAttribute('lang', useEn ? 'en' : ex.lang);
        bq.setAttribute('dir', !useEn && ex.lang === 'ar' ? 'rtl' : 'ltr');
      });
    }

    // Biblo dozes while the answers are folded away and wakes up while one is open
    var brand = document.querySelector('.brand');
    function wake() {
      var on = !!paper.querySelector('.answer.open');
      if (!brand) return;
      if (on === brand.classList.contains('awake')) return;
      brand.classList.toggle('awake', on);
      if (!reduceMotion) { brand.classList.remove('blink'); void brand.offsetWidth; brand.classList.add('blink'); }
    }

    // open a set from a link and bring one of its prompts into view
    hooks.openSet = function (num, v) {
      var i = -1;
      D.examples.forEach(function (ex, j) { if (String(ex.set) === String(num)) i = j; });
      if (i < 0) return false;
      if (i !== state.i) select(i);
      var ex = D.examples[i], code = v === ex.fifth ? 'H' : v;
      var target = (code && paper.querySelector('.verse[data-code="' + code + '"]')) || document.getElementById('sets');
      setTimeout(function () {
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: code ? 'center' : 'start' });
        if (code) { target.classList.remove('linked'); void target.offsetWidth; target.classList.add('linked'); }
      }, 60);
      return true;
    };

    function select(i) {
      state.i = i;
      tabsHost.querySelectorAll('.tab').forEach(function (b, j) { b.setAttribute('aria-selected', j === i ? 'true' : 'false'); });
      render();
      wake();
    }
    render();
  })();

  /* ---------------- I: pressure dumbbells ---------------- */
  (function dumbbell() {
    var host = document.getElementById('dumbbell');
    var MAX = 60;
    var keys = el('div', { class: 'db-keys' }, host);
    keys.innerHTML = '<span><i style="background:var(--A)"></i>aligned control</span><span><i style="background:var(--T)"></i>target</span><span><i class="p"></i>paraphrase</span>';
    var rows = D.models.map(function (m) { return { id: m.id, name: m.name, A: m.A, T: m.T, P: m.P, d: m.TA }; });
    rows.push({ name: 'All 17 models', A: D.paper.mis.A, T: D.paper.mis.T, P: D.paper.mis.P, d: D.paper.mis.diff, pooled: true });
    rows.forEach(function (r) {
      var row = el('div', { class: 'db-row' + (r.pooled ? ' pooled' : '') }, host);
      var lab = el('div', { class: 'db-label' }, row);
      if (r.id) el('a', { href: '#model=' + r.id, text: r.name, tabindex: '-1', title: 'Link to ' + r.name }, lab);
      else lab.textContent = r.name;
      if (r.id) row.setAttribute('data-model', r.id);
      var tr = el('div', { class: 'db-track' }, row);
      [0, 10, 20, 30, 40, 50, 60].forEach(function (t) { var gl = el('i', { class: 'gridline' }, tr); gl.style.left = (100 * t / MAX) + '%'; });
      var line = el('i', { class: 'db-line' }, tr);
      var p = el('i', { class: 'db-dot p' }, tr);
      var a = el('i', { class: 'db-dot a' }, tr);
      var t = el('i', { class: 'db-dot t' }, tr);
      el('div', { class: 'db-val', text: signed(r.d) }, row);
      a.style.left = line.style.left = (100 * r.A / MAX) + '%';
      p.style.left = (100 * r.P / MAX) + '%';
      t.style.left = (100 * r.T / MAX) + '%';
      line.style.width = (100 * (r.T - r.A) / MAX) + '%';
      var html = '<b>' + esc(r.name) + '</b><br>aligned control ' + fmt(r.A) + '% → target ' + fmt(r.T) + '%<br>paraphrase ' + fmt(r.P) + '%';
      row.tabIndex = 0;
      row.setAttribute('aria-label', r.name + ': aligned control ' + fmt(r.A) + '%, target ' + fmt(r.T) + '%, paraphrase ' + fmt(r.P) + '%, gap ' + signed(r.d) + ' points');
      row.addEventListener('mousemove', function (e) { showTip(html, e.clientX, e.clientY); });
      row.addEventListener('mouseleave', hideTip);
      row.addEventListener('focus', function () { if (row.matches(':focus-visible')) tipFor(t, html); });
      row.addEventListener('blur', hideTip);
      row.addEventListener('click', function (e) { if (e.target.closest('a')) return; e.stopPropagation(); tipFor(t, html); });
    });
    var axis = el('div', { class: 'db-axis' }, host);
    el('div', null, axis);
    var ticks = el('div', { class: 'ticks' }, axis);
    [0, 10, 20, 30, 40, 50, 60].forEach(function (t) { var s = el('span', { text: t + '%', class: t % 20 ? 'odd' : '' }, ticks); s.style.left = (100 * t / MAX) + '%'; });
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
    // shuffled grey grid first; once visible, hard negatives slide left, jailbreak variants right
    function layout() {
      var W = host.clientWidth;
      var s = W < 420 ? 12 : 14, g = 3, u = s + g, rows = W < 640 ? 10 : 6, gap = W < 420 ? 22 : 40;
      var hCols = Math.ceil(nH / rows);
      host.style.height = (rows * u) + 'px';
      var hi = 0, ji = 0;
      tiles.forEach(function (t, idx) {
        t.style.width = t.style.height = s + 'px';
        var x, y;
        if (!done) { x = Math.floor(idx / rows) * u; y = (idx % rows) * u; }
        else if (kinds[idx] === 'h') { x = Math.floor(hi / rows) * u; y = (hi % rows) * u; hi++; }
        else { x = hCols * u + gap + Math.floor(ji / rows) * u; y = (ji % rows) * u; ji++; }
        t.style.left = x + 'px'; t.style.top = y + 'px';
        t.style.transitionDelay = done && !reduceMotion ? (Math.floor(idx / rows) * 18) + 'ms' : '0ms';
      });
      var caps = document.querySelector('.split-captions');
      caps.style.gridTemplateColumns = W < 640 ? '' : (hCols * u + gap) + 'px 1fr';
    }
    layout();
    window.addEventListener('resize', layout);
    function play() { done = true; host.classList.add('done'); layout(); }
    if (reduceMotion) play(); else onVisible(host, function () { setTimeout(play, 350); }, 0.6);

    function bars(hostId, key, cls, lo, hi, pooledVal) {
      var h = document.getElementById(hostId);
      var span = hi - lo, zero = 100 * (0 - lo) / span;
      var rows = D.models.map(function (m) { return { id: m.id, name: m.name, v: m.refusal[key] }; });
      rows.push({ name: 'All 17 models', v: pooledVal, pooled: true });
      var items = rows.map(function (r) {
        var row = el('div', { class: 'bar-row' + (r.pooled ? ' pooled' : '') }, h);
        if (r.id) row.setAttribute('data-model', r.id);
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
            // value label always sits just past the bar end; the axis ranges leave room for it
            if (it.r.v < 0) {
              it.b.style.left = (zero - w) + '%'; it.b.style.width = w + '%';
              it.v.style.left = 'calc(' + (zero - w) + '% - 6px)'; it.v.style.transform = 'translate(-100%, -50%)';
            } else {
              it.b.style.width = w + '%';
              it.v.style.left = 'calc(' + (zero + w) + '% + 6px)';
            }
            it.v.style.opacity = '1';
          }, reduceMotion ? 0 : 45 * i);
        });
      }
      if (reduceMotion) play2(); else onVisible(h, play2, 0.25);
    }
    // same points-per-pixel in both panels
    bars('bars-j', 'JT', 'j', -36, 8, D.paper.jsets_refusal.diff);
    bars('bars-h', 'HA', 'h', -8, 36, D.paper.hsets_refusal.diff);
  })();

  /* ---------------- III: prophecy (screening) ---------------- */
  (function prophecy() {
    var host = document.getElementById('barcode');
    var input = document.getElementById('cutoff');
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

    // the six frontier models, each with one pip per target prompt that broke it
    var F = D.screening.frontier, emperors = [];
    var emHost = document.getElementById('emperors');
    if (F && P[0].length > 3 && emHost) {
      emHost.hidden = false;
      el('p', { class: 'emperors-head', html: 'The six <span>&middot; each frontier model&rsquo;s failures caught so far</span>' }, emHost);
      var list = el('div', { class: 'emperor-list' }, emHost);
      F.forEach(function (name, b) {
        var mine = []; P.forEach(function (p, i) { if (p[3] >> b & 1) mine.push(i); });
        var card = el('button', { class: 'emperor', type: 'button', 'aria-pressed': 'false' }, list);
        el('span', { class: 'emperor-name', text: name }, card);
        var pips = el('span', { class: 'pips', 'aria-hidden': 'true' }, card);
        var pipEls = mine.map(function () { return el('i', null, pips); });
        var count = el('span', { class: 'emperor-count' }, card);
        var em = { b: b, name: name, mine: mine, card: card, pips: pipEls, count: count };
        card.addEventListener('mouseenter', function () { spotlight(em, false); });
        card.addEventListener('mouseleave', function () { spotlight(null, false); });
        card.addEventListener('focus', function () { spotlight(em, false); });
        card.addEventListener('blur', function () { spotlight(null, false); });
        card.addEventListener('click', function () { spotlight(pinned === em ? null : em, true); });
        emperors.push(em);
      });
    }
    var pinned = null;
    hooks.pinFrontier = function (name) {
      var em = null;
      emperors.forEach(function (e) { if (e.name === name) em = e; });
      spotlight(em, true);
      return !!em;
    };
    function spotlight(em, pin) {
      if (pin) pinned = em;
      var on = em || pinned;
      emperors.forEach(function (e) { e.card.setAttribute('aria-pressed', String(e === pinned)); e.card.classList.toggle('lit', e === on); });
      host.classList.toggle('spot', !!on);
      ticks.forEach(function (t, i) { t.classList.toggle('mine', !!on && !!(P[i][3] >> on.b & 1)); });
    }

    var roK = document.getElementById('ro-k'), roKp = document.getElementById('ro-kp');
    var roF = document.getElementById('ro-f'), roFp = document.getElementById('ro-fp');
    function update(kk) {
      kk = Math.max(1, Math.min(N, Math.round(kk)));
      var xx = X0 + (X1 - X0) * (kk / N);
      shade.setAttribute('width', xx - X0);
      cut.setAttribute('x1', xx); cut.setAttribute('x2', xx);
      ticks.forEach(function (t, i) { if (P[i][2]) t.classList.toggle('out', i >= kk); });
      handle.style.left = (100 * xx / 1000) + '%';
      handle.style.top = (y(kk) - 7) + 'px';
      roK.textContent = kk; roKp.textContent = Math.floor(100 * kk / N);
      roF.textContent = cum[kk]; roFp.textContent = Math.round(100 * cum[kk] / POS);
      input.value = kk;
      emperors.forEach(function (e) {
        var found = 0;
        e.mine.forEach(function (i, j) { var f = i < kk; e.pips[j].classList.toggle('found', f); if (f) found++; });
        e.count.textContent = found + ' of ' + e.mine.length + ' caught';
        e.card.setAttribute('aria-label', e.name + ': ' + found + ' of ' + e.mine.length + ' failures found in the top ' + kk);
      });
    }
    input.addEventListener('input', function () { update(+input.value); });
    update(Math.round(N / 3));
  })();

  /* ---------------- links: #set=814, #set=814&v=T, #model=kimi-k3 ---------------- */
  var routedPin = false;
  function setHash(h) { if (history.replaceState) history.replaceState(null, '', '#' + h); }
  function route() {
    var q = {};
    location.hash.slice(1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[1]) q[p[0]] = decodeURIComponent(p[1]); });
    document.querySelectorAll('[data-model].picked').forEach(function (n) { n.classList.remove('picked'); });
    if (routedPin && hooks.pinFrontier) { hooks.pinFrontier(null); routedPin = false; }
    if (q.set && hooks.openSet) { hooks.openSet(q.set, q.v); return; }
    if (q.model) {
      var m = null;
      D.models.forEach(function (x) { if (x.id === q.model) m = x; });
      if (!m) return;
      document.querySelectorAll('[data-model="' + q.model + '"]').forEach(function (n) { n.classList.add('picked'); });
      if (hooks.pinFrontier) routedPin = hooks.pinFrontier(m.name);
      var row = document.querySelector('.db-row[data-model="' + q.model + '"]');
      setTimeout(function () { row.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }); }, 60);
    }
  }
  window.addEventListener('hashchange', route);
  if (/^#(set|model)=/.test(location.hash)) route();

  /* ---------------- copy BibTeX ---------------- */
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = document.getElementById(b.getAttribute('data-copy')).textContent;
      var done = function () { var o = b.textContent; b.textContent = 'Copied'; setTimeout(function () { b.textContent = o; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, function () {});
    });
  });
})();
