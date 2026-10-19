/* HARLEY: a Thousand Sunny that sails the top bar to Treasure Tree Adam as you scroll, and a
   serpent from the Elbaph mural that swims around the rings. Everything is SVG and every motion
   is driven by elapsed time, never by frame count. The page picks which ones to use with
   data-parts on the script tag.
   ?calm turns it all off; reduced motion keeps the drawings but holds them still. */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg', TAU = Math.PI * 2;
  var calm = /[?&]calm\b/.test(location.search);
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var uid = 0;

  function make(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function f(x) { return (Math.round(x * 10) / 10).toString(); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* a bone from (x1,y1) to (x2,y2): ink underlay, white shaft, two knuckles at each end */
  function bone(x1, y1, x2, y2, w) {
    var dx = x2 - x1, dy = y2 - y1, L = Math.sqrt(dx * dx + dy * dy), px = -dy / L * w * .42, py = dx / L * w * .42;
    var ends = [[x1, y1], [x2, y2]], knobs = '', i;
    for (i = 0; i < 2; i++) {
      knobs += '<circle cx="' + f(ends[i][0] + px) + '" cy="' + f(ends[i][1] + py) + '" r="' + f(w * .5) + '"/>' +
               '<circle cx="' + f(ends[i][0] - px) + '" cy="' + f(ends[i][1] - py) + '" r="' + f(w * .5) + '"/>';
    }
    var line = 'x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '"';
    return '<g class="s-bone">' +
      '<g class="s-bone-ink"><line ' + line + ' stroke-width="' + f(w + 1.4) + '"/>' + knobs.replace(/r="([\d.]+)"/g, function (m, r) { return 'r="' + f(+r + .7) + '"'; }) + '</g>' +
      '<g class="s-bone-white"><line ' + line + ' stroke-width="' + f(w) + '"/>' + knobs + '</g></g>';
  }

  /* a dome striped red and yellow, the Sunny's crow's nest and stern tower both wear one */
  function dome(cx, base, rx, ry, id) {
    var d = 'M' + f(cx - rx) + ' ' + base + 'A' + rx + ' ' + ry + ' 0 0 1 ' + f(cx + rx) + ' ' + base + 'Z', stripes = '';
    for (var x = cx - rx + rx / 3.5; x < cx + rx; x += rx / 1.75) {
      stripes += '<rect x="' + f(x) + '" y="' + f(base - ry - 1) + '" width="' + f(rx / 3.5) + '" height="' + f(ry + 1) + '"/>';
    }
    return '<clipPath id="' + id + '"><path d="' + d + '"/></clipPath>' +
      '<path class="s-yellow" d="' + d + '"/><g class="s-red-f" clip-path="url(#' + id + ')">' + stripes + '</g>' +
      '<path class="s-line" fill="none" d="' + d + '"/>';
  }

  /* ---------------- the Thousand Sunny, broadside, bow to the right ----------------
     Laid out on a side elevation (Oda's SBS blueprint icons, the "Sunny at Yo" painting and a
     broadside pixel study, mirrored): a deep round bowl of a hull, two red U-panels framed in
     white, the dark band through the big "1" ring, the lion on its gold collar over crossed
     bones, the foremast with the crow's nest and the straw-hat sail, the taller mainmast with a
     white topsail over the red-and-black gaff sail, the galley house, the domed stern tower and
     the paddle drum. Units are those of the 690px study; SHIP.water is the waterline. */
  var SHIP = { w: 725, water: 640, mid: 378 };
  function port(x, y) {
    return '<rect class="s-port" x="' + (x - 13) + '" y="' + (y - 11) + '" width="26" height="22" rx="7"/>' +
           '<rect class="s-port-glass" x="' + (x - 5) + '" y="' + (y - 4) + '" width="10" height="8" rx="3"/>';
  }
  function shipMarkup() {
    var k = 'sunny' + (++uid), petals = '', stripes = '', rivets = '', i, a;
    for (i = 0; i < 11; i++) petals += '<path transform="rotate(' + f(i * 32.7 + 6) + ')" d="M-15 -26C-17 -46 -8 -62 8 -76C3 -57 13 -42 15 -26Z"/>';
    for (i = 0; i < 7; i++) stripes += '<path d="M' + (44 + i * 40) + ' 80h20l-48 290h-20z"/>';
    for (i = 0; i < 9; i++) { a = i / 9 * TAU; rivets += '<circle cx="' + f(566 + 29 * Math.cos(a)) + '" cy="' + f(494 + 77 * Math.sin(a)) + '" r="4.5"/>'; }
    var uPanel = 'M216 436L300 432C300 478 322 512 360 514C398 514 420 478 420 428L502 410C506 470 474 538 418 560C390 576 330 578 300 562C252 542 222 494 216 436Z';
    var shield = 'M504 412L598 418C604 500 590 568 550 606C528 580 512 510 504 412Z';
    var hull = 'M118 522L224 522L224 440L598 416C604 500 586 598 522 642C452 684 268 684 198 652C146 628 120 588 118 522Z';
    var curl = 'M424 436C412 408 432 388 458 392C482 396 486 424 466 432C452 438 444 426 452 418';
    return '' +
      '<path class="s-rig" d="M445 130L592 405M440 140L392 428M450 140L424 428M396 392H426M399 362H429M213 44L440 108M210 60L60 364M213 56L330 92"/>' +
      /* mainmast: white topsail over the red-and-black gaff sail */
      '<rect class="s-wood-2" x="204" y="34" width="12" height="390"/>' +
      '<clipPath id="' + k + 'g"><path d="M38 98C110 120 160 150 207 178L207 338C140 320 70 305 12 292C22 230 30 160 38 98Z"/></clipPath>' +
      '<path class="s-gaff" d="M38 98C110 120 160 150 207 178L207 338C140 320 70 305 12 292C22 230 30 160 38 98Z"/>' +
      '<g class="s-gaff-dark" clip-path="url(#' + k + 'g)">' + stripes + '</g>' +
      '<path class="s-line" fill="none" d="M38 98C110 120 160 150 207 178L207 338C140 320 70 305 12 292C22 230 30 160 38 98Z"/>' +
      '<path class="s-spar" d="M30 92L212 180M28 186L250 246M4 292L258 352"/>' +
      '<path class="s-canvas" d="M98 30L305 98C322 150 322 205 302 245C220 228 140 205 58 184C82 135 92 80 98 30Z"/>' +
      '<path class="s-seam" d="M140 44C130 100 118 150 108 196M185 58C178 110 168 160 160 209M230 74C228 120 220 170 210 222M272 88C276 135 270 180 258 236"/>' +
      '<path class="s-spar" d="M90 25L314 101"/>' +
      '<rect class="s-black" x="203" y="262" width="14" height="10"/>' +
      '<ellipse class="s-white" cx="210" cy="36" rx="17" ry="7"/>' +
      '<line class="s-pole" x1="210" y1="32" x2="210" y2="0"/>' +
      '<path class="s-flag" d="M210 2C197 -2 185 6 170 2V30C185 34 197 26 210 30Z"/><circle class="s-white" cx="189" cy="16" r="5"/>' +
      /* foremast: crow's nest and the straw-hat sail */
      '<rect class="s-wood-2" x="440" y="118" width="12" height="310"/>' +
      '<path class="s-canvas" d="M342 92L546 212C562 272 560 330 540 362C470 374 392 395 322 420C312 330 320 190 342 92Z"/>' +
      '<path class="s-seam" d="M380 114C370 200 362 300 360 405M420 138C415 220 410 300 408 390M462 162C462 240 460 300 456 378M505 186C510 250 508 320 500 368"/>' +
      bone(427, 238, 505, 330, 13) + bone(505, 238, 427, 330, 13) +
      '<circle class="s-skull" cx="466" cy="274" r="31"/>' +
      '<rect class="s-skull" x="450" y="294" width="32" height="18" rx="6"/>' +
      '<ellipse class="s-black" cx="454" cy="276" rx="8" ry="10"/><ellipse class="s-black" cx="478" cy="276" rx="8" ry="10"/>' +
      '<ellipse class="s-straw" cx="466" cy="249" rx="48" ry="9"/>' +
      '<path class="s-straw" d="M440 248C438 216 494 216 492 248Z"/>' +
      '<path class="s-red" d="M440 238H492L492.4 247H439.6Z"/>' +
      '<path class="s-spar" d="M335 86L552 216"/>' +
      '<path class="s-white s-line" d="M412 125C425 150 465 150 478 125Z"/>' +
      '<rect class="s-white s-line" x="414" y="104" width="62" height="21"/>' +
      '<path class="s-glass" d="M421 108h9v12h-9zM436 108h9v12h-9zM451 108h9v12h-9zM465 108h7v12h-7z"/>' +
      dome(445, 104, 31, 18, k + 'd1') +
      '<line class="s-pole" x1="445" y1="86" x2="445" y2="40"/>' +
      '<path class="s-flag" d="M445 42C432 38 420 46 404 42V70C420 74 432 66 445 70Z"/><circle class="s-white" cx="424" cy="56" r="5"/>' +
      /* the stern tower on its pedestal, the galley house, a tree by the mainmast */
      '<path class="s-white s-line" d="M30 396H160C150 418 118 424 106 432C80 424 40 418 30 396Z"/>' +
      '<path class="s-stalk-ink" d="M102 428C96 450 104 466 126 474"/><path class="s-stalk" d="M102 428C96 450 104 466 126 474"/>' +
      '<rect class="s-white s-line" x="38" y="372" width="115" height="24"/>' +
      '<path class="s-glass" d="M48 377h12v14H48zM68 377h12v14H68zM88 377h12v14H88zM108 377h12v14h-12zM128 377h12v14h-12z"/>' +
      dome(95, 372, 58, 30, k + 'd2') +
      '<path class="s-black" d="M150 330h12v14h-12z"/><path class="s-line" fill="none" d="M156 344V372"/>' +
      '<circle class="s-leaf" cx="188" cy="386" r="15"/><circle class="s-fruit" cx="183" cy="380" r="3.5"/><circle class="s-fruit" cx="195" cy="390" r="3.5"/>' +
      '<rect class="s-house-red" x="138" y="408" width="162" height="44"/>' +
      '<path class="s-glass-sea" d="M158 446v-16a9 9 0 0 1 18 0v16zM190 446v-16a9 9 0 0 1 18 0v16zM222 446v-16a9 9 0 0 1 18 0v16zM254 446v-16a9 9 0 0 1 18 0v16z"/>' +
      '<path class="s-roof" d="M128 412Q215 378 304 404V414Q215 392 128 422Z"/>' +
      '<rect class="s-house" x="118" y="452" width="106" height="76"/>' +
      '<path class="s-glass-sea" d="M128 468h16v14h-16zM198 468h16v14h-16z"/><path class="s-door" d="M160 528v-30a11 11 0 0 1 22 0v30z"/>' +
      '<path class="s-line" fill="none" d="M118 460H224"/>' +
      /* the hull */
      '<path class="s-wood" d="' + hull + '"/>' +
      '<path class="s-plank" d="M160 610C250 640 460 640 548 600M190 640C270 664 440 664 520 638M130 560C140 575 150 590 160 600"/>' +
      '<path class="s-waist" d="M300 432C300 478 322 512 360 514C398 514 420 478 420 428Z"/><ellipse class="s-lawn" cx="360" cy="500" rx="46" ry="12"/>' +
      '<path class="s-band" d="M150 548C220 578 300 588 355 588C420 588 500 566 552 532"/>' +
      '<path class="s-frame-ink" d="' + uPanel + '"/><path class="s-panel" d="' + uPanel + '"/>' +
      '<path class="s-frame-ink" d="' + shield + '"/><path class="s-panel" d="' + shield + '"/>' +
      port(262, 500) + port(284, 538) + port(470, 466) + port(462, 504) + port(440, 540) + port(176, 566) +
      '<circle class="s-ring" cx="356" cy="576" r="54"/>' +
      '<path class="s-one" d="M342 552L362 540V612M338 614H386"/>' +
      '<path class="s-curl-ink" d="' + curl + '"/><path class="s-curl" d="' + curl + '"/>' +
      '<path class="s-drum" d="M80 468L122 472V562L80 566Z"/><path class="s-hoop" d="M94 469V565M110 470V563"/>' +
      '<ellipse class="s-drum-end" cx="80" cy="517" rx="17" ry="49"/><ellipse class="s-drum-ring" cx="80" cy="517" rx="10" ry="31"/><ellipse class="s-wood-2" cx="80" cy="517" rx="4" ry="11"/>' +
      '<rect class="s-drum" x="96" y="580" width="54" height="78" rx="10"/><path class="s-plank" d="M96 602H150M96 636H150"/>' +
      '<path class="s-hull-line" d="' + hull + '"/>' +
      /* the figurehead: Sunny-kun on his gold collar over crossed bones */
      bone(548, 372, 616, 610, 20) + bone(622, 380, 540, 606, 20) +
      '<ellipse class="s-collar" cx="566" cy="494" rx="36" ry="86"/><ellipse class="s-collar-in" cx="566" cy="494" rx="22" ry="66"/>' +
      '<g class="s-rivet">' + rivets + '</g>' +
      '<g class="s-mane" transform="translate(642 424)">' + petals + '<circle r="40"/></g>' +
      '<circle class="s-face" cx="648" cy="426" r="36"/>' +
      '<ellipse class="s-muzzle" cx="678" cy="440" rx="18" ry="15"/>' +
      '<ellipse class="s-black" cx="694" cy="432" rx="6" ry="5"/>' +
      '<circle class="s-black" cx="655" cy="412" r="6"/><circle class="s-white" cx="657" cy="410" r="2"/>' +
      '<path class="s-smile" d="M674 456Q684 461 694 453"/>';
  }

  /* ---------------- Treasure Tree Adam, standing out of the sea at Elbaph ----------------
     Box 150 x 110, sea level at y = 100: a flat crown like a thunderhead, a trunk that glows
     where the light hits it, a second forest on the shelf below, waterfalls off both rims. */
  function scallops(pts, rnd) {
    var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
    for (var i = 1; i <= pts.length; i++) {
      var a = pts[i - 1], b = pts[i % pts.length], dx = b[0] - a[0], dy = b[1] - a[1];
      var r = Math.sqrt(dx * dx + dy * dy) / 2 * (1.02 + rnd() * .25);
      d += 'A' + f(r) + ' ' + f(r) + ' 0 0 1 ' + f(b[0]) + ' ' + f(b[1]);
    }
    return d + 'Z';
  }
  function crown(cx, cy, rx, ry, under, nTop, nBot, rnd) {
    var pts = [], i, t;
    for (i = 0; i <= nTop; i++) {
      t = Math.PI + Math.PI * i / nTop;
      pts.push([cx + rx * Math.cos(t), cy - ry * Math.pow(Math.abs(Math.sin(t)), .55) + (rnd() - .5) * 2]);
    }
    for (i = 1; i < nBot; i++) {
      t = i / nBot;
      pts.push([cx + rx - 2 * rx * t, cy + under * Math.sin(Math.PI * t) + (rnd() - .5) * 1.5]);
    }
    return scallops(pts, rnd);
  }
  function islandMarkup() {
    var rnd = mulberry32(1591), i, out = '';
    for (i = 0; i < 27; i++) rnd();                               // the crowns' bumps start 27 draws in
    /* Elbaph as it looks from the sea. Below the shelf the trunk carries on down in shadow and
       flares into its roots, dark rock spires crowd round its foot, and falls drop from the shelf's
       rim to the sea. It is far off, so a mask fades it into the air, most of all toward the water.
       The rock has its own generator, so the tree keeps the shape it was drawn with. */
    var isl = mulberry32(1592), hz = 'isle' + (++uid);
    out += '<linearGradient id="' + hz + 'g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">' +
      '<stop offset=".25" class="i-hz-top"/><stop offset="1" class="i-hz-bot"/></linearGradient>' +
      '<mask id="' + hz + '" maskUnits="userSpaceOnUse" x="-5" y="-5" width="160" height="110">' +
      '<rect x="-5" y="-5" width="160" height="110" fill="url(#' + hz + 'g)"/></mask><g mask="url(#' + hz + ')">';
    function ridge(x0, x1, tall, low) {                           // a jagged row of spires standing on the water
      var d = 'M' + f(x0) + ' 100', x = x0, w, h;
      while (x < x1) {
        w = 4 + isl() * 4;
        h = low + tall * Math.max(0, 1 - Math.abs(x + w / 2 - 75) / 58) + isl() * 3;
        d += 'L' + f(x + w * (.35 + isl() * .3)) + ' ' + f(100 - h) + 'L' + f(x + w) + ' ' + f(100 - low * .45 - isl() * 1.5);
        x += w;
      }
      return d + 'L' + f(x) + ' 100Z';
    }
    out += '<path class="i-spire-far" d="' + ridge(14, 130, 13, 7.5) + '"/>';
    /* the trunk under the shelf, out of the sun, widening into roots where it meets the rock */
    out += '<path class="i-trunk-low" d="M58 66L60.4 82C60.6 88 57 92.4 49 95.6C45 97.2 41 98.6 36 100L114 100C109 98.6 105 97.2 101 95.6C93 92.4 89.4 88 89.6 82L92 66Z"/>';
    out += '<path class="i-glow-low" d="M70.4 72C71.6 79 71.2 87 69 95L79 95C77.4 87 77.6 79 79.4 72Z"/>';
    out += '<path class="i-bark" d="M63.6 76C64.4 84 62 90 55 94.6M86.4 76C85.6 84 88 90 95 94.6M75 78C74.2 85 75.6 90 74.6 96"/>';
    out += '<path class="i-spire" d="' + ridge(22, 126, 2, 5) + '"/>';
    out += '<ellipse class="i-mist" cx="75" cy="97" rx="62" ry="3"/>';
    /* the trunk between shelf and crown, lit gold down the middle, splitting into the crown's roots */
    out += '<path class="i-trunk" d="M52 32C61 38 64 46 64 54L63.6 64L86.4 64L86 54C86 46 89 38 98 32Z"/>';
    out += '<path class="i-glow" d="M67 40C70 46 70.6 52 70 58L69.6 64L80.4 64L80 58C79.4 52 80 46 83 40C78 38 72 38 67 40Z"/>';
    out += '<path class="i-bark" d="M66.4 45C68.6 51 68 57 67 63M83.6 45C81.4 51 82 57 83 63M75 41C76 49 74.6 55 75.4 63"/>';
    out += '<path class="i-root" d="M62 40C53 36 41 36 28 34.6M88 40C97 36 109 36 122 34.6M68 36C62 33 54 32 45 32.4M82 36C88 33 96 32 105 32.4M72 35C70 31.6 65 30 60 30M78 35C80 31.6 85 30 90 30"/>';
    out += '<g class="i-fall"><rect x="30" y="34" width="1.6" height="20"/><rect x="44.4" y="36" width="1.2" height="17"/><rect x="104.6" y="36" width="1.6" height="17"/><rect x="118" y="34" width="1.4" height="19"/></g>';
    /* the crown: a great flat dome, sunlit on top, dark and heavy underneath */
    out += '<path class="i-leaf" d="' + crown(75, 30, 57, 26, 3, 14, 13, rnd) + '"/>';
    out += '<path class="i-leaf-lit" d="' + crown(72, 23, 45, 17, 2, 12, 8, rnd) + '"/>';
    out += '<path class="i-leaf-sun" d="' + crown(66, 14, 26, 8, 1.5, 7, 5, rnd) + '"/>';
    out += '<path class="i-leaf-dark" d="M19 30.4C44 38 106 38 131 30.4L130 32.6C106 40.6 44 40.6 20 32.6Z"/>';
    /* the shelf: a flat forest wider than the crown over a dark underside of earth and roots */
    out += '<path class="i-plate" d="M7 62C30 71 120 71 143 62L140 67.4C118 79 32 79 10 67.4Z"/>';
    out += '<path class="i-leaf i-shelf" d="' + crown(75, 61, 72, 11, 5, 24, 14, rnd) + '"/>';
    out += '<path class="i-leaf-lit" d="' + crown(74, 57, 58, 5, 1.5, 18, 10, rnd) + '"/>';
    out += '<ellipse class="i-cloud" cx="62" cy="55" rx="5" ry="1.8"/><ellipse class="i-cloud" cx="88" cy="54.6" rx="5.6" ry="2"/>';
    /* falls off the shelf's rim, all the way down to the sea */
    out += '<g class="i-fall"><path d="M36 56L41 56L41.8 100L35.2 100Z"/><path d="M99 55L103 55L103.6 100L98.4 100Z"/><path d="M128.8 58L132 58L133 100L128.4 100Z"/><path d="M7.4 62L9.6 62L4.6 100L2 100Z"/></g>';
    out += '<path class="i-surf" d="M1 98.4Q9 96.8 19 98.4T39 98.4T59 98.4T79 98.4T99 98.4T119 98.4T139 98.4T149 98.4"/>';
    return out + '</g>';
  }

  /* ---------------- the voyage: the Sunny sails the top bar's bottom edge ----------------
     The sea is the bar's bottom border: two long swells of different length and speed added
     together, so it never quite repeats, running the full width of the bar. The ship sails it in
     the empty stretch between the brand and the nav, so she never covers the page; scroll
     position sets where she is headed and she eases there over real time, riding the swell.
     The blue wake behind her is how far down the page you are. Under way the sea runs; at
     anchor it slows. Where the bar has no room for her, the border still rolls and the wake
     alone keeps count. */
  var SWELL = [[.85, TAU / 97, 1.2, 0], [.4, TAU / 41, -1.6, 1.7]];   // height (px), wavenumber, speed, phase
  function swell(x, t) {
    return SWELL[0][0] * Math.sin(SWELL[0][1] * x - SWELL[0][2] * t + SWELL[0][3]) +
           SWELL[1][0] * Math.sin(SWELL[1][1] * x - SWELL[1][2] * t + SWELL[1][3]);
  }

  function voyage(topbar) {
    var brand = topbar.querySelector('.brand'), nav = topbar.querySelector('.topnav'), sw = topbar.querySelector('.theme-switch');
    if (!brand || !sw) return;
    var k = 'voy' + (++uid), STEP = 6, IDLE = .3;
    var host = make('svg', { 'class': 'voyage', 'aria-hidden': 'true', focusable: 'false' });
    topbar.insertBefore(host, topbar.firstChild);
    var defs = make('defs', {}, host);
    var wakeClip = make('rect', { x: 0, y: 0, width: 0, height: 200 }, make('clipPath', { id: k + 'w' }, defs));
    var above = make('path', {}, make('clipPath', { id: k + 's' }, defs));   // everything above the sea: hulls sink into it, nothing hangs below the bar

    var waves = make('path', { 'class': 'v-waves' }, host);
    var fade = make('linearGradient', { id: k + 'f', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
    make('stop', { offset: 0, 'class': 'v-wake-ink', 'stop-opacity': 0 }, fade);   // the wake trails off toward the left edge
    make('stop', { offset: .55, 'class': 'v-wake-ink', 'stop-opacity': .35 }, fade);
    make('stop', { offset: 1, 'class': 'v-wake-ink' }, fade);
    var wake = make('path', { 'class': 'v-wake', stroke: 'url(#' + k + 'f)', 'clip-path': 'url(#' + k + 'w)' }, host);
    var afloat = make('g', { 'clip-path': 'url(#' + k + 's)' }, host);
    var isle = make('g', { 'class': 'v-isle' }, afloat);
    isle.innerHTML = islandMarkup();
    var ship = make('g', { 'class': 'v-ship' }, afloat);
    var flip = make('g', { 'class': 'v-flip' }, ship);
    make('rect', { x: SHIP.mid - 400, y: 0, width: 800, height: SHIP.water, fill: 'none' }, flip);   // centres the flip on the hull, not on the foam
    make('g', {}, flip).innerHTML = shipMarkup();
    var foam = make('g', { 'class': 'v-foam' }, flip);
    foam.innerHTML = '<path d="M160 634q-30 -18 -60 0M110 638q-36 -24 -80 -6"/><path class="v-foam-2" d="M50 640q-36 -18 -72 0"/><path d="M540 636q24 -30 60 -24M580 640q18 -18 48 -18"/>';

    var W = 0, laneX = 0, lane = 0, waterY = 0, s = .45, range = 0, sailing = false;
    var voy = 0, target = 0, facing = 1, sea = 0, flow = IDLE, idleAt = 0, raf = 0, last = 0, drawn = 0;

    function layout() {
      var tb = topbar.getBoundingClientRect(), b = brand.getBoundingClientRect();
      var end = nav && getComputedStyle(nav).display !== 'none' ? nav : sw;
      var Hp = topbar.clientHeight;                          // the padding box; the border row sits just below it
      W = Math.round(tb.width);
      laneX = b.right - tb.left + 18;
      lane = Math.floor(end.getBoundingClientRect().left - tb.left - 18 - laneX);
      sailing = lane >= 150;
      ship.style.display = isle.style.display = sailing ? '' : 'none';
      host.setAttribute('viewBox', '0 0 ' + W + ' ' + (Hp + 1));
      waterY = Hp - .4;
      if (sailing) {
        s = Hp * .6 / SHIP.water;
        var si = Hp * .88 / 100 * (lane < 260 ? .85 : 1), isleX = laneX + lane - 150 * si;
        isle.setAttribute('transform', 'translate(' + f(isleX) + ' ' + f(waterY - 100 * si) + ') scale(' + si.toFixed(3) + ')');
        range = Math.max(0, isleX + 6 * si - laneX - SHIP.w * s);
      }
      draw();
    }
    function draw() {
      var x, y, px = -STEP, py = waterY + swell(px, sea), d = 'M' + f(px) + ' ' + f(py);
      for (x = 0; x <= W + STEP; x += STEP) {                // quadratic through the midpoints: smooth, no corners
        y = waterY + swell(x, sea);
        d += 'Q' + f(px) + ' ' + f(py) + ' ' + f((px + x) / 2) + ' ' + f((py + y) / 2);
        px = x; py = y;
      }
      waves.setAttribute('d', d); wake.setAttribute('d', d);
      above.setAttribute('d', d + 'L' + f(px) + ' -9L' + f(-STEP) + ' -9Z');
      if (!sailing) { wakeTo(voy * W); return; }
      var x0 = laneX + voy * range, xc = x0 + SHIP.mid * s, half = SHIP.w * s * .3;
      var tilt = clamp(Math.atan2(swell(xc + half, sea) - swell(xc - half, sea), 2 * half) * 180 / Math.PI * 1.5, -3.5, 3.5);
      ship.setAttribute('transform', 'translate(' + f(x0) + ' ' + f(waterY - SHIP.water * s + .8 * swell(xc, sea)) + ') rotate(' + f(tilt) +
        ' ' + f(SHIP.mid * s) + ' ' + f(SHIP.water * s) + ') scale(' + s.toFixed(4) + ')');
      wakeTo(x0 + 60 * s);
    }
    function wakeTo(x) {                                     // from the left edge to the stern, fading out behind her
      wakeClip.setAttribute('width', f(Math.max(0, x)));
      fade.setAttribute('x2', f(Math.max(1, x)));
    }
    function frame(now) {
      var dt = Math.min(.1, (now - last) / 1000), d = target - voy, moving = Math.abs(d) > .003;
      last = now;
      voy = Math.abs(d) < .0005 ? target : voy + d * (1 - Math.exp(-dt / .3));
      if (moving) {
        var dir = d > 0 ? 1 : -1;
        if (dir !== facing) { facing = dir; flip.classList.toggle('astern', dir < 0); }
        idleAt = now + 700; ship.classList.add('under-way');
      } else if (idleAt && now > idleAt) {
        idleAt = 0; ship.classList.remove('under-way');
        if (voy < .01 && facing < 0) { facing = 1; flip.classList.remove('astern'); }   // back in port, she turns about
      }
      flow += ((idleAt ? 1 : IDLE) - flow) * (1 - Math.exp(-dt / .8));
      sea += dt * flow;
      if (moving || now - drawn > 32) { draw(); drawn = now; }   // at anchor the sea is fine at 30 fps
      raf = requestAnimationFrame(frame);
    }
    function aim() {
      var max = document.documentElement.scrollHeight - innerHeight;
      target = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
      if (still) { voy = target; draw(); return; }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    }

    layout(); aim();
    addEventListener('scroll', aim, { passive: true });
    addEventListener('resize', function () { layout(); aim(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layout(); aim(); });
  }

  /* ---------------- the serpent from the Elbaph mural, swimming around the rings ----------------
     Drawn the way the mural draws its dragons: a flat body with a comb of spines behind the head,
     a blank round white eye, a white mouth of round teeth, a pale band of herringbone that
     starts at the snout, runs through the eye and keeps going all the way down, and small
     crosses in pairs either side of it down the thick of the body. The skull
     narrows into the neck, and from there it tapers in one long sweep: like Jormungandr it is
     long, the tail a thread half way round the rings. One lap takes 90 seconds. */
  var HEAD =
    '<path class="sp-horn" d="M2 -5C-1 -10 -5 -12.5 -10 -12.5M6 -6.2C4 -11.6 1 -14.6 -3.6 -15.6"/>' +
    '<path class="sp-skin" d="M-10 -4C-5 -4.1 0 -7.2 5 -7.9C9 -8.5 11 -8.1 14 -6.8C18.6 -5.4 22.2 -3.6 22.8 -1.4C23 -.4 22.4 0 21.4 .1L6 .9L6 1.6L20.4 4.2C21.4 5.4 20.6 7.2 18 7.6C11 8.4 5 8 1 6.8C-3 5.4 -6 4.1 -10 4Z"/>' +
    '<path class="sp-mouth" d="M6 .9L21.4 .1C21.6 1.6 21.2 3.2 20.4 4.2L6 1.6Z"/>' +
    '<g class="sp-teeth"><circle cx="10" cy="1.2" r=".9"/><circle cx="13.6" cy="1" r=".9"/><circle cx="17.2" cy=".8" r=".9"/>' +
      '<circle cx="11.6" cy="2.3" r=".85"/><circle cx="15.2" cy="3" r=".85"/><circle cx="18.6" cy="3.6" r=".85"/></g>' +
    '<circle class="sp-eye" cx="8" cy="-3.6" r="2.5"/>';
  var BAND = .3;   // the band's half-width, as a share of the body's
  function chevron(cx, cy, tx, ty, h) {      // a herringbone stitch across the band, pointing at the head
    return 'M' + f(cx - ty * h - tx * h * .9) + ' ' + f(cy + tx * h - ty * h * .9) + 'L' + f(cx + tx * h * .3) + ' ' + f(cy + ty * h * .3) +
           'L' + f(cx + ty * h - tx * h * .9) + ' ' + f(cy - tx * h - ty * h * .9);
  }
  function headBand() {                      // the band rises from the neck to the eye and runs out along the snout
    var up = [], lo = [], ch = '', x, y, h, dy;
    function cy(x) { var u = clamp((x + 9) / 16, 0, 1); return -3.6 * u * u * (3 - 2 * u) + (x > 7 ? .07 * (x - 7) : 0); }
    function hw(x) { return x < 13 ? 1.28 : 1.28 * (1 - Math.pow((x - 13) / 7.6, 2)); }
    for (x = -10.6; x <= 20.6; x += .8) { y = cy(x); h = Math.max(0, hw(x)); up.push(f(x) + ' ' + f(y - h)); lo.unshift(f(x) + ' ' + f(y + h)); }
    for (x = -7.6; x < 19; x += 3.4 * hw(x)) {
      if (x > 4.6 && x < 11.4) continue;     // not across the eye
      y = cy(x); dy = cy(x + .1) - y; h = 10 / Math.sqrt(1 + 100 * dy * dy);
      if (hw(x) > .5) ch += chevron(x, y, h / 10, h * dy, hw(x));
    }
    return '<path class="sp-band" d="M' + up.join('L') + 'L' + lo.join('L') + 'Z"/><path class="sp-chev" d="' + ch + '"/>';
  }

  function serpent(host, opts) {
    opts = opts || {};
    var CX = opts.cx || 240, CY = opts.cy || 240, R = opts.r || 245;
    var N = 140, SPAN = 3.1, LAP = 90, WAVE = 3.4, KW = 3.6, ARC = SPAN * R;
    var g = make('g', { 'class': 'mural-serpent', 'aria-hidden': 'true' }, host);
    var spines = make('path', { 'class': 'sp-spines' }, g);
    var body = make('path', { 'class': 'sp-skin' }, g);
    var band = make('path', { 'class': 'sp-band' }, g);
    var chev = make('path', { 'class': 'sp-chev' }, g);
    var stars = make('path', { 'class': 'sp-stars' }, g);
    var head = make('g', { 'class': 'sp-head' }, g);
    head.innerHTML = HEAD.replace('<circle class="sp-eye"', headBand() + '<circle class="sp-eye"');
    var P = [], T = [], Nn = [], W = [], i;
    for (i = 0; i <= N; i++) { P.push([0, 0]); T.push([0, 0]); Nn.push([0, 0]); W.push(0); }

    function width(s) { return 4.2 * (1 - s) * (1 - s) + .25; }   // half-width: as wide as the back of the skull, then one long taper
    function at(arr, s) { return arr[Math.round(s * N)]; }
    function smooth(pts) {
      var d = 'M' + f(pts[0][0]) + ' ' + f(pts[0][1]);
      for (var j = 1; j < pts.length - 1; j++) {
        d += 'Q' + f(pts[j][0]) + ' ' + f(pts[j][1]) + ' ' + f((pts[j][0] + pts[j + 1][0]) / 2) + ' ' + f((pts[j][1] + pts[j + 1][1]) / 2);
      }
      var z = pts[pts.length - 1];
      return d + 'L' + f(z[0]) + ' ' + f(z[1]);
    }

    function draw(t) {
      var th = (opts.angle != null ? opts.angle : -.9) + TAU * t / LAP + .04 * Math.sin(t * .37);
      for (i = 0; i <= N; i++) {
        var s = i / N, a = th - s * SPAN, r = R + (.8 + 2.6 * s) * Math.sin(KW * TAU * s - TAU * t / WAVE);
        P[i][0] = CX + r * Math.cos(a); P[i][1] = CY + r * Math.sin(a); W[i] = width(s);
      }
      for (i = 0; i <= N; i++) {
        var p = P[Math.max(0, i - 1)], q = P[Math.min(N, i + 1)], tx = p[0] - q[0], ty = p[1] - q[1], L = Math.sqrt(tx * tx + ty * ty) || 1;
        tx /= L; ty /= L; T[i][0] = tx; T[i][1] = ty;
        var nx = -ty, ny = tx;                                   // pick the normal that points away from the centre
        if (nx * (P[i][0] - CX) + ny * (P[i][1] - CY) < 0) { nx = -nx; ny = -ny; }
        Nn[i][0] = nx; Nn[i][1] = ny;
      }
      var left = [], right = [];
      for (i = 0; i <= N; i++) {
        left.push([P[i][0] + Nn[i][0] * W[i], P[i][1] + Nn[i][1] * W[i]]);
        right.unshift([P[i][0] - Nn[i][0] * W[i], P[i][1] - Nn[i][1] * W[i]]);
      }
      body.setAttribute('d', smooth(left.concat(right)) + 'Z');

      var sp = '', s2, c, n, tt, w, len;
      for (s2 = .03; s2 < .24; s2 += 7.4 / ARC) {               // the comb only runs down the neck and shoulders, shrinking as it goes
        c = at(P, s2); n = at(Nn, s2); tt = at(T, s2); w = at(W, s2); len = 1 + 3.4 * Math.pow(1 - s2 / .24, 1.1);
        sp += 'M' + f(c[0] + n[0] * (w - 1.5)) + ' ' + f(c[1] + n[1] * (w - 1.5)) +
              'L' + f(c[0] + n[0] * (w + len) - tt[0] * len * 1.25) + ' ' + f(c[1] + n[1] * (w + len) - tt[1] * len * 1.25);
      }
      spines.setAttribute('d', sp);

      var bl = [], br = [];                                    // the band runs nose to tail, narrowing with the body
      for (i = 0; i <= N; i++) {
        w = W[i] * BAND;
        bl.push([P[i][0] + Nn[i][0] * w, P[i][1] + Nn[i][1] * w]);
        br.unshift([P[i][0] - Nn[i][0] * w, P[i][1] - Nn[i][1] * w]);
      }
      band.setAttribute('d', smooth(bl.concat(br)) + 'Z');
      var ch = '';
      for (s2 = 12.2 / ARC; (w = width(s2) * BAND) > .5; s2 += 3.4 * w / ARC) {   // stitches until the band is too thin to hold them
        c = at(P, s2); tt = at(T, s2);
        ch += chevron(c[0], c[1], tt[0], tt[1], w);
      }
      chev.setAttribute('d', ch);
      var st = '', side, x0, y0, e;
      for (s2 = .03 + 1.5 * 7.4 / ARC; s2 < .42; s2 += 4 * 7.4 / ARC) {   // small crosses in pairs, one each side of the band, between the spines
        c = at(P, s2); n = at(Nn, s2); tt = at(T, s2); w = at(W, s2); e = Math.min(.55, w * .17);
        var ux = (tt[0] + n[0]) * e, uy = (tt[1] + n[1]) * e, vx = (tt[0] - n[0]) * e, vy = (tt[1] - n[1]) * e;   // square to the body, wherever it turns
        for (side = -1; side <= 1; side += 2) {
          x0 = c[0] + n[0] * w * .64 * side; y0 = c[1] + n[1] * w * .64 * side;
          st += 'M' + f(x0 - ux) + ' ' + f(y0 - uy) + 'L' + f(x0 + ux) + ' ' + f(y0 + uy) + 'M' + f(x0 - vx) + ' ' + f(y0 - vy) + 'L' + f(x0 + vx) + ' ' + f(y0 + vy);
        }
      }
      stars.setAttribute('d', st);

      var h0 = P[0], ang = Math.atan2(P[0][1] - P[2][1], P[0][0] - P[2][0]) * 180 / Math.PI;   // aimed along the neck, so the skull's band meets the body's
      head.setAttribute('transform', 'translate(' + f(h0[0]) + ' ' + f(h0[1]) + ') rotate(' + f(ang) + ') scale(1.02)');
    }

    var on = true, raf = 0, t0 = performance.now();
    function frame(now) { draw((now - t0) / 1000); raf = on ? requestAnimationFrame(frame) : 0; }
    draw(0);
    if (still) return g;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        on = es[0].isIntersecting;
        if (on && !raf) raf = requestAnimationFrame(frame);
      }).observe(host);
    }
    raf = requestAnimationFrame(frame);
    return g;
  }

  window.HarleyCreatures = { shipMarkup: shipMarkup, islandMarkup: islandMarkup, serpent: serpent, voyage: voyage };
  /* <script src="creatures.js" data-parts="voyage"> picks which to bring to life; both by default */
  var parts = ((document.currentScript && document.currentScript.getAttribute('data-parts')) || 'voyage serpent').split(/\s+/);
  if (calm) return;
  var bar = document.querySelector('.topbar'), rings = document.getElementById('rings'), root = document.documentElement;
  if (bar && parts.indexOf('voyage') >= 0) { root.classList.add('creatures-voyage'); voyage(bar); }
  if (rings && parts.indexOf('serpent') >= 0) { root.classList.add('creatures-serpent'); serpent(rings); }
})();
