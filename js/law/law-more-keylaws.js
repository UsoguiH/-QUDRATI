/* Node 2, «قوانين هامة في القدرات» (skills.keylaws): every rule card of its short lessons that law-core does not carry. */
(function () {
  'use strict';
  const C = window.LAWCORE, M = window.LAWMORE; if (!C || !M) return;
  const H = M.h, { A, fx, anim, RISE, POP, pulse, pop, show, up, rnd, pick, shuffle, four, SHAKE } = C;
  const $ = (st, s) => st.querySelector(s), $$ = (st, s) => [...st.querySelectorAll(s)];
  const S = 'green';
  /* a count with its noun as Arabic counts it: ٣–١٠ the plural, ١١–٩٩ the singular with its tanween, a round hundred the bare singular */
  const nn = (n, pl, acc, gen) => { const m = n % 100; return `${A(n)} ${m >= 3 && m <= 10 ? pl : m >= 11 ? acc : gen || acc}`; };
  /* a node on a number line: a circle with its number */
  const node = (x, y, v, cls = '', r = 14) => `<g class="nl ${cls}" data-v="${v}"><circle cx="${x}" cy="${y}" r="${r}"/><text x="${x}" y="${y + 1}" text-anchor="middle" dominant-baseline="central">${A(v)}</text></g>`;
  const arc = (x1, x2, y, h = 16) => `<path class="jp" d="M${x1} ${y} Q${(x1 + x2) / 2} ${y - h} ${x2} ${y}" fill="none" stroke="#1CB0F6" stroke-width="2.5" stroke-linecap="round" style="opacity:0"/>`;

  const rules = [
    { key: 'fromto', name: 'من… إلى، وبين', tok: [{ t: 'من… إلى' }, '=', { t: 'الفرق' }, '+', '١،', 'بين', '=', { t: 'الفرق' }, '−', '١'],
      say: '*من… إلى*: الفرق + ١. و«بين»: الفرق − ١.', cue: 'تجيك لما تقرا «كم عدداً من … إلى …» أو «كم عدداً بين … و…».',
      trap: '«بين» ما تحسب الطرفين، و«من… إلى» تحسبهم.' },
    { key: 'evcount', name: 'عدّ الزوجية والفردية', tok: [{ t: 'العدد' }, '=', { t: 'آخر عدد' }, '−', { t: 'أول عدد' }, '÷', '٢', '+', '١'], tail: 7,
      say: '*العدد*: الفرق بين آخر وأول، على ٢، وزد ١.', cue: 'تجيك لما تقرا «كم عدداً زوجياً (أو فردياً) من … إلى …».',
      trap: 'لا تنسى + ١: القفزات أقل من الأعداد بواحد.', notDecoy: ['آخر زوجي', 'أول زوجي', 'آخر عدد', 'آخر فردي', 'أول فردي'] },
    { key: 'evedge', name: 'الأطراف الفردية', tok: [{ t: 'العدد' }, '=', { t: 'آخر زوجي' }, '−', { t: 'أول زوجي' }, '÷', '٢', '+', '١'], tail: 7,
      say: 'الطرف فردي؟ *ما يدخل*. ابدأ من أول زوجي وانتهِ بآخر زوجي.', cue: 'تجيك لما تقرا «كم عدداً زوجياً بين ٥ و٣١» والطرفين فرديين.',
      trap: 'لا تبدأ من الطرف الفردي: أول زوجي بعد ٥ هو ٦.', notDecoy: ['آخر', 'أول', 'آخر عدد', 'أول عدد'] },
    { key: 'gifts', name: 'الهدايا', tok: [{ t: 'الهدايا' }, '=', { t: 'العدد' }, '×', { t: '(العدد − ١)' }], wswap: [1, 2],
      say: '*الهدايا*: كل واحد يهدي الباقين، وكل هدية لها اتجاه.', cue: 'تجيك لما يعطي كل واحد كل واحد شي: هدايا، رسائل، بطاقات.',
      trap: 'ما تقسم على ٢: هدية أحمد لسعد غير هدية سعد لأحمد.', notDecoy: ['الكل', 'الخطوط', '(الخطوط − ١)'] },
    { key: 'league', name: 'مباريات الدوري', tok: [{ t: 'المباريات' }, '=', { t: 'العدد' }, '×', { t: '(العدد − ١)' }, '×', { t: 'مرات اللقاء' }, '÷', '٢'], wswap: [1, 2],
      say: '*المباريات*: مصافحات بين الفرق، في مرات اللقاء.', cue: 'تجيك لما تقرا «دوري، كل فريقين يلتقون…» أو «ذهاباً وإياباً».',
      trap: 'ذهاب وإياب يعني مرتين: اضرب في ٢.', notDecoy: ['الكل', 'الخطوط', '(الخطوط − ١)'] },
    { key: 'tris', name: 'المثلثات من رأس واحد', tok: [{ t: 'المثلثات' }, '=', { t: 'الخطوط' }, '×', { t: '(الخطوط − ١)' }, '÷', '٢'], wswap: [1, 2],
      say: 'كل *خطين* يطلعون من الرأس يسوّون مثلث مع القاعدة.', cue: 'تجيك في شكل فيه خطوط تطلع من رأس واحد وتقطع قاعدة واحدة.',
      trap: 'عدّ الضلعين مع الخطوط اللي داخل.', notDecoy: ['العدد', '(العدد − ١)'] },
    { key: 'marks', name: 'العلامات على الطريق', tok: [{ t: 'العلامات' }, '=', { t: 'الطول' }, '÷', { t: 'المسافة' }, '+', '١'], tail: 5,
      say: 'كم *مسافة* في الطريق؟ وزد علامة البداية.', cue: 'تجيك لما تقرا «علامة (أو شجرة) كل … متر» ومعها البداية.',
      trap: 'لا تنسى + ١: علامة البداية.' },
    { key: 'cuts', name: 'مرات القصّ', tok: [{ t: 'مرات القصّ' }, '=', { t: 'عدد القطع' }, '−', '١'],
      say: 'كل *قصّة* تزيد قطعة، والقطعة الأولى ما تحتاج قص.', cue: 'تجيك لما تقرا «قطّع حبلاً (أو خشبة) إلى … قطع».',
      trap: 'القصّات أقل من القطع بواحد.' },
    { key: 'clockm', name: 'الساعة مع الدقائق', tok: [{ t: 'الزاوية' }, '=', '|', { t: 'الساعة' }, '×', '٣٠', '−', { t: 'الدقائق' }, '×', '٥٫٥', '|'],
      say: 'مع الدقائق: الساعة × ٣٠، ناقص الدقائق × *٥٫٥*.', cue: 'تجيك لما يكون في الوقت دقائق: «٣:٢٠». و٥٫٥ هي ١١ ÷ ٢.',
      trap: 'إذا طلعت فوق ١٨٠° اطرحها من ٣٦٠°.' },
    { key: 'equal', name: 'متى يتساويان؟', tok: [{ t: 'زمن التساوي' }, '=', { t: 'فرق المبالغ' }, '÷', { t: 'فرق الزيادات' }],
      say: 'الفرق بينهم يقصر كل يوم بـ*فرق الزيادات*، فاقسم.', cue: 'تجيك لما تقرا «بعد كم يوم يتساويان» أو «متى يلحقه».',
      trap: 'اطرح المبالغ واطرح الزيادات، لا تجمعها.' },
    { key: 'work', name: 'العمل معاً', tok: [{ t: 'زمنهم معاً' }, '=', { t: 'ضرب الزمنين' }, '÷', { t: 'جمع الزمنين' }],
      say: 'اثنين يشتغلون مع بعض؟ *ضرب الزمنين* على جمعهم.', cue: 'تجيك لما تقرا «حنفيتان تملآن…» أو «يعملان معاً».',
      trap: 'زمنهم معاً أقل من زمن الأسرع، مو متوسطهم.' },
  ];

  const dia = {
    fromto: {
      html: () => { const X = v => 274 - (v - 2) * 42; let d = ''; for (let v = 2; v <= 8; v++) d += node(X(v), 74, v, v === 3 || v === 7 ? 'end' : '');
        for (let v = 3; v < 7; v++) d += arc(X(v), X(v + 1), 56, 22);
        return `<div class="dg"><svg class="d nlv" width="300" height="100" viewBox="0 0 300 100">${d}</svg>${H.lab([['الفرق'], ['بين'], ['من… إلى', '؟']])}</div>`; },
      async run(st, c) {
        const ns = $$(st, '.nl'), jp = $$(st, '.jp'), at = v => ns.find(n => +n.dataset.v === v), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        H.rise(ns, 0, 50); await c.wait(560);
        c.cap('كم عدداً من ٣ إلى ٧؟'); [3, 7].forEach(v => { at(v).classList.add('pin'); pulse(at(v)); }); c.s('on', 1, .35); await c.wait(700);
        for (let i = 0; i < 4; i++) { H.draw(jp[i], 240); H.set(n1, i + 1); c.s('tap', up(i * 2), .32); await c.wait(260); }
        c.cap('٧ − ٣ = ٤ قفزات'); c.val(1, '٤', n1); await c.wait(380); c.val(2, '٤', n1); await c.wait(560);
        c.cap('من ٣ إلى ٧: الطرفين محسوبين');
        for (let v = 3, k = 0; v <= 7; v++, k++) { at(v).classList.add('on'); pulse(at(v)); H.set(n3, k + 1); c.s('t' + Math.min(k + 1, 5), 1, .4); await c.wait(240); }
        c.cap('٤ + ١ = ٥'); c.s('hint', 1, .45); await c.wait(300); c.val(0, '٥', n3); await c.wait(1100);
        [3, 7].forEach(v => at(v).classList.add('out'));
        c.cap('وبين ٣ و٧: بدون الطرفين ← ٤ − ١ = ٣'); H.set(n2, '٣'); c.s('off', 1, .35); await c.wait(600);
      },
    },
    evcount: {
      html: () => { const X = i => 276 - i * 32; let d = ''; for (let i = 0; i < 9; i++) d += node(X(i), 74, 4 + 2 * i, '', 13);
        for (let i = 0; i < 8; i++) d += arc(X(i), X(i + 1), 58, 18);
        return `<div class="dg"><svg class="d nlv" width="300" height="100" viewBox="0 0 300 100">${d}</svg>${H.lab([['القفزات'], ['العدد', '؟']])}</div>`; },
      async run(st, c) {
        const ns = $$(st, '.nl'), jp = $$(st, '.jp'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        H.rise(ns, 0, 45); await c.wait(600);
        c.cap('٤، ٦، ٨، …، ٢٠ — كم عدداً؟'); await c.wait(500);
        ns[8].classList.add('pin'); pulse(ns[8]); c.s('t1', 1, .42); c.val(1, '٢٠', ns[8]); await c.wait(520);
        ns[0].classList.add('pin'); pulse(ns[0]); c.s('t2', 1, .42); c.val(2, '٤', ns[0]); await c.wait(560);
        c.cap('كل قفزة ٢ ← (٢٠ − ٤) ÷ ٢ = ٨ قفزات');
        for (let i = 0; i < 8; i++) { H.draw(jp[i], 200); H.set(n1, i + 1); c.s('tap', up(i), .28); await c.wait(170); }
        await c.wait(500);
        c.cap('٨ قفزات بين ٩ أعداد ← ٨ + ١ = ٩');
        ns.forEach((n, i) => C.later(i * 60, () => { n.classList.add('on'); })); H.set(n2, '٩'); c.s('hint', 1, .45);
        await c.wait(600); c.val(0, '٩', n2); await c.wait(300);
      },
    },
    evedge: {
      html: () => { const vs = [5, 6, 8, '…', 28, 30, 31], X = i => 276 - i * 42;
        const d = vs.map((v, i) => v === '…' ? `<text class="dots3" x="${X(i)}" y="76" text-anchor="middle" dominant-baseline="central">…</text>` : node(X(i), 74, v, v % 2 ? 'odd' : '')).join('');
        return `<div class="dg"><svg class="d nlv" width="300" height="100" viewBox="0 0 300 100">${d}</svg>${H.lab([['أول زوجي'], ['آخر زوجي'], ['العدد', '؟']])}</div>`; },
      async run(st, c) {
        const ns = $$(st, '.nl'), at = v => ns.find(n => +n.dataset.v === v), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        H.rise([...ns, $(st, '.dots3')], 0, 50); await c.wait(600);
        c.cap('كم عدداً زوجياً بين ٥ و٣١؟'); await c.wait(800);
        at(5).classList.add('no'); anim(at(5), SHAKE, { duration: 380 }); c.s('off', 1, .4); c.cap('٥ فردي ← ما يدخل'); await c.wait(700);
        at(6).classList.add('pin'); pulse(at(6)); H.set(n1, '٦'); c.s('t1', 1, .42); c.val(2, '٦', at(6)); await c.wait(700);
        at(31).classList.add('no'); anim(at(31), SHAKE, { duration: 380 }); c.s('off', .9, .4); c.cap('٣١ فردي ← ما يدخل'); await c.wait(700);
        at(30).classList.add('pin'); pulse(at(30)); H.set(n2, '٣٠'); c.s('t2', 1, .42); c.val(1, '٣٠', at(30)); await c.wait(700);
        c.cap('(٣٠ − ٦) ÷ ٢ = ١٢ ← ١٢ + ١ = ١٣'); [6, 8, 28, 30].forEach((v, i) => C.later(i * 80, () => at(v).classList.add('on')));
        H.set(n3, '١٣'); c.s('hint', 1, .45); await c.wait(500); c.val(0, '١٣', n3); await c.wait(300);
      },
    },
    gifts: {
      html: () => {
        const P = [[230, 34], [70, 34], [70, 150], [230, 150]], L = [];   // read from the right, as the handshakes are (QA, 2026-11-08)
        for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (a !== b) {
          const [x1, y1] = P[a], [x2, y2] = P[b], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
          const sx = x1 + ux * 17, sy = y1 + uy * 17, ex = x2 - ux * 21, ey = y2 - uy * 21, mx = (sx + ex) / 2 + uy * 14, my = (sy + ey) / 2 - ux * 14;
          L.push(`<path class="ga" data-a="${a}" d="M${sx.toFixed(1)} ${sy.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" fill="none" stroke="#84D8FF" stroke-width="2.5" stroke-linecap="round" marker-end="url(#lmGa)" style="opacity:0"/>`);
        }
        return `<div class="dg"><svg class="d" width="300" height="184" viewBox="0 0 300 184"><defs><marker id="lmGa" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
          ${L.join('')}${P.map(q => `<circle cx="${q[0]}" cy="${q[1]}" r="13" fill="#fff" stroke="#4B4B4B" stroke-width="3" style="opacity:0"/>`).join('')}</svg>
          ${H.lab([['الأشخاص'], ['كل واحد يهدي'], ['الهدايا']])}</div>`;
      },
      async run(st, c) {
        const P = $$(st, 'circle'), L = $$(st, '.ga'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        for (let i = 0; i < 4; i++) { pop(P[i], 260); H.set(n1, i + 1); c.s('tap', up(i), .3); await c.wait(140); }
        c.val(1, '٤', n1); await c.wait(460);
        P[0].setAttribute('fill', '#1CB0F6'); P[0].setAttribute('stroke', '#1899D6');
        const mine = L.filter(l => l.dataset.a === '0'), rest = L.filter(l => l.dataset.a !== '0');
        let tot = 0;
        for (let j = 0; j < 3; j++) { H.draw(mine[j], 280, '#1899D6'); tot++; H.set(n2, j + 1); H.set(n3, tot); c.s('t' + (j + 1), 1, .4); await c.wait(300); }
        c.val(2, '٣', n2); await c.wait(520);
        c.cap('هدية أحمد لسعد غير هدية سعد لأحمد');
        for (let j = 0; j < rest.length; j++) { H.draw(rest[j], 220); tot++; n3.textContent = A(tot); c.s('tap', up(j + 3) * .7, .26); await c.wait(140); }
        c.cap('٤ × ٣ = ١٢ — وما نقسم على ٢'); pulse(n3); c.s('hint', 1, .45);
        await c.wait(380); c.val(0, '١٢', n3); await c.wait(300);
      },
    },
    league: {
      html: () => {
        const P = [[230, 34], [70, 34], [70, 150], [230, 150]], L = [];
        for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
          const [x1, y1] = P[a], [x2, y2] = P[b], dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy), ox = -dy / len * 4, oy = dx / len * 4;
          L.push(`<line class="g1" x1="${x1 + ox}" y1="${y1 + oy}" x2="${x2 + ox}" y2="${y2 + oy}" stroke="#84D8FF" stroke-width="3" stroke-linecap="round" style="opacity:0"/>`);
          L.push(`<line class="g2" x1="${x1 - ox}" y1="${y1 - oy}" x2="${x2 - ox}" y2="${y2 - oy}" stroke="#CE82FF" stroke-width="3" stroke-linecap="round" style="opacity:0"/>`);
        }
        return `<div class="dg"><svg class="d" width="300" height="184" viewBox="0 0 300 184">${L.join('')}
          ${P.map((q, i) => `<g class="tm" style="opacity:0"><circle cx="${q[0]}" cy="${q[1]}" r="15" fill="#fff" stroke="#4B4B4B" stroke-width="3"/><path d="M${q[0] - 6} ${q[1] - 6}h12v4q0 7-6 9q-6-2-6-9z" fill="${['#1CB0F6', '#FF9600', '#58CC02', '#CE82FF'][i]}"/></g>`).join('')}</svg>
          ${H.lab([['الأندية'], ['مرة واحدة'], ['ذهاب وإياب']])}</div>`;
      },
      async run(st, c) {
        const T = $$(st, '.tm'), L1 = $$(st, '.g1'), L2 = $$(st, '.g2'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        for (let i = 0; i < 4; i++) { pop(T[i], 260); H.set(n1, i + 1); c.s('tap', up(i), .3); await c.wait(140); }
        c.val(1, '٤', n1); await c.wait(400); c.cap('كل فريق يلعب مع ٣'); c.val(2, '٣', n1); await c.wait(560);
        for (let j = 0; j < 6; j++) { H.draw(L1[j], 240); H.set(n2, j + 1); c.s('t' + Math.min(j + 1, 5), 1, .4); await c.wait(220); }
        c.cap('٤ × ٣ ÷ ٢ = ٦ مباريات'); await c.wait(900);
        c.cap('ذهاب وإياب ← كل فريقين يلتقون مرتين'); c.val(3, '٢', n2); await c.wait(500);
        for (let j = 0; j < 6; j++) { H.draw(L2[j], 220); H.set(n3, 6 + j + 1); c.s('tap', up(j + 3) * .7, .28); await c.wait(170); }
        c.cap('٦ × ٢ = ١٢'); pulse(n3); c.s('hint', 1, .45); await c.wait(380); c.val(0, '١٢', n3); await c.wait(300);
      },
    },
    tris: {
      html: () => {
        const B = [30, 110, 190, 270];
        return `<div class="dg"><svg class="d" width="300" height="178" viewBox="0 0 300 178"><polygon class="tf" points="" fill="rgba(28,176,246,.22)" stroke="#1CB0F6" stroke-width="3" stroke-linejoin="round"/>
          <line class="bs" x1="22" y1="156" x2="278" y2="156" stroke="#4B4B4B" stroke-width="4" stroke-linecap="round"/>
          ${B.map((x, i) => `<line class="ln" data-x="${x}" x1="150" y1="16" x2="${x}" y2="156" stroke="#4B4B4B" stroke-width="${i === 0 || i === 3 ? 4 : 3}" stroke-linecap="round" style="opacity:0"/>`).join('')}
          <circle cx="150" cy="16" r="6" fill="#4B4B4B"/></svg>${H.lab([['الخطوط'], ['المثلثات', '٠']])}</div>`;
      },
      async run(st, c) {
        const ln = $$(st, '.ln'), tf = $(st, '.tf'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), B = [30, 110, 190, 270];
        for (let i = 0; i < 4; i++) { H.draw(ln[i], 300); H.set(n1, i + 1); c.s('tap', up(i), .32); await c.wait(300); }
        c.cap('٤ خطوط من الرأس: الضلعين واللي بينهم'); c.val(1, '٤', n1); await c.wait(600);
        let k = 0;
        for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) {
          tf.setAttribute('points', `150,16 ${B[a]},156 ${B[b]},156`); anim(tf, [{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
          ln[a].setAttribute('stroke', '#1899D6'); ln[b].setAttribute('stroke', '#1899D6');
          H.set(n2, ++k); c.s('t' + Math.min(k, 5), 1, .4); await c.wait(460);
          ln[a].setAttribute('stroke', '#4B4B4B'); ln[b].setAttribute('stroke', '#4B4B4B');
        }
        tf.setAttribute('points', '150,16 30,156 270,156'); tf.setAttribute('fill', 'rgba(88,204,2,.14)'); tf.setAttribute('stroke', '#58CC02');
        c.cap('كل خط يصير مثلثاً مع كل واحد من الـ٣ الباقية ← ٤ × ٣ ÷ ٢ = ٦'); c.val(2, '٣', n1); c.s('hint', 1, .45);
        await c.wait(500); c.val(0, '٦', n2); await c.wait(300);
      },
    },
    marks: {
      html: () => { const X = i => 270 - i * 48;
        return `<div class="dg"><svg class="d" width="300" height="120" viewBox="0 0 300 120"><line x1="270" y1="80" x2="30" y2="80" stroke="#AFAFAF" stroke-width="10" stroke-linecap="round"/>
          ${[0, 1, 2, 3, 4].map(i => `<line class="sg" x1="${X(i) - 4}" y1="80" x2="${X(i + 1) + 4}" y2="80" stroke="#84D8FF" stroke-width="10" stroke-linecap="round" style="opacity:0"/><text class="sl" x="${X(i) - 24}" y="106" font-size="12" font-weight="800" fill="#1899D6" text-anchor="middle" style="opacity:0">٢٠</text>`).join('')}
          ${[0, 1, 2, 3, 4, 5].map(i => `<g class="fl" style="opacity:0"><line x1="${X(i)}" y1="80" x2="${X(i)}" y2="42" stroke="#4B4B4B" stroke-width="3" stroke-linecap="round"/><path d="M${X(i)} 42h-16l5 7-5 7h16z" fill="${i === 0 ? '#FF9600' : '#58CC02'}"/></g>`).join('')}
          <text x="270" y="22" font-size="12" font-weight="800" fill="#777" text-anchor="middle">البداية</text><text x="30" y="22" font-size="12" font-weight="800" fill="#777" text-anchor="middle">١٠٠ م</text></svg>
          ${H.lab([['المسافات'], ['العلامات', '٠']])}</div>`; },
      async run(st, c) {
        const sg = $$(st, '.sg'), sl = $$(st, '.sl'), fl = $$(st, '.fl'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        c.cap('طريق ١٠٠ م، علامة كل ٢٠ م'); c.val(1, '١٠٠', $(st, 'svg text:last-of-type')); await c.wait(600); c.val(2, '٢٠', sl[0]); await c.wait(500);
        for (let i = 0; i < 5; i++) { show(sg[i]); anim(sg[i], [{ opacity: 0 }, { opacity: 1 }], { duration: 200 }); pop(sl[i], 240); H.set(n1, i + 1); c.s('tap', up(i * 2), .3); await c.wait(260); }
        c.cap('١٠٠ ÷ ٢٠ = ٥ مسافات'); await c.wait(800);
        for (let i = 5; i >= 0; i--) { show(fl[i]); fl[i].style.transformBox = 'fill-box'; fl[i].style.transformOrigin = 'bottom'; anim(fl[i], [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.3,1.4,.5,1)' }); H.set(n2, 6 - i); c.s('t' + Math.min(6 - i, 5), 1, .4); await c.wait(240); }
        c.cap('٥ مسافات و٦ علامات ← علامة البداية زيادة'); pulse(fl[0]); c.s('hint', 1, .45);
        await c.wait(400); c.val(0, '٦', n2); await c.wait(300);
      },
    },
    cuts: {
      html: () => `<div class="dg"><svg class="d" width="300" height="110" viewBox="0 0 300 110">${[0, 1, 2, 3, 4].map(i => `<rect class="pc" data-i="${i}" x="${246 - i * 52}" y="40" width="52" height="16" rx="4" fill="#E2B6FF"/>`).join('')}
          ${[1, 2, 3, 4].map(i => `<g class="cut" data-i="${i}" style="opacity:0"><line x1="${298 - i * 52}" y1="26" x2="${298 - i * 52}" y2="70" stroke="#FF4B4B" stroke-width="2.5" stroke-dasharray="4 4"/></g>`).join('')}
          ${[0, 1, 2, 3, 4].map(i => `<text class="pn" x="${272 - i * 52}" y="90" font-size="13" font-weight="800" fill="#A568CC" text-anchor="middle" style="opacity:0">${A(i + 1)}</text>`).join('')}</svg>
          ${H.lab([['القطع'], ['القصّات', '٠']])}</div>`,
      async run(st, c) {
        const pc = $$(st, '.pc'), cut = $$(st, '.cut'), pn = $$(st, '.pn'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        anim(st.querySelector('svg'), RISE, { duration: 300 }); c.cap('حبل، وتبي ٥ قطع'); await c.wait(800);
        for (let i = 0; i < 4; i++) {
          pop(cut[i], 260); c.s('click', up(i), .4);
          pc.slice(i + 1).forEach(p => { const k = +p.dataset.i; anim(p, [{ transform: `translateX(${-k * 3 + (k > i + 1 ? 3 : 0) * 0}px)` }, { transform: `translateX(${-(i + 1) * 3}px)` }], { duration: 260, fill: 'forwards', easing: 'ease-out' }); });
          H.set(n2, i + 1); await c.wait(420);
        }
        c.cap('٤ قصّات'); await c.wait(500);
        for (let i = 0; i < 5; i++) { pop(pn[i], 240); H.set(n1, i + 1); c.s('t' + (i + 1), 1, .4); await c.wait(200); }
        c.val(1, '٥', n1); await c.wait(560);
        c.cap('القطعة الأولى ما تحتاج قص ← ٥ − ١ = ٤'); pulse(n2); c.s('hint', 1, .45);
        await c.wait(400); c.val(0, '٤', n2); await c.wait(300);
      },
    },
    clockm: {
      html: () => {
        const pt = (deg, R) => { const a = deg * Math.PI / 180; return [100 + R * Math.sin(a), 100 - R * Math.cos(a)].map(v => v.toFixed(1)); };
        const H12 = Array.from({ length: 12 }, (_, i) => i + 1);
        return `<div class="dg"><svg class="d" width="186" height="186" viewBox="0 0 200 200"><circle cx="100" cy="100" r="88" fill="#fff" stroke="#4B4B4B" stroke-width="4"/>
          <path class="wg" d="" fill="rgba(88,204,2,.22)" stroke="#58CC02" stroke-width="2"/>
          ${H12.map(k => { const [a, b] = pt(k * 30, 80), [x, y] = pt(k * 30, 86); return `<line x1="${a}" y1="${b}" x2="${x}" y2="${y}" stroke="#4B4B4B" stroke-width="${k % 3 ? 2 : 4}" stroke-linecap="round"/>`; }).join('')}
          ${H12.map(k => { const [x, y] = pt(k * 30, 66); return `<text x="${x}" y="${y}" font-size="15" fill="#AFAFAF" text-anchor="middle" dominant-baseline="central">${A(k)}</text>`; }).join('')}
          <line class="mh" x1="100" y1="100" x2="100" y2="26" stroke="#1899D6" stroke-width="5" stroke-linecap="round" style="transform-origin:100px 100px"/>
          <line class="hh" x1="100" y1="100" x2="100" y2="52" stroke="#A568CC" stroke-width="7" stroke-linecap="round" style="transform-origin:100px 100px"/><circle cx="100" cy="100" r="6" fill="#4B4B4B"/></svg>
          ${H.lab([['الساعة × ٣٠ ='], ['الدقائق × ٥٫٥ ='], ['الزاوية', '؟']])}</div>`;
      },
      async run(st, c) {
        const hh = $(st, '.hh'), mh = $(st, '.mh'), wg = $(st, '.wg'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        const rot = (el, a, b, ms = 700) => { el.style.transform = `rotate(${b}deg)`; anim(el, [{ transform: `rotate(${a}deg)` }, { transform: `rotate(${b}deg)` }], { duration: ms, easing: 'cubic-bezier(.3,1.1,.5,1)' }); };
        const wd = (a, b) => { const R = 46, p = d => [(100 + R * Math.sin(d * Math.PI / 180)).toFixed(1), (100 - R * Math.cos(d * Math.PI / 180)).toFixed(1)], [x1, y1] = p(a), [x2, y2] = p(b); return `M100 100L${x1} ${y1}A${R} ${R} 0 0 1 ${x2} ${y2}Z`; };
        c.cap('الساعة ٣:٢٠'); rot(hh, 0, 90); rot(mh, 0, 120); c.s('on', 1, .35); await c.wait(900);
        c.cap('الساعة ٣ ← ٣ × ٣٠ = ٩٠°'); H.set(n1, '٩٠'); c.s('t1', 1, .42); c.val(1, '٣', n1); await c.wait(900);
        c.cap('بس الصغير يمشي نص درجة كل دقيقة، والكبير ٦'); rot(hh, 90, 100, 500); c.s('tap', 1.2, .3); await c.wait(1000);
        c.cap('الفرق ٦ − ٠٫٥ = ٥٫٥ ← ٢٠ × ٥٫٥ = ١١٠'); H.set(n2, '١١٠'); c.s('t2', 1, .42); c.val(2, '٢٠', n2); await c.wait(1000);
        wg.setAttribute('d', wd(100, 120)); anim(wg, [{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
        c.cap('| ٩٠ − ١١٠ | = ٢٠°'); H.set(n3, '٢٠°'); c.s('hint', 1, .45); await c.wait(400); c.val(0, '٢٠°', n3); await c.wait(1200);
        c.cap('ولو طلعت فوق ١٨٠°: اطرحها من ٣٦٠°'); await c.wait(500);
      },
    },
    equal: {
      html: () => `<div class="dg"><div class="eq">
          <div class="eq-r"><span class="eq-n">أحمد</span><span class="eq-b a"><i></i></span><b class="eq-v a">١٠٠</b><small>+٥ يومياً</small></div>
          <div class="eq-r"><span class="eq-n">سعد</span><span class="eq-b s"><i></i></span><b class="eq-v s">٦٠</b><small>+٩ يومياً</small></div>
          <div class="eq-d"><span>اليوم <b class="eq-day">٠</b></span><span>الفرق <b class="eq-gap">٤٠</b></span></div></div>
        ${H.lab([['فرق المبالغ'], ['فرق الزيادات'], ['زمن التساوي', '؟']])}</div>`,
      async run(st, c) {
        const ba = $(st, '.eq-b.a i'), bs = $(st, '.eq-b.s i'), va = $(st, '.eq-v.a'), vs = $(st, '.eq-v.s'), day = $(st, '.eq-day'), gap = $(st, '.eq-gap'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        const W = v => (v / 150 * 100) + '%';
        ba.style.width = W(100); bs.style.width = W(60);
        anim(ba, [{ width: '0%' }, { width: W(100) }], { duration: 500, easing: 'ease-out' }); anim(bs, [{ width: '0%' }, { width: W(60) }], { duration: 500, delay: 100, easing: 'ease-out' });
        await c.wait(700);
        c.cap('الفرق اليوم: ١٠٠ − ٦٠ = ٤٠'); pulse(gap); H.set(n1, '٤٠'); c.s('t1', 1, .42); c.val(1, '٤٠', gap); await c.wait(900);
        c.cap('سعد يزيد ٩ وأحمد ٥ ← يقرّب ٤ كل يوم'); H.set(n2, '٤'); c.s('t2', 1, .42); c.val(2, '٤', n2); await c.wait(900);
        for (let d = 1; d <= 10; d++) {
          const a = 100 + 5 * d, s = 60 + 9 * d;
          ba.style.width = W(a); bs.style.width = W(s); va.textContent = A(a); vs.textContent = A(s); day.textContent = A(d); gap.textContent = A(a - s);
          c.s('tap', up(d) * .7, .26); await c.wait(170);
        }
        $$(st, '.eq-b').forEach(b => b.classList.add('eqd')); pulse(gap); c.cap('٤٠ ÷ ٤ = ١٠ أيام ← ١٥٠ و١٥٠'); H.set(n3, '١٠'); c.s('hint', 1, .45);
        await c.wait(400); c.val(0, '١٠', n3); await c.wait(300);
      },
    },
    work: {
      html: () => `<div class="dg"><div class="wk">
          <div class="wk-t"><div class="wk-tank">${'<i></i>'.repeat(6)}</div><span class="wk-h">الساعة <b>٠</b></span></div>
          <div class="wk-k"><span class="ka">الأولى في <span class="ln-nw">٣ ساعات</span><small>٢ من ٦ كل ساعة</small></span><span class="kb">الثانية في <span class="ln-nw">٦ ساعات</span><small>١ من ٦ كل ساعة</small></span></div></div>
        ${H.lab([['ضرب الزمنين'], ['جمع الزمنين'], ['معاً', '؟']])}</div>`,
      async run(st, c) {
        const u = $$(st, '.wk-tank i'), hr = $(st, '.wk-h b'), ka = $(st, '.ka'), kb = $(st, '.kb'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        H.rise([ka, kb], 0, 120); c.cap('حوض من ٦ أجزاء'); await c.wait(900);
        for (let h = 0; h < 2; h++) {
          hr.textContent = A(h + 1); pulse(hr.parentNode);
          for (const [i, cl] of [[h * 3, 'a'], [h * 3 + 1, 'a'], [h * 3 + 2, 'b']]) { u[i].className = cl; anim(u[i], [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 240, easing: 'ease-out' }); c.s('drop', up(i), .32); await c.wait(220); }
          await c.wait(380);
        }
        c.cap('كل ساعة ٣ أجزاء ← امتلأ في ساعتين'); await c.wait(900);
        c.cap('بالقانون: ٣ × ٦ = ١٨'); H.set(n1, '١٨'); c.s('t1', 1, .42); c.val(1, '١٨', n1); await c.wait(700);
        c.cap('٣ + ٦ = ٩'); H.set(n2, '٩'); c.s('t2', 1, .42); c.val(2, '٩', n2); await c.wait(700);
        c.cap('١٨ ÷ ٩ = ٢ ← ساعتين، أقل من الأسرع'); H.set(n3, '٢'); c.s('hint', 1, .45); await c.wait(400); c.val(0, '٢', n3); await c.wait(300);
      },
    },
  };

  const g = {
    fromto(i) {
      const a = rnd(4, 40), b = a + rnd(6, 40), btw = i % 2 === 0;
      const r = btw ? b - a - 1 : b - a + 1;
      return { q: btw ? `كم عدداً صحيحاً يقع بين ${A(a)} و${A(b)}؟` : `كم عدداً صحيحاً من ${A(a)} إلى ${A(b)}؟`, ans: A(r), ch: four(A(r), [A(b - a), A(btw ? b - a + 1 : b - a - 1), A(r + 2)]),
        sol: `الفرق ${A(b)} − ${A(a)} = ${A(b - a)} ← ${btw ? `بين: ${A(b - a)} − ١` : `من… إلى: ${A(b - a)} + ١`} = ${A(r)}` };
    },
    evcount(i) {
      const odd = i % 2 === 1, a = rnd(2, 20) * 2 + (odd ? 1 : 0), b = a + rnd(8, 30) * 2, r = (b - a) / 2 + 1;
      return { q: `كم عدداً ${odd ? 'فردياً' : 'زوجياً'} في: ${A(a)}، ${A(a + 2)}، ${A(a + 4)}، …، ${A(b)}؟`, ans: A(r), ch: four(A(r), [A(r - 1), A(b - a), A(r + 1)]),
        sol: `(${A(b)} − ${A(a)}) ÷ ٢ + ١ = ${A((b - a) / 2)} + ١ = ${A(r)}` };
    },
    evedge(i) {
      const a = rnd(2, 15) * 2 + 1, b = a + rnd(6, 20) * 2, f = a + 1, l = b - 1, r = (l - f) / 2 + 1;
      return { q: `كم عدداً زوجياً يقع بين ${A(a)} و${A(b)}؟`, ans: A(r), ch: four(A(r), [A((b - a) / 2 + 1), A(r - 1), A(b - a - 1)]),
        sol: `أول زوجي ${A(f)}، آخر زوجي ${A(l)} ← (${A(l)} − ${A(f)}) ÷ ٢ + ١ = ${A(r)}` };
    },
    gifts(i) {
      const n = rnd(5, 10), r = n * (n - 1), what = pick([['أصدقاء', 'أهدى كل واحد منهم هدية لكل واحد من الباقين', 'هدية'], ['طلاب', 'أرسل كل واحد منهم رسالة لكل واحد من الباقين', 'رسالة'], ['زملاء', 'كتب كل واحد منهم بطاقة لكل واحد من الباقين', 'بطاقة']]);
      return { q: `${A(n)} ${what[0]}، ${what[1]}. كم ${what[2]} في المجموع؟`, ans: A(r), ch: four(A(r), [A(r / 2), A(n * n), A((n - 1) * (n - 1))]), sol: `${A(n)} × ${A(n - 1)} = ${A(r)} — بدون ÷ ٢` };
    },
    league(i) {
      let n, k; do { n = rnd(5, 12); k = pick([2, 2, 3]); } while (n === 9 && k === 2);   /* not bank keylaws-03 */
      const r = n * (n - 1) / 2 * k;
      return { q: `دوري فيه ${A(n)} ${n <= 10 ? 'فرق' : 'فريقاً'}، يلعب كل فريقين ${k === 2 ? 'مرتين (ذهاباً وإياباً)' : '٣ مرات'}. كم مباراة في الدوري؟`, ans: A(r), ch: four(A(r), [A(n * (n - 1) / 2), A(n * (n - 1) * k), A(n * k)]),
        sol: `${A(n)} × ${A(n - 1)} × ${A(k)} ÷ ٢ = ${A(r)}` };
    },
    tris(i) {
      const inside = rnd(3, 5), n = inside + 2, r = n * (n - 1) / 2;
      return { q: `من رأس مثلث رُسمت ${A(inside)} قطع مستقيمة إلى القاعدة (غير الضلعين). كم مثلثاً يتكوّن؟`, ans: A(r), ch: four(A(r), [A(inside * (inside - 1) / 2 || 1), A((inside + 1) * inside / 2), A(n * (n - 1))]),
        sol: `الخطوط مع الضلعين ${A(n)} ← ${A(n)} × ${A(n - 1)} ÷ ٢ = ${A(r)}` };
    },
    marks(i) {
      const d = pick([5, 10, 15, 20, 25]), k = rnd(6, 16), L = d * k, r = k + 1;
      return { q: `طريق طوله ${nn(L, 'أمتار', 'متراً', 'متر')}، وُضعت عليه علامة كل ${A(d)} ${d > 10 ? 'متراً' : 'أمتار'} بدءاً من بدايته حتى نهايته. كم علامة؟`, ans: A(r), ch: four(A(r), [A(k), A(k - 1), A(k + 2)]), sol: `${A(L)} ÷ ${A(d)} = ${nn(k, 'مسافات', 'مسافة')} ← + ١ = ${A(r)}` };
    },
    cuts(i) {
      const n = rnd(5, 12);
      if (i % 2) { const m = pick([2, 3, 4, 5]); return { q: `قصّ حبل يحتاج ${m === 2 ? 'دقيقتين' : A(m) + ' دقائق'} للقصّة الواحدة. كم دقيقة تحتاج لتقطيعه إلى ${A(n)} ${n > 10 ? 'قطعة' : 'قطع'}؟`, ans: A((n - 1) * m), ch: four(A((n - 1) * m), [A(n * m), A((n + 1) * m), A(n - 1)]), sol: `القصّات ${A(n)} − ١ = ${A(n - 1)} ← × ${A(m)} = ${A((n - 1) * m)}` }; }
      return { q: `كم قصّة تحتاج لتقطيع خشبة إلى ${nn(n, 'قطع', 'قطعة')}؟`, ans: A(n - 1), ch: four(A(n - 1), [A(n), A(n + 1), A(n - 2)]), sol: `${A(n)} − ١ = ${A(n - 1)}` };
    },
    clockm(i) {
      let h, m, raw, r;
      do { h = rnd(1, 11); m = pick([10, 20, 30, 40, 50]); raw = Math.abs(30 * h - 5.5 * m); r = raw > 180 ? 360 - raw : raw; } while (r === 0 || r === 180 || (h === 4 && m === 40));   /* ٤:٤٠ is bank keylaws-09 */
      const dg = x => A(x) + '°';
      return { q: `كم الزاوية الصغرى بين عقربي الساعة عند ${A(h)}:${A(m)}؟`, ans: dg(r), ch: four(dg(r), [Math.abs(30 * h - 6 * m), raw > 180 ? raw : 360 - raw, r + 15, Math.abs(r - 30) || 45].filter(x => x > 0 && x <= 360).map(dg)),
        sol: `| ${A(h)} × ٣٠ − ${A(m)} × ٥٫٥ | = ${dg(raw)}${raw > 180 ? ` ← فوق ١٨٠°: ٣٦٠° − ${dg(raw)} = ${dg(r)}` : ''}` };
    },
    equal(i) {
      const t = rnd(5, 15), da = rnd(3, 6), db = da + rnd(2, 6), b0 = rnd(3, 9) * 10, a0 = b0 + (db - da) * t;
      return { q: `مع خالد ${nn(a0, 'ريالات', 'ريالاً', 'ريال')} ويوفر ${nn(da, 'ريالات', 'ريالاً', 'ريال')} يومياً، ومع فهد ${nn(b0, 'ريالات', 'ريالاً', 'ريال')} ويوفر ${nn(db, 'ريالات', 'ريالاً', 'ريال')} يومياً. بعد كم يوم يتساوى ما معهما؟`, ans: A(t), ch: four(A(t), [A(Math.round((a0 - b0) / (da + db))), A(a0 - b0), A(t + 2)]),
        sol: `(${A(a0)} − ${A(b0)}) ÷ (${A(db)} − ${A(da)}) = ${A(a0 - b0)} ÷ ${A(db - da)} = ${A(t)}` };
    },
    work(i) {
      const [a, b] = pick([[3, 6], [4, 12], [6, 12], [10, 15], [12, 24], [20, 30], [6, 3], [12, 4]]), r = a * b / (a + b);
      return { q: `حنفية تملأ حوضاً في ${A(a)} ${a > 10 ? 'ساعة' : 'ساعات'}، وأخرى تملؤه في ${A(b)} ${b > 10 ? 'ساعة' : 'ساعات'}. في كم ساعة يمتلئ لو فُتحتا معاً؟`, ans: A(r), ch: four(A(r), [A((a + b) / 2), A(Math.min(a, b)), A(Math.abs(a - b) || r + 1)]),
        sol: `(${A(a)} × ${A(b)}) ÷ (${A(a)} + ${A(b)}) = ${A(a * b)} ÷ ${A(a + b)} = ${A(r)}` };
    },
  };

  const sign = {
    fromto: [S, '<path class="s" d="M5 26h30"/><circle class="f" cx="10" cy="26" r="4"/><circle class="f" cx="30" cy="26" r="4"/><path class="s" d="M10 18q10-10 20 0"/>'],
    evcount: [S, '<path class="s" d="M6 28q7-12 14 0q7-12 14 0"/>'],
    evedge: [S, '<path class="s" d="M6 30h28M10 24l-4 6 4 6M30 24l4 6-4 6"/><path class="s" d="M16 14q4-6 8 0"/>'],
    gifts: [S, '<rect class="s" x="8" y="16" width="24" height="18" rx="3"/><path class="s" d="M20 16v18M8 22h24M20 16q-8-10-8-2q0 2 8 2q8 0 8-2q0-8-8 2"/>'],
    league: [S, '<path class="s" d="M12 8h16v8a8 8 0 0 1-16 0zM20 24v6M14 32h12M12 11H7q0 7 6 7M28 11h5q0 7-6 7"/>'],
    tris: [S, '<path class="s" d="M20 6L6 33h28zM20 6l-4 27M20 6l5 27"/>'],
    marks: [S, '<path class="s" d="M6 32h28M10 32V12M30 32V12"/><path class="f" d="M10 12h9l-3 4 3 4h-9zM30 12h9l-3 4 3 4h-9z"/>'],
    cuts: [S, '<circle class="s" cx="11" cy="29" r="5"/><circle class="s" cx="29" cy="29" r="5"/><path class="s" d="M14 25L28 7M26 25L12 7"/>'],
    clockm: [S, '<circle class="s" cx="20" cy="20" r="14"/><path class="s" d="M20 11v9l6 4"/>'],
    equal: [S, '<path class="s" d="M8 30h12M8 22h20M8 14h24"/><path class="s" d="M30 30l4-4-4-4"/>'],
    work: [S, '<path class="s" d="M8 12h8v4H8zM24 12h8v4h-8zM12 16v4M28 16v4"/><path class="s" d="M8 22h24v12H8z"/>'],
  };
  const where = {
    fromto: ['skills.keylaws', 'count', /^\*من… إلى\*/], evcount: ['skills.keylaws', 'evens', /^\(\*آخر\*/], evedge: ['skills.keylaws', 'evens', /^\*الأطراف الفردية\*/],
    gifts: ['skills.keylaws', 'shake', /^\*الهدايا\*/], league: ['skills.keylaws', 'league', /^\*المباريات\*/], tris: ['skills.keylaws', 'league', /^\*المثلثات\*/],
    marks: ['skills.keylaws', 'poles', /^علامة في البداية/], cuts: ['skills.keylaws', 'poles', /^\*مرات القصّ?\*/], clockm: ['skills.keylaws', 'clock', /^\*٥٫٥\*/],
    equal: ['skills.keylaws', 'together', /^\*زمن التساوي\*/], work: ['skills.keylaws', 'together', /^\*زمنهم معاً\*/],
  };
  const nums = {
    fromto: { ex: 'كم عدداً صحيحاً من ٤ إلى ٩؟', v: ['٦', '٥', '٥'], more: ['٤', '١٣', '٣'], line: 'الفرق ٩ − ٤ = ٥ ← من ٤ إلى ٩ = ٥ + ١ = ٦', hint: { 1: 'الفرق: ٩ − ٤ = ؟', 2: 'الفرق نفسه: ٩ − ٤ = ؟' } },
    evcount: { ex: 'كم عدداً زوجياً في: ٦، ٨، ١٠، …، ٣٠؟', v: ['١٣', '٣٠', '٦'], more: ['١٢', '٢٤', '١٤'], hint: { 1: 'آخر عدد في المثال كم؟', 2: 'أول عدد في المثال كم؟' } },
    evedge: { ex: 'كم عدداً زوجياً يقع بين ٧ و٢٣؟', v: ['٨', '٢٢', '٨'], more: ['٧', '٢٣', '٩'], hint: { 1: '٢٣ فردي: آخر زوجي قبله كم؟', 2: '٧ فردي: أول زوجي بعده كم؟' } },
    gifts: { ex: '٥ أصدقاء، كل واحد أهدى كل واحد من الباقين. كم هدية؟', v: ['٢٠', '٥', '٤'], more: ['١٠', '٢٥', '٦'], hint: { 2: 'كل واحد يهدي الباقين ما عدا نفسه: كم؟' } },
    league: { ex: '٥ فرق، كل فريقين يلتقون ذهاباً وإياباً. كم مباراة؟', v: ['٢٠', '٥', '٤', '٢'], more: ['١٠', '٤٠', '٦'], hint: { 2: 'كل فريق يلعب مع كم فريق؟', 3: 'ذهاب وإياب: كم مرة يلتقي كل فريقين؟' } },
    tris: { ex: '٥ خطوط تطلع من رأس واحد (مع الضلعين) إلى القاعدة. كم مثلثاً؟', v: ['١٠', '٥', '٤'], more: ['٢٠', '٦', '٣'], hint: { 1: 'كم خط يطلع من الرأس مع الضلعين؟' } },
    marks: { ex: 'طريق ٦٠ متراً، علامة كل ١٠ أمتار، ومعها علامة البداية. كم علامة؟', v: ['٧', '٦٠', '١٠'], more: ['٦', '٥', '٦٠٠'], hint: { 1: 'كم طول الطريق؟', 2: 'كم متر بين كل علامتين؟' } },
    cuts: { ex: 'تبي تقطع حبلاً إلى ٨ قطع. كم قصّة؟', v: ['٧', '٨'], more: ['٩', '٦', '١٦'], hint: { 1: 'كم قطعة تبي؟' } },
    clockm: { ex: 'الساعة ٤:٢٠ — كم الزاوية بين العقربين؟', v: ['١٠°', '٤', '٢٠'], more: ['١١٠', '١٢٠', '٨٠'], line: '| ٤ × ٣٠ − ٢٠ × ٥٫٥ | = | ١٢٠ − ١١٠ | = ١٠°', hint: { 1: 'الساعة كم؟', 2: 'الدقائق كم؟' } },
    equal: { ex: 'مع ريم ٩٠ وتوفر ٤ يومياً، ومع سارة ٥٠ وتوفر ٨ يومياً. بعد كم يوم تتساويان؟', v: ['١٠', '٤٠', '٤'], more: ['١٢', '١٤٠', '٨'], hint: { 1: '٩٠ − ٥٠ = ؟', 2: '٨ − ٤ = ؟' } },
    work: { ex: 'حنفية تملأ الحوض في ٤ ساعات، وأخرى في ١٢ ساعة. في كم ساعة يمتلئ لو فتحناهما معاً؟', v: ['٣', '٤٨', '١٦'], more: ['٨', '٦', '٤'], hint: { 1: '٤ × ١٢ = ؟', 2: '٤ + ١٢ = ؟' } },
  };

  const css = `
.law .nlv text { font-size: 13px; font-weight: 800; fill: var(--ink2); }
.law .nl circle { fill: #fff; stroke: var(--line); stroke-width: 2.5; transition: fill .2s, stroke .2s; }
.law .nl text { transition: fill .2s; }
.law .nl.pin circle { stroke: var(--blue); stroke-width: 3.5; }
.law .nl.on circle { fill: var(--blue); stroke: var(--blue-dk); }
.law .nl.on text { fill: #fff; }
.law .nl.out circle { fill: #fff; stroke: var(--red, #FF4B4B); stroke-dasharray: 4 3; }
.law .nl.out text { fill: var(--red, #FF4B4B); }
.law .nl.no circle { fill: var(--red-soft, #FFDFE0); stroke: var(--red, #FF4B4B); }
.law .nl.no text { fill: var(--red, #FF4B4B); }
.law .nl.odd text { fill: var(--gray); }
.law .nl { transform-box: fill-box; transform-origin: center; }
.law .dots3 { font-size: 18px; font-weight: 800; fill: var(--gray-icon); }
.law .eq { width: 280px; display: flex; flex-direction: column; gap: 8px; }
.law .eq-r { display: grid; grid-template-columns: 38px 1fr 34px; align-items: center; gap: 6px; font-weight: 800; }
.law .eq-r small { grid-column: 2 / 4; margin-top: -6px; font-size: 11.5px; color: var(--gray); }
.law .eq-n { font-size: 13px; color: var(--ink2); }
.law .eq-b { height: 16px; border-radius: 8px; background: var(--line); overflow: hidden; }
.law .eq-b i { display: block; height: 100%; border-radius: 8px; transition: width .16s linear; }
.law .eq-b.a i { background: var(--blue); } .law .eq-b.s i { background: var(--purple); }
.law .eq-b.eqd i { background: var(--green); }
.law .eq-v { font-size: 14px; text-align: center; } .law .eq-v.a { color: var(--blue-dk); } .law .eq-v.s { color: #A568CC; }
.law .eq-d { display: flex; justify-content: center; gap: 10px; font-size: 13px; font-weight: 800; color: var(--gray); }
.law .eq-d span { border: 2px solid var(--line); border-radius: 9px; padding: 0 8px; } .law .eq-d b { color: var(--ink2); }
.law .wk { display: flex; align-items: center; gap: 16px; }
.law .wk-t { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.law .wk-tank { width: 74px; height: 120px; border: 3px solid var(--ink2); border-top: none; border-radius: 0 0 12px 12px; display: flex; flex-direction: column-reverse; gap: 2px; padding: 3px; }
.law .wk-tank i { display: block; flex: 1; border-radius: 4px; transform-origin: bottom; }
.law .wk-tank i.a { background: var(--blue); } .law .wk-tank i.b { background: var(--purple); }
.law .wk-h { font-size: 13px; font-weight: 800; color: var(--gray); } .law .wk-h b { color: var(--ink2); }
.law .wk-k { display: flex; flex-direction: column; gap: 10px; font-size: 14px; font-weight: 800; }
.law .wk-k span { display: flex; flex-direction: column; border-inline-start: 5px solid; padding-inline-start: 8px; }
.law .wk-k .ka { border-color: var(--blue); color: var(--blue-dk); } .law .wk-k .kb { border-color: var(--purple); color: #A568CC; }
.law .wk-k small { font-size: 12px; color: var(--gray); font-weight: 700; }
@media (max-width: 380px) { .law .wk-k { font-size: 12px; gap: 5px; } .law .wk-k small { font-size: 10.5px; } .law .wk-k span { padding-inline-start: 6px; } }
`;
  M.add({ rules, dia, g, sign, where, nums, css });
})();
