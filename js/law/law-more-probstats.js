/* Node 3, «الاحتمالات والإحصاء» (skills.probstats): every rule card of its short lessons that law-core does not carry. */
(function () {
  'use strict';
  const C = window.LAWCORE, M = window.LAWMORE; if (!C || !M) return;
  const H = M.h, { A, fx, anim, RISE, POP, pulse, pop, show, up, rnd, pick, shuffle, four, fr, gcd, SHAKE } = C;
  const $ = (st, s) => st.querySelector(s), $$ = (st, s) => [...st.querySelectorAll(s)];
  const S = 'green';
  /* «مبدأ العدّ»'s own words fit «عملات ونرد» too: never offered there as wrong ones, and the other way round */
  const ways = C.RULES.find(r => r.key === 'ways'); if (ways) ways.notDecoy = ['نواتج الأولى', 'نواتج الثانية', 'كل النواتج'];

  const rules = [
    { key: 'outcomes', name: 'عملات ونرد', tok: [{ t: 'كل النواتج' }, '=', { t: 'نواتج الأولى' }, '×', { t: 'نواتج الثانية' }], wswap: [1, 2],
      say: '*عملة* لها ٢، و*نرد* له ٦، وترميهم مع بعض؟ اضرب.', cue: 'تجيك لما تقرا «رُميت عملتان» أو «نردان» أو «عملة ونرد».',
      trap: 'تضرب ما تجمع: نردان ٣٦ مو ١٢.', notDecoy: ['خيارات الأول', 'خيارات الثاني'] },
    { key: 'order', name: 'كل ترتيب ينحسب', tok: [{ t: 'الاحتمال' }, '=', { t: 'الأزواج المرتّبة' }, '÷', '٣٦'],
      say: '*(١،٣)* غير *(٣،١)*: كل ترتيب ينحسب لحاله.', cue: 'تجيك في النردين: «ما احتمال أن يكون مجموعهما ٤؟».',
      trap: 'لا تعدّ (١،٣) و(٣،١) مرة وحدة: هذي خانتين.', notDecoy: ['المطلوب'] },
    { key: 'norep', name: 'بدون تكرار', tok: [{ t: 'الرموز' }, '=', { t: 'الأرقام' }, '×', { t: '(الأرقام − ١)' }, '×', { t: '(الأرقام − ٢)' }],
      say: '*بدون تكرار*: كل خانة أقل بواحد من اللي قبلها.', cue: 'تجيك لما تقرا «بدون تكرار» أو «أرقام مختلفة» في رمز أو رقم سري.',
      trap: 'مع التكرار كل خانة نفس العدد، وبدونه تنقص واحد.', notDecoy: ['العدد', '(العدد − ١)', 'أرقام نازلة'] },
    { key: 'median', name: 'الوسيط', tok: [{ t: 'الوسيط' }, '=', { t: 'اللي في النص' }, 'بعد', { t: 'الترتيب' }],
      say: '*الوسيط*: رتّب الأعداد أول، وخذ اللي في النص.', cue: 'تجيك لما تقرا «الوسيط». ولو عددها زوجي: خذ متوسط العددين اللي في النص.',
      trap: 'اللي في النص قبل الترتيب مو الوسيط.' },
    { key: 'total', name: 'المجموع من الوسط', tok: [{ t: 'المجموع' }, '=', { t: 'الوسط' }, '×', { t: 'العدد' }], wswap: [1, 2],
      say: 'تعرف *الوسط* والعدد؟ اضربهم يطلع المجموع.', cue: 'تجيك لما تقرا «متوسط … أعداد يساوي …» ويسأل عن مجموعها أو عن عدد ناقص.',
      trap: 'تضرب في عدد الأعداد كلها، والناقص معهم.' },
    { key: 'permcomb', name: 'تباديل ولا توافيق؟', tok: [{ t: 'التباديل' }, '=', { t: 'التوافيق' }, '×', { t: 'ترتيباتها' }], wswap: [1, 2],
      say: 'لو *بدّلت مكانين* وصار شي جديد: تباديل. ما تغيّر شي: توافيق.', cue: 'لجنة، فريق، مجموعة: توافيق. رمز، كلمة، مراكز، رف: تباديل.',
      trap: 'لجنة «أحمد وسعد» هي نفسها «سعد وأحمد».' },
    { key: 'places', name: 'كم مكان؟', tok: [{ t: 'التباديل' }, '=', { t: 'أرقام نازلة' }, 'بعدد', { t: 'الأماكن' }],
      say: '*كم مكان؟* هذا عدد الأرقام اللي تضربها، نازلة من الكل.', cue: 'تجيك لما تقرا «بكم طريقة يجلس، يفوز، يترتّب …».',
      trap: 'لا تضرب كل الأرقام: بس بعدد الأماكن.', notDecoy: ['(الأرقام − ١)', '(الأرقام − ٢)'] },
    { key: 'choose', name: 'التوافيق', tok: [{ t: 'التوافيق' }, '=', { t: 'أرقام نازلة' }, '÷', { t: 'أرقام صاعدة من ١' }],
      say: 'تختار *٣*؟ ٣ أرقام نازلة فوق، و١ × ٢ × ٣ تحت.', cue: 'تجيك لما تقرا «لجنة» أو «تختار … من …» والترتيب ما يفرق.',
      trap: 'تحت تضرب من ١ بعدد اللي تختاره، مو الكل.', notDecoy: ['الأماكن', 'ترتيباتها'] },
  ];

  const DIE = n => { const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[n];
    return `<svg viewBox="-12 -12 24 24" class="die"><rect x="-11" y="-11" width="22" height="22" rx="5"/>${P.map(([x, y]) => `<circle cx="${x * 5.5}" cy="${y * 5.5}" r="2.3"/>`).join('')}</svg>`; };
  const dia = {
    outcomes: {
      html: () => `<div class="dg"><div class="oc-g"><span></span>${[1, 2, 3, 4, 5, 6].map(n => `<span class="oc-h d">${DIE(n)}</span>`).join('')}
          ${['ش', 'ك'].map((f, r) => `<span class="oc-h c">${f}</span>${[1, 2, 3, 4, 5, 6].map(n => `<span class="oc-x" data-r="${r}">${f}${A(n)}</span>`).join('')}`).join('')}</div>
        ${H.lab([['العملة'], ['النرد'], ['كل النواتج']])}</div>`,
      async run(st, c) {
        const hc = $$(st, '.oc-h.c'), hd = $$(st, '.oc-h.d'), x = $$(st, '.oc-x'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        [...hc, ...hd, ...x].forEach(e => show(e, false));
        c.cap('عملة ونرد مع بعض');
        for (let i = 0; i < 2; i++) { pop(hc[i], 260); H.set(n1, i + 1); c.s('tap', up(i), .32); await c.wait(240); }
        c.val(1, '٢', n1); await c.wait(420);
        for (let i = 0; i < 6; i++) { pop(hd[i], 240); H.set(n2, i + 1); c.s('tap', up(i + 2), .3); await c.wait(150); }
        c.val(2, '٦', n2); await c.wait(500);
        c.cap('كل وجه للعملة مع كل وجه للنرد');
        for (let i = 0; i < 12; i++) { show(x[i]); anim(x[i], POP, { duration: 220 }); H.set(n3, i + 1); c.s('tap', up(i % 6) * .8, .22); await c.wait(95); }
        c.cap('٢ × ٦ = ١٢ — وعملتان ٢ × ٢ = ٤، ونردان ٦ × ٦ = ٣٦'); pulse(n3); c.s('hint', 1, .45);
        await c.wait(380); c.val(0, '١٢', n3); await c.wait(300);
      },
    },
    order: {
      html: () => { let d = ''; const X = k => 168 - k * 25, Y = r => 34 + r * 25;
        for (let k = 0; k < 6; k++) d += `<text class="gh" x="${X(k)}" y="14" text-anchor="middle">${A(k + 1)}</text><text class="gh" x="${X(6) + 4}" y="${Y(k) + 1}" text-anchor="middle" dominant-baseline="central">${A(k + 1)}</text>`;
        for (let r = 0; r < 6; r++) for (let k = 0; k < 6; k++) d += `<rect class="gc" data-a="${r + 1}" data-b="${k + 1}" x="${X(k) - 11}" y="${Y(r) - 11}" width="22" height="22" rx="5"/>`;
        return `<div class="dg"><div class="od"><svg class="d" width="186" height="186" viewBox="0 0 186 186">${d}<text class="gh t" x="168" y="-2"> </text></svg>
          <div class="od-l"><span class="p" data-i="0">(١،٣)</span><span class="p" data-i="1">(٢،٢)</span><span class="p" data-i="2">(٣،١)</span></div></div>
          ${H.lab([['المجموع ٤'], ['الكل'], ['الاحتمال', '؟']])}</div>`; },
      async run(st, c) {
        const gc = $$(st, '.gc'), ps = $$(st, '.od-l .p'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        ps.forEach(p => show(p, false));
        gc.forEach((e, i) => anim(e, [{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: i * 12, fill: 'backwards' }));
        c.cap('نردان ← ٦ × ٦ = ٣٦ خانة'); H.set(n2, '٣٦'); c.s('on', 1, .35); await c.wait(1000);
        c.cap('وين المجموع ٤؟');
        const hit = [[1, 3], [2, 2], [3, 1]];
        for (let i = 0; i < 3; i++) { const [a, b] = hit[i], e = gc.find(g => +g.dataset.a === a && +g.dataset.b === b); e.classList.add('on'); pulse(e); show(ps[i]); anim(ps[i], RISE, { duration: 260 }); H.set(n1, i + 1); c.s('t' + (i + 1), 1, .42); await c.wait(520); }
        c.cap('(١،٣) و(٣،١) خانتين مختلفتين ← كل ترتيب ينحسب'); [ps[0], ps[2]].forEach(p => { p.classList.add('tw'); pulse(p); }); c.s('click', 1.2, .4); await c.wait(1000);
        c.val(1, '٣', n1); await c.wait(600);
        c.cap('٣ ÷ ٣٦ = ١/١٢'); H.set(n3, '١/١٢'); c.s('hint', 1, .45); await c.wait(400); c.val(0, '١/١٢', n3); await c.wait(300);
      },
    },
    norep: {
      html: () => `<div class="dg"><div class="nr"><div class="nr-pool">${[1, 2, 3, 4, 5].map(n => `<span class="cell" data-n="${n}">${A(n)}</span>`).join('')}</div>
          <div class="nr-slots">${[0, 1, 2].map(i => `<span class="nr-s"><i></i><b>٠</b></span>`).join('')}</div></div>
        ${H.lab([['الخانة الأولى'], ['الثانية'], ['الثالثة'], ['الرموز', '؟']])}</div>`,
      async run(st, c) {
        const pool = $$(st, '.nr-pool .cell'), sl = $$(st, '.nr-s'), ns = [1, 2, 3, 4].map(i => $(st, '.n' + i));
        H.rise(pool, 0, 60); await c.wait(500);
        c.cap('رمز من ٣ خانات من ٥ أرقام، بدون تكرار'); await c.wait(900);
        const take = [2, 4, 1];
        for (let k = 0; k < 3; k++) {
          const left = pool.filter(p => !p.classList.contains('gone'));
          left.forEach((p, i) => C.later(i * 70, () => { p.classList.add('on'); c.s('tap', up(i + k), .26); }));
          await c.wait(left.length * 70 + 260);
          const b = sl[k].querySelector('b'); H.set(b, left.length); H.set(ns[k], left.length); c.s('t' + (k + 1), 1, .42);
          c.val(k + 1, A(left.length), b); await c.wait(420);
          const p = pool[take[k]], dst = sl[k].querySelector('i');
          dst.textContent = p.textContent; C.flyFrom(dst, p, 420, 24); p.classList.add('gone'); left.forEach(q => q.classList.remove('on'));
          c.s('drop', up(k * 2), .35); if (k < 2) c.cap(`خانة ${k ? 'ثالثة' : 'ثانية'}: باقي ${A(left.length - 1)} ← واحد أقل`); await c.wait(700);
        }
        c.cap('٥ × ٤ × ٣ = ٦٠ — ومع التكرار ٥ × ٥ × ٥'); H.set(ns[3], '٦٠'); c.s('hint', 1, .45);
        await c.wait(400); c.val(0, '٦٠', ns[3]); await c.wait(300);
      },
    },
    median: {
      html: () => `<div class="dg"><div class="cells md">${[9, 2, 7, 4, 5].map(v => `<span class="cell" data-v="${v}">${A(v)}</span>`).join('')}</div>
        <div class="md-x">النص؟</div>${H.lab([['الترتيب', '؟'], ['الوسيط', '؟']])}</div>`,
      async run(st, c) {
        const row = $(st, '.md'), cs = $$(st, '.md .cell'), x = $(st, '.md-x'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        show(x, false); H.rise(cs, 0, 70); await c.wait(600);
        c.cap('٩ ، ٢ ، ٧ ، ٤ ، ٥ — وش الوسيط؟'); await c.wait(800);
        cs[2].classList.add('bad'); pop(x); anim(cs[2], SHAKE, { duration: 380 }); c.s('wrong', 1, .3);
        c.cap('اللي في النص الحين ٧، بس ما رتّبناها'); await c.wait(1200);
        cs[2].classList.remove('bad'); show(x, false);
        const sorted = cs.slice().sort((a, b) => +a.dataset.v - +b.dataset.v);
        H.flip(row, sorted); c.s('drop', 1, .4); c.cap('رتّبها أول: ٢ ، ٤ ، ٥ ، ٧ ، ٩'); await c.wait(700);
        H.set(n1, '٢،٤،٥،٧،٩'); c.val(2, '٢،٤،٥،٧،٩', n1); await c.wait(700);
        const mid = sorted[2]; [0, 1, 3, 4].forEach(i => sorted[i].classList.add('dim'));
        mid.classList.add('ok'); pulse(mid); c.s('t3', 1, .42); c.val(1, '٥', mid); await c.wait(600);
        c.cap('اللي في النص بعد الترتيب = ٥'); H.set(n2, '٥'); c.s('hint', 1, .45); await c.wait(380); c.val(0, '٥', n2); await c.wait(300);
      },
    },
    total: {
      html: () => `<div class="dg"><div class="tt"><div class="tt-c">${[0, 1, 2, 3].map(i => `<div class="tt-b"><span>١٠</span><i></i></div>`).join('')}<span class="tt-m"></span></div>
          <div class="tt-r">${[0, 1, 2, 3].map(i => `<i data-i="${i}">١٠</i>`).join('')}</div></div>
        ${H.lab([['الوسط'], ['العدد'], ['المجموع', '٠']])}</div>`,
      async run(st, c) {
        const bs = $$(st, '.tt-b'), m = $(st, '.tt-m'), seg = $$(st, '.tt-r i'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        seg.forEach(s => show(s, false)); show(m, false);
        bs.forEach((b, i) => { b.style.transformOrigin = 'bottom'; anim(b, [{ transform: 'scaleY(.2)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, delay: i * 90, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' }); });
        await c.wait(700);
        c.cap('وسط ٤ أعداد = ١٠ ← كأن كل واحد ١٠'); show(m); anim(m, [{ clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 420 });
        H.set(n1, '١٠'); c.s('t1', 1, .42); c.val(1, '١٠', n1); await c.wait(800);
        bs.forEach((b, i) => pulse(b, i * 70)); H.set(n2, '٤'); c.s('t2', 1, .42); c.val(2, '٤', n2); await c.wait(700);
        c.cap('حطّها جنب بعض');
        for (let i = 0; i < 4; i++) {
          anim(bs[i], [{ opacity: 1 }, { opacity: .25 }], { duration: 300, fill: 'forwards' });
          show(seg[i]); seg[i].style.transformOrigin = 'right'; anim(seg[i], [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 320, easing: 'ease-out' });
          H.set(n3, (i + 1) * 10); c.s('drop', up(i * 2), .35); await c.wait(320);
        }
        c.cap('١٠ × ٤ = ٤٠'); c.s('hint', 1, .45); await c.wait(380); c.val(0, '٤٠', n3); await c.wait(300);
      },
    },
    permcomb: {
      html: () => `<div class="dg"><div class="pc3">${[['أ', 'ب'], ['أ', 'ج'], ['ب', 'ج']].map(([a, b]) => `<div class="pc-col"><span class="pc-t">${a} ${b}</span><span class="pc-o">${a}${b}</span><span class="pc-o">${b}${a}</span></div>`).join('')}</div>
        ${H.lab([['لجان من ٢'], ['ترتيب كل لجنة'], ['رئيس ونائب', '٠']])}</div>`,
      async run(st, c) {
        const t = $$(st, '.pc-t'), o = $$(st, '.pc-o'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        o.forEach(e => show(e, false));
        c.cap('٣ أشخاص: أ ، ب ، ج — لجنة من ٢');
        for (let i = 0; i < 3; i++) { pop(t[i], 300); H.set(n1, i + 1); c.s('t' + (i + 1), 1, .42); await c.wait(380); }
        c.cap('اللجنة «أ ب» نفسها «ب أ» ← ترتيبها ما يفرق ← توافيق'); c.val(1, '٣', n1); await c.wait(1300);
        c.cap('رئيس ونائب: «أب» غير «بأ» ← تباديل');
        for (let i = 0; i < 3; i++) {
          [o[i * 2], o[i * 2 + 1]].forEach((e, j) => { show(e); anim(e, [{ opacity: 0, transform: `translateY(-22px) translateX(${j ? -14 : 14}px)` }, { opacity: 1, transform: 'none' }], { duration: 340, delay: j * 90, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' }); });
          H.set(n3, (i + 1) * 2); c.s('tap', up(i * 2), .32); await c.wait(420);
        }
        H.set(n2, '٢'); c.val(2, '٢', n2); await c.wait(600);
        c.cap('٣ لجان × ٢ ترتيب = ٦'); pulse(n3); c.s('hint', 1, .45); await c.wait(380); c.val(0, '٦', n3); await c.wait(300);
      },
    },
    places: {
      html: () => `<div class="dg"><div class="pl"><div class="pl-run">${[1, 2, 3, 4, 5, 6].map(n => `<span class="pl-p">${A(n)}</span>`).join('')}</div>
          <div class="pl-pod">${[[2, 'b'], [1, 'a'], [3, 'c']].map(([k, cl]) => `<div class="pl-st ${cl}" data-k="${k}"><i></i><span>${A(k)}</span><b></b></div>`).join('')}</div></div>
        ${H.lab([['الأماكن'], ['التباديل', '؟']])}</div>`,
      async run(st, c) {
        const ps = $$(st, '.pl-p'), stp = k => $(st, `.pl-st[data-k="${k}"]`), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        H.rise(ps, 0, 50); await c.wait(500);
        [1, 2, 3].forEach((k, i) => C.later(i * 160, () => { const e = stp(k); e.style.transformOrigin = 'bottom'; anim(e, [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.3,1.3,.5,1)' }); c.s('tap', up(i), .3); H.set(n1, i + 1); }));
        c.cap('٦ متسابقين و٣ ميداليات'); await c.wait(900);
        c.val(2, '٣', n1); await c.wait(500);
        const pick3 = [3, 0, 5];
        for (let k = 1; k <= 3; k++) {
          const left = ps.filter(p => !p.classList.contains('gone')), e = stp(k), b = e.querySelector('b');
          left.forEach((p, i) => C.later(i * 50, () => p.classList.add('on'))); await c.wait(left.length * 50 + 160);
          b.textContent = A(left.length); pop(b); c.s('t' + k, 1, .42); await c.wait(380);
          const p = ps[pick3[k - 1]], dst = e.querySelector('i'); dst.textContent = p.textContent; C.flyFrom(dst, p, 420, 30); p.classList.add('gone');
          left.forEach(q => q.classList.remove('on')); c.s('drop', up(k * 2), .35); await c.wait(560);
        }
        c.cap('٣ أماكن ← ٣ أرقام نازلة من ٦: ٦ × ٥ × ٤'); c.val(1, '٦ × ٥ × ٤', stp(1)); await c.wait(900);
        c.cap('٦ × ٥ × ٤ = ١٢٠'); H.set(n2, '١٢٠'); c.s('hint', 1, .45); await c.wait(380); c.val(0, '١٢٠', n2); await c.wait(300);
      },
    },
    choose: {
      html: () => `<div class="dg"><div class="ch3"><div class="ch-top">٦ × ٥ × ٤ = <b>١٢٠</b> <small>ترتيب</small></div>
          <div class="ch-ords">${['أبج', 'أجب', 'بأج', 'بجأ', 'جأب', 'جبأ'].map(w => `<span>${w}</span>`).join('')}</div>
          <div class="ch-one"><span>أ ب ج</span><small>لجنة وحدة</small></div></div>
        ${H.lab([['فوق'], ['تحت'], ['التوافيق', '؟']])}</div>`,
      async run(st, c) {
        const top = $(st, '.ch-top'), ords = $$(st, '.ch-ords span'), one = $(st, '.ch-one'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        [...ords, one].forEach(e => show(e, false));
        c.cap('تختار ٣ من ٦ للجنة'); anim(top, RISE, { duration: 300 }); await c.wait(600);
        c.cap('لو الترتيب يفرق: ٣ أرقام نازلة من ٦'); pulse(top); H.set(n1, '١٢٠'); c.s('t1', 1, .42); c.val(1, '٦ × ٥ × ٤', top); await c.wait(1000);
        c.cap('بس اللجنة «أ ب ج» انحسبت بكل ترتيباتها');
        for (let i = 0; i < 6; i++) { show(ords[i]); anim(ords[i], POP, { duration: 240 }); c.s('tap', up(i), .28); await c.wait(150); }
        c.cap('١ × ٢ × ٣ = ٦ ترتيبات للجنة وحدة'); H.set(n2, '٦'); c.s('t2', 1, .42); c.val(2, '١ × ٢ × ٣', n2); await c.wait(900);
        const k = C.scaleOf(one);
        show(one); const o = one.getBoundingClientRect();
        ords.forEach((e, i) => { const r = e.getBoundingClientRect(); anim(e, [{ transform: 'none', opacity: 1 }, { transform: `translate(${(o.left + o.width / 2 - r.left - r.width / 2) / k}px, ${(o.top - r.top) / k}px) scale(.6)`, opacity: 0 }], { duration: 420, delay: i * 40, easing: 'ease-in', fill: 'forwards' }); });
        anim(one, POP, { duration: 360, delay: 380, fill: 'backwards' }); c.s('drop', 1, .4); await c.wait(900);
        c.cap('١٢٠ ÷ ٦ = ٢٠ لجنة'); H.set(n3, '٢٠'); c.s('hint', 1, .45); await c.wait(380); c.val(0, '٢٠', n3); await c.wait(300);
      },
    },
  };

  const C4 = (n, k) => { let a = 1, b = 1; for (let i = 0; i < k; i++) { a *= n - i; b *= i + 1; } return a / b; };
  const P4 = (n, k) => { let a = 1; for (let i = 0; i < k; i++) a *= n - i; return a; };
  const g = {
    outcomes(i) {
      const [cn, dn] = pick([[2, 0], [3, 0], [0, 2], [1, 1], [2, 1], [1, 2]]), r = Math.pow(2, cn) * Math.pow(6, dn);
      const say = [cn ? (cn === 1 ? 'عملة' : cn === 2 ? 'عملتان' : '٣ عملات') : '', dn ? (dn === 1 ? 'حجر نرد' : 'حجرا نرد') : ''].filter(Boolean).join(' و');
      return { q: `رُمي ${say} معاً. كم عدد النواتج الممكنة؟`, ans: A(r), ch: four(A(r), [A(2 * cn + 6 * dn), A(r / 2), A(r * 2)]),
        sol: `${[...Array(cn).fill('٢'), ...Array(dn).fill('٦')].join(' × ')} = ${A(r)}` };
    },
    order(i) {
      const s = pick([3, 4, 5, 6, 8, 9, 10]), w = 6 - Math.abs(s - 7), un = Math.ceil(w / 2), ans = fr(w, 36);
      return { q: `رُمي حجرا نرد. ما احتمال أن يكون مجموع العددين ${A(s)}؟`, ans, ch: four(ans, [fr(un, 36), fr(w, 12), fr(1, s), fr(w + 1, 36)]),
        sol: `الأزواج المرتّبة ${A(w)} من ٣٦ ← ${A(w)}/٣٦${gcd(w, 36) > 1 ? ' = ' + ans : ''}` };
    },
    norep(i) {
      const n = rnd(5, 9), k = pick([2, 3, 3]), r = P4(n, k);
      return { q: `كم رمزاً من ${A(k)} خانات يمكن تكوينه من ${A(n)} أرقام مختلفة، بدون تكرار؟`.replace('٢ خانات', 'خانتين'), ans: A(r), ch: four(A(r), [A(Math.pow(n, k)), A(n * k), A(C4(n, k))]),
        sol: `${Array.from({ length: k }, (_, j) => A(n - j)).join(' × ')} = ${A(r)}` };
    },
    median(i) {
      const k = pick([5, 7]); let v;
      do { v = shuffle(Array.from({ length: 30 }, (_, j) => j + 2)).slice(0, k); } while (v[(k - 1) / 2] === v.slice().sort((a, b) => a - b)[(k - 1) / 2]);
      const s = v.slice().sort((a, b) => a - b), med = s[(k - 1) / 2], mean = Math.round(v.reduce((a, b) => a + b, 0) / k);
      return { q: `ما وسيط الأعداد: ${v.map(A).join(' ، ')}؟`, ans: A(med), ch: four(A(med), [A(v[(k - 1) / 2]), mean !== med ? A(mean) : null, A(s[(k - 1) / 2 + 1])]),
        sol: `بعد الترتيب: ${s.map(A).join(' ، ')} ← اللي في النص ${A(med)}` };
    },
    total(i) {
      if (i % 2) {
        const k = rnd(4, 7), m = rnd(8, 15), d = rnd(1, 3), x = (k + 1) * (m + d) - k * m;
        return { q: `وسط ${A(k)} أعداد يساوي ${A(m)}، أُضيف إليها عدد فصار الوسط ${A(m + d)}. ما العدد المضاف؟`, ans: A(x), ch: four(A(x), [A(m + d), A(d * k), A(x - m)]),
          sol: `المجموع قبل ${A(k)} × ${A(m)} = ${A(k * m)} ، وبعد ${A(k + 1)} × ${A(m + d)} = ${A((k + 1) * (m + d))} ← الفرق ${A(x)}` };
      }
      const k = rnd(4, 9), m = rnd(7, 16), r = k * m;
      return { q: `الوسط الحسابي لـ ${A(k)} أعداد يساوي ${A(m)}. ما مجموعها؟`, ans: A(r), ch: four(A(r), [A(k + m), A(r - m), A(k * (m + 1))]), sol: `${A(m)} × ${A(k)} = ${A(r)}` };
    },
    permcomb(i) {
      const P = ['ترتيب ٤ كتب على رف', 'اختيار رئيس ونائب من ٦ طلاب', 'تكوين رمز من ٣ أرقام مختلفة', 'توزيع ٣ ميداليات على ٨ متسابقين', 'ترتيب ٥ طلاب في طابور'];
      const Cm = ['اختيار لجنة من ٣ أشخاص من ٧', 'اختيار فريق من ٤ لاعبين من ١٠', 'اختيار ٣ أسئلة من ٨ للإجابة عنها', 'عدد المصافحات بين ٦ أشخاص', 'اختيار ٢ من ٥ أصدقاء لرحلة'];
      const perm = i % 2 === 0, right = pick(perm ? P : Cm), others = shuffle(perm ? Cm : P).slice(0, 3);
      return { q: `أي مما يلي يُحسب ${perm ? 'بالتباديل (الترتيب يفرق)' : 'بالتوافيق (الترتيب ما يفرق)'}؟`, ans: right, ch: shuffle([right, ...others]),
        sol: `${right}: لو بدّلت مكانين ${perm ? 'يصير شي جديد ← تباديل' : 'ما يتغيّر شي ← توافيق'}` };
    },
    places(i) {
      const n = rnd(5, 9), k = pick([2, 3]), r = P4(n, k);
      const q = i % 2 ? `بكم طريقة يمكن أن يجلس ${A(k)} من ${A(n)} أشخاص على ${A(k)} كراسي مرقّمة؟` : `سباق فيه ${A(n)} متسابقين، بكم طريقة تُوزّع ${k === 2 ? 'الميداليتان الذهبية والفضية' : 'الميداليات الذهبية والفضية والبرونزية'}؟`;
      return { q: q.replace('٢ كراسي', 'كرسيين').replace('٢ من', 'اثنان من'), ans: A(r), ch: four(A(r), [A(P4(n, k + 1)), A(C4(n, k)), A(Math.pow(n, k))]),
        sol: `${A(k)} أماكن ← ${Array.from({ length: k }, (_, j) => A(n - j)).join(' × ')} = ${A(r)}` };
    },
    choose(i) {
      const n = rnd(5, 9), k = pick([2, 3]), r = C4(n, k);
      return { q: `بكم طريقة يمكن اختيار لجنة من ${A(k)} أشخاص من بين ${A(n)} أشخاص؟`.replace('٢ أشخاص', 'شخصين'), ans: A(r), ch: four(A(r), [A(P4(n, k)), A(n * k), A(C4(n, k - 1) || n)]),
        sol: `(${Array.from({ length: k }, (_, j) => A(n - j)).join(' × ')}) ÷ (${Array.from({ length: k }, (_, j) => A(j + 1)).join(' × ')}) = ${A(P4(n, k))} ÷ ${A(P4(k, k))} = ${A(r)}` };
    },
  };

  const sign = {
    outcomes: [S, '<circle class="s" cx="13" cy="20" r="8"/><rect class="s" x="22" y="12" width="15" height="15" rx="4"/><circle class="f" cx="29.5" cy="19.5" r="2"/>'],
    order: [S, '<rect class="s" x="5" y="9" width="13" height="13" rx="3"/><rect class="s" x="22" y="18" width="13" height="13" rx="3"/><path class="s" d="M14 30q6 6 12 0M26 10q-6-6-12 0"/>'],
    norep: [S, '<rect class="s" x="4" y="13" width="9" height="14" rx="2"/><rect class="s" x="15.5" y="13" width="9" height="14" rx="2"/><rect class="s" x="27" y="13" width="9" height="14" rx="2"/>'],
    median: [S, '<path class="s" d="M8 30v-6M14 30v-10M26 30v-14M32 30v-18"/><path class="s" d="M20 32V8" stroke-dasharray="1 0"/><circle class="f" cx="20" cy="8" r="3"/>'],
    total: [S, '<path class="s" d="M6 26h28M6 18h28"/><path class="s" d="M12 32v-6M20 32v-6M28 32v-6"/>'],
    permcomb: [S, '<circle class="s" cx="12" cy="14" r="5"/><circle class="s" cx="28" cy="14" r="5"/><path class="s" d="M8 30q12 8 24 0M28 26l4 4-4 3"/>'],
    places: [S, '<path class="s" d="M14 32V16h12v16M4 32V22h10M26 32V25h10"/><path class="s" d="M20 8v4"/>'],
    choose: [S, '<path class="s" d="M10 12h20M10 28h20M8 20h24"/>'],
  };
  const where = {
    outcomes: ['skills.probstats', 'dice', /^\*عملتان\*/], order: ['skills.probstats', 'dice', /^\*\(١،٣\)\*/], norep: ['skills.probstats', 'counting', /^\*بدون تكرار\*/],
    median: ['skills.probstats', 'stats', /^\*الوسيط\*/], total: ['skills.probstats', 'mean', /^\*المجموع\* = \*الوسط\*/], permcomb: ['skills.probstats', 'choose', /^اسأل: لو/],
    places: ['skills.probstats', 'choose', /^\*كم مكان\*/], choose: ['skills.probstats', 'choose', /^تختار \*٣\*/],
  };
  const nums = {
    outcomes: { ex: 'رمينا حجري نرد معاً. كم ناتجاً ممكناً؟', v: ['٣٦', '٦', '٦'], more: ['١٢', '٢', '٨'], hint: { 1: 'النرد الأول كم وجه؟', 2: 'النرد الثاني كم وجه؟' } },
    order: { ex: 'رمينا حجري نرد. ما احتمال أن يكون مجموعهما ٥؟', v: ['١/٩', '٤'], more: ['٢', '١/١٨', '٥'], hint: { 1: '(١،٤) وعكسها، و(٢،٣) وعكسها: كم زوج؟' } },
    norep: { ex: 'رمز من ٣ خانات من الأرقام ١ إلى ٦، بدون تكرار. كم رمزاً؟', v: ['١٢٠', '٦', '٥', '٤'], more: ['٢١٦', '٣', '١٨'], hint: { 1: 'كم رقم عندك للخانة الأولى؟', 2: 'الخانة الثانية: واحد أقل', 3: 'الخانة الثالثة: واحد أقل بعد' } },
    median: { ex: 'ما وسيط: ٨ ، ٣ ، ١١ ، ٦ ، ٤؟', v: ['٦', '٦', '٣،٤،٦،٨،١١'], more: ['١١', '٨،٣،١١،٦،٤', '٤'], line: 'بعد الترتيب: ٣ ، ٤ ، ٦ ، ٨ ، ١١ ← اللي في النص ٦', hint: { 1: 'بعد الترتيب، اللي في النص كم؟', 2: 'رتّبها من الأصغر للأكبر' } },
    total: { ex: 'وسط ٥ أعداد = ٨. كم مجموعها؟', v: ['٤٠', '٨', '٥'], more: ['١٣', '٣٢', '٣'], hint: { 1: 'الوسط في المثال كم؟', 2: 'كم عدد في المثال؟' } },
    permcomb: { ex: 'من ٤ أشخاص فيه ٦ لجان من ٢. فبكم طريقة نختار رئيساً ونائباً؟', v: ['١٢', '٦', '٢'], more: ['٨', '٤', '٢٤'], hint: { 1: 'كم لجنة من ٢ في المثال؟', 2: 'لجنة من ٢: بكم ترتيب؟' } },
    places: { ex: '٥ متسابقين على ميداليتين (ذهبية وفضية). بكم طريقة؟', v: ['٢٠', '٥ × ٤', '٢'], more: ['٢٥', '١٠', '٥ × ٤ × ٣'], line: 'مكانان ← رقمين نازلين: ٥ × ٤ = ٢٠', hint: { 1: 'ابدأ من ٥ ونزّل: كم رقم تاخذ؟', 2: 'كم ميدالية؟' } },
    choose: { ex: 'اختيار ٣ من ٥ للجنة. كم طريقة؟', v: ['١٠', '٥ × ٤ × ٣', '١ × ٢ × ٣'], more: ['٦٠', '٥ × ٤', '١ × ٢'], hint: { 1: '٣ أرقام نازلة تبدأ من ٥', 2: '٣ أرقام صاعدة تبدأ من ١' } },
  };

  const css = `
.law .oc-g { display: grid; grid-template-columns: 30px repeat(6, 36px); gap: 4px; align-items: center; justify-items: center; direction: rtl; }
.law .oc-h.c { width: 26px; height: 26px; border-radius: 50%; background: var(--gold); color: var(--brown-dk, #8A5A00); font-size: 13px; font-weight: 800; display: grid; place-items: center; border: 2px solid var(--gold-dk); }
.law .die { width: 26px; height: 26px; } .law .die rect { fill: #fff; stroke: var(--ink2); stroke-width: 2; } .law .die circle { fill: var(--ink2); }
.law .oc-x { width: 36px; height: 28px; border-radius: 8px; background: var(--blue-light); color: var(--blue-dk); font-size: 13px; font-weight: 800; display: grid; place-items: center; border: 2px solid var(--blue-border, #84D8FF); }
.law .od { display: flex; align-items: center; gap: 12px; }
.law .gh { font-size: 12px; font-weight: 800; fill: var(--gray); }
.law .gc { fill: #fff; stroke: var(--line); stroke-width: 2; transition: fill .2s, stroke .2s; transform-box: fill-box; transform-origin: center; }
.law .gc.on { fill: var(--blue); stroke: var(--blue-dk); }
.law .od-l { display: flex; flex-direction: column; gap: 8px; }
.law .od-l .p { font-size: 17px; font-weight: 800; color: var(--blue-dk); background: var(--blue-light); border-radius: 9px; padding: 1px 9px; white-space: nowrap; transition: background .2s, color .2s; }
.law .od-l .p.tw { background: var(--purple); color: #fff; }
.law .nr { display: flex; flex-direction: column; align-items: center; gap: 18px; }
.law .nr-pool { display: flex; gap: 8px; }
.law .nr-pool .cell.gone { opacity: .18; }
.law .nr-slots { display: flex; gap: 14px; }
.law .nr-s { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.law .nr-s i { width: 46px; height: 50px; border-radius: 11px; border: 2.5px dashed var(--gray-icon); display: grid; place-items: center; font-style: normal; font-size: 22px; font-weight: 800; color: var(--ink2); background: #fff; }
.law .nr-s b { font-size: 15px; font-weight: 800; color: var(--blue-dk); background: var(--blue-light); border-radius: 8px; padding: 0 8px; }
.law .cells.md { gap: 8px; } .law .cells.md .cell { width: 40px; height: 44px; font-size: 20px; }
.law .cell.bad { border-color: var(--red, #FF4B4B); background: var(--red-soft, #FFDFE0); color: var(--red, #FF4B4B); }
.law .cell.ok { background: var(--green); border-color: var(--green-dk); color: #fff; }
.law .md-x { margin-top: -6px; font-size: 13px; font-weight: 800; color: var(--red, #FF4B4B); }
.law .tt { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.law .tt-c { position: relative; display: flex; gap: 14px; align-items: flex-end; height: 74px; }
.law .tt-b { width: 40px; height: 64px; border-radius: 8px 8px 4px 4px; background: var(--blue); position: relative; display: flex; justify-content: center; }
.law .tt-b span { position: absolute; top: -20px; font-size: 13px; font-weight: 800; color: var(--blue-dk); }
.law .tt-m { position: absolute; left: -10px; right: -10px; top: 8px; height: 3px; border-radius: 2px; background: var(--green); }
.law .tt-r { display: flex; direction: rtl; height: 24px; }
.law .tt-r i { width: 58px; height: 24px; border-radius: 6px; margin-inline-start: 2px; background: var(--blue); color: #fff; font-style: normal; font-size: 13px; font-weight: 800; display: grid; place-items: center; }
.law .pc3 { display: flex; gap: 16px; }
.law .pc-col { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.law .pc-t { font-size: 18px; font-weight: 800; color: var(--blue-dk); background: var(--blue-light); border: 2px solid var(--blue-border, #84D8FF); border-radius: 12px; padding: 2px 12px; white-space: nowrap; }
.law .pc-o { font-size: 16px; font-weight: 800; color: #fff; background: var(--purple); border-radius: 10px; padding: 1px 10px; }
.law .pl { display: flex; flex-direction: column; align-items: center; gap: 12px; }
.law .pl-run { display: flex; gap: 6px; }
.law .pl-p { width: 30px; height: 30px; border-radius: 50%; border: 2.5px solid var(--ink2); background: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 800; color: var(--ink2); transition: all .2s; }
.law .pl-p.on { background: var(--blue); border-color: var(--blue-dk); color: #fff; }
.law .pl-p.gone { opacity: .18; }
.law .pl-pod { display: flex; align-items: flex-end; gap: 4px; }
.law .pl-st { width: 64px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 2px; border-radius: 10px 10px 0 0; position: relative; padding-top: 4px; }
.law .pl-st.a { height: 70px; background: var(--gold); } .law .pl-st.b { height: 54px; background: #D7D7D7; } .law .pl-st.c { height: 42px; background: #F0B27A; }
.law .pl-st i { position: absolute; top: -34px; width: 30px; height: 30px; border-radius: 50%; background: var(--blue); color: #fff; font-style: normal; font-size: 14px; font-weight: 800; display: grid; place-items: center; }
.law .pl-st i:empty { display: none; }
.law .pl-st span { font-size: 16px; font-weight: 800; color: #fff; }
.law .pl-st b { font-size: 13px; font-weight: 800; color: var(--blue-dk); background: #fff; border-radius: 7px; padding: 0 6px; }
.law .pl-st b:empty { display: none; }
.law .ch3 { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.law .ch-top { font-size: 20px; font-weight: 800; color: var(--ink2); } .law .ch-top b { color: var(--blue-dk); } .law .ch-top small { font-size: 13px; color: var(--gray); }
.law .ch-ords { display: flex; gap: 5px; }
.law .ch-ords span { font-size: 15px; font-weight: 800; color: #fff; background: var(--purple); border-radius: 8px; padding: 1px 7px; }
.law .ch-one { display: flex; flex-direction: column; align-items: center; }
.law .ch-one span { font-size: 18px; font-weight: 800; color: var(--green-dk); background: var(--green-bg); border: 2px solid var(--green); border-radius: 12px; padding: 1px 14px; }
.law .ch-one small { font-size: 12px; font-weight: 800; color: var(--gray); }
`;
  M.add({ rules, dia, g, sign, where, nums, css });
})();
