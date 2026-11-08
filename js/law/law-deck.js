/* The path's card for the rules due today, three ways to choose from (the user, 2026-11-03, on the fanned deck:
   «create better animation than this one i want very amazing animation and UI»). tools/law-deck.html shows them side by
   side; run.html takes `?deck=0|1|2|3` (0 is the deck it replaces) and `?due=1|2|3`.

   Every version cycles through the rules waiting, one at a time: the rule in front is named under the title and its
   name changes as its sign comes forward, so the card says which rules wait, not only how many.
     1 الكومة — the rules as a deck of gold hexagons, each peeking over the one in front; the front one crouches, springs
                over the top and drops in at the back while the others step forward, each with a hop and a squash
     2 الحلقة — one gold hexagon in the path's own segmented ring, a segment per rule; its sign does the path's star
                flip and lands as the next rule's sign, its segment lighting as it lands, the ring breathing on the beat
     3 الكومة الذهبية — the rules as a pile of thick gold coins; the top one is tossed, spins over twice, swaps its sign
                edge-on and lands on the pile, which gives under it

   It runs on transforms and opacity only (the GPU's, as the path's other loops), from keyframes written for the number
   of rules, so one loop needs no script once it is drawn. */
(function () {
  'use strict';
  const C = () => window.LAWCORE;
  const q = new URLSearchParams(location.search);
  const DEF = 3;
  const V = q.has('deck') ? +q.get('deck') : DEF;
  const K = +(q.get('slow') || 1) || 1;            /* the lab's «بطيء» */
  const HEX = '19.5,4 51.5,4 67,29 51.5,54 19.5,54 4,29', HEXLIP = '19.5,11 51.5,11 67,36 51.5,61 19.5,61 4,36';
  const D0 = 1.1;                                  /* after the card's own entrance */
  let uid = 0, TOTAL = 0;

  const signG = R => (C().NW_LES[R.key] || C().NW_LES.prob)[1]
    .replace(/class="s"/g, 'fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"')
    .replace(/class="f j"|class="f"|class="j"/g, 'fill="currentColor"');
  const signSvg = R => `<svg viewBox="0 0 40 40" aria-hidden="true">${signG(R)}</svg>`;
  /* the gold hexagon with its lip and two bands of light, without its sign (the sign is a layer of its own) */
  const face = (lip = 7, tone = 0) => {
    const id = 'lwd' + (++uid), f = ['#FFC800', '#F7BC00', '#EEB000'][tone], l = ['#E6A000', '#D99200', '#CC8600'][tone];
    const lp = HEX.split(' ').map(p => { const [x, y] = p.split(','); return x + ',' + (+y + lip); }).join(' ');
    return `<svg viewBox="0 0 71 ${58 + lip + 4}" aria-hidden="true"><g stroke-width="8" stroke-linejoin="round"><polygon points="${lp}" fill="${l}" stroke="${l}"/><polygon points="${HEX}" fill="${f}" stroke="${f}"/></g>
      <clipPath id="${id}"><polygon points="${HEX}"/></clipPath><g clip-path="url(#${id})" fill="#FFD940"${tone ? ' opacity=".7"' : ''}><polygon points="27,60 38,60 63,-4 52,-4"/><polygon points="42,60 47,60 72,-4 67,-4"/></g></svg>`;
  };

  /* keyframes, written once per name: keys are [seconds into the cycle, declarations, easing to the next key] */
  const css = {};
  function kf(name, cyc, keys) {
    if (css[name]) return name;
    const ks = keys.slice().sort((a, b) => a[0] - b[0]);
    if (ks[0][0] > 0) ks.unshift([0, ks[ks.length - 1][1]]);
    if (ks[ks.length - 1][0] < cyc) ks.push([cyc, ks[0][1]]);
    css[name] = `@keyframes ${name}{${ks.map(([t, p, e]) => `${Math.max(0, Math.min(100, t / cyc * 100)).toFixed(3)}%{${p}${e ? `;animation-timing-function:${e}` : ''}}`).join('')}}`;
    let el = document.getElementById('lwDeckKF');
    if (!el) { el = document.createElement('style'); el.id = 'lwDeckKF'; document.head.appendChild(el); }
    el.textContent = Object.values(css).join('\n');
    return name;
  }
  /* an element's animation: the cycle, the global start, and how far into its own cycle it starts */
  const anim = (name, cyc, ahead = 0) => `animation:${name} ${(cyc * K).toFixed(3)}s linear ${((D0 - ahead) * K).toFixed(3)}s infinite both`;

  /* a window of the cycle where a rule's sign and name show: from `x` seconds before its turn ends, back at the turn
     before; returns the opacity and slide keys for the name line */
  const show = (n, T, x, hide, fadeIn = .22, fadeOut = .2) => {
    const cyc = n * T, on = cyc - (T - x);         /* the rule's own cycle: its turn is [0, T), the next comes in at x */
    return hide === 'jump'
      ? [[0, 'opacity:1'], [x - .001, 'opacity:1'], [x, 'opacity:0'], [on - .001, 'opacity:0'], [on, 'opacity:1']]
      : [[0, 'opacity:1;transform:translateY(0)'], [x - fadeOut / 2, 'opacity:1;transform:translateY(0)', 'cubic-bezier(.5,0,.8,.4)'],
         [x + fadeOut / 2, 'opacity:0;transform:translateY(-14px)'], [on - fadeIn / 2, 'opacity:0;transform:translateY(14px)', 'cubic-bezier(.2,.9,.3,1.2)'],
         [on + fadeIn / 2, 'opacity:1;transform:translateY(0)']];
  };

  /* a band of light crossing the face once the new one has settled, as the finished node's shine does */
  const glint = T => `<span class="lw-gl"><i style="${anim(kf('lwdg', T, [[0, 'transform:translateX(-46px) skewX(-20deg)'], [.12, 'transform:translateX(-46px) skewX(-20deg)', 'cubic-bezier(.4,0,.3,1)'], [.62, 'transform:translateX(52px) skewX(-20deg)'], [T, 'transform:translateX(52px) skewX(-20deg)']]), T)}"></i></span>`;

  /* ───── 1 الكومة: a deck; the front one flies over the top to the back ───── */
  function v1(due) {
    const n = due.length, T = n > 1 ? 2.7 : 3.4, cyc = n * T;
    const P = k => ({ x: -k * 9, y: -k * 8, z: -k * 26, s: 1 - k * .05, sh: [0, .14, .26][k] });
    const tf = (y, z, ry, sx, sy, x = 0) => `transform:translate3d(${x}px,${y}px,${z}px) rotateY(${ry}deg) scale(${sx},${sy})`;
    const at = (k, sx = 1, sy = 1, dy = 0, ry = 360) => { const p = P(k); return tf(p.y + dy, p.z, ry, p.s * sx, p.s * sy, p.x); };
    const L = n - 1, f = T - 1.0;                   /* f: the front one starts its jump */
    const front = [
      [0, at(0, 1, 1, 0, 0)], [f, at(0, 1, 1, 0, 0), 'ease-out'],
      [f + .14, tf(2, 0, 0, 1.12, .84), 'cubic-bezier(.2,.9,.35,1)'],
      [f + .36, tf(-30, 6, 150, .9, 1.08), 'linear'],
      [f + .5, tf(-36, P(L).z - 4, 270, .86, .96, P(L).x * .7), 'cubic-bezier(.45,0,.9,.6)'],
      [f + .7, tf(P(L).y, P(L).z - 4, 360, P(L).s * 1.1, P(L).s * .86, P(L).x), 'ease-out'],
      [f + .82, tf(P(L).y - 3, P(L).z, 360, P(L).s * .97, P(L).s * 1.04, P(L).x), 'ease-in-out'],
      [f + .95, tf(P(L).y, P(L).z, 360, P(L).s, P(L).s, P(L).x)],
    ];
    /* the others step forward as it leaves, the nearest first */
    const keys = n === 1 ? front.map(k => [k[0], k[1].replace(/translate3d\(0,(-?[\d.]+)px,(-?[\d.]+)px\)/, (m, y) => `translate3d(0,${y}px,0px)`), k[2]]) : front.slice();
    const shade = [[0, 'opacity:0'], [f + .5, 'opacity:0', 'linear'], [f + .7, `opacity:${P(L).sh}`]];
    for (let s = 1; s < n; s++) {
      const k = n - s, go = s * T + f + .2 + (k - 1) * .09;     /* from place k to place k − 1 */
      keys.push([go, at(k), 'cubic-bezier(.3,0,.5,1)'], [go + .2, at(k - 1, .96, 1.06, -6), 'cubic-bezier(.5,0,.9,.5)'],
        [go + .34, at(k - 1, 1.08, .9), 'ease-out'], [go + .5, at(k - 1)]);
      shade.push([go, `opacity:${P(k).sh}`, 'ease-in-out'], [go + .34, `opacity:${P(k - 1).sh}`]);
    }
    keys.push([cyc, at(0)]);
    const card = kf(`lwd1c${n}`, cyc, keys), dark = kf(`lwd1s${n}`, cyc, shade);
    /* the rule j takes its turn in the j-th slot: it starts (n − j) slots into its own cycle */
    const ahead = j => ((n - j) % n) * T;
    const into = f + .2 + .5;                       /* the next one is in front */
    const cards = due.map((R, j) => `<span class="d1-c" style="${anim(card, cyc, ahead(j))}">${face(7, 0)}<span class="d1-sg">${signSvg(R)}</span><span class="d1-sh" style="${anim(dark, cyc, ahead(j))}">${face(7, 0)}</span></span>`);
    const bump = kf(`lwd1b`, T, [[0, 'transform:scale(1)'], [into - .02, 'transform:scale(1)', 'ease-out'], [into + .08, 'transform:scale(1.3)', 'ease-in-out'], [into + .2, 'transform:scale(.9)', 'ease-out'], [into + .32, 'transform:scale(1)']]);
    return { stage: `<span class="lw-stg d1"><i class="d1-floor"></i><span class="d1-deck">${cards.reverse().join('')}</span><span class="d1-glw">${glint(T)}</span><b class="lw-n" style="${anim(bump, T)}">${C().A(TOTAL)}</b></span>`, T, x: into - .1, ahead };
  }

  /* ───── 2 الحلقة: one hexagon in the path's ring; its sign flips to the next rule ───── */
  const ringPts = (() => {
    const cx = 35.5, cy = 31, k = 1.22, pt = (x, y) => `${(cx + (x - cx) * k).toFixed(2)},${(cy + (y - cy) * k).toFixed(2)}`;
    return [[35.5, 4], [19.5, 4], [4, 29], [19.5, 54], [51.5, 54], [67, 29], [51.5, 4], [35.5, 4]].map(p => pt(...p)).join(' ');
  })();
  function v2(due) {
    const n = due.length, T = n > 1 ? 2.4 : 3.2, cyc = n * T, f = T - 1.15, e = f + .5;   /* e: edge-on, the sign changes */
    const flip = kf(`lwd2f`, T, [
      [0, 'transform:translateY(0) rotateY(0deg) scale(1,1)'], [f, 'transform:translateY(0) rotateY(0deg) scale(1,1)', 'ease-out'],
      [f + .14, 'transform:translateY(1px) rotateY(0deg) scale(1.16,.78)', 'cubic-bezier(.2,.9,.3,1)'],
      [f + .32, 'transform:translateY(-11px) rotateY(0deg) scale(.82,1.14)', 'ease-in'],
      [e - .001, 'transform:translateY(-12px) rotateY(90deg) scale(.9,1.05)'],
      [e, 'transform:translateY(-12px) rotateY(-90deg) scale(.9,1.05)', 'ease-out'],
      [e + .2, 'transform:translateY(-9px) rotateY(0deg) scale(1,1)', 'cubic-bezier(.5,0,.9,.5)'],
      [e + .36, 'transform:translateY(1px) rotateY(0deg) scale(1.14,.82)', 'ease-out'],
      [e + .5, 'transform:translateY(-2px) rotateY(0deg) scale(.96,1.05)', 'ease-in-out'],
      [e + .62, 'transform:translateY(0) rotateY(0deg) scale(1,1)'],
    ]);
    const land = e + .36;
    const face2 = kf(`lwd2h`, T, [[0, 'transform:scale(1,1)'], [f, 'transform:scale(1,1)', 'ease-out'], [f + .14, 'transform:scale(1.03,.95)', 'ease-out'],
      [f + .3, 'transform:scale(1,1)'], [land - .02, 'transform:scale(1,1)', 'ease-out'], [land + .08, 'transform:scale(1.05,.93)', 'ease-out'], [land + .3, 'transform:scale(1,1)']]);
    const breathe = kf(`lwd2r`, T, [[0, 'transform:scale(1)'], [land, 'transform:scale(1)', 'cubic-bezier(.2,.9,.3,1.3)'], [land + .3, 'transform:scale(1.07)', 'ease-in-out'], [land + 1, 'transform:scale(1)']]);
    const sg = n > 1 ? kf(`lwd2s${n}`, cyc, show(n, T, e, 'jump')) : null;
    const lit = n > 1 ? kf(`lwd2l${n}`, cyc, [[0, 'opacity:1'], [land - .001, 'opacity:1'], [land + .25, 'opacity:0'], [cyc - (T - land) - .001, 'opacity:0'], [cyc - (T - land) + .06, 'opacity:1']].sort((a, b) => a[0] - b[0])) : null;
    const ahead = j => ((n - j) % n) * T;
    const gap = n > 1 ? 4 : 0, seg = 100 / n - gap;
    const segs = due.map((R, j) => {
      const da = `stroke-dasharray="${seg.toFixed(2)} ${(100 - seg).toFixed(2)}" stroke-dashoffset="${(-(j * 100 / n) - gap / 2).toFixed(2)}"`;
      const path = col => `<svg viewBox="-12 -9 95 80"><polyline points="${ringPts}" pathLength="100" fill="none" stroke="${col}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round" ${da}/></svg>`;
      return `<span class="d2-seg">${path('#FFE27A')}</span><span class="d2-seg lit"${lit ? ` style="${anim(lit, cyc, ahead(j))}"` : ''}>${path('#FFC800')}</span>`;
    }).join('');
    const signs = due.map((R, j) => `<span class="d2-sg"${sg ? ` style="${anim(sg, cyc, ahead(j))}"` : ''}>${signSvg(R)}</span>`).join('');
    return { stage: `<span class="lw-stg d2"><span class="d2-ring" style="${anim(breathe, T)}">${segs}</span><span class="d2-hx" style="${anim(face2, T)}">${face(7, 0)}${glint(T)}<span class="d2-fl" style="${anim(flip, T)}">${signs}</span></span></span>`, T, x: e, ahead };
  }

  /* ───── 3 الكومة الذهبية: a pile of coins; the top one is tossed, turns over twice and lands as the next ───── */
  function v3(due) {
    const n = due.length, T = n > 1 ? 2.6 : 3.4, cyc = n * T, f = T - 1.15;
    const up = f + .16, top = up + .32, down = top + .3, sw = up + .62 * .62;   /* the spin is linear from up to down; it is edge-on at 450° */
    const fly = kf(`lwd3f`, T, [
      [0, 'transform:translateY(0) scale(1,1)'], [f, 'transform:translateY(0) scale(1,1)', 'ease-out'],
      [up, 'transform:translateY(2px) scale(1.14,.8)', 'cubic-bezier(.15,.85,.35,1)'],
      [top, 'transform:translateY(-28px) scale(.94,1.06)', 'cubic-bezier(.55,0,.9,.55)'],
      [down, 'transform:translateY(0) scale(1.16,.8)', 'ease-out'],
      [down + .14, 'transform:translateY(-4px) scale(.96,1.05)', 'ease-in-out'],
      [down + .28, 'transform:translateY(0) scale(1,1)'],
    ]);
    const spin = kf(`lwd3s`, T, [[0, 'transform:perspective(140px) rotateX(0deg)'], [up + .02, 'transform:perspective(140px) rotateX(0deg)', 'linear'],
      [down - .02, 'transform:perspective(140px) rotateX(720deg)'], [T, 'transform:perspective(140px) rotateX(720deg)']]);
    const pile = kf(`lwd3p`, T, [[0, 'transform:scale(1,1)'], [f, 'transform:scale(1,1)', 'ease-out'], [up, 'transform:scale(1.03,.93)', 'cubic-bezier(.2,.9,.3,1.4)'],
      [up + .2, 'transform:scale(1,1)'], [down - .01, 'transform:scale(1,1)', 'ease-out'], [down + .08, 'transform:scale(1.05,.88)', 'ease-out'], [down + .34, 'transform:scale(1,1)']]);
    const shade = kf(`lwd3h`, T, [[0, 'transform:scale(1);opacity:1'], [up, 'transform:scale(1);opacity:1', 'ease-out'], [top, 'transform:scale(.62);opacity:.5', 'ease-in'], [down, 'transform:scale(1.08);opacity:1', 'ease-out'], [down + .3, 'transform:scale(1);opacity:1']]);
    const sg = n > 1 ? kf(`lwd3g${n}`, cyc, show(n, T, sw, 'jump')) : null;
    const into = down + .02;
    const bump = kf(`lwd3b`, T, [[0, 'transform:scale(1)'], [into, 'transform:scale(1)', 'ease-out'], [into + .1, 'transform:scale(1.3)', 'ease-in-out'], [into + .22, 'transform:scale(.9)', 'ease-out'], [into + .34, 'transform:scale(1)']]);
    const ahead = j => ((n - j) % n) * T;
    const below = Math.min(n, 3) - 1;
    /* the coins under the top one, the lowest drawn first so each lies on the one below */
    const under = Array.from({ length: below }, (_, i) => `<span class="d3-pc" style="--b:${below - 1 - i}">${face(8, i + 1)}</span>`).reverse().join('');
    const signs = due.map((R, j) => `<span class="d3-sg"${sg ? ` style="${anim(sg, cyc, ahead(j))}"` : ''}>${signSvg(R)}</span>`).join('');
    return { stage: `<span class="lw-stg d3" style="--pile:${below}"><i class="d3-floor" style="${anim(shade, T)}"></i><span class="d3-pile" style="${anim(pile, T)}">${under}</span>
      <span class="d3-top" style="${anim(fly, T)}"><span class="d3-spin" style="${anim(spin, T)}">${face(8, 0)}<span class="d3-face">${signs}</span></span>${glint(T)}</span><b class="lw-n" style="${anim(bump, T)}">${C().A(TOTAL)}</b></span>`, T, x: sw, ahead };
  }

  /* the card: the stage, the title, the rule in front named in turn, the count and the time, and «راجع» */
  function card(due, o) {
    TOTAL = o.total || due.length;
    const n = due.length, d = [v1, v2, v3][V - 1](due), cyc = n * d.T;
    /* one line and nothing else (the user, 2026-11-08: «make this UI very simple very very simple not texts just قوانين تحتاج
       تراجعها»): the pile with its count, the line, and a small gold «راجع» */
    return `<button type="button" class="due-card lw-due lw-due2 lw-due4 dk${V}" onclick="LAWX.review()" aria-label="قوانين تحتاج تراجعها: ${o.count}">
      ${d.stage}<b class="lw4-t">قوانين تحتاج تراجعها</b><span class="lw4-go">راجع</span>
    </button>`;
  }

  window.LAWDECK = { V, card };
})();
