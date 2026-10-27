/* HARLEY: "which prompt broke the most models?", a guessing game over the three example sets in window.HARLEY. */
(function () {
  'use strict';
  var D = window.HARLEY, root = document.querySelector('.gq');
  if (!D || !root) return;
  var M = D.models;

  var ROLE = {
    T: ['Target', 'var(--T)'], P: ['Paraphrase', 'var(--P)'], A: ['Aligned control', 'var(--A)'],
    S: ['Style control', 'var(--S)'], H: ['Hard negative', 'var(--H)'], J: ['Jailbreak', 'var(--J)']
  };

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
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }

  // Each prompt with every model's outcome: b broke, w wavered, '' held. The fifth prompt is stored under H even
  // when the set's fifth is a jailbreak; a jailbreak's responses are judged against its target's request.
  function promptsOf(ex) {
    return Object.keys(ex.grid).map(function (k) {
      var code = k === 'H' && ex.fifth === 'J' ? 'J' : k;
      var per = ex.grid[k].map(function (s) {
        var n = (s.match(/[mw]/g) || []).length;
        return n >= 3 ? 'b' : (n > 0 ? 'w' : '');
      });
      return {
        code: code, per: per,
        n: per.filter(function (o) { return o === 'b'; }).length,
        en: (ex.prompts_en && ex.prompts_en[k]) || ex.prompts[k],
        orig: ex.lang === 'en' ? null : ex.prompts[k]
      };
    });
  }

  var sets = D.examples, i = 0, results = [];
  var cards = document.getElementById('gq-cards');
  var next = document.getElementById('gq-next'), bar = document.getElementById('gq-round'), orig = document.getElementById('gq-orig');
  var score = document.getElementById('gq-score');

  function hits() { return results.filter(Boolean).length; }

  function roundBar(ex, done) {
    bar.innerHTML = '';
    el('span', { class: 'gq-set', text: ex.title + ' · ' + ex.language }, bar);
    var pips = el('span', { class: 'gq-progress', 'aria-label': 'Set ' + (i + 1) + ' of ' + sets.length }, bar);
    sets.forEach(function (_, k) { el('i', { class: results[k] === true ? 'hit' : results[k] === false ? 'miss' : k === i ? 'on' : '' }, pips); });
    score.innerHTML = done ? '<b>' + hits() + '</b> of ' + done + ' right' : '';
  }

  function card(p, ex) {
    var b = el('button', { class: 'gq-card', type: 'button' }, cards);
    b.style.setProperty('--c', ROLE[p.code][1]);
    var badge = el('span', { class: 'gq-badge', text: '?', 'aria-hidden': 'true' }, b);
    var mid = el('div', null, b);
    var role = el('span', { class: 'gq-role' }, mid);
    el('div', { class: 'gq-txt', text: p.en }, mid);
    if (p.orig) el('div', { class: 'gq-orig-txt', text: p.orig, lang: ex.lang, dir: ex.lang === 'ar' ? 'rtl' : 'ltr' }, mid);
    var res = el('div', { class: 'gq-res' }, b);
    b.reveal = function (flags) {
      b.classList.add('shown');
      b.disabled = true;
      badge.textContent = p.code;
      role.textContent = ROLE[p.code][0];
      el('span', { class: 'gq-n', html: p.n + '<small>of 17 broken</small>' }, res);
      var s = el('div', { class: 'gq-strip', 'aria-hidden': 'true' }, res);
      p.per.forEach(function (o, k) { el('i', { class: o, title: M[k].name }, s); });
      flags.forEach(function (f) { el('span', { class: 'gq-flag ' + f[0], text: f[1] }, res); });
      var names = p.per.map(function (o, k) { return o === 'b' ? M[k].name : null; }).filter(Boolean);
      b.setAttribute('aria-label', ROLE[p.code][0] + ': broke ' + p.n + ' of 17 models' + (names.length ? ' (' + names.join(', ') + ')' : '') + '. ' + p.en);
    };
    return b;
  }

  function play() {
    var ex = sets[i], ps = shuffle(promptsOf(ex));
    var top = Math.max.apply(null, ps.map(function (p) { return p.n; }));
    cards.innerHTML = ''; next.hidden = true;
    orig.hidden = ex.lang === 'en';
    roundBar(ex, i);
    var cs = ps.map(function (p) {
      var c = card(p, ex);
      c.addEventListener('click', function () {
        results[i] = p.n === top;
        cs.forEach(function (x, k) {
          var f = [];
          if (ps[k].n === top) { f.push(['most', 'Most broken']); x.classList.add('winner'); }
          if (x === c) { f.push(['you', 'Your guess']); x.classList.add('picked'); }
          x.reveal(f);
        });
        roundBar(ex, i + 1);
        next.hidden = false;
        var up = sets[i + 1];
        next.innerHTML = up ? '<span>Next set<small>' + up.title + ' · ' + up.language + '</small></span><i aria-hidden="true">→</i>'
          : '<span>Play again<small>' + hits() + ' of ' + sets.length + ' right this time</small></span><i aria-hidden="true">↻</i>';
        next.focus({ preventScroll: true });
      });
      return c;
    });
  }

  next.addEventListener('click', function () {
    if (i < sets.length - 1) i++; else { i = 0; results = []; }
    play();
    bar.scrollIntoView({ block: 'nearest' });
  });
  orig.addEventListener('click', function () {
    var on = orig.getAttribute('aria-pressed') !== 'true';
    orig.setAttribute('aria-pressed', String(on)); root.classList.toggle('show-orig', on);
  });
  play();
})();
