/* More rules for the lab (2026-11-03; the user: «for the first 3 lessons … all lessons inside them, i want you to make them
   fully law screens for any laws that doesnt have a law screen»). law-core.js carries eight rules cut from rule-flow.html;
   every other rule card of nodes 1–3 (skills.bigsum, skills.keylaws, skills.probstats) is written in its own file —
   law-more-bigsum.js, law-more-keylaws.js, law-more-probstats.js — and handed in here with LAWMORE.add(pack):

     pack.rules  [R]            — as law-core's RULES: { key, name, tok, say, cue, trap, wswap?, tail?, notDecoy? }
                                  tail: where a rule runs on past its fraction («(آخر − أول) ÷ ٢ + ١»), the index in tok of
                                  the first token beside the fraction; notDecoy: words that also fit a blank, never offered
     pack.dia    { key: {html, run} } — the proof, as law-core's DIA
     pack.g      { key: i => ({ q, ans, ch, sol }) } — the review's exam question, as law-core's G
     pack.sign   { key: [unitColour, svg] } — the rule's sign on its hexagon, as law-core's NW_LES (40 × 40, class s / f / j)
     pack.where  { key: [nodeKey, lessonId, RegExp of the see's rule] } — which rule card in which short lesson it replaces
     pack.nums   { key: { ex, v: [answer, term1, …], more: [wrong numbers], hint?: { slot: line }, line? } }
     pack.css    a string of CSS for its proofs (every selector under .law)

   law-core's own objects are the ones it reads (RULES, DIA, G, NW_LES), so a rule added here plays everywhere a core rule
   does: the lesson, «كمّل القانون», «حطّ الأرقام», the review, «قوانيني». law.js reads LAWMORE.where and LAWMORE.nums. */
(function () {
  'use strict';
  const C = window.LAWCORE;
  const M = window.LAWMORE = { where: {}, nums: {}, order: [], packs: [] };
  M.add = function (p) {
    if (!C || !p) return;
    M.packs.push(p);
    (p.rules || []).forEach(R => { if (!C.RULES.some(x => x.key === R.key)) { C.RULES.push(R); M.order.push(R.key); } });
    Object.assign(C.DIA, p.dia || {});
    Object.assign(C.G, p.g || {});
    Object.assign(C.NW_LES, p.sign || {});
    Object.assign(M.where, p.where || {});
    Object.assign(M.nums, p.nums || {});
    if (p.css) { const s = document.createElement('style'); s.textContent = p.css; document.head.appendChild(s); }
  };
  if (!C) return;
  const N = v => (typeof v === 'number' ? C.A(v) : v);
  /* the proofs' shared pieces, in law-core's own paint (.cells, .dlab, .step) */
  M.h = {
    N,
    /* a row of number tiles */
    cells: (vs, cls = '') => `<div class="cells ${cls}">${vs.map(v => `<span class="cell">${C.fx(N(v))}</span>`).join('')}</div>`,
    /* the labels under a proof, the last one the answer (green): [[label, start], …] */
    lab: xs => `<div class="dlab">${xs.map((x, i) => `<span${i === xs.length - 1 ? ' class="l3"' : ''}>${x[0]}<b class="n${i + 1}">${x[1] == null ? '٠' : N(x[1])}</b></span>`).join('')}</div>`,
    /* a number changes and says so */
    set: (el, v) => { if (!el) return; el.innerHTML = C.fx(N(v)); C.pulse(el); },
    /* a line or path draws itself */
    draw: (l, ms = 260, col) => { if (!l) return; const n = l.getTotalLength ? l.getTotalLength() : 100; if (col) l.setAttribute('stroke', col); l.style.opacity = 1; l.style.strokeDasharray = n;
      C.anim(l, [{ strokeDashoffset: n + 'px' }, { strokeDashoffset: '0px' }], { duration: ms, easing: 'ease-out' }); },
    /* tiles take their new order, each gliding from where it stood (in the drawing's own scale) */
    flip: (par, order, ms = 440) => {
      const k = C.scaleOf(par), r0 = new Map(order.map(e => [e, e.getBoundingClientRect()]));
      order.forEach(e => par.appendChild(e));
      order.forEach((e, i) => { const a = r0.get(e), b = e.getBoundingClientRect(), dx = (a.left - b.left) / k, dy = (a.top - b.top) / k;
        if (Math.abs(dx) + Math.abs(dy) > 1) C.anim(e, [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: `translate(${dx / 2}px, ${dy / 2 - 22}px)`, offset: .5 }, { transform: 'none' }], { duration: ms, delay: i * 30, easing: 'cubic-bezier(.4,0,.3,1)', fill: 'backwards' }); });
    },
    /* an svg element */
    el: (tag, at, parent) => { const e = document.createElementNS(C.NS, tag); Object.keys(at).forEach(k => e.setAttribute(k, at[k])); if (parent) parent.appendChild(e); return e; },
    rise: (els, d = 0, step = 40) => els.forEach((x, i) => C.anim(x, C.RISE, { duration: 260, delay: d + i * step, fill: 'backwards' })),
  };
})();
