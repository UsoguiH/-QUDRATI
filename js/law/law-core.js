/* The rule's own pieces for the app lab (tools/law-app.html): taken as they are from tools/rule-flow.html — the proofs (DIA),
   the exam-style question makers (G), the eight rules, card 13 («الكلمة تصير رقم» in the app's paint) with the student's five
   changes on every rule (KB_NEW), and Duolingo's «قانون جديد» header and flying card in look 16 (the solid gold hexagon with the
   lesson's sign). Only the paths (the lab runs from the site's root), the sound switch and the screen box (cur) differ.
   tools/lawapp/law.js puts them inside the app. */
(function () {
  'use strict';
  let L = null, cur = null;
  let reduce = false;
  const AR = '٠١٢٣٤٥٦٧٨٩', toAr = n => String(n).replace(/\d/g, d => AR[d]).replace('.', '٫'), A = toAr;
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
  const fx = s => String(s).replace(/([٠-٩]+)\/([٠-٩]+)/g, '<span class="fr"><b>$1</b><i></i><b>$2</b></span>').replace(/÷/g, '<i class="dv"></i>');
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const fr = (a, b) => { const g = gcd(a, b); return A(a / g) + '/' + A(b / g); };
  const OP = /^[=×÷+−←]$/;
  const $ = id => document.getElementById(id);
  const FH = s => `assets/mascot/qaddour-${s}.png`;
  const X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>';
  const CHECK = c => `<svg viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`;
  const CROSS = '<svg viewBox="0 0 24 24" fill="none" stroke="#EA2B2B" stroke-width="3.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';

  /* ───── sounds ───── */
  const SB = 'assets/sounds/';
  const FILES = { tap: SB + 'bri/lightweight-choice', click: SB + 'bri/assessment-click-option-1', hint: SB + 'bri/hint', on: SB + 'bri/toggle-on', off: SB + 'bri/toggle-off',
    t1: SB + 'bri/xp-tally-1', t2: SB + 'bri/xp-tally-2', t3: SB + 'bri/xp-tally-3', t4: SB + 'bri/xp-tally-4', t5: SB + 'bri/xp-tally-5',
    right: SB + 'correct', wrong: SB + 'bri/incorrect', start: SB + 'bri/start-lesson', drop: SB + 'bri/drag-released', done: SB + 'lesson-complete' };
  let ctx = null; const bufs = {};
  function audio() {
    if (ctx) return;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    Object.entries(FILES).forEach(([k, f]) => fetch(f + '.mp3').then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b)).then(d => { bufs[k] = d; }).catch(() => {}));
  }
  addEventListener('pointerdown', () => { audio(); if (ctx && ctx.state === 'suspended') ctx.resume(); }, true);
  let mute = false;
  function snd(k, rate = 1, vol = .5) {
    if (mute || !ctx || ctx.state !== 'running' || !bufs[k]) return;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = bufs[k]; s.playbackRate.value = rate; g.gain.value = vol; s.connect(g); g.connect(ctx.destination); s.start();
  }
  /* a felt marker on a whiteboard: filtered noise that rises and falls with the strokes */
  function scratch(ms, vol = .05) {
    if (!ctx || ctx.state !== 'running') return;
    const sr = ctx.sampleRate, n = Math.max(1, Math.floor(sr * ms / 1000)), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
    let ph = 0, f = 11;
    for (let i = 0; i < n; i++) { if (i % 900 === 0) f = 7 + Math.random() * 10; ph += 2 * Math.PI * f / sr; const env = Math.min(1, i / (sr * .015), (n - i) / (sr * .03)); d[i] = (Math.random() * 2 - 1) * (.4 + .6 * Math.abs(Math.sin(ph))) * env; }
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; bp.type = 'bandpass'; bp.frequency.value = 2300 + Math.random() * 700; bp.Q.value = .8; hp.type = 'highpass'; hp.frequency.value = 900; g.gain.value = vol;
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(ctx.destination); src.start();
  }
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };
  const up = k => Math.pow(2, Math.min(k, 11) * 2 / 12);

  /* ───── motion ───── */
  const TL = { t: [], a: [] };
  let RUN = 0;
  /* ?slow=4 plays the lesson four times slower, to set it beside Duolingo's file played the same way */
  const SLOW = 1;
  document.documentElement.style.setProperty('--nwsl', SLOW);
  const later = (ms, f) => { TL.t.push(setTimeout(f, ms * SLOW)); };
  const wipe = () => { RUN++; TL.t.forEach(clearTimeout); TL.t = []; TL.a.forEach(a => { try { a.cancel(); } catch (e) {} }); TL.a = []; };
  const anim = (el, kf, o) => { if (reduce || !el) return null; const a = el.animate(kf, o); if (SLOW > 1) a.playbackRate = 1 / SLOW; TL.a.push(a); return a; };
  const show = (el, on = true) => { if (el) el.style.opacity = on ? 1 : 0; };
  /* a line drawn in from the right and wiped off to the left, with its origin held on the left and the growth carried by a
     translate, so the GPU runs it (an animated transform-origin keeps the page's main thread busy for as long as it waits) */
  const nwSweep = (el, kf, o) => { if (el) el.style.transformOrigin = '0 50%'; return anim(el, kf, o); };
  const RISE = [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }];
  const POP = [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1.08)', offset: .7 }, { opacity: 1, transform: 'none' }];
  const PULSE = [{ transform: 'none' }, { transform: 'scale(1.18)', offset: .4 }, { transform: 'none' }];
  const SHAKE = [{ transform: 'none' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(2px)' }, { transform: 'none' }];
  /* Duolingo's right-answer jump (adWave's curve): crouch, spring, land past, rebound */
  const JUMP = [{ transform: 'none' }, { transform: 'translateY(4px) scale(1.04, .94)', offset: .12 }, { transform: 'translateY(-20px) scale(.97, 1.04)', offset: .42 }, { transform: 'translateY(3px) scale(1.03, .96)', offset: .75 }, { transform: 'none' }];
  const pulse = (el, d = 0) => anim(el, PULSE, { duration: 320, delay: d, easing: 'ease-out' });
  const pop = (el, ms = 300) => { show(el); anim(el, POP, { duration: ms, easing: 'ease-out' }); };
  const jump = (el, d = 0) => anim(el, JUMP, { duration: 560, delay: d, easing: 'ease-out' });
  const scaleOf = el => { const p = el.closest && el.closest('.dg'); return (p && p._s) || 1; };
  function flyFrom(el, src, ms = 480, lift = 26) {
    if (!src) return null;
    const k = scaleOf(el), a = src.getBoundingClientRect(), b = el.getBoundingClientRect(), dx = ((a.left + a.width / 2) - (b.left + b.width / 2)) / k, dy = ((a.top + a.height / 2) - (b.top + b.height / 2)) / k;
    return anim(el, [{ opacity: 1, transform: `translate(${dx}px, ${dy}px) scale(.8)` }, { opacity: 1, transform: `translate(${dx * .5}px, ${dy * .5 - lift / k}px) scale(1.12)`, offset: .5 }, { opacity: 1, transform: 'none' }], { duration: ms, easing: 'cubic-bezier(.4,0,.3,1)' });
  }
  function fit(line, min = 12) {
    line.style.fontSize = '';
    let fs = parseFloat(getComputedStyle(line).fontSize);
    while (line.scrollWidth > line.clientWidth + 1 && fs > min) { fs -= .5; line.style.fontSize = fs + 'px'; }
    while (line.scrollWidth > line.clientWidth + 1 && fs > 10) { fs -= .5; line.style.fontSize = fs + 'px'; }
  }
  /* فهيم's words arrive one at a time, each on Brilliant's tap, as his bubble does in the app */
  const wsplit = t => t.split(' ').map(w => `<span class="w">${fx(w.replace(/\*([^*]+)\*/g, '<em>$1</em>'))}</span>`).join(' ');
  function sayInto(el, text, d0 = 250) {
    el.innerHTML = wsplit(text.replace(/\*([^*]+)\*/g, (m, p) => p.split(' ').map(w => `*${w}*`).join(' ')));
    const ws = [...el.querySelectorAll('.w')];
    anim(el.closest('.obs-bubble'), [{ opacity: 0, transform: 'scale(.1)' }, { opacity: 1, transform: 'none' }], { duration: 250, delay: d0 - 200 > 0 ? d0 - 200 : 0, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'backwards' });
    ws.forEach((w, i) => { anim(w, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: d0 + i * 85, fill: 'backwards' }); later(d0 + i * 85, () => snd('tap', 1.25 + (i % 3) * .06, .2)); });
    return d0 + ws.length * 85;
  }

  /* ───── the proofs (kept from round 3): a small example, its numbers handed to the formula ───── */
  const NS = 'http://www.w3.org/2000/svg';
  const pts = (n, cx, cy, rx, ry) => { const o = []; for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; o.push([+(cx + Math.cos(a) * rx).toFixed(1), +(cy + Math.sin(a) * ry).toFixed(1)]); } return o; };
  const DIA = {
    prob: {
      html: () => `<div class="dg"><div class="cells">${[1, 2, 3, 4, 5, 6, 7, 8].map(i => `<span class="cell">${A(i)}</span>`).join('')}</div>
        <div class="dlab"><span>المطلوب (زوجي)<b class="n1">٠</b></span><span>الكل<b class="n2">٠</b></span><span class="l3">الاحتمال<b class="n3">؟</b></span></div></div>`,
      async run(st, c) {
        const cells = [...st.querySelectorAll('.cell')], n1 = st.querySelector('.n1'), n2 = st.querySelector('.n2'), n3 = st.querySelector('.n3');
        cells.forEach((x, i) => anim(x, RISE, { duration: 260, delay: i * 40, fill: 'backwards' }));
        await c.wait(520); let k = 0;
        for (const i of [1, 3, 5, 7]) { cells[i].classList.add('on'); pulse(cells[i]); n1.textContent = A(++k); c.s('t' + k, 1, .45); await c.wait(300); }
        c.val(1, '٤', n1); await c.wait(500);
        for (let i = 0; i < 8; i++) { cells[i].classList.add('ring'); n2.textContent = A(i + 1); c.s('tap', up(i) * .8, .28); await c.wait(70); }
        pulse(n2); c.val(2, '٨', n2); await c.wait(500);
        n3.innerHTML = fx('٤/٨'); pulse(n3); c.s('hint', 1, .45); await c.wait(500);
        n3.innerHTML = fx('١/٢'); pulse(n3); c.val(0, '١/٢', n3); await c.wait(300);
      },
    },
    mean: {
      html: () => `<div class="dg"><div class="bars">${[4, 6, 11].map(v => `<div class="bc"><span class="bv">${A(v)}</span><div class="bu">${'<i></i>'.repeat(v)}</div></div>`).join('')}<span class="ml"></span></div>
        <div class="dlab"><span>المجموع<b class="n1">٠</b></span><span>العدد<b class="n2">٠</b></span><span class="l3">الوسط<b class="n3">؟</b></span></div></div>`,
      async run(st, c) {
        const V = [4, 6, 11], M = 7, bc = [...st.querySelectorAll('.bc')], cols = bc.map(b => b.querySelector('.bu')), bv = bc.map(b => b.querySelector('.bv')), ml = st.querySelector('.ml'), box = st.querySelector('.bars'), n1 = st.querySelector('.n1'), n2 = st.querySelector('.n2'), n3 = st.querySelector('.n3');
        bc.forEach((b, i) => anim((b.style.transformOrigin = 'bottom', b), [{ opacity: 0, transform: 'scaleY(.2)' }, { opacity: 1, transform: 'none' }], { duration: 380, delay: i * 90, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' }));
        await c.wait(560); let sum = 0;
        for (let i = 0; i < 3; i++) { const u = [...cols[i].children]; u.forEach(x => x.classList.add('hl')); sum += V[i]; n1.textContent = A(sum); pulse(n1); pulse(bv[i]); c.s('t' + (i + 1), 1, .45); await c.wait(320); u.forEach(x => x.classList.remove('hl')); }
        c.val(1, '٢١', n1); await c.wait(460);
        n2.textContent = '٣'; bv.forEach((x, i) => pulse(x, i * 60)); pulse(n2); c.s('click', 1, .4); await c.wait(240);
        c.val(2, '٣', n2); await c.wait(460);
        const h = V.slice(); let m = 0;
        for (;;) {
          let hi = -1, lo = -1; h.forEach((v, i) => { if (v > M && (hi < 0 || v > h[hi])) hi = i; if (v < M && (lo < 0 || v < h[lo])) lo = i; });
          if (hi < 0) break; h[hi]--; h[lo]++;
          const src = cols[hi].lastElementChild, nb = document.createElement('i'); nb.className = 'mv'; cols[lo].appendChild(nb);
          const a = src.getBoundingClientRect(); src.remove(); const b = nb.getBoundingClientRect(), k = scaleOf(nb), x = (a.left - b.left) / k, y = (a.top - b.top) / k;
          anim(nb, [{ transform: `translate(${x}px, ${y}px)` }, { transform: `translate(${x / 2}px, ${y / 2 - 26}px)`, offset: .5 }, { transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.4,0,.3,1)' });
          bv[hi].textContent = A(h[hi]); bv[lo].textContent = A(h[lo]); c.s('drop', up(m) * .9, .35); m++;
          await c.wait(250);
        }
        await c.wait(200);
        const tp = cols[0].lastElementChild.getBoundingClientRect(), bx = box.getBoundingClientRect();
        ml.style.top = ((tp.top - bx.top) / scaleOf(ml) - 2) + 'px'; show(ml);
        anim(ml, [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 420, easing: 'ease-out' });
        cols.forEach(col => [...col.children].forEach(x => x.classList.add('lv')));
        n3.textContent = '٧'; pulse(n3); c.s('on', 1.1, .45); await c.wait(300); c.val(0, '٧', n3); await c.wait(300);
      },
    },
    hand: {
      html: () => {
        const P = pts(5, 150, 92, 104, 74), L = [];
        for (let a = 0; a < 5; a++) for (let b = a + 1; b < 5; b++) L.push([a, b]);
        return `<div class="dg"><svg class="d" width="300" height="184" viewBox="0 0 300 184">${L.map(([a, b]) => `<line data-a="${a}" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}" stroke="#84D8FF" stroke-width="3" stroke-linecap="round" style="opacity:0"/>`).join('')}
          ${P.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="10" fill="#fff" stroke="#4B4B4B" stroke-width="3" style="opacity:0"/>`).join('')}</svg>
          <div class="dlab"><span>الأشخاص<b class="n1">٠</b></span><span>كل واحد يصافح<b class="n2">٠</b></span><span class="l3">المصافحات<b class="n3">٠</b></span></div></div>`;
      },
      async run(st, c) {
        const C = [...st.querySelectorAll('circle')], L = [...st.querySelectorAll('line')], n1 = st.querySelector('.n1'), n2 = st.querySelector('.n2'), n3 = st.querySelector('.n3');
        for (let i = 0; i < 5; i++) { pop(C[i], 260); n1.textContent = A(i + 1); c.s('tap', up(i), .3); await c.wait(130); }
        pulse(n1); c.val(1, '٥', n1); await c.wait(440);
        C[0].setAttribute('fill', '#1CB0F6'); C[0].setAttribute('stroke', '#1899D6');
        const draw = (l, col) => { const n = l.getTotalLength(); l.setAttribute('stroke', col); l.style.opacity = 1; l.style.strokeDasharray = n; anim(l, [{ strokeDashoffset: n + 'px' }, { strokeDashoffset: '0px' }], { duration: 260, easing: 'ease-out' }); };
        const first = L.filter(l => l.dataset.a === '0'), rest = L.filter(l => l.dataset.a !== '0');
        let tot = 0;
        for (let j = 0; j < first.length; j++) { draw(first[j], '#1899D6'); tot++; n2.textContent = A(j + 1); n3.textContent = A(tot); c.s('t' + Math.min(j + 1, 5), 1, .4); await c.wait(230); }
        pulse(n2); c.val(2, '٤', n2); await c.wait(520);
        for (let j = 0; j < rest.length; j++) { draw(rest[j], '#84D8FF'); tot++; n3.textContent = A(tot); c.s('tap', up(j + 4) * .8, .3); await c.wait(160); }
        c.cap('٥ × ٤ = ٢٠، وكل خط انحسب مرتين ← ٢٠ ÷ ٢ = ١٠'); pulse(n3); c.s('hint', 1, .45);
        await c.wait(380); c.val(0, '١٠', n3); await c.wait(300);
      },
    },
    last: {
      html: () => `<div class="dg dl"><div class="mul"><span class="band"></span>
          <span></span><span></span><span class="d t">٣</span><span class="d u u1">٧</span>
          <span class="op2">×</span><span></span><span class="d t">٢</span><span class="d u u2">٣</span>
          <i class="bar2"></i>
          <span></span><span class="d pr">٨</span><span class="d pr">٥</span><span class="d pr lastc">١</span></div>
          <div class="step"><span class="s1">٧ × ٣ = ٢١</span><span class="s2">آخر رقم: ١</span></div></div>`,
      async run(st, c) {
        const mul = st.querySelector('.mul'), band = st.querySelector('.band'), u1 = st.querySelector('.u1'), u2 = st.querySelector('.u2'), pr = [...st.querySelectorAll('.pr')], last = st.querySelector('.lastc'), s1 = st.querySelector('.s1'), s2 = st.querySelector('.s2');
        anim(mul, RISE, { duration: 320 }); await c.wait(500);
        mul.classList.add('dim'); show(band); band.style.transformOrigin = 'top'; anim(band, [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 360, easing: 'ease-out' }); c.s('off', 1, .4);
        c.cap('العشرات ما تأثّر على آخر رقم'); await c.wait(650);
        pulse(u1); c.val(1, '٧', u1); await c.wait(400);
        pulse(u2); c.val(2, '٣', u2); await c.wait(520);
        pop(s1); c.s('t3', 1, .45); await c.wait(480);
        pop(s2); c.s('t4', 1, .45); await c.wait(460);
        c.cap('تأكيد: ٣٧ × ٢٣ = ٨٥١');
        pr.forEach((x, i) => { show(x); anim(x, RISE, { duration: 280, delay: i * 90, fill: 'backwards' }); });
        await c.wait(420); last.classList.add('on'); pulse(last); c.s('hint', 1, .45);
        await c.wait(280); c.val(0, '١', last); await c.wait(300);
      },
    },
    tri: {
      html: () => {
        let d = '';
        for (let r = 0; r < 5; r++) for (let k = 0; k < 6; k++) { const blue = k <= r; d += `<circle class="${blue ? 'b' : 'o'}" data-r="${r}" cx="${232 - k * 30}" cy="${22 + r * 30}" r="10" fill="${blue ? '#1CB0F6' : '#FF9600'}" style="opacity:0"/>`; }
        return `<div class="dg"><svg class="d" width="290" height="160" viewBox="0 0 290 160">${d}
          <text class="lw" x="157" y="-8" font-size="15" fill="#A568CC" text-anchor="middle" style="opacity:0">٦</text>
          <text class="lh" x="262" y="86" font-size="15" fill="#1899D6" text-anchor="middle" style="opacity:0">٥</text></svg>
          <div class="dlab"><span>آخر عدد<b class="n1">٠</b></span><span>آخر عدد + ١ =<b class="n2">؟</b></span><span class="l3">المجموع<b class="n3">٠</b></span></div></div>`;
      },
      async run(st, c) {
        const B = [...st.querySelectorAll('circle.b')], O = [...st.querySelectorAll('circle.o')], lw = st.querySelector('.lw'), lh = st.querySelector('.lh'), n1 = st.querySelector('.n1'), n2 = st.querySelector('.n2'), n3 = st.querySelector('.n3');
        let sum = 0;
        for (let r = 0; r < 5; r++) { B.filter(x => +x.dataset.r === r).forEach((x, i) => { show(x); anim(x, [{ opacity: 0 }, { opacity: 1 }], { duration: 240, delay: i * 40, fill: 'backwards' }); }); sum += r + 1; n1.textContent = A(r + 1); n3.textContent = A(sum); c.s('t' + (r + 1), 1, .42); await c.wait(320); }
        pulse(n1); pop(lh); c.val(1, '٥', n1); await c.wait(500);
        c.cap('نسخة ثانية مقلوبة تكمّل الدرج مستطيل');
        O.forEach((x, i) => { show(x); anim(x, [{ opacity: 0, transform: 'translate(-40px, -40px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: i * 25, easing: 'cubic-bezier(.3,1.2,.5,1)', fill: 'backwards' }); });
        c.s('drop', 1, .4); await c.wait(680);
        pop(lw); n2.textContent = '٦'; pulse(n2); c.s('click', 1.1, .4); c.val(2, '٦', lw); await c.wait(540);
        c.cap('المستطيل ٥ × ٦ = ٣٠، والدرج نصّه'); n3.textContent = '٣٠'; pulse(n3); await c.wait(600);
        O.forEach(x => { x.style.opacity = .15; anim(x, [{ opacity: 1 }, { opacity: .15 }], { duration: 420 }); });
        n3.textContent = '١٥'; pulse(n3); c.s('hint', 1, .45); c.cap('٣٠ ÷ ٢ = ١٥');
        await c.wait(360); c.val(0, '١٥', n3); await c.wait(300);
      },
    },
    queue: {
      html: () => `<div class="dg"><div style="width:280px"><div class="qhead"><span>الأمام</span><span>الخلف</span></div>
          <div class="qrow" style="justify-content:space-between">${Array.from({ length: 7 }, (_, i) => `<span class="qd${i === 2 ? ' me' : ''}"><i class="f">${A(i + 1)}</i><i class="b">${A(7 - i)}</i></span>`).join('')}</div><div class="qends"></div></div>
          <div class="dlab"><span>من الأمام<b class="n1">٠</b></span><span>من الخلف<b class="n2">٠</b></span><span class="l3">العدد<b class="n3">؟</b></span></div></div>`,
      async run(st, c) {
        const D = [...st.querySelectorAll('.qd')], me = D[2], n1 = st.querySelector('.n1'), n2 = st.querySelector('.n2'), n3 = st.querySelector('.n3');
        D.forEach((x, i) => anim(x, POP, { duration: 260, delay: i * 50, fill: 'backwards' }));
        await c.wait(540);
        for (let i = 0; i < 3; i++) { pop(D[i].querySelector('.f'), 240); n1.textContent = A(i + 1); c.s('tap', up(i), .32); await c.wait(210); }
        pulse(n1); c.val(1, '٣', me.querySelector('.f')); await c.wait(440);
        for (let j = 0; j < 5; j++) { pop(D[6 - j].querySelector('.b'), 240); n2.textContent = A(j + 1); c.s('t' + (j + 1), 1, .4); await c.wait(210); }
        pulse(n2); c.val(2, '٥', me.querySelector('.b')); await c.wait(500);
        me.classList.add('twice'); anim(me, SHAKE, { duration: 400 }); n3.textContent = '٨'; pulse(n3); c.s('off', 1, .45); c.cap('٣ + ٥ = ٨، لكنك انحسبت مرتين');
        await c.wait(880);
        me.classList.remove('twice'); n3.textContent = '٧'; pulse(n3); c.s('hint', 1, .45); c.cap('٨ − ١ = ٧');
        await c.wait(320); c.val(0, '٧', n3); await c.wait(300);
      },
    },
    clock: {
      html: () => {
        const pt = (k, R) => { const a = k * Math.PI / 6; return [100 + R * Math.sin(a), 100 - R * Math.cos(a)].map(v => v.toFixed(1)); };
        const H = Array.from({ length: 12 }, (_, i) => i + 1);
        return `<div class="dg"><svg class="d" width="186" height="186" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="#fff" stroke="#4B4B4B" stroke-width="4"/>
          <path class="wg" d="" fill="rgba(28,176,246,.16)" stroke="#1CB0F6" stroke-width="2"/>
          ${H.map(k => { const [a, b] = pt(k, 80), [x, y] = pt(k, 86); return `<line x1="${a}" y1="${b}" x2="${x}" y2="${y}" stroke="#4B4B4B" stroke-width="${k % 3 ? 2 : 4}" stroke-linecap="round"/>`; }).join('')}
          ${H.map(k => { const [x, y] = pt(k, 64); return `<text class="hn" x="${x}" y="${y}" font-size="16" fill="#AFAFAF" text-anchor="middle" dominant-baseline="central">${A(k)}</text>`; }).join('')}
          <g class="tags"></g><line x1="100" y1="100" x2="100" y2="28" stroke="#4B4B4B" stroke-width="5" stroke-linecap="round"/>
          <line class="hh" x1="100" y1="100" x2="100" y2="52" stroke="#A568CC" stroke-width="7" stroke-linecap="round" style="transform-origin:100px 100px"/><circle cx="100" cy="100" r="6" fill="#4B4B4B"/></svg>
          <div class="dlab"><span>الساعة<b class="n1">٠</b></span><span class="l3">الزاوية<b class="n3">٠°</b></span></div></div>`;
      },
      async run(st, c) {
        const hh = st.querySelector('.hh'), wg = st.querySelector('.wg'), tags = st.querySelector('.tags'), hn = [...st.querySelectorAll('.hn')], n1 = st.querySelector('.n1'), n3 = st.querySelector('.n3');
        const wd = Ag => { const R = 44, r = Ag * Math.PI / 180; return `M100 100 L100 ${100 - R} A${R} ${R} 0 ${Ag > 180 ? 1 : 0} 1 ${(100 + R * Math.sin(r)).toFixed(2)} ${(100 - R * Math.cos(r)).toFixed(2)}Z`; };
        c.cap('٣٦٠° على ١٢ ساعة ← كل ساعة ٣٠°'); await c.wait(850);
        for (let h = 1; h <= 3; h++) {
          hh.style.transform = `rotate(${h * 30}deg)`; anim(hh, [{ transform: `rotate(${(h - 1) * 30}deg)` }, { transform: `rotate(${h * 30}deg)` }], { duration: 300, easing: 'cubic-bezier(.3,1.3,.5,1)' });
          wg.setAttribute('d', wd(h * 30)); hn[h - 1].setAttribute('fill', '#1899D6');
          const a = (h - .5) * 30 * Math.PI / 180, t = document.createElementNS(NS, 'text'); t.setAttribute('x', (100 + 30 * Math.sin(a)).toFixed(1)); t.setAttribute('y', (100 - 30 * Math.cos(a)).toFixed(1)); t.setAttribute('font-size', '10'); t.setAttribute('fill', '#1899D6'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('dominant-baseline', 'central'); t.textContent = '٣٠'; tags.appendChild(t); pop(t, 260);
          n1.textContent = A(h); n3.textContent = A(h * 30) + '°'; pulse(n3); c.s('t' + h, 1, .45); await c.wait(500);
        }
        pulse(n1); c.val(1, '٣', hn[2]); await c.wait(460);
        c.cap('٣ × ٣٠ = ٩٠°'); pulse(n3); c.s('hint', 1, .45); await c.wait(320); c.val(0, '٩٠°', n3); await c.wait(300);
      },
    },
    ways: {
      html: () => {
        const L1 = [60, 150, 240], lv = [];
        L1.forEach((x, i) => [x - 24, x + 24].forEach((y, j) => lv.push([x, y, i, j])));
        return `<div class="dg"><svg class="d" width="300" height="170" viewBox="0 0 300 170">
          ${L1.map(x => `<line class="e1" x1="150" y1="18" x2="${x}" y2="78" stroke="#84D8FF" stroke-width="3" stroke-linecap="round" style="opacity:0"/>`).join('')}
          ${lv.map(([x, y, i]) => `<line class="e2" data-i="${i}" x1="${x}" y1="78" x2="${y}" y2="140" stroke="#E2B6FF" stroke-width="3" stroke-linecap="round" style="opacity:0"/>`).join('')}
          <circle cx="150" cy="18" r="8" fill="#4B4B4B"/>
          ${L1.map((x, i) => `<g class="n1g" style="opacity:0"><circle cx="${x}" cy="78" r="13" fill="#1CB0F6"/><text x="${x}" y="79" font-size="12" fill="#fff" text-anchor="middle" dominant-baseline="central">ق${A(i + 1)}</text></g>`).join('')}
          ${lv.map(([x, y, i, j]) => `<g class="n2g" data-i="${i}" style="opacity:0"><circle cx="${y}" cy="146" r="12" fill="#CE82FF"/><text x="${y}" y="147" font-size="11" fill="#fff" text-anchor="middle" dominant-baseline="central">ب${A(j + 1)}</text></g>`).join('')}</svg>
          <div class="dlab"><span>القمصان<b class="n1">٠</b></span><span>لكل قميص<b class="n2">٠</b></span><span class="l3">الطرق<b class="n3">٠</b></span></div></div>`;
      },
      async run(st, c) {
        const E1 = [...st.querySelectorAll('.e1')], E2 = [...st.querySelectorAll('.e2')], G1 = [...st.querySelectorAll('.n1g')], G2 = [...st.querySelectorAll('.n2g')], n1 = st.querySelector('.n1'), n2 = st.querySelector('.n2'), n3 = st.querySelector('.n3');
        const draw = l => { const n = l.getTotalLength(); l.style.opacity = 1; l.style.strokeDasharray = n; anim(l, [{ strokeDashoffset: n + 'px' }, { strokeDashoffset: '0px' }], { duration: 260, easing: 'ease-out' }); };
        await c.wait(300);
        for (let i = 0; i < 3; i++) { draw(E1[i]); later(200, () => pop(G1[i], 260)); n1.textContent = A(i + 1); c.s('tap', up(i), .32); await c.wait(290); }
        pulse(n1); c.val(1, '٣', n1); await c.wait(440);
        let tot = 0;
        for (let i = 0; i < 3; i++) {
          const e = E2.filter(x => +x.dataset.i === i), g = G2.filter(x => +x.dataset.i === i);
          for (let j = 0; j < 2; j++) { draw(e[j]); later(200, () => pop(g[j], 240)); tot++; n3.textContent = A(tot); if (i === 0) n2.textContent = A(j + 1); c.s('t' + Math.min(tot, 5), 1, .4); await c.wait(i ? 190 : 290); }
          if (i === 0) { pulse(n2); c.val(2, '٢', n2); await c.wait(480); }
        }
        c.cap('كل قميص مع كل بنطلون ← ٣ × ٢ = ٦'); pulse(n3); c.s('hint', 1, .45); await c.wait(360); c.val(0, '٦', n3); await c.wait(300);
      },
    },
  };

  /* ───── exam-style questions (kept from round 3) ───── */
  const four = (ans, ds) => {
    const out = [ans]; ds.forEach(d => { if (out.length < 4 && d != null && !out.includes(d)) out.push(d); });
    const base = +String(ans).replace(/[٠-٩]/g, x => AR.indexOf(x)).replace(/\D/g, '') || 1, suf = /°$/.test(ans) ? '°' : '';
    for (let k = 1; out.length < 4 && k < 40; k++) { const n = base + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 2; if (n > 0) { const v = A(n) + suf; if (!out.includes(v)) out.push(v); } }
    return shuffle(out);
  };
  const G = {
    prob(i) {
      const kind = ['dice', 'bag', 'range'][i % 3]; let q, w, n;
      if (kind === 'dice') { const c = pick([['عدد أكبر من ٤', v => v > 4], ['عدد زوجي', v => v % 2 === 0], ['عدد أقل من ٣', v => v < 3], ['عدد أولي', v => [2, 3, 5].includes(v)]]); n = 6; w = [1, 2, 3, 4, 5, 6].filter(c[1]).length; q = `رُمي حجر نرد مرة واحدة. ما احتمال ظهور ${c[0]}؟`; }
      else if (kind === 'bag') { const r = rnd(3, 7), b = rnd(3, 7), blue = Math.random() < .5; n = r + b; w = blue ? b : r; q = `صندوق فيه ${A(r)} كرات حمراء و${A(b)} كرات زرقاء، سُحبت منه كرة عشوائياً. ما احتمال أن تكون ${blue ? 'زرقاء' : 'حمراء'}؟`; }
      else { const [N, m] = pick([[20, 4], [20, 5], [30, 5], [24, 6], [30, 6], [12, 3], [40, 8]]); n = N; w = N / m; q = `اختير عدد عشوائياً من الأعداد ١ إلى ${A(N)}. ما احتمال أن يكون من مضاعفات ${A(m)}؟`; }
      const ans = fr(w, n);
      return { q, ans, ch: four(ans, [n - w !== w ? fr(w, n - w) : null, fr(n - w, n), fr(1, n), fr(w + 1, n), fr(w, n + 1)]), sol: `المطلوب ${A(w)} من ${A(n)} ← ${A(w)}/${A(n)}${gcd(w, n) > 1 ? ' = ' + ans : ''}` };
    },
    mean(i) {
      const kind = ['direct', 'sum', 'miss'][i % 3];
      if (kind === 'direct') { const k = rnd(4, 5), m = rnd(8, 15), v = Array(k).fill(m); for (let g = 0; g < 16; g++) { const a = rnd(0, k - 1), b = rnd(0, k - 1), d = rnd(1, 4); if (a !== b && v[b] - d > 1) { v[a] += d; v[b] -= d; } } const s = k * m; return { q: `ما الوسط الحسابي للأعداد: ${v.map(A).join('، ')}؟`, ans: A(m), ch: four(A(m), [A(m + 1), A(m - 1), A(m + 2), A(Math.round(s / 2))]), sol: `المجموع ${A(s)} ÷ العدد ${A(k)} = ${A(m)}` }; }
      if (kind === 'sum') { const k = rnd(4, 7), m = rnd(9, 18), s = k * m; return { q: `الوسط الحسابي لـ ${A(k)} أعداد يساوي ${A(m)}. ما مجموع هذه الأعداد؟`, ans: A(s), ch: four(A(s), [A(m + k), A(s - m), A(s + k), A(k * (m + 1))]), sol: `المجموع = الوسط × العدد = ${A(m)} × ${A(k)} = ${A(s)}` }; }
      let m, a, b, c, d; do { m = rnd(9, 14); a = rnd(m - 5, m + 4); b = rnd(m - 5, m + 4); c = rnd(m - 5, m + 4); d = 4 * m - a - b - c; } while (d < 2 || [a, b, c].includes(d) || d === m);
      return { q: `الوسط الحسابي لأربعة أعداد يساوي ${A(m)}. إذا كانت ثلاثة منها ${A(a)} و${A(b)} و${A(c)}، فما العدد الرابع؟`, ans: A(d), ch: four(A(d), [A(m), A(d + 2), A(Math.abs(d - 3)), A(Math.round((a + b + c) / 3))]), sol: `المجموع = ${A(m)} × ٤ = ${A(4 * m)} ← ${A(4 * m)} − ${A(a + b + c)} = ${A(d)}` };
    },
    hand(i) {
      const kind = ['people', 'league', 'points'][i % 3]; let n, q;
      if (kind === 'people') { n = rnd(6, 10); q = `في اجتماع حضره ${A(n)} أشخاص، صافح كل واحد منهم جميع الآخرين مرة واحدة. كم عدد المصافحات؟`; }
      else if (kind === 'league') { n = rnd(10, 16); q = `دوري فيه ${A(n)} ${n === 10 ? 'فرق' : 'فريقاً'}، لعب كل فريق مع كل فريق آخر مباراة واحدة. كم عدد مباريات الدوري؟`; }
      else { n = rnd(6, 10); q = `كم قطعة مستقيمة يمكن رسمها بين ${A(n)} نقاط، لا تقع أي ثلاث منها على استقامة واحدة؟`; }
      const r = n * (n - 1) / 2;
      return { q, ans: A(r), ch: four(A(r), [A(n * (n - 1)), A(n * (n + 1) / 2), A((n - 1) * (n - 1)), A(r - 1)]), sol: `${A(n)} × ${A(n - 1)} ÷ ٢ = ${A(r)}` };
    },
    last(i) {
      const kind = ['two', 'three', 'triple'][i % 3], u = () => rnd(2, 9); let q, ua, ub, r, sol;
      if (kind === 'triple') { const a = rnd(1, 9) * 10 + u(), b = rnd(1, 9) * 10 + u(), c = rnd(1, 9) * 10 + u(); ua = a % 10; ub = b % 10; const uc = c % 10; r = (ua * ub * uc) % 10; q = `ما رقم الآحاد في ناتج ${A(a)} × ${A(b)} × ${A(c)}؟`; sol = `${A(ua)} × ${A(ub)} = ${A(ua * ub)} ← ${A((ua * ub) % 10)} × ${A(uc)} = ${A((ua * ub) % 10 * uc)} ← آخر رقم ${A(r)}`; }
      else { const big = kind === 'three', a = (big ? rnd(10, 99) * 10 : rnd(1, 9) * 10) + u(), b = (big ? rnd(10, 99) * 10 : rnd(1, 9) * 10) + u(); ua = a % 10; ub = b % 10; r = (ua * ub) % 10; q = `ما رقم الآحاد في ناتج ${A(a)} × ${A(b)}؟`; sol = `${A(ua)} × ${A(ub)} = ${A(ua * ub)} ← آخر رقم ${A(r)}`; }
      return { q, ans: A(r), ch: four(A(r), [A((ua + ub) % 10), A(Math.floor(ua * ub / 10) % 10), A((r + 5) % 10), A((r + 2) % 10), A((r + 4) % 10)]), sol };
    },
    tri(i) {
      const n = [30, 40, 50, 25, 60, 100][(i + rnd(0, 5)) % 6], r = n * (n + 1) / 2;
      const q = [`ما مجموع الأعداد الصحيحة من ١ إلى ${A(n)}؟`, `١ + ٢ + ٣ + … + ${A(n)} = ؟`, `ما مجموع أول ${A(n)} عدداً صحيحاً موجباً؟`][i % 3];
      return { q, ans: A(r), ch: four(A(r), [A(n * (n - 1) / 2), A(n * n / 2), A(n * (n + 1))]), sol: `${A(n)} × ${A(n + 1)} ÷ ٢ = ${A(r)}` };
    },
    queue(i) {
      const f = rnd(5, 15), b = rnd(5, 15), n = f + b - 1;
      const q = [`في طابور، ترتيب أحد الأشخاص ${A(f)} من الأمام و${A(b)} من الخلف. كم عدد الأشخاص في الطابور؟`, `ترتيب طالب في صفّه ${A(f)} من الأعلى و${A(b)} من الأسفل حسب الدرجات. كم عدد طلاب الصف؟`, `شقة في الطابق ${A(f)} من الأسفل، وهي نفسها في الطابق ${A(b)} من الأعلى. كم عدد طوابق المبنى؟`][i % 3];
      return { q, ans: A(n), ch: four(A(n), [A(f + b), A(f + b - 2), A(f + b + 1)]), sol: `${A(f)} + ${A(b)} − ١ = ${A(n)}` };
    },
    clock(i) {
      const h = [4, 2, 6, 1][(i + rnd(0, 3)) % 4], a = h * 30, dg = x => A(x) + '°';
      const q = [`ما قياس الزاوية بين عقربي الساعة عند الساعة ${A(h)} تماماً؟`, `كم درجة الزاوية بين عقربي الساعة عندما تشير إلى ${A(h)}:٠٠؟`][i % 2];
      return { q, ans: dg(a), ch: four(dg(a), [a + 30, h * 5 === a ? null : h * 5, 360 - a === a ? null : 360 - a, a - 30 > 0 ? a - 30 : null, h * 60 <= 360 ? h * 60 : null].filter(x => x != null && x > 0).map(dg)), sol: `${A(h)} × ٣٠ = ${dg(a)}` };
    },
    ways(i) {
      const kind = ['clothes', 'roads', 'menu'][i % 3], a = rnd(3, 6), b = rnd(3, 5), r = a * b;
      const q = kind === 'clothes' ? `عند شخص ${A(a)} قمصان و${A(b)} بناطيل. بكم طريقة يمكنه اختيار قميص وبنطال؟`
        : kind === 'roads' ? `توجد ${A(a)} طرق من المدينة (أ) إلى (ب)، و${A(b)} طرق من (ب) إلى (ج). بكم طريقة يمكن الذهاب من (أ) إلى (ج) مروراً بـ(ب)؟`
        : `مطعم يقدّم ${A(a)} أطباق رئيسية و${A(b)} أنواع من العصير. بكم طريقة يمكن اختيار طبق وعصير؟`;
      return { q, ans: A(r), ch: four(A(r), [A(a + b), A(r + a), A((a - 1) * b), A(r - 1)]), sol: `${A(a)} × ${A(b)} = ${A(r)}` };
    },
  };

  /* ───── the rules. tok: the formula (terms are {t}); say: فهيم's line; cue: when it shows up; trap: its trap;
     words: blanks the words screen may swap; num: the step-by-step example (rows of tokens, {b} a blank; swap: blanks
     of one row that may go in either order, a product's or a sum's) ───── */
  const B = v => ({ b: v });
  const RULES = [
    { key: 'prob', name: 'الاحتمال', tok: [{ t: 'الاحتمال' }, '=', { t: 'المطلوب' }, '÷', { t: 'الكل' }],
      say: '*الاحتمال*: المطلوب، على الكل.', cue: 'تجيك لما تقرا «احتمال» أو «سُحب عشوائياً».', trap: 'تقسم على الكل، مو على الباقي.',
      num: { ex: 'نرد واحد: احتمال عدد أكبر من ٤', rows: [['=', B('٢'), '÷', B('٦')], ['=', B('١/٣')]], more: ['٤', '٢/٤', '١/٢'] } },
    { key: 'mean', name: 'الوسط الحسابي', tok: [{ t: 'الوسط' }, '=', { t: 'المجموع' }, '÷', { t: 'العدد' }],
      say: '*الوسط*: اجمعها كلها، واقسم على عددها.', cue: 'تجيك لما تقرا «متوسط» أو «معدّل». ولو طلب المجموع: الوسط × العدد.', trap: 'تقسم على عدد الأعداد، مو على ٢.',
      num: { ex: 'الوسط الحسابي للأعداد ٨، ١٢، ١٠', rows: [['=', B('٣٠'), '÷', B('٣')], ['=', B('١٠')]], more: ['٢', '١٥', '٢٨'] } },
    { key: 'hand', name: 'المصافحات', tok: [{ t: 'المصافحات' }, '=', { t: 'العدد' }, '×', { t: '(العدد − ١)' }, '÷', '٢'], wswap: [1, 2],
      say: '*المصافحات*: كل واحد يصافح الباقين، وكل مصافحة تنحسب مرة.', cue: 'تجيك لما تقرا «كل واحد مع كل واحد»: مصافحات، مباريات دوري، خطوط بين نقاط.', trap: 'لا تنسى ÷ ٢، كل مصافحة انحسبت مرتين.',
      num: { ex: '٧ أشخاص، كل واحد يصافح الباقين', rows: [['=', B('٧'), '×', B('٦'), '÷', '٢'], ['=', B('٤٢'), '÷', '٢'], ['=', B('٢١')]], more: ['٨', '٤٩', '١٤'], swap: [[0, 0, 1]] } },
    { key: 'last', name: 'رقم الآحاد في الضرب', tok: [{ t: 'آخر رقم في الناتج' }, '=', 'آخر رقم من', { t: 'آحاد' }, '×', { t: 'آحاد' }],
      say: '*آخر رقم* في الضرب يجي من ضرب الآحاد بس.', cue: 'تجيك لما تقرا «رقم الآحاد» في ضرب أعداد كبيرة.', trap: 'تضرب الآحاد، ما تجمعها.',
      num: { ex: 'رقم الآحاد في ٤٨ × ٢٧', rows: [[B('٨'), '×', B('٧'), '=', B('٥٦')], ['رقم الآحاد', '=', B('٦')]], more: ['٤', '٢', '٥'], swap: [[0, 0, 1]] } },
    { key: 'tri', name: 'مجموع ١ إلى ن', tok: [{ t: 'المجموع' }, '=', { t: 'آخر عدد' }, '×', { t: '(آخر عدد + ١)' }, '÷', '٢'], wswap: [1, 2],
      say: '*المجموع* من ١: اضرب آخر عدد في اللي بعده، وخذ النص.', cue: 'تجيك لما تقرا «من ١ إلى …» أو «أول … عدداً».', trap: 'آخر عدد + ١، مو − ١.',
      num: { ex: '١ + ٢ + ٣ + … + ٢٠', rows: [['=', B('٢٠'), '×', B('٢١'), '÷', '٢'], ['=', B('٤٢٠'), '÷', '٢'], ['=', B('٢١٠')]], more: ['١٩', '٤٠٠', '٢٠٠'], swap: [[0, 0, 1]] } },
    { key: 'queue', name: 'الترتيب من الطرفين', tok: [{ t: 'العدد' }, '=', { t: 'من الأمام' }, '+', { t: 'من الخلف' }, '−', '١'], wswap: [1, 2],
      say: '*العدد*: اجمع ترتيبك من الجهتين، واطرح نفسك.', cue: 'تجيك لما تقرا «ترتيبه … من الأمام و… من الخلف»، أو الطوابق.', trap: 'لا تنسى − ١، أنت انحسبت مرتين.',
      num: { ex: 'ترتيبك ٤ من الأمام و٩ من الخلف', rows: [['=', B('٤'), '+', B('٩'), '−', '١'], ['=', B('١٢')]], more: ['١٣', '٥', '١١'], swap: [[0, 0, 1]] } },
    { key: 'clock', name: 'زاوية الساعة', tok: [{ t: 'الزاوية' }, '=', { t: 'الساعة' }, '×', '٣٠'],
      say: 'على رأس الساعة: كل ساعة على الوجه *٣٠ درجة*.', cue: 'تجيك لما تكون الساعة تماماً، بدون دقائق.', trap: 'كل ساعة ٣٠°، مو ٦٠ ولا ٥.',
      num: { ex: 'الزاوية عند الساعة ٥ تماماً', rows: [['=', B('٥'), '×', '٣٠'], ['=', B('١٥٠°')]], more: ['٦٠°', '٦', '١٢٠°'] } },
    { key: 'ways', name: 'مبدأ العدّ', tok: [{ t: 'عدد الطرق' }, '=', { t: 'خيارات الأول' }, '×', { t: 'خيارات الثاني' }], wswap: [1, 2],
      say: 'تختار من كل مجموعة؟ *اضرب* عدد الخيارات.', cue: 'تجيك لما تختار شي من كل مجموعة: لبس، طرق بين مدن، وجبة وعصير.', trap: 'تضرب، ما تجمع.',
      num: { ex: '٤ قمصان و٣ بناطيل: كم طريقة؟', rows: [['=', B('٤'), '×', B('٣')], ['=', B('١٢')]], more: ['٧', '١٦', '٩'], swap: [[0, 0, 1]] } },
  ];
  const opHtml = x => OP.test(x) ? `<span class="op">${x === '÷' ? '<i class="dv"></i>' : x}</span>` : `<span class="pw">${x}</span>`;
  const fcard = R => `<div class="fcard${R.key === 'prob' ? ' tall' : ''}"><div class="line">${R.tok.map((x, i) => typeof x === 'string' ? opHtml(x) : `<span class="k${R.tok.indexOf(x) === 0 ? ' ca' : ''}" data-s="${R.tok.filter(y => typeof y !== 'string').indexOf(x)}">${x.t}<i class="val"></i></span>`).join('')}</div></div>`;

  /* ───── the rule, three ways (?card=1|2|3; 0 is the yellow card). Each draws the formula as the exam prints it —
     a «÷» rule stacked over its bar — and takes the proof's numbers its own way: html, intro (a promise that ends
     when the proof may start), review (hidden until the student taps), reset (before a proof replays), val ───── */
  const CV = '13';
  const parseF = R => {
    const terms = R.tok.filter(x => typeof x !== 'string');
    const it = R.tok.map(x => typeof x === 'string' ? { p: x } : { t: x.t, s: terms.indexOf(x) });
    /* a sentence rule (no «=» after its first word) is all one row, with no name standing apart */
    const eq = it[1] && it[1].p === '=', all = eq ? it.slice(2) : it, cut = R.tail ? R.tail - 2 : all.length, rhs = all.slice(0, cut), d = rhs.findIndex(x => x.p === '÷');
    return { lhs: eq ? it[0] : null, rhs: all, num: d < 0 ? null : rhs.slice(0, d), den: d < 0 ? null : rhs.slice(d + 1), tail: all.slice(cut) };
  };
  const fRow = (xs, T) => xs.map(x => x.p != null ? (OP.test(x.p) ? T.op(x.p) : T.plain(x.p)) : T.term(x, false)).join('');
  const fRhs = (F, T) => F.num ? T.frac(fRow(F.num, T), fRow(F.den, T)) + fRow(F.tail, T) : fRow(F.rhs, T);
  const fAll = (F, T) => (F.lhs ? T.term(F.lhs, true) + T.op('=') : '') + fRhs(F, T);
  const rel = (el, host) => { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(); return { l: a.left - b.left, r: a.right - b.left, t: a.top - b.top, b: a.bottom - b.top, w: a.width, h: a.height }; };
  const opTxt = p => p === '÷' ? '<i class="dv"></i>' : p;
  const at$ = ms => new Promise(res => later(ms, res));
  const tick = slot => snd('click', slot === 0 ? 1.26 : slot === 1 ? 1 : 1.12, .42);
  const CARDS = {};


  const cen = (el, host) => { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(); return { x: a.left + a.width / 2 - b.left, y: a.top + a.height / 2 - b.top }; };
  const FRAC = (n, d) => `<span class="fq"><span class="fq-n">${n}</span><i class="fq-bar"></i><span class="fq-d">${d}</span></span>`;
  const decoy = s => String(s).replace(/[٠-٩]/g, () => AR[rnd(0, 9)]);
  const stopA = (...els) => els.forEach(e => e && e.getAnimations().forEach(a => a.cancel()));
  const fadeHint = (h, d) => later(d, () => { show(h); anim(h, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 }); });
  function onTap(card, hint, f) { card.style.cursor = 'pointer'; card.onclick = () => { card.onclick = null; card.style.cursor = ''; hint.style.opacity = 0; f(); }; }

  const XO = 'cubic-bezier(.19,1,.22,1)', XIO = 'cubic-bezier(.87,0,.13,1)';

  /* 12. the word becomes a number, drawn in Brilliant's lesson UI: each term a blue-100 box that is also its mask —
     the word rises inside it, a blue-500 line runs along its foot, and each number pushes its word up and out while the box
     grows or shrinks to the number; the word comes back small under it, and the answer's box turns Brilliant's correct green */
  const KBT = {
    term: (x, l) => `<span class="k${l ? ' ca' : ''}" data-s="${x.s}"><span class="kb-m"><span class="kb-w">${x.t}</span><span class="kb-n"></span><i class="kb-u"></i></span><span class="kb-c" data-w="${x.t}">${x.t}</span></span>`,
    plain: p => `<span class="pl">${fx(p)}</span>`, op: p => `<span class="op">${opTxt(p)}</span>`, frac: FRAC };
  /* the first three rules play the card as a student asked for it (tools/student-view.html; the user, 2026-10-30: «ok do it your way
     and lets do it for the first 3 lessons»): a short rule plays faster, a new rule leaves one term blank for the student to pick,
     a review asks for one term before it shows anything, and the card ends on the rule in words with its numbers small under it */
  const KB_NEW = { has: () => true };
  const kbNew = fc => !!(fc._R && KB_NEW.has(fc._R.key));
  function kbIn(fc, t, only) {
    const line = fc.querySelector('.kb-fx'), all = [...line.querySelectorAll('.k, .op, .pl, .fq-bar')], kids = all.filter(e => !only || only(e));
    const sp = kbNew(fc) && all.length <= 5 ? .62 : 1, st = 85 * sp, su = 280 * sp;
    kids.forEach((e, i) => {
      const d = t + i * st;
      if (e.classList.contains('k')) {
        anim(e.querySelector('.kb-m'), [{ opacity: 0, transform: 'scale(.86)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: d, easing: XO, fill: 'backwards' });
        if (!e.classList.contains('gap')) anim(e.querySelector('.kb-w'), [{ transform: 'translateY(115%)' }, { transform: 'none' }], { duration: 720 * Math.max(sp, .8), delay: d + 60, easing: XO, fill: 'backwards' });
        later(d, () => snd('tap', 1.1 + i * .06, .22));
      }
      else if (e.classList.contains('fq-bar')) anim(e, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 640, delay: d, easing: XO, fill: 'backwards' });
      else anim(e, [{ opacity: 0, transform: 'translateY(.3em)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: d, easing: XO, fill: 'backwards' });
    });
    const e2 = t + kids.length * st + 260 * sp, terms = [...line.querySelectorAll('.k:not(.ca):not(.gap)')].filter(e => !only || only(e));
    terms.forEach((k, j) => {
      const d = e2 + j * su;
      nwSweep(k.querySelector('.kb-u'), [{ transform: 'translateX(100%) scaleX(0)' }, { transform: 'translateX(0) scaleX(1)', offset: .5 }, { transform: 'translateX(0) scaleX(0)' }], { duration: 640 * Math.max(sp, .8), delay: d, easing: 'cubic-bezier(.65,0,.35,1)' });
      later(d, () => snd('click', up(j * 2), .26));
    });
    return e2 + terms.length * su + 320 * sp;
  }
  /* the rule is always one line (the user, 2026-10-29: «i dont want two lines»), as big as the card's width lets it be */
  function kbFit(fc) {
    const line = fc.querySelector('.kb-fx');
    line.style.fontSize = '';
    fit(line, innerWidth < 380 ? 12 : 15);
  }
  function kbGrow(fc) {
    /* the card keeps its height, so nothing under it moves: the rule grows into the card's own empty foot and no further */
    const line = fc.querySelector('.kb-fx'), card = line.closest('.kb-card'), from = parseFloat(getComputedStyle(line).fontSize);
    const k = scaleOf(card), cr = card.getBoundingClientRect();
    card.style.height = (cr.height / k) + 'px';
    fit(line, innerWidth < 380 ? 12 : 15);
    let to = parseFloat(getComputedStyle(line).fontSize);
    const low = () => Math.max(line.getBoundingClientRect().bottom, ...[...line.querySelectorAll('.kb-c')].map(c => c.getBoundingClientRect().bottom));
    while (to > from && low() > cr.bottom - 18 * k) { to -= .5; line.style.fontSize = to + 'px'; }
    line.style.fontSize = from + 'px';
    if (to - from < 1) return;
    anim(line, [{ fontSize: from + 'px' }, { fontSize: to + 'px' }], { duration: 640, easing: XIO });
    line.style.fontSize = to + 'px';
  }
  /* one term is a blank and three words wait under the rule: the right one drops into it; a wrong one shakes and is spent.
     On a review a wrong pick counts against the rule, so it comes back sooner */
  function kbAsk(fc, k, review, done) {
    const R = fc._R, card = fc.querySelector('.kb-card'), tag = fc.querySelector('.kb-tag'), right = k.querySelector('.kb-w').textContent;
    const mine = R.tok.filter(x => typeof x !== 'string').map(x => x.t);
    const names = RULES.map(r => r.tok[0].t), also = R.notDecoy || { mean: ['الكل'], hand: ['الكل'] }[R.key] || [];
    const pool = shuffle([...new Set(RULES.filter(r => r !== R).flatMap(r => r.tok.filter(x => typeof x !== 'string').map(x => x.t)))].filter(t => !mine.includes(t) && !names.includes(t) && !also.includes(t) && /[\u0621-\u064A]/.test(t)));
    /* a rule may name its own wrong answers, when other rules' words make no sense among its terms (the numbers of «الأعداد المكمّلة») */
    const near = pool.filter(t => Math.abs(t.length - right.length) <= 4), others = R.decoys ? shuffle(R.decoys.filter(t => !mine.includes(t))).slice(0, 2) : (near.length >= 2 ? near : pool).slice(0, 2);
    const pick = document.createElement('div'); pick.className = 'kb-pick';
    pick.innerHTML = shuffle([right, ...others]).map(t => `<button class="kb-ch">${t}</button>`).join('');
    card.appendChild(pick);
    k.classList.add('gap', 'ask');
    tag.textContent = 'وش الناقص؟';
    anim(tag, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: XO });
    [...pick.children].forEach((b, i) => anim(b, RISE, { duration: 300, delay: 80 + i * 70, easing: XO, fill: 'backwards' }));
    later(80, () => snd('on', 1.1, .3));
    let miss = 0;
    pick.querySelectorAll('.kb-ch').forEach(b => b.onclick = () => {
      if (pick.dataset.done) return;
      if (b.textContent !== right) {
        miss++; b.classList.add('no'); b.disabled = true; anim(b, SHAKE, { duration: 400 }); snd('wrong', 1, .4); buzz([30, 40, 30]);
        if (review && miss === 1 && L) L.miss++;
        return;
      }
      pick.dataset.done = 1; kbWave(b); snd('right', 1, .45); buzz(12);
      const m = k.querySelector('.kb-m'), w = k.querySelector('.kb-w');
      k.classList.remove('gap', 'ask');
      anim(w, [{ opacity: 0, transform: 'translateY(-115%)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: XO });
      anim(m, [{ transform: 'none' }, { transform: 'scale(1.08)', offset: .4 }, { transform: 'none' }], { duration: 420, delay: 120, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      later(700, () => { anim(pick, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }); later(250, () => pick.remove()); });
      later(420, () => {
        tag.textContent = 'القانون'; anim(tag, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
        done(miss);
      });
    });
  }
  /* Duolingo's right answer on a tapped word, as the app plays it (adWave in app.js, from TapInput's AtomicDelightAnimation):
     it crouches, springs 23.6px, lands past its place and rebounds (650ms) with its squash and stretch, turns green 100ms in over
     a grey slab where it stood, and a pale band and two sparkles cross it */
  const AD_JUMP = [[0, 0, 'cubic-bezier(.01,0,0,1)'], [.1277, 7.3, 'linear'], [.1538, -12.7, 'cubic-bezier(.1,.53,0,.92)'],
    [.3585, -23.6, 'cubic-bezier(1,-.05,.95,.65)'], [.6923, 4.4, 'cubic-bezier(.09,.75,.4,.95)'], [.8723, -7.3, 'cubic-bezier(.89,-.08,.95,.79)'], [1, 0]];
  const AD_SQ = [[0, 0, 0, 'cubic-bezier(.01,0,0,1)'], [.1509, 2.9, -5.8, 'linear'], [.1818, -5.7, 2.53, 'cubic-bezier(.01,0,.15,1)'],
    [.4236, 0, 0, 'cubic-bezier(.85,0,.94,.72)'], [.7873, 0, 2.53, 'linear'], [.8182, 1.96, -2.9, 'cubic-bezier(.1,.47,.01,1)'], [1, 0, 0]];
  const AD_SLAB = { at: [0, .2418, .6364, .8491, 1], k: [5.9, 7.1, 1.27, 4.72, 3.64], l: [4.78, 6.36, 4.78, 5.45, 3.64], m: [4.5, 5, 4.3, 4.57, 3.64],
    ease: ['cubic-bezier(.1,.53,0,.92)', 'cubic-bezier(1,-.03,.95,.65)', 'cubic-bezier(.09,.75,.4,.95)', 'cubic-bezier(.89,-.08,.95,.79)'] };
  const AD_STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C12.9 7.2 16.8 11.1 24 12 16.8 12.9 12.9 16.8 12 24 11.1 16.8 7.2 12.9 0 12 7.2 11.1 11.1 7.2 12 0Z"/></svg>';
  function kbWave(c) {
    if (reduce) { c.classList.add('ok'); return; }
    const W = c.offsetWidth || 1, H = c.offsetHeight || 1, par = c.parentElement, ease = e => (e ? { easing: e } : {}), rad = getComputedStyle(c).borderRadius;
    c.classList.add('ad-go');
    anim(c, AD_JUMP.map(([o, y, e]) => Object.assign({ offset: o, translate: `0 ${y}px` }, ease(e))), { duration: 650 });
    anim(c, AD_SQ.map(([o, w, h, e]) => Object.assign({ offset: o, scale: `${(1 + 2 * w / W).toFixed(4)} ${(1 + 2 * h / H).toFixed(4)}` }, ease(e))), { duration: 550 });
    const slab = document.createElement('i'); slab.className = 'ad-slab';
    Object.assign(slab.style, { left: c.offsetLeft + 'px', top: c.offsetTop + 'px', width: W + 'px', height: H + 'px', borderRadius: rad });
    par.insertBefore(slab, c);
    anim(slab, AD_SLAB.at.map((o, j) => Object.assign({ offset: o, opacity: 1,
      clipPath: `inset(${(AD_SLAB.l[j] + AD_SLAB.m[j]).toFixed(2)}px ${AD_SLAB.k[j]}px ${(AD_SLAB.l[j] - AD_SLAB.m[j]).toFixed(2)}px ${AD_SLAB.k[j]}px round ${rad})` }, ease(AD_SLAB.ease[j]))), { duration: 550, delay: 100 });
    const sh = document.createElement('i'); sh.className = 'ad-sh'; sh.innerHTML = '<b></b>'; c.appendChild(sh);
    const band = sh.firstChild, bw = 38, x = p => `${(-bw + (W + bw + H / 2) * p).toFixed(1)}px 0`;
    band.style.transform = `skewX(${(-Math.atan(.5) * 180 / Math.PI).toFixed(2)}deg)`;
    anim(band, [{ offset: 0, translate: x(0), easing: 'linear' }, { offset: .0486, translate: x(.24), easing: 'cubic-bezier(.17,.17,.32,.73)' },
      { offset: .4286, translate: x(.47), easing: 'cubic-bezier(.63,.17,.83,.83)' }, { offset: 1, translate: x(1) }], { duration: 350, delay: 105, fill: 'backwards' });
    [['ad-sp a', 12], ['ad-sp b', 8]].forEach(([cls, sz]) => {
      const sp = document.createElement('i'); sp.className = cls; sp.style.width = sp.style.height = sz + 'px'; sp.innerHTML = AD_STAR; c.appendChild(sp);
      anim(sp, [{ offset: 0, scale: 0, easing: 'cubic-bezier(.17,.17,0,.89)' }, { offset: .5, scale: 1.1535, easing: 'cubic-bezier(.8,-.09,.83,.83)' }, { offset: 1, scale: 0 }], { duration: 400, delay: 100, fill: 'both' });
      anim(sp, [{ rotate: '0deg' }, { rotate: '39.05deg' }], { duration: 400, delay: 100 });
    });
    later(100, () => c.classList.add('ok'));
    later(700, () => { slab.remove(); sh.remove(); c.querySelectorAll('.ad-sp').forEach(e => e.remove()); c.classList.remove('ad-go'); });
  }
  /* the end: the numbers step down under their words and the rule comes back in words, big, so the rule is the last thing seen */
  function kbBack(fc) {
    const line = fc.querySelector('.kb-fx'), ks = [...line.querySelectorAll('.k')].filter(k => k.querySelector('.kb-n').innerHTML), F1 = parseFloat(getComputedStyle(line).fontSize);
    if (!ks.length) return;
    stopA(line);
    const ms = ks.map(k => k.querySelector('.kb-m')), from = ms.map(m => [m.style.width, m.style.height]);
    ms.forEach(m => { m.style.width = ''; m.style.height = ''; });
    fit(line, innerWidth < 380 ? 12 : 15);
    const F2 = parseFloat(getComputedStyle(line).fontSize), s = scaleOf(line);
    const to = ms.map(m => { const r = m.getBoundingClientRect(); return [(r.width / s / F2) + 'em', (r.height / s / F2) + 'em']; });
    anim(line, [{ fontSize: F1 + 'px' }, { fontSize: F2 + 'px' }], { duration: 640, easing: XIO });
    ms.forEach((m, i) => {
      m.style.width = to[i][0]; m.style.height = to[i][1];
      anim(m, [{ width: from[i][0] || to[i][0], height: from[i][1] || to[i][1] }, { width: to[i][0], height: to[i][1] }], { duration: 640, easing: XIO });
    });
    const tk = fc._kbT;
    later(700, () => { if (fc._kbT === tk) ms.forEach(m => { m.style.width = ''; m.style.height = ''; }); });
    ks.forEach((k, i) => {
      const w = k.querySelector('.kb-w'), n = k.querySelector('.kb-n'), c = k.querySelector('.kb-c');
      stopA(w, n, c);
      anim(n, [{ transform: 'none' }, { transform: 'translateY(115%)' }], { duration: 520, delay: i * 60, easing: XIO, fill: 'backwards' });
      anim(w, [{ transform: 'translateY(-115%)' }, { transform: 'none' }], { duration: 600, delay: 60 + i * 60, easing: XIO, fill: 'backwards' });
      c.innerHTML = n.firstChild ? n.firstChild.innerHTML : ''; c.classList.add('num'); c.style.opacity = 1;
      anim(c, [{ opacity: 0, transform: 'translate(-50%, -6px)' }, { opacity: 1, transform: 'translateX(-50%)' }], { duration: 420, delay: 320 + i * 60, easing: XO, fill: 'backwards' });
    });
    snd('on', .9, .3);
    later(520, () => { const tag = fc.querySelector('.kb-tag'); if (tag) anim(tag, [{ transform: 'none' }, { transform: 'scale(1.12)', offset: .4 }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' }); });
  }
  CARDS[12] = {
    html(R) { return `<div class="kb12"><div class="kb-card"><span class="kb-tag">القانون</span><div class="kb-fx">${fAll(parseF(R), KBT)}</div><span class="kb-hint">اضغط تشوف القانون</span></div></div>`; },
    intro(fc, R, t) {
      fc._R = R; kbFit(fc);
      const t0 = Math.max(0, t - 450);
      anim(fc.querySelector('.kb-card'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: t0, easing: XO, fill: 'backwards' });
      anim(fc.querySelector('.kb-tag'), [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: t0 + 120, fill: 'backwards' });
      if (!kbNew(fc) || fc._whole) return at$(kbIn(fc, t0 + 220));
      const ks = [...fc.querySelectorAll('.kb12 .k:not(.ca)')], wd = e => e.querySelector('.kb-w').textContent;
      const k = ks.find(e => !ks.some(o => o !== e && wd(o).includes(wd(e)))) || fc.querySelector('.kb12 .k[data-s="1"]'); k.classList.add('gap');
      const end = kbIn(fc, t0 + 220);
      return new Promise(res => later(end, () => kbAsk(fc, k, false, () => later(450, res))));
    },
    review(fc, R, go) {
      fc._R = R;
      const w = fc.querySelector('.kb12'), card = fc.querySelector('.kb-card'), hint = fc.querySelector('.kb-hint'); kbFit(fc);
      anim(card, [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 200, easing: XO, fill: 'backwards' });
      if (kbNew(fc)) {
        const terms = [...fc.querySelectorAll('.kb12 .k:not(.ca)')], k = terms[rnd(0, terms.length - 1)];
        terms.forEach(x => x.classList.add('gap'));
        const end = kbIn(fc, 300, e => !e.matches('.k:not(.ca)'));
        later(end, () => kbAsk(fc, k, true, miss => {
          const rest = terms.filter(x => x !== k);
          rest.forEach(x => x.classList.remove('gap'));
          later(kbIn(fc, 0, e => rest.includes(e)), () => go(!miss));
        }));
        return;
      }
      w.classList.add('hide');
      kbIn(fc, 300, e => !e.matches('.k:not(.ca)'));
      fadeHint(hint, 1300);
      onTap(card, hint, () => { w.classList.remove('hide'); snd('on', 1, .35); later(kbIn(fc, 0, e => e.matches('.k:not(.ca)')), go); });
    },
    reset(fc) {
      fc._kbT = (fc._kbT || 0) + 1;
      const pk = fc.querySelector('.kb-pick'); if (pk) pk.remove();
      const tag = fc.querySelector('.kb-tag'); if (tag) tag.textContent = 'القانون';
      fc.querySelectorAll('.kb12 .k').forEach(k => {
        const m = k.querySelector('.kb-m'), c = k.querySelector('.kb-c');
        stopA(m, k.querySelector('.kb-w'), k.querySelector('.kb-n'), c);
        k.classList.remove('ok', 'gap', 'ask'); m.style.width = ''; m.style.height = ''; k.querySelector('.kb-n').innerHTML = '';
        c.classList.remove('num'); c.style.opacity = ''; c.innerHTML = c.dataset.w;
      });
      const card = fc.querySelector('.kb-card'); if (card) { card.style.height = ''; stopA(fc.querySelector('.kb-fx')); kbFit(fc); }
    },
    val(fc, slot, text, src) {
      const k = fc.querySelector(`.k[data-s="${slot}"]`); if (!k) return;
      const m = k.querySelector('.kb-m'), w = k.querySelector('.kb-w'), n = k.querySelector('.kb-n'), c = k.querySelector('.kb-c');
      if (src) pulse(src);
      stopA(m, w, n, c);
      n.innerHTML = `<span>${fx(text)}</span>`;
      /* the box takes the number's width, never narrower than the word under it, so two captions never touch */
      const pad = parseFloat(getComputedStyle(m).paddingLeft) * 2, w0 = m.getBoundingClientRect().width / scaleOf(m);
      const w1 = Math.max(n.firstChild.offsetWidth + pad * 1.4, c.offsetWidth + 6, pad + 14), em = parseFloat(getComputedStyle(m).fontSize);
      /* and grows taller when the number is a fraction, so it is printed at full size, top over bottom */
      const h0 = m.getBoundingClientRect().height / scaleOf(m), h1 = Math.max(h0, n.firstChild.offsetHeight + pad * .7);
      m.style.width = (w1 / em) + 'em'; m.style.height = (h1 / em) + 'em';
      anim(m, [{ width: (w0 / em) + 'em', height: (h0 / em) + 'em' }, { width: (w1 / em) + 'em', height: (h1 / em) + 'em' }], { duration: 560, delay: 80, easing: XIO, fill: 'backwards' });
      anim(w, [{ transform: 'none' }, { transform: 'translateY(-115%)' }], { duration: 540, easing: XIO, fill: 'forwards' });
      anim(n, [{ transform: 'translateY(115%)' }, { transform: 'none' }], { duration: 580, delay: 60, easing: XIO, fill: 'both' });
      anim(c, [{ opacity: 0, transform: 'translate(-50%, -5px)' }, { opacity: 1, transform: 'translateX(-50%)' }], { duration: 420, delay: 420, easing: XO, fill: 'forwards' });
      later(40, () => snd('tap', 1.5, .2)); later(420, () => { tick(slot); buzz(6); });
      if (slot !== 0) return;
      later(560, () => {
        k.classList.add('ok'); snd('right', 1, .38); buzz(12);
        anim(m, [{ transform: 'none' }, { transform: 'scale(1.08)', offset: .4 }, { transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      });
      /* a long rule was shrunk to fit its words; once the answer is in, the numbers take less room, so the line grows back */
      const tk = fc._kbT;
      later(1000, () => { if (fc._kbT === tk) kbGrow(fc); });
      if (kbNew(fc)) later(2700, () => { if (fc._kbT === tk) kbBack(fc); });
    },
  };

  /* 13. card 12 in the app's own font and colours: the same card, the same motion, only the paint differs (.kb13) */
  CARDS[13] = Object.assign({}, CARDS[12], {
    html(R) { return CARDS[12].html(R).replace('<div class="kb12">', '<div class="kb12 kb13">'); },
  });


  /* ───── «قانون جديد»: Duolingo's new-word header and card (nw_header_and_card_v10.riv, as ChallengeIndicatorView sets it up),
     measured off the file at a twentieth of its speed and drawn as our own rule card ───── */
  /* the rule's sign on the card, one per look: a fraction, «=», «÷»; the book's title plate, the node's star, the wordmark's ق */
  const NW_Q = '<svg viewBox="4250 1370 780 1030"><path fill="#3C3C3C" fill-rule="evenodd" d="M4290 2361L4847 2361L4988 2213L4988 1835L4847 1687L4573 1687L4396 1865L4396 2146L4458 2213L4290 2213Z M4625 1835L4847 1835L4847 2213L4662 2213L4544 2102L4544 1917Z"/><path fill="#58CC02" d="M4742 1413h152v152h-152Z M4503 1413h152v152h-152Z"/></svg>';
  const NW_SIGN = { 1: '<rect x="6" y="2.4" width="8" height="5.6" rx="2"/><rect x="2.6" y="8.9" width="14.8" height="2.3" rx="1.15"/><rect x="6" y="12.1" width="8" height="5.6" rx="2"/>',
    2: '<rect x="2.6" y="5.6" width="14.8" height="3.2" rx="1.6"/><rect x="2.6" y="11.2" width="14.8" height="3.2" rx="1.6"/>',
    3: '<circle cx="10" cy="3.4" r="2.3"/><rect x="2.6" y="8.7" width="14.8" height="2.7" rx="1.35"/><circle cx="10" cy="15.4" r="2.3"/>',
    4: '<rect x="1.6" y="5.4" width="14.6" height="8.2" rx="1.8" fill="#fff"/><rect x="4" y="7.9" width="9.8" height="1.4" rx=".7" fill="#8A3FD1"/><rect x="5.4" y="10.3" width="7" height="1.4" rx=".7" fill="#C9A3EE"/>',
    5: '<path d="M10 2.6l2.2 4.6 5 .6-3.7 3.5.9 5-4.4-2.4-4.4 2.4.9-5-3.7-3.5 5-.6z" fill="#C57A1C" stroke="#C57A1C" stroke-width="1.4" stroke-linejoin="round"/>',
    7: '<circle cx="4.2" cy="3.4" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="8.1" cy="3.4" r="1.75" fill="#3C3C3C"/><circle cx="12" cy="3.4" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="15.9" cy="3.4" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="4.2" cy="10" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="8.1" cy="10" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="12" cy="10" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="15.9" cy="10" r="1.75" fill="#3C3C3C"/><circle cx="4.2" cy="16.6" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="8.1" cy="16.6" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/><circle cx="12" cy="16.6" r="1.75" fill="#3C3C3C"/><circle cx="15.9" cy="16.6" r="1.5" fill="none" stroke="#AFAFAF" stroke-width=".8"/>',
    9: '' }['16'];
  let SIGN = NW_SIGN === undefined ? NW_Q : NW_SIGN ? `<svg viewBox="0 0 20 20" fill="currentColor">${NW_SIGN}</svg>` : '';
  /* look 8: each rule as its lesson's node — the lesson's sign (the app's LESSON_ICON) on its unit's colour */
  const NW_LES = { prob: ['green', '<rect class="s" x="6" y="6" width="28" height="28" rx="7"/><circle class="f" cx="14" cy="14" r="3"/><circle class="f" cx="20" cy="20" r="3"/><circle class="f" cx="26" cy="26" r="3"/>'],
    mean: ['purple', '<path class="s" d="M8 34V22M16 34V12M24 34V18M32 34V8M4 20h32"/>'],
    hand: ['green', '<circle class="s" cx="13" cy="20" r="7"/><path class="s" d="M20 20h16M30 20v7M35 20v5"/>'],
    last: ['green', '<path class="s" d="M32 18a12 12 0 0 0-22-5M8 22a12 12 0 0 0 22 5"/><path class="s" d="M9 5v8h8M31 35v-8h-8"/>'],
    tri: ['green', '<path class="s" d="M12 6v12M6 12h12M24 12h11M24 27l10 10M34 27l-10 10M6 32h12"/><circle class="f" cx="12" cy="26.5" r="2.4"/><circle class="f" cx="12" cy="37.5" r="2.4"/>'],
    queue: ['green', '<path class="f j" d="M23 3 8 23h11l-3 14 16-21H21z"/>'],
    clock: ['yellow', '<path class="s" d="M6 33h29M6 33 30 9"/><path class="s" d="M19 33a13 13 0 0 0-4-9"/>'],
    ways: ['green', '<rect class="s" x="6" y="6" width="28" height="28" rx="7"/><circle class="f" cx="14" cy="14" r="3"/><circle class="f" cx="20" cy="20" r="3"/><circle class="f" cx="26" cy="26" r="3"/>'] };
  const NW_UNIT = { green: ['#58CC02', '#58A700', '#71DC1A', '#58A700'], blue: ['#1CB0F6', '#1899D6', '#55C5F9', '#1899D6'], purple: ['#CE82FF', '#A568CC', '#DAA0FF', '#A568CC'], yellow: ['#FFC800', '#E6A000', '#FFE700', '#CD7900'] };
  /* look 11: the shape of the rule's formula in the card's chips, top to bottom: the answer (green), «=», then its terms
     (blue) as a fraction, a product over a number, a product, or a sum */
  const NW_FORM = { prob: 'frac', mean: 'frac', hand: 'pfrac', tri: 'pfrac', last: 'prod', clock: 'prod', ways: 'prod', queue: 'sum' };
  const nwMini = R => {
    const pill = (x, y, w, h, f, st) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${f}" stroke="${st}" stroke-width="1"/>`;
    const B = (x, y, w) => pill(x, y, w, 3.6, '#DDF4FF', '#1CB0F6'), bar = y => `<rect x="2.6" y="${y}" width="14.8" height="1" rx=".5" fill="#3C3C3C"/>`;
    const op = (x, y, k) => k === '×' ? `<path d="M${x - 1.1} ${y - 1.1}l2.2 2.2M${x + 1.1} ${y - 1.1}l-2.2 2.2" stroke="#AFAFAF" stroke-width=".8" stroke-linecap="round"/>` : `<path d="M${x - 1.2} ${y}h2.4M${x} ${y - 1.2}v2.4" stroke="#AFAFAF" stroke-width=".8" stroke-linecap="round"/>`;
    const k = NW_FORM[R.key] || 'frac';
    let g = pill(4, 2.4, 12, 3.8, '#D7FFB8', '#58CC02') + '<rect x="8" y="7.9" width="4" height=".8" rx=".4" fill="#AFAFAF"/><rect x="8" y="9.5" width="4" height=".8" rx=".4" fill="#AFAFAF"/>';
    if (k === 'frac') g += B(4.5, 12.4, 11) + bar(17.3) + B(4.5, 19.6, 11);
    if (k === 'pfrac') g += B(1.6, 12.4, 7.2) + op(10, 14.2, '×') + B(11.2, 12.4, 7.2) + bar(17.3) + B(7.6, 19.6, 4.8);
    if (k === 'prod') g += B(4.5, 12.6, 11) + op(10, 18.2, '×') + B(4.5, 20.2, 11);
    if (k === 'sum') g += B(1.6, 12.6, 7.2) + op(10, 14.4, '+') + B(11.2, 12.6, 7.2) + `<rect x="8" y="19.6" width="4" height=".8" rx=".4" fill="#AFAFAF"/>` + B(7, 21.2, 6);
    return `<svg viewBox="0 0 20 26">${g}</svg>`;
  };
  const nwLook = R => {
    const nw = '16';
    if (!['8', '10', '11', '12', '13', '14', '15', '16'].includes(nw)) return;
    const [u, g] = NW_LES[R.key] || NW_LES.prob, [c, sh, hi, t] = NW_UNIT[u], st = document.documentElement.style;
    if (nw === '8') {
      st.setProperty('--nwf', c); st.setProperty('--nwm', sh); st.setProperty('--nwt', t);
      st.setProperty('--nwbg', `linear-gradient(180deg, ${hi} 0 9%, ${c} 9%)`);
      SIGN = `<svg class="nw-l" viewBox="0 0 40 40" style="color:#fff">${g}</svg>`;
    }
    if (nw === '10') SIGN = `<svg class="nw-l" viewBox="0 0 40 40" style="color:#FFC800">${g}</svg>`;
    if (nw === '11') SIGN = nwMini(R);
    if (['13', '14', '15', '16'].includes(nw)) SIGN = `<svg class="nw-l" viewBox="0 0 40 40" style="color:#C57A1C">${g}</svg>`;
    if (nw === '12') { st.setProperty('--nwu', c); st.setProperty('--nwt', t); SIGN = `<svg class="nw-l" viewBox="0 0 40 40" style="color:${c}">${g}</svg>`; }
  };
  const nwTag = R => (nwLook(R), `<div class="nw-tag"><span class="nw-ic"><i class="nw-c nw-b"></i><i class="nw-c nw-f">${SIGN}</i></span><span class="nw-w">قانون</span><span class="nw-w">جديد</span></div>`);
  /* the flight, [ms, u, v, turn°, width, height]: u runs from the word (0) to the header (1), v is the sideways bow, both in parts of
     the distance between them, so the path keeps its shape at any distance; Duolingo's file is drawn left to right and the app mirrors
     it on a right-to-left phone, so here the bow and the turn are mirrored. The card rises and squashes, turns over once (NW_SPIN),
     then sweeps into the header, shrinking to the header card's size, and lands at 975ms */
  const NW_FLY = [[0, 0, 0, 8.9, 0.809, 1.175], [33, 0.023, -0.0163, 4.7, 0.812, 1.179], [67, 0.0451, -0.0244, -0.2, 0.864, 1.169], [100, 0.0678, -0.0296, -5, 1.102, 1.114],
    [133, 0.0895, -0.0331, -6.6, 1.251, 0.986], [167, 0.1108, -0.0356, -7.9, 1.225, 1.004], [200, 0.129, -0.0373, -9.1, 1.237, 0.973], [233, 0.1432, -0.0384, -9.9, 1.105, 1.038],
    [267, 0.1517, -0.0396, -10.1, 1, 1.101], [300, 0.1558, -0.0405, -10.4, 1, 1.111], [317, 0.1596, -0.0413, -10.7, 1, 1.098], [333, 0.1607, -0.0418, -11.2, 1, 1.088],
    [350, 0.1613, -0.0405, -8.4, 1, 1.078], [367, 0.162, -0.039, -8, 1, 1.067], [383, 0.1626, -0.0375, -9.6, 1, 1.057], [400, 0.1633, -0.0363, -11.3, 1, 1.032],
    [433, 0.1748, -0.0378, -11.8, 1, 1.077], [467, 0.1858, -0.0387, -12.3, 1, 1.079], [500, 0.1975, -0.0393, -13.9, 1, 1.071], [550, 0.219, -0.0398, -17.1, 1, 1.054],
    [600, 0.2454, -0.0403, -21.1, 1, 1.032], [650, 0.2786, -0.0404, -26.5, 1, 1.01], [700, 0.3217, -0.0398, -32.8, 1, 1], [750, 0.3771, -0.0383, -40.5, 1.006, 0.987],
    [800, 0.4489, -0.0352, -51.7, 0.972, 0.947], [833, 0.5105, -0.032, -59.7, 0.923, 0.903], [867, 0.5883, -0.0273, -67.4, 0.835, 0.816], [900, 0.6846, -0.0209, -76.2, 0.688, 0.67],
    [917, 0.7442, -0.0168, -77.8, 0.491, 0.483], [933, 0.8102, -0.0121, -77, 0.476, 0.464], [950, 0.8948, -0.0058, -77.1, 0.477, 0.464], [975, 1, 0, -80, 0.474, 0.465]];
  const NW_LAND = 975;
  /* its turn about its upright axis, [ms, turn°, twist°], read off the width of Duolingo's card at its middle, head and foot
     (cos of the turn) every 12ms: it slides off the line, passes edge-on at 358ms and slows into the last of it, over at 700ms.
     Its foot runs ahead of its head by the twist (33° through the turn, letting go after it), so it passes as a wedge, an
     hourglass and the other wedge */
  const NW_SPIN = [[0, 0, 0], [240, 0, 0], [262, 12, 30], [274, 22, 33], [286, 29, 33], [298, 38, 33], [310, 45, 33], [322, 54, 33], [334, 66, 33],
    [346, 80, 33], [358, 88, 33], [370, 99, 33], [382, 101, 33], [394, 111, 33], [406, 117, 33], [418, 122, 32], [442, 128, 29], [466, 136, 27],
    [490, 141, 24], [514, 148, 22], [550, 156, 17], [600, 164, 10], [650, 170, 5], [700, 180, 0]];
  const nwSpin = (t, y) => { const k = NW_SPIN.findIndex(p => p[0] >= t); if (k < 0) return 180; if (k === 0) return 0;
    const [t0, a0, w0] = NW_SPIN[k - 1], [t1, a1, w1] = NW_SPIN[k], f = (t - t0) / (t1 - t0); return a0 + (a1 - a0) * f + (w0 + (w1 - w0) * f) * y; };
  /* the header coming on: the gold card slides out and over the yellow one, they swap, hold, and swap back (660ms) */
  function nwShuffle(ic, d) {
    const f = ic.querySelector('.nw-f'), b = ic.querySelector('.nw-b'), T = 660, o = ms => ms / T;
    /* measured left to right; the phone is right to left, so every x and turn is mirrored */
    const at = (x, y, r) => `translate(${-x}px, ${y}px) rotate(${-r}deg)`;
    anim(b, [{ offset: 0, transform: at(0, 0, 0) }, { offset: o(51), transform: at(13, 5, 20), easing: 'linear' }, { offset: o(115), transform: at(13, 5, 14) },
      { offset: o(211), transform: at(-5, -2, -4) }, { offset: o(300), transform: at(-6, -2, -3) }, { offset: o(403), transform: at(-6, -2, -3) },
      { offset: o(499), transform: at(-3, -2, -1) }, { offset: o(530), transform: at(0, 0, 0) }, { offset: 1, transform: at(6, 1, 10) }],
      { duration: T, delay: d, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
    anim(f, [{ offset: 0, transform: at(0, 0, 0) }, { offset: o(51), transform: at(-2, -1, 0) }, { offset: o(115), transform: at(-2, -1, 0) },
      { offset: o(211), transform: at(11, 4, 24) }, { offset: o(300), transform: at(12, 4, 25) }, { offset: o(403), transform: at(12, 4, 25) },
      { offset: o(499), transform: at(9, 3, 20), easing: 'cubic-bezier(.4,0,.2,1)' }, { offset: o(547), transform: at(1, 1, 2) }, { offset: 1, transform: at(0, 0, 0) }],
      { duration: T, delay: d, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'backwards' });
    later(d + 120, () => ic.classList.add('swap')); later(d + 410, () => ic.classList.remove('swap'));
    later(d, () => snd('tap', 1.5, .18)); later(d + 140, () => snd('tap', 1.3, .16)); later(d + 430, () => snd('tap', 1.6, .18));
    /* the label's words slide in from the icon's side, 283ms in and 70ms apart (330ms, PathInterpolator .14, .76, 0, 1) */
    [...ic.parentNode.querySelectorAll('.nw-w')].forEach((w, i) => {
      later(d + 283 + i * 70, () => { w.style.opacity = 1; });
      anim(w, [{ transform: 'translateX(10px)' }, { transform: 'none' }], { duration: 330, delay: d + 283 + i * 70, easing: 'cubic-bezier(.14,.76,0,1)' });
    });
  }
  /* the card lands: the gold card tucks behind, the yellow one leans back and holds, then both spring back (Duolingo's card_hit) */
  function nwHit(ic) {
    const f = ic.querySelector('.nw-f'), b = ic.querySelector('.nw-b'), T = 560, o = ms => ms / T;
    anim(b, [{ offset: 0, transform: 'translate(-6px, 1px) rotate(-10deg)' }, { offset: o(35), transform: 'none' }, { offset: o(315), transform: 'none' },
      { offset: o(400), transform: 'translate(-6px, 1px) rotate(-15deg)' }, { offset: o(480), transform: 'translate(-6px, 1px) rotate(-8deg)' }, { offset: 1, transform: 'translate(-6px, 1px) rotate(-10deg)' }],
      { duration: T, easing: 'cubic-bezier(.3,0,.2,1)' });
    anim(f, [{ offset: 0, transform: 'scale(1.12)' }, { offset: o(40), transform: 'none', easing: 'cubic-bezier(.2,0,0,1)' }, { offset: o(120), transform: 'translateX(4px) rotate(20deg)' },
      { offset: o(300), transform: 'translateX(4px) rotate(20deg)', easing: 'cubic-bezier(.3,0,.2,1)' }, { offset: o(340), transform: 'translateX(1px) rotate(7deg)' },
      { offset: o(400), transform: 'rotate(-2.7deg)' }, { offset: o(460), transform: 'rotate(2.1deg)' }, { offset: 1, transform: 'none' }],
      { duration: T, easing: 'cubic-bezier(.3,0,.2,1)' });
    snd('drop', 1.2, .35); buzz(10);
    later(310, () => snd('tap', 1.7, .18));
  }
  /* ── the flying card, drawn before it flies ──
     A look is drawn once as a picture of its face (nwFace: the look's colours, its sign, its shape), then the turn is drawn
     from it into a sheet of 36 frames from flat at 240ms to flat again at 700ms, each shown around its own moment (nwSprite): each row of pixels turned by its own angle (the turn and the twist, nwSpin),
     the face squeezed by the cosine, the card's thickness as its edge colour behind it, the shine of 10 laid on per frame.
     The flight then only moves the card along the path and steps the sheet: two transforms the GPU runs on its own, so a
     busy or slow phone draws it as smoothly as a fast one. */
  const NW_GRID = 6, NW_T0 = 240, NW_T1 = 700;
  const nwCssLin = (deg, w, h) => { const a = deg * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), L = Math.abs(w * dx) + Math.abs(h * dy);
    return [w / 2 - dx * L / 2, h / 2 - dy * L / 2, w / 2 + dx * L / 2, h / 2 + dy * L / 2]; };
  const nwLinDef = (id, deg, w, h, stops) => { const [x1, y1, x2, y2] = nwCssLin(deg, w, h);
    return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`; };
  /* a sign placed as the header's grid places it: centred, fr of the width, moved by (mx, my) parts of the width */
  const nwPlace = (svg, w, h, fr, mx = 0, my = 0, color) => {
    if (!svg) return '';
    const vb = (svg.match(/viewBox="([^"]+)"/) || [, '0 0 20 20'])[1].split(/\s+/).map(Number), sw = w * fr, sh = sw * vb[3] / vb[2];
    return svg.replace('<svg ', `<svg x="${(w - sw) / 2 + mx * w}" y="${(h - sh) / 2 + my * w}" width="${sw}" height="${sh}" ${color ? `style="color:${color}" ` : ''}`);
  };
  const NW_HEX = '19.5,4 51.5,4 67,29 51.5,54 19.5,54 4,29', NW_HEXLIP = '19.5,11 51.5,11 67,36 51.5,61 19.5,61 4,36';
  let NW_IMG = '';
  /* the face of each look as one SVG: [width, height, thickness, edge colour, svg body, shine] */
  const nwFace = R => {
    const nw = 16, cs = getComputedStyle(document.documentElement), v = k => cs.getPropertyValue(k).trim();
    const [u] = NW_LES[R.key] || NW_LES.prob, [uc, ush, uhi] = NW_UNIT[u];
    let w = 31, h = 39, T = 1.6, edge = v('--nwm') || '#1CB0F6', body = '', defs = '', shine = false;
    const rr = (fill, x = 0, y = 0, ww = w, hh = h, r = 5) => `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="${r}" fill="${fill}"/>`;
    const rim = (c, sw, r = 5) => `<rect x="${sw / 2}" y="${sw / 2}" width="${w - sw}" height="${h - sw}" rx="${r - sw / 2}" fill="none" stroke="${c}" stroke-width="${sw}"/>`;
    const clip = '<clipPath id="k"><rect width="' + w + '" height="' + h + '" rx="5"/></clipPath>';
    if (nw <= 3) body = rr(v('--nwf')) + nwPlace(SIGN, w, h, .54, 0, 0, edge);
    else if (nw === 4) body = rr('#8A3FD1') + `<g clip-path="url(#k)"><rect x="${w * .81}" width="${w * .04}" height="${h}" fill="#A35FE0"/><rect x="${w * .85}" width="${w * .15}" height="${h}" fill="#6E28B3"/></g>` + nwPlace(SIGN, w, h, .54);
    else if (nw === 5 || nw === 13) {
      defs = nwLinDef('g', 118, w, h, [[.5, 'rgba(255,217,64,0)'], [.5, '#FFD940'], [.61, '#FFD940'], [.61, 'rgba(255,217,64,0)'], [.68, 'rgba(255,217,64,0)'], [.68, '#FFD940'], [.74, '#FFD940'], [.74, 'rgba(255,217,64,0)']]);
      body = rr('#FFC800') + rr('url(#g)') + (nw === 13 ? `<g clip-path="url(#k)"><rect y="${h - 3}" width="${w}" height="3" fill="#E6A000"/></g>` + nwPlace(SIGN, w, h, .54, 0, -.04) : nwPlace(SIGN, w, h, .54));
      edge = '#E6A000';
    }
    else if (nw === 6) body = rr('#fff') + rim('#DCDCDC', 1.6) + nwPlace(SIGN, w, h, .54);
    else if (nw === 7) body = rr('#fff') + Array.from({ length: Math.floor((h - 8) / 4.6) + 1 }, (_, i) => `<rect x="${w - 4.6}" y="${4 + i * 4.6}" width="2.4" height="1.6" fill="#4B4B4B"/>`).join('') + rim('#DCDCDC', 1.6) + nwPlace(SIGN, w, h, .8, -.06);
    else if (nw === 8) { body = rr(uc) + `<g clip-path="url(#k)"><rect width="${w}" height="${h * .09}" fill="${uhi}"/></g>` + nwPlace(SIGN, w, h, .54); edge = ush; }
    else if (nw === 9) { const iw = w * .92, ih = iw * 100 / 96; body = rr('#F3E0FF') + `<g clip-path="url(#k)"><image href="${NW_IMG}" x="${(w - iw) / 2}" y="${h - ih}" width="${iw}" height="${ih}"/></g>`; edge = '#8A3FD1'; }
    else if (nw === 10) { body = rr('#1E3A8A') + rim('#FFC800', 1.4) + `<rect x="2.9" y="2.9" width="${w - 5.8}" height="${h - 5.8}" rx="2.4" fill="none" stroke="rgba(255,200,0,.45)" stroke-width=".6"/>` + nwPlace(SIGN, w, h, .54); edge = '#172C6B'; shine = true; }
    else if (nw === 11) body = rr('#fff') + `<g clip-path="url(#k)"><rect y="${h - 3}" width="${w}" height="3" fill="#E5E5E5"/></g>` + rim('#E5E5E5', 1.4) + nwPlace(SIGN, w, h, .72, 0, -.03);
    else if (nw === 12) {
      const dash = Array.from({ length: Math.ceil(w / 3.4) }, (_, i) => `<rect x="${i * 3.4}" y="${(h - 1.1) * .33}" width="1.6" height="1.1" fill="#fff"/>`).join('');
      const bars = Array.from({ length: Math.floor(w * .54 / 2) }, (_, i) => `<rect x="${w * .23 + i * 2}" y="${(h - 3.4) * .9}" width=".9" height="3.4" fill="#4B4B4B"/>`).join('');
      body = `<mask id="n"><rect width="${w}" height="${h}" fill="#fff"/><circle cx="0" cy="${h * .34}" r="3.2"/><circle cx="${w}" cy="${h * .34}" r="3.2"/></mask><g mask="url(#n)">` + rr('#fff') +
        `<g clip-path="url(#k)"><rect width="${w}" height="${h * .335}" fill="${uc}"/></g><rect x="${w * .25}" y="${(h - 1.8) * .12}" width="${w * .5}" height="1.8" fill="#fff"/><rect x="${w * .34}" y="${(h - 1.6) * .21}" width="${w * .32}" height="1.6" fill="rgba(255,255,255,.65)"/>` +
        dash + bars + rim('#E5E5E5', 1.4) + '</g>' + nwPlace(SIGN, w, h, .5, 0, .11);
      edge = '#DADADA';
    }
    else {
      w = nw === 16 ? 56 : 39; h = nw === 16 ? 52 : 36; T = nw === 14 ? 0 : nw === 16 ? 3.8 : 2.6; edge = '#D99A00';
      body = `<svg width="${w}" height="${h}" viewBox="0 0 71 65" preserveAspectRatio="none"><defs><clipPath id="h"><polygon points="${NW_HEX}"/></clipPath></defs><g stroke-width="8" stroke-linejoin="round">` +
        `<polygon points="${NW_HEXLIP}" fill="#E6A000" stroke="#E6A000"/><polygon points="${NW_HEX}" fill="#FFC800" stroke="#FFC800"/></g>` +
        `<g clip-path="url(#h)" fill="#FFD940"><polygon points="27,60 38,60 63,-4 52,-4"/><polygon points="42,60 47,60 72,-4 67,-4"/></g></svg>` + nwPlace(SIGN, w, h, .44, 0, -.055);
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><style>.s{fill:none;stroke:currentColor;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.f,.j{fill:currentColor}</style><defs>${clip}${defs}</defs>${body}</svg>`;
    return { w, h, T, edge, svg, shine };
  };
  /* the sheet: built in slices of six frames between other work, finished at once if the card must fly before it is done */
  let NW_SP = null;
  function nwSprite(R) {
    const F = nwFace(R), S = Math.min(4, (devicePixelRatio || 1) * 1.25), n = NW_GRID * NW_GRID;
    const cw = Math.ceil(F.w + F.T + 3), ch = Math.ceil(F.h + 3), Wd = Math.round(F.w * S), Hd = Math.round(F.h * S);
    const sheet = document.createElement('canvas'); sheet.width = Math.round(cw * S) * NW_GRID; sheet.height = Math.round(ch * S) * NW_GRID;
    const sp = { F, S, cw, ch, sheet, done: 0, n, ready: false, img: new Image() };
    const face = document.createElement('canvas'); face.width = Wd; face.height = Hd;
    let rows = null;
    const frame = k => {
      const g = sheet.getContext('2d'), cwd = Math.round(cw * S), chd = Math.round(ch * S), ox = (k % NW_GRID) * cwd, oy = Math.floor(k / NW_GRID) * chd;
      const t = NW_T0 + k * (NW_T1 - NW_T0) / (n - 1), cx = ox + cwd / 2, top = oy + Math.round((chd - Hd) / 2), zT = F.T * S / 2;
      let src = face;
      if (F.shine) {
        /* 10's light: from the far side at 30% of the flight to gone at 75%, a band of light across the navy */
        const X = Math.max(0, Math.min(1, 1 - (t / NW_LAND - .3) / .45)), tmp = document.createElement('canvas'); tmp.width = Wd; tmp.height = Hd;
        const q = tmp.getContext('2d'); q.drawImage(face, 0, 0); q.globalCompositeOperation = 'source-atop';
        const bw = F.w * 3.2, off = -2.2 * F.w * X, [x1, y1, x2, y2] = nwCssLin(112, bw, F.h), gr = q.createLinearGradient((x1 + off) * S, y1 * S, (x2 + off) * S, y2 * S);
        [[.38, 'rgba(255,241,184,0)'], [.41, 'rgba(255,241,184,.08)'], [.47, 'rgba(255,241,184,.7)'], [.51, 'rgba(190,215,255,.55)'], [.54, 'rgba(255,200,240,.35)'], [.6, 'rgba(255,200,240,0)']].forEach(([o, c]) => gr.addColorStop(o, c));
        q.fillStyle = gr; q.fillRect(0, 0, Wd, Hd); src = tmp;
      }
      g.fillStyle = F.edge;
      for (let j = 0; j < Hd; j++) {
        const r = rows[j]; if (!r) continue;
        const ph = nwSpin(t, (j + .5) / Hd - .5) * Math.PI / 180, c = Math.cos(ph), sn = Math.sin(ph), ac = Math.abs(c);
        const a0 = (r[0] - Wd / 2) * ac, a1 = (r[1] - Wd / 2) * ac, sh = zT * sn;
        /* the edge only once the card has turned enough to show it, kept half a pixel inside the face's own outline */
        if (zT && Math.abs(sh) > .25) { const l = cx + Math.min(a0 - sh, a0 + sh, -a1 - sh, -a1 + sh) + .5, rr = cx + Math.max(a1 + sh, a1 - sh, -a0 + sh, -a0 - sh) - .5; g.fillRect(l, top + j, rr - l, 1); }
        if (ac * Wd < .5) continue;
        const fx = cx + (c >= 0 ? sh : -sh) - Wd / 2 * ac;
        g.drawImage(src, 0, j, Wd, 1, fx, top + j, Wd * ac, 1);
      }
    };
    sp.step = (all) => {
      if (!rows || sp.ready) return;
      const end = all ? n : Math.min(n, sp.done + 6);
      for (; sp.done < end; sp.done++) frame(sp.done);
      if (sp.done >= n) sp.ready = true; else setTimeout(() => sp.step(), 0);
    };
    sp.img.onload = () => {
      face.getContext('2d').drawImage(sp.img, 0, 0, Wd, Hd);
      /* each row's extent, read off the face, so the edge follows its shape */
      rows = new Array(Hd);
      let px = null; try { px = face.getContext('2d').getImageData(0, 0, Wd, Hd).data; } catch (e) {}
      for (let j = 0; j < Hd; j++) {
        if (!px) { rows[j] = [0, Wd]; continue; }
        let l = -1, r = -1; for (let x = 0; x < Wd; x++) if (px[(j * Wd + x) * 4 + 3] > 40) { if (l < 0) l = x; r = x + 1; }
        rows[j] = l < 0 ? null : [l, r];
      }
      sp.step();
    };
    sp.img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(F.svg);
    return sp;
  }
  /* the flying card at S, flying the distance D (N its normal), and its sheet stepped across the turn */
  function nwCard(S, D, N, sp) {
    const c = document.createElement('i'); c.className = 'nw-fly';
    if (sp && !sp.ready) sp.step(true);
    if (sp && sp.ready) {
      const win = document.createElement('i'); win.className = 'nw-win';
      Object.assign(win.style, { width: sp.cw + 'px', height: sp.ch + 'px', left: -sp.cw / 2 + 'px', top: -sp.ch / 2 + 'px' });
      const sh = sp.sheet; sh.className = 'nw-sheet'; sh.style.width = sp.cw * NW_GRID + 'px'; sh.style.height = sp.ch * NW_GRID + 'px';
      win.appendChild(sh); c.appendChild(win);
      const at = k => `translate(${-(k % NW_GRID) * sp.cw}px, ${-Math.floor(k / NW_GRID) * sp.ch}px)`;
      c.__sheet = [{ offset: 0, transform: at(0), easing: 'steps(1, end)' }]
        .concat(Array.from({ length: sp.n - 1 }, (_, i) => ({ offset: (NW_T0 + (i + .5) * (NW_T1 - NW_T0) / (sp.n - 1)) / NW_LAND, transform: at(i + 1), easing: 'steps(1, end)' })))
        .concat([{ offset: 1, transform: at(sp.n - 1) }]);
    }
    c.__kf = NW_FLY.map(([t, u, v, r, sx, sy]) => ({ offset: t / NW_LAND,
      transform: `translate(${(S[0] + u * D[0] - v * N[0]).toFixed(1)}px, ${(S[1] + u * D[1] - v * N[1]).toFixed(1)}px) rotate(${-r}deg) scale(${sx}, ${sy})` }));
    return c;
  }
  function nwGo(c) {
    const o = { duration: NW_LAND, easing: 'linear', fill: 'both' };
    anim(c, c.__kf, o);
    const sh = c.querySelector('.nw-sheet'); if (sh) anim(sh, c.__sheet, o);
  }
  /* the flight from the new word to the header's icon */
  function nwFly(from, ic) {
    if (!from || !ic || !cur || reduce) { if (ic) nwHit(ic); return; }
    const box = cur.getBoundingClientRect(), a = from.getBoundingClientRect(), z = ic.querySelector('.nw-f').getBoundingClientRect();
    const S = [a.left + a.width / 2 - box.left, a.top + a.height / 2 - box.top], E = [z.left + z.width / 2 - box.left, z.top + z.height / 2 - box.top];
    const D = [E[0] - S[0], E[1] - S[1]], N = [D[1], -D[0]];
    const c = nwCard(S, D, N, NW_SP); cur.appendChild(c); nwGo(c);
    snd('on', 1.25, .28);
    later(330, () => snd('tap', 1.9, .14));
    later(NW_LAND, () => { c.remove(); nwHit(ic); });
  }

  window.LAWCORE = { RULES, DIA, G, CARD: CARDS[13], kbWave, kbBack, kbIn, kbAsk, kbFit, stopA, XO, nwTag, nwShuffle, nwSprite, nwFly, nwHit, NW_LAND, NW_LES,
    sayInto, snd, audio, buzz, anim, later, wipe, RISE, POP, PULSE, SHAKE, JUMP, jump, pulse, pop, fx, A, toAr, shuffle, pick, rnd, up, fit, flyFrom, show, at$, FH,
    setCur: el => { cur = el; }, setL: v => { L = v; }, setNW: v => { NW_SP = v; }, setReduce: v => { reduce = !!v; }, setMute: v => { mute = !!v; },
    run: () => ++RUN, alive: t => t === RUN, get reduce() { return reduce; },
    four, fr, gcd, NS, pts, scaleOf, XIO, SB };
})();
