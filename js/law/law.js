/* The rule's final version, laid into the app for the user to judge (tools/law-app.html; the user, 2026-11-03: «create the
   last version for laws and enter it in the levels … dont enter it really but show me how will it be … like real app and
   has the same animations»). Nothing here ships: tools/lawapp/run.html runs the real app with a few hooks written into a
   copy of app.js, and these functions answer them.

   Where a rule lives:
     the path      — a node whose next lesson teaches a rule says so on its card (popLine); the rules due today stand above
                     the day's review as one card (pathCard), and with none due it opens the student's set (collection)
     the lesson    — the lesson's own rule card (the `see` with that rule) becomes the rule's lesson: «قانون جديد» flies off
                     فهيم's word into the header, the card asks «وش الناقص؟», the proof hands its numbers to the rule and
                     the rule comes back in words; then the app's own «كمّل القاعدة» and «كمّل الخطوة» with the rule's
                     words and numbers (swap); the lesson's practice and its exam question follow as they are
     the win       — «تقدّمك اليوم» opens with the rule joining the set, its first of five steps lit (winCard, winPlay)
     the review    — retrieval first: every term blank, one asked; remembered at once skips the proof, a miss replays
                     it; then one exam question with new numbers; the end lights each rule's next step, gold at five,
                     and says when it comes back (LADDER: 1, 3, 7, 14, 30 days) */
(function () {
  'use strict';
  const C = () => window.LAWCORE, Q = () => window.__QI || {};
  const call = (n, ...a) => { const f = Q()[n]; return typeof f === 'function' ? f(...a) : undefined; };
  const $app = document.getElementById('app');
  const KEY = 'qudrati.lawapp.v1', LADDER = [1, 3, 7, 14, 30];
  let ST = {}; try { ST = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { ST = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {} };
  /* the student's own day, so «بكرة» turns at their midnight and not at UTC's (03:00 in Riyadh) */
  const day = () => { const d = new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 6e4) / 864e5); };
  /* a rule counts once the lesson that teaches it is done in the app's own save, so a lab's seeded rules, or rules left from
     another save on this phone, never show to a student who has not met them (the user, 2026-11-08: «im on first lesson why is
     this one apper i dont even have any laws») */
  const real = k => { const w = WHERE[k], S = Q().S, L = w && S && S.learn && S.learn[w[0]]; return !!(ST[k] && L && (L.done || []).includes(w[1])); };
  const status = k => !real(k) ? 'new' : ST[k].due <= day() ? 'due' : 'ok';
  const A = n => C().A(n);
  const RULES = () => C().RULES, rule = k => RULES().find(r => r.key === k);
  const inDays = n => n <= 0 ? 'اليوم' : n === 1 ? 'بكرة' : n === 2 ? 'بعد يومين' : `بعد ${A(n)} ${n <= 10 ? 'أيام' : 'يوم'}`;
  const plural = n => n === 1 ? 'قانون واحد' : n === 2 ? 'قانونين' : `${A(n)} قوانين`;

  /* which short lesson meets which rule: its node, its lesson, and its rule card (the `see`'s rule) */
  const WHERE = {
    tri: ['skills.bigsum', 'series', /^من ١ إلى أي عدد/], last: ['skills.bigsum', 'units', /آخر رقم في الناتج/],
    queue: ['skills.keylaws', 'count', /عدد الطابور/], hand: ['skills.keylaws', 'shake', /^\*المصافحات\*/], clock: ['skills.keylaws', 'clock', /^على رأس الساعة/],
    prob: ['skills.probstats', 'chance', /^\*الاحتمال\*/], ways: ['skills.probstats', 'counting', /^\*عدد الطرق\*/], mean: ['skills.probstats', 'mean', /^\*الوسط\* = \*المجموع\*/],
  };
  const lessonOf = k => { const w = WHERE[k], set = window.QLEARN && window.QLEARN[w[0]]; return set && set.lessons.find(l => l.id === w[1]); };
  /* the unit's lesson a rule lives in: its place in the unit and its title («الدرس ٢، قوانين هامة في القدرات») */
  const nodeOf = k => { const [dom, key] = WHERE[k][0].split('.'), d = window.QBANK && window.QBANK[dom]; if (!d) return null;
    const i = d.lessons.findIndex(l => l.key === key); return i < 0 ? null : { dom, key, i, title: d.lessons[i].title }; };

  /* the rule's mark: the finished node's gold hexagon with the lesson's sign (look 16's face); grey while it is still to come */
  const HEX = '19.5,4 51.5,4 67,29 51.5,54 19.5,54 4,29', HEXLIP = '19.5,11 51.5,11 67,36 51.5,61 19.5,61 4,36';
  function hexSvg(R, locked) {
    /* the sign's strokes and fills as attributes, so it draws the same outside the rule's own screens */
    const g = (C().NW_LES[R.key] || C().NW_LES.prob)[1]
      .replace(/class="s"/g, 'fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"')
      .replace(/class="f j"|class="f"|class="j"/g, 'fill="currentColor"');
    const face = locked ? '#E5E5E5' : '#FFC800', lip = locked ? '#AFAFAF' : '#E6A000', ink = locked ? '#AFAFAF' : '#C57A1C';
    return `<svg class="lw-hex" viewBox="0 0 71 65" aria-hidden="true"><g stroke-width="8" stroke-linejoin="round"><polygon points="${HEXLIP}" fill="${lip}" stroke="${lip}"/><polygon points="${HEX}" fill="${face}" stroke="${face}"/></g>
      ${locked ? '' : `<clipPath id="lwhx"><polygon points="${HEX}"/></clipPath><g clip-path="url(#lwhx)" fill="#FFD940"><polygon points="27,60 38,60 63,-4 52,-4"/><polygon points="42,60 47,60 72,-4 67,-4"/></g>`}
      <svg x="20" y="9" width="31" height="31" viewBox="0 0 40 40" style="color:${ink}" class="nw-l">${g}</svg></svg>`;
  }
  const dots = lv => `<span class="lw-dots${lv >= LADDER.length ? ' gold' : ''}">${LADDER.map((x, i) => `<i${i < lv ? ' class="on"' : ''}></i>`).join('')}</span>`;

  /* ───── the lesson: the rule card is swapped for the rule's three screens ───── */
  let pending = null, LES = null;
  function begin(key, les) { pending = []; LES = { key, id: les.id }; }
  const firstLes = () => { const QB = window.QBANK || {}, d = Object.keys(QB)[0], l = d && QB[d].lessons[0], set = l && window.QLEARN && window.QLEARN[d + '.' + l.key];
    return !!(LES && set && LES.key === d + '.' + l.key && set.lessons[0].id === LES.id); };
  function swap(src, key, les) {
    if (!src || typeof src !== 'object' || src.t !== 'see' || !src.rule) return null;
    const k = Object.keys(WHERE).find(x => WHERE[x][0] === key && WHERE[x][1] === les.id && WHERE[x][2].test(src.rule));
    if (!k) return null;
    /* the numbers come as the app's own «كمّل الخطوة» (the user, 2026-11-08: «we agreed we want something like that»): the
       example on top and its working down the box a step a line, from the lesson's own worked example (`STEPS` for a chain) */
    /* never the old «حطّ أرقام المثال في القانون» card (the user, 2026-11-08: «dont ever do it like this»): a rule whose card
       has no worked example of its own gets one written from its example's line */
    const nums = PLAY[k] ? { t: 'see', law: k, fill: 'play' } : call('learnRuleNums', STEPS[k] ? Object.assign({}, src, { num: STEPS[k] }) : src.num ? src : Object.assign({}, src, { num: numOf(k) }));
    return [{ t: 'see', law: k }, { t: 'see', law: k, fill: 'words' }, nums].filter(Boolean);
  }
  const PAIRS = { tens: 100 };
  const numOf = k => { const R = rule(k), N = NUMS[k]; if (!R || !N) return null;
    return { q: N.ex, eq: numLine(R, N).split(/(\s+|[()])/).map(t => N.v.includes(t) ? `{${t}}` : t).join(''), lab: false, more: N.more }; };
  const STEPS = {
    tens: { q: '٤٦ + ٣٨ + ٥٤ + ٦٢', eq: '(٤٦ + {٥٤}) + (٣٨ + {٦٢}) = {١٠٠} + {١٠٠} = {٢٠٠}', lab: false, more: ['٦٤', '٥٢', '٩٠'] },
  };
  /* each rule's worked example for «حطّ الأرقام»: the question, then every term's number (in the order of R's terms,
     the first being the answer), and wrong numbers a student is likely to reach for */
  const NUMS = {
    prob: { ex: 'رمينا حجر نرد مرة. ما احتمال ظهور عدد أكبر من ٤؟', v: ['١/٣', '٢', '٦'], more: ['٤', '٣', '١/٢'], hint: { 1: 'كم وجه في النرد أكبر من ٤؟', 2: 'كم وجه في النرد كله؟' } },
    mean: { ex: 'ما الوسط الحسابي للأعداد ٨ و١٢ و١٠؟', v: ['١٠', '٣٠', '٣'], more: ['٢', '١٥', '٢٠'], hint: { 1: 'احسبها: ٨ + ١٢ + ١٠ = ؟', 2: 'كم عدد في المثال؟' } },
    hand: { ex: '٧ أشخاص، صافح كل واحد منهم الباقين مرة. كم مصافحة؟', v: ['٢١', '٧', '٦'], more: ['٨', '٤٢', '١٤'], hint: { 2: 'كل واحد يصافح الباقين ما عدا نفسه: كم؟' } },
    last: { ex: 'ما رقم الآحاد في ناتج ٤٨ × ٢٧؟', v: ['٦', '٨', '٧'], more: ['٥٦', '٤', '٢'], hint: { 1: 'آحاد ٤٨ كم؟ وآحاد ٢٧ كم؟', 2: 'آحاد ٤٨ كم؟ وآحاد ٢٧ كم؟' } },
    tri: { ex: 'ما مجموع الأعداد من ١ إلى ٢٠؟', v: ['٢١٠', '٢٠', '٢١'], more: ['١٩', '٤٢٠', '٢٠٠'], hint: { 2: 'آخر عدد ٢٠، وزد عليه ١: كم؟' } },
    queue: { ex: 'ترتيبك ٤ من الأمام و٩ من الخلف. كم واحد في الطابور؟', v: ['١٢', '٤', '٩'], more: ['١٣', '٥', '١١'] },
    clock: { ex: 'كم الزاوية بين عقربي الساعة عند الساعة ٥ تماماً؟', v: ['١٥٠°', '٥'], more: ['٦٠°', '٦', '١٢٠°'] },
    ways: { ex: 'عندك ٤ قمصان و٣ بناطيل. بكم طريقة تختار قميص وبنطلون؟', v: ['١٢', '٤', '٣'], more: ['٧', '١٦', '٩'] },
  };
  const OPR = /^[=×÷+−]$/;
  /* the long rule's fill screen, four ways to choose from (tools/law-fill.html, `?lf=N`; the user, 2026-11-04, on the camera:
     «thats very bad UX … create multiple UX UI versions»): 1 the name is the card's title and the formula its own line,
     2 the long rules in fewer words, 3 one blank at a time under the whole rule, 4 both 1 and 2; 5 is the line as it was before the camera, shrunk to fit (the user's «very small»). The app plays 1 */
  const LFP = +((/[?&]lf=([1-5])/.exec(location.search) || [])[1] || 0), LFV = LFP || 1, LFN = LFV > 0 && LFV < 5;
  /* the labs drive the app by hash and by message; the shipped app answers neither */
  const DEV = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(location.hostname) || /[?&]dev=1(&|$)/.test(location.search);
  const LF_SHORT = {
    tens: [{ t: 'المجموع' }, '=', { t: 'زوج ١' }, '+', { t: 'زوج ٢' }],
    tri: [{ t: 'المجموع' }, '=', { t: 'الأخير' }, '×', { t: '(الأخير + ١)' }, '÷', '٢'],
    common: [{ t: 'المجموع' }, '=', { t: 'المشترك' }, '×', { t: 'الباقي' }],
    evensum: [{ t: 'المجموع' }, '=', { t: 'الأخير' }, '×', { t: '(الأخير + ٢)' }, '÷', '٤'],
    last: [{ t: 'آحاد الناتج' }, '=', 'آخر رقم من', { t: 'آحاد' }, '×', { t: 'آحاد' }],
    fromto: [{ t: 'من… إلى' }, '=', { t: 'الفرق' }, '+', '١', '،', 'بين', '=', { t: 'الفرق' }, '−', '١'],
    league: [{ t: 'المباريات' }, '=', { t: 'الفرق' }, '×', { t: '(الفرق − ١)' }, '×', { t: 'اللقاءات' }, '÷', '٢'],
    outcomes: [{ t: 'النواتج' }, '=', { t: 'نواتج ١' }, '×', { t: 'نواتج ٢' }],
    ways: [{ t: 'الطرق' }, '=', { t: 'خيارات ١' }, '×', { t: 'خيارات ٢' }],
    norep: [{ t: 'الرموز' }, '=', { t: 'الأرقام' }, '×', { t: '(الأرقام − ١)' }, '×', { t: '(الأرقام − ٢)' }],
    median: [{ t: 'الوسيط' }, '=', { t: 'الأوسط' }, 'بعد', { t: 'الترتيب' }],
    places: [{ t: 'التباديل' }, '=', { t: 'تنازلي' }, 'بعدد', { t: 'الأماكن' }],
  };
  const lfRule = R => (LFV === 2 || LFV === 4) && LF_SHORT[R.key] ? Object.assign({}, R, { tok: LF_SHORT[R.key] }) : R;
  /* the rules written in law-more-*.js (every other rule card of nodes 1–3): their rule cards and their worked examples */
  if (window.LAWMORE) { Object.assign(WHERE, window.LAWMORE.where); Object.assign(NUMS, window.LAWMORE.nums); }
  /* every rule in the order the path meets it: the node, its short lesson, the rule card's place in the lesson */
  let ORD = null;
  function ordered() {
    if (ORD) return ORD;
    const out = [], QB = window.QBANK || {}, QL = window.QLEARN || {};
    Object.keys(QB).forEach(dom => (QB[dom].lessons || []).forEach(l => { const key = dom + '.' + l.key, set = QL[key]; if (!set) return;
      set.lessons.forEach(les => les.items.forEach(src => { if (!src || src.t !== 'see' || !src.rule) return;
        const k = Object.keys(WHERE).find(x => WHERE[x][0] === key && WHERE[x][1] === les.id && WHERE[x][2].test(src.rule));
        if (k && !out.includes(k)) out.push(k); })); }));
    Object.keys(WHERE).forEach(k => { if (!out.includes(k)) out.push(k); });
    return (ORD = out);
  }
  const lawsOf = (key, id) => ordered().filter(k => WHERE[k][0] === key && (id == null || WHERE[k][1] === id));
  /* the rule as card 13 lays it out: the name, «=», and the rest stacked over its bar when it divides; cell() draws each term */
  function formula(R, cell, split) {
    let n = 0;
    const it = R.tok.map(x => typeof x === 'string' ? { p: x } : { t: x.t, s: n++ });
    const row = xs => xs.map(x => x.p != null ? (OPR.test(x.p) ? `<span class="op">${x.p === '÷' ? '<i class="dv"></i>' : x.p}</span>` : `<span class="pl">${C().fx(x.p)}</span>`) : cell(x.s, x.t, false)).join('');
    if (!it[1] || it[1].p !== '=') return split ? { head: '', body: row(it) } : row(it);
    const rhs = it.slice(2), cut = R.tail ? R.tail - 2 : rhs.length, body = rhs.slice(0, cut), d = body.findIndex(x => x.p === '÷');
    const r = d < 0 ? row(rhs) : `<span class="fq"><span class="fq-n">${row(body.slice(0, d))}</span><i class="fq-bar"></i><span class="fq-d">${row(body.slice(d + 1))}</span></span>${row(rhs.slice(cut))}`;
    const head = cell(it[0].s, it[0].t, true) + '<span class="op">=</span>';
    return split ? { head, body: r } : head + r;
  }
  /* the session's own top: the app's bar, ✕ and hearts, so the rule reads as one more step of the lesson */
  function topHtml(pct, safe, hearts, quit) {
    const q = Q();
    return `<div class="session-top">
        <button class="x-btn" onclick="${quit}" aria-label="إنهاء">${q.X_SVG || '✕'}</button>
        <div class="prog-wrap"><div class="progress" role="progressbar" aria-valuenow="${pct}"><i style="width:${pct}%"></i><i class="prog-cool" style="width:${pct}%"></i></div><div class="fx-tag" id="fxTag" aria-hidden="true"></div></div>
        ${safe ? `<span class="sess-hearts sess-review">${call('ico', 'heart', 22) || ''} ∞</span>` : `<span class="sess-hearts" id="sesHearts">${call('ico', 'heart', 22) || ''} ${A(hearts)}</span>`}
      </div>`;
  }
  const REV_IC = `<svg viewBox="0 0 71 65" aria-hidden="true"><g stroke-width="8" stroke-linejoin="round"><polygon points="${HEXLIP}" fill="#E07800" stroke="#E07800"/><polygon points="${HEX}" fill="#FF9600" stroke="#FF9600"/></g>
    <g fill="none" stroke="#fff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"><path d="M47 29a11.5 11.5 0 1 1-3.4-8.2"/><path d="M45.5 15.5v7h-7"/></g></svg>`;
  const revTag = () => `<div class="nw-tag lw-rv"><span class="lw-rv-ic">${REV_IC}</span><span>مراجعة</span></div>`;
  const obs = st => `<div class="obs"><img class="obs-duo" src="${C().FH(st)}" alt=""><div class="obs-say"><p class="obs-bubble"><span class="tx"></span></p></div></div>`;
  let SCR = null;
  /* a screen left by the app (✕, a jump elsewhere) stops its timers and sounds */
  new MutationObserver(() => { if (SCR && !SCR.isConnected) { SCR = null; C().wipe(); } }).observe($app, { childList: true });
  function mount(html) {
    const c = C(), q = Q();
    c.wipe();
    $app.innerHTML = html;
    SCR = $app.firstElementChild;
    c.setCur(SCR); c.setL({ miss: 0 });
    c.setMute(q.S && q.S.sound === false); c.setReduce(call('motionReduced'));
    c.audio();
    return SCR;
  }
  /* a screen's content fits the phone above its button, as the app's own steps do (fitNow): it is drawn at full size and
     zoomed down only as far as it must, never under .66; run again whenever the content grows (a help line, a turn) */
  function fitIn(root) {
    const run = () => {
      const inn = root && root.querySelector('.lw-in'); if (!inn || !inn.isConnected) return;
      const box = inn.parentNode, cs = getComputedStyle(box);
      inn.style.zoom = '';
      const room = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), h = inn.scrollHeight;
      if (h > room + 1) inn.style.zoom = Math.max(.66, Math.floor(room / h * 100) / 100);
    };
    run();
    if (!root._fit) { root._fit = run; addEventListener('resize', () => { if (root.isConnected) run(); }); }
    return run;
  }
  const least = () => innerWidth < 380 ? 12 : 15;
  /* «وش الناقص؟»'s three words stay inside their card: a row too wide for it is set a size or two smaller */
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (!n.classList || !n.classList.contains('kb-pick')) return;
    requestAnimationFrame(() => { let fz = 17; const bs = [...n.querySelectorAll('.kb-ch')];
      while (fz > 12 && n.scrollWidth > n.clientWidth + 1) { fz -= 1; bs.forEach(b => { b.style.fontSize = fz + 'px'; b.style.paddingInline = Math.round(fz * .6) + 'px'; }); } });
  }))).observe(document.body, { childList: true, subtree: true });
  /* fit the drawing into what is left of the screen */
  function drawDia(scr, R) {
    const host = scr.querySelector('#stage'); host.innerHTML = C().DIA[R.key].html();
    const g = host.firstElementChild;
    /* sized to the room the card leaves, and again whenever the card grows or gives room back */
    const size = () => { if (!g.isConnected) return; const W = host.clientWidth - 8, H = host.clientHeight - 4;
      g._s = Math.max(.3, Math.min(W / g.offsetWidth, H / g.offsetHeight, 1.1)); g.style.transform = `translate(-50%, -50%) scale(${g._s})`; };
    size();
    if (host._ro) host._ro.disconnect();
    if (window.ResizeObserver) { host._ro = new ResizeObserver(size); host._ro.observe(host); host._ro.observe(g); }
    scr.querySelector('#dcap').textContent = '';
    return g;
  }
  function proof(scr, R, then) {
    const c = C(), tok = c.run(), alive = () => c.alive(tok) && scr.isConnected, fc = scr.querySelector('#fc');
    c.CARD.reset(fc);
    const st = scr.querySelector('#stage'); st.style.display = '';
    const g = drawDia(scr, R);
    c.anim(g.parentNode, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    const ctl = {
      wait: ms => new Promise(res => setTimeout(() => { if (alive()) res(); }, ms)),
      s: (k, r, v) => { if (alive()) c.snd(k, r, v); },
      cap: t => { const p = scr.querySelector('#dcap'); if (!p || !alive()) return; p.innerHTML = c.fx(t); c.anim(p, c.RISE, { duration: 260 }); },
      val: (slot, text, src) => { if (alive()) c.CARD.val(fc, slot, text, src); },
    };
    c.DIA[R.key].run(g, ctl).then(() => { if (alive()) then(); });
  }

  /* the rule's screen inside a lesson */
  const unitStyle = () => { const q = Q(), S = q.SES, d = window.QBANK[S.domKey], U = q.UNIT_COLORS || {}, u = U[d.color] || U.green || { c: '#58CC02', s: '#58A700', h: '#71DC1A' };
    return `--li-c:${u.c};--li-s:${u.s};--li-h:${u.h}`; };
  function render(it) {
    if (it.fill === 'play') return PLAY[it.law](it);
    if (it.fill) return fillScreen(it);
    const c = C(), q = Q(), S = q.SES, R = rule(it.law);
    const review = status(R.key) !== 'new';
    if (!pending) pending = [];
    if (!pending.some(p => p.k === R.key)) pending.push({ k: R.key, fresh: !review });
    const d = window.QBANK[S.domKey], U = q.UNIT_COLORS || {}, u = U[d.color] || U.green || { c: '#58CC02', s: '#58A700', h: '#71DC1A' };
    const scr = mount(`<div class="screen screen-full screen-session screen-learn law lw-learn" data-fit="off" style="--li-c:${u.c};--li-s:${u.s};--li-h:${u.h}">
      ${topHtml(call('sesPct') || 0, S.safe, S.hearts, 'A.quitSession()')}
      <div class="lw-area">
        ${review ? revTag() : c.nwTag(R)}
        ${obs('teach')}
        <div class="lw-fc" id="fc">${c.CARD.html(R)}</div>
        <div class="stage" id="stage" title="أعد الرسم"></div><p class="dcap" id="dcap"></p>
      </div>
      <div class="action-bar"><button class="btn" id="lwGo" disabled>كمّل</button></div>
      <div class="feedback" id="fb" role="status"></div><div class="storm" id="storm" aria-hidden="true"></div>
    </div>`);
    call('fxPaintBar', S.run);
    let kept = false;
    play(scr, R, review, () => {
      if (review && ST[R.key]) {
        const s = ST[R.key];
        if (!kept) s.due = day() + 1;
        else if (s.due <= day()) { s.lv = Math.min(s.lv + 1, LADDER.length); s.due = day() + LADDER[s.lv - 1]; }
        save();
      }
      c.wipe(); A_next();
    }, () => { kept = true; });
  }
  const A_next = () => window.A.next();

  /* a review asks for every blank it shows, one after another (the user, 2026-11-03: «one فراغ one filling, two فراغ two
     filling»): the name stays, each term is a blank, and each blank gets its own three words; a miss on any counts once */
  function reviewAsk(fc, R, done) {
    const c = C();
    fc._R = R; c.kbFit(fc);
    c.anim(fc.querySelector('.kb-card'), [{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 200, easing: c.XO, fill: 'backwards' });
    const all = [...fc.querySelectorAll('.kb12 .k:not(.ca)')], wd = e => e.querySelector('.kb-w').textContent;
    all.forEach(x => x.classList.add('gap'));
    const terms = all.filter((x, i) => all.findIndex(o => wd(o) === wd(x)) === i);
    const end = c.kbIn(fc, 300, e => !e.matches('.k:not(.ca)'));
    let miss = 0, i = 0;
    const next = () => {
      if (!fc.isConnected) return;
      if (i >= terms.length) { c.fit(fc.querySelector('.kb-fx'), least()); return done(!miss); }
      const k = terms[i++];
      c.kbAsk(fc, k, true, m => { miss += m;
        const twins = all.filter(o => o !== k && wd(o) === wd(k));
        if (twins.length) { twins.forEach(o => o.classList.remove('gap')); c.kbIn(fc, 0, e => twins.includes(e)); }
        c.later(i < terms.length ? 620 : 150, next); });
    };
    c.later(end, next);
  }

  /* ───── «كمّل القانون» and «حطّ الأرقام»: the rule's own card, its blanks filled from tiles ─────
     The rule is drawn as card 13 draws it, so the student fills the same picture they will remember: the name and «=»
     stay (the user, 2026-11-03: «dont add المصافحات as a choice make it المصافحات = and the rest is فراغ»), the rest is
     blank, stacked over its bar when it divides. On the numbers screen every blank carries its term under it (above it in
     a fraction's top), so a student who knows the answer knows which number goes where, the answer's blank too: one blank
     for each thing to find, nothing in between. A miss is tried again on the spot: the wrong ones go red and come back to
     the tiles, the right ones stay, and the help grows — the rule in words, then the tiles that fit nowhere fade, then how
     many are left. It costs no heart. */
  function fillScreen(it) {
    const c = C(), q = Q(), S = q.SES, words = it.fill === 'words', R0 = lfRule(rule(it.law)), N = NUMS[R0.key];
    /* a rule that is an order (القوس ← الأس ← …) asks for the order alone (the user, 2026-11-08, on «أول» and «آخر» offered
       among its steps: «i think this is very bad lesson methods»): no other rule's words, no «الناتج =», each blank
       captioned with its place, so what is tested is the order itself */
    const chain = words && R0.tok.includes('←'), R = chain ? Object.assign({}, R0, { tok: R0.tok.slice(2) }) : R0;
    const PLACE = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً', 'خامساً'];
    const terms = R.tok.filter(x => typeof x !== 'string').map(x => x.t);
    /* the slots to fill, in reading order: the rule's terms, and on the numbers screen the answer last */
    const eqR = R.tok[1] === '=', slots = words ? terms.map((t, i) => i).slice(eqR ? 1 : 0) : terms.map((t, i) => i).slice(1).concat(0);
    const want = slots.map(s => words ? terms[s] : N.v[s]);
    let more;
    if (words) {
      /* never a rule's name: the names stand before «=» and are never a blank */
      const names = RULES().map(r => r.tok[0].t);
      const also = R.notDecoy || { mean: ['الكل'], hand: ['الكل'] }[R.key] || [];
      const pool = [...new Set(RULES().filter(r => r !== R).flatMap(r => r.tok.slice(1).filter(x => typeof x !== 'string').map(x => x.t)))].filter(t => !terms.includes(t) && !names.includes(t) && !also.includes(t) && /[\u0621-\u064A]/.test(t));
      /* the wrong words are about as long as the right ones, so none of them makes the line small for everyone */
      const max = Math.max(...want.map(t => t.length)) + 1, min = Math.min(...want.map(t => t.length)) - 3;
      /* in the lab's versions no wrong word is longer than the shortest right one, so the widest filling is the answer itself */
      const short = Math.min(...want.map(t => t.length));
      const near = pool.filter(t => LFN ? t.length <= short && t.length >= Math.min(3, short) : t.length <= max && t.length >= min);
      const n = want.length > 2 ? 2 : 3;
      more = chain ? [] : R.decoys ? c.shuffle(R.decoys.filter(t => !want.includes(t))).slice(0, 2) : c.shuffle(near.length >= n ? near : pool.slice().sort((a, b) => a.length - b.length).slice(0, n + 1)).slice(0, n);
    } else more = N.more.filter(x => !want.includes(x));
    const tiles = c.shuffle(want.concat(more));
    const cell = (s, t, lhs) => {
      if (words && lhs) return `<span class="k ca"><span class="kb-m"><span class="kb-w">${t}</span></span></span>`;
      const cap = chain ? (s === terms.length - 1 ? 'أخيراً' : PLACE[s]) : words ? '' : t;
      return `<button type="button" class="k lf-b gap${lhs ? ' ans' : ''}" data-s="${s}"><span class="kb-m"><span class="kb-w"></span></span>${cap ? `<span class="kb-c">${cap}</span>` : ''}</button>`;
    };
    const scr = mount(`<div class="screen screen-full screen-session screen-learn law lw-learn lw-fill${words ? ' lf-words' : ' lf-nums'}" data-fit="off" style="${unitStyle()}">
      ${topHtml(call('sesPct') || 0, S.safe, S.hearts, 'A.quitSession()')}
      <div class="lw-area"><div class="lw-in">
        <p class="lf-ask">${chain ? 'رتّبها: مين يبدأ أول؟' : words ? 'كمّل القانون:' : 'حطّ أرقام المثال في القانون:'}</p>
        ${words ? '' : `<div class="lf-ex"><span class="lf-ex-t">المثال</span><p>${c.fx(N.ex)}</p></div>`}
        <div class="lw-fc" id="fc"><div class="kb12 kb13 lf${LFV ? ' lfv' + LFV : ''}${chain ? ' lf-chain' : ''}"><div class="kb-card"><span class="kb-tag">القانون</span>${lfCard(R, cell)}</div></div></div>
        <div class="lf-help" id="lfHelp"></div>
        <div class="ln-tiles lf-tiles">${tiles.map((t, i) => `<button type="button" class="ln-tile" data-i="${i}">${c.fx(t)}</button>`).join('')}</div>
      </div></div>
      <div class="action-bar"><button class="btn" id="lfChk" disabled>تحقق</button></div>
      <div class="feedback" id="fb" role="status"></div><div class="storm" id="storm"></div>
    </div>`);
    call('fxPaintBar', S.run);
    const fc = scr.querySelector('#fc'), line = fc.querySelector('.kb-fx:not(.lf-head)'), chk = scr.querySelector('#lfChk'), help = scr.querySelector('#lfHelp');
    const me = S.queue[S.idx], tried = () => !me || !S.firstTry || me.uid in S.firstTry;
    const B = slots.map(s => fc.querySelector(`.lf-b[data-s="${s}"]`)), T = [...scr.querySelectorAll('.lf-tiles .ln-tile')];
    /* the lab's capture scripts read the answer off the screen they play (tools/law-fill-v2.html) */
    if (LFP) window.LFDBG = { want, tiles, B, T };
    /* one size for the line and every blank, set once: each blank as wide as the widest right word (a longer wrong one is
       clipped inside it), never narrower than the label under it, so placing a tile never moves or shrinks anything */
    const widest = want.reduce((a, b) => (b.length > a.length ? b : a), '');
    const least = words ? (LFN ? 1.7 : 2.9) : 1.9;
    const capW = () => B.forEach(b => { const k = b.querySelector('.kb-c'), m = b.querySelector('.kb-m'), fz = parseFloat(getComputedStyle(m).fontSize); m.style.width = ''; m.style.minWidth = '0';
      m.style.width = Math.max(m.offsetWidth / fz, k ? (k.offsetWidth + 6) / fz : 0, least) + 'em'; });
    /* the versions never shrink a word (the user, 2026-11-04, on «(الفرق − ١)» squeezed into the blank sized for «الفرق»: «fix
       this problem forever»), and their blanks are the regular ones (the same day, on blanks drawn as small circles: «make them
       regular like ours»): every blank as wide as the widest word on offer, measured in the line itself, never narrower than
       the label under it, so any word fits any blank as it is and nothing moves when one lands; the line is sized with that */
    const minW = b => { const k = b.querySelector('.kb-c'), fz = parseFloat(getComputedStyle(b.querySelector('.kb-m')).fontSize); return Math.max(least, k ? (k.offsetWidth + 6) / fz : 0); };
    let top = null;
    const free = () => {
      if (top == null) { const b = B[0], m = b.querySelector('.kb-m'), w = b.querySelector('.kb-w'); m.style.width = ''; m.style.minWidth = '0';
        top = tiles.map(t => { w.innerHTML = c.fx(t); return [m.offsetWidth, t]; }).sort((x, y) => y[0] - x[0])[0][1]; }
      B.forEach(b => { const m = b.querySelector('.kb-m'); m.style.width = ''; m.style.minWidth = minW(b) + 'em'; b.querySelector('.kb-w').innerHTML = c.fx(top); });
      B.forEach(b => { const m = b.querySelector('.kb-m'), fz = parseFloat(getComputedStyle(m).fontSize); m.style.minWidth = m.offsetWidth / fz + 'em'; });
    };
    B.forEach(b => { b.querySelector('.kb-w').innerHTML = c.fx(widest); b.classList.remove('gap'); });
    const long = LFV === 5 ? (capW(), c.fit(line, 12), capW(), c.fit(line, 12), false) : LFN ? (fitLine(line, free, 30, 10), false) : bigLine(line, capW);
    const fs = line.style.fontSize;
    B.forEach(b => { b.querySelector('.kb-w').innerHTML = ''; b.classList.add('gap'); });
    line.style.fontSize = fs;
    const put = B.map(() => null), lock = B.map(() => false);
    let target = 0, misses = 0, done = false;
    const lens = LFV === 3 ? lensOf(fc, B) : null;
    const cam = long ? camera(fc, line, B, i => { if (done) return; if (put[i] == null && !lock[i]) { target = i; mark(); } else cam.follow(i, false, 0); }) : null;
    const mark = () => {
      if (put[target] != null || lock[target]) { const n = put.findIndex((x, i) => x == null && !lock[i]); target = n < 0 ? target : n; }
      B.forEach((b, i) => b.classList.toggle('ask', !done && put[i] == null && i === target));
      chk.disabled = put.some(x => x == null);
      if (cam) cam.follow(target, done || put.every(x => x != null), 280);
      if (lens) lens.show(target, done || put.every(x => x != null));
    };
    const order = [];
    const place = (i, ti, src) => {
      put[i] = ti; T[ti].classList.add('used'); order.push(i);
      const b = B[i], m = b.querySelector('.kb-m'), was = m.offsetWidth;
      b.classList.remove('gap', 'ask', 'no'); const w = b.querySelector('.kb-w'); w.style.fontSize = ''; w.innerHTML = c.fx(tiles[ti]);
      if (LFN) grow(m, was);
      else {
        /* a word longer than its blank shrinks inside it: measured at its own width against the blank's room inside its padding */
        const ms = getComputedStyle(m), room = m.clientWidth - parseFloat(ms.paddingLeft) - parseFloat(ms.paddingRight) - 2;
        w.style.maxWidth = 'none'; const over = w.scrollWidth / Math.max(1, room); w.style.maxWidth = '';
        if (over > 1) w.style.fontSize = Math.max(.55, 1 / over) + 'em';
      }
      if (src) c.flyFrom(lens ? lens.hold(i) : m, src, 320, 18);
    };
    const unplace = i => { const ti = put[i]; if (ti == null) return; T[ti].classList.remove('used'); put[i] = null; order.splice(order.indexOf(i), 1); const b = B[i], m = b.querySelector('.kb-m'), was = m.offsetWidth; b.classList.add('gap'); b.classList.remove('no'); b.querySelector('.kb-w').innerHTML = ''; if (LFN) grow(m, was); };
    /* a blank takes its new word's width with a little spring, and the line steps down a size if it ever had to (it never should) */
    const grow = (m, was) => {
      const now = m.offsetWidth;
      if (Math.abs(now - was) > 1) c.anim(m, [{ width: was + 'px' }, { width: now + 'px' }], { duration: 260, easing: 'cubic-bezier(.3,1.25,.5,1)' });
      for (let f = parseFloat(line.style.fontSize); line.scrollWidth > line.clientWidth + 1 && f > 10; f--) line.style.fontSize = f - 1 + 'px';
    };
    T.forEach((t, ti) => t.onclick = () => {
      if (done || t.classList.contains('used') || t.classList.contains('out')) return;
      let i = put[target] == null && !lock[target] ? target : put.findIndex((x, j) => x == null && !lock[j]);
      if (i < 0) return;
      place(i, ti, t); call('snd', 'choice-select', null, 'assessment-click-option-' + (Math.min(i, 3) + 1)); c.buzz(5);
      mark();
    });
    B.forEach((b, i) => b.onclick = () => {
      if (done || lock[i]) return;
      if (put[i] != null) { unplace(i); c.snd('off', 1, .35); }
      target = i; mark();
    });
    /* the rule's terms play in either order where the rule does: a product's factors, a sum's terms */
    const swaps = (R.wswap ? [R.wswap] : []).map(([a, b]) => [slots.indexOf(a), slots.indexOf(b)]).filter(([a, b]) => a >= 0 && b >= 0);
    if (!words) slots.forEach((s, a) => slots.forEach((u, b) => { if (a < b && terms[s] === terms[u] && !swaps.some(p => p[0] === a && p[1] === b)) swaps.push([a, b]); }));
    chk.onclick = () => {
      if (done || put.some(x => x == null)) return;
      const got = put.map(ti => tiles[ti]);
      swaps.forEach(([a, b]) => { if (lock[a] || lock[b] || want[a] === want[b]) return;
        if ((got[a] === want[b] && got[b] !== want[b]) || (got[b] === want[a] && got[a] !== want[a])) { const x = want[a]; want[a] = want[b]; want[b] = x; } });
      const left = want.slice(), ok = R.any ? got.map(g => { const j = left.indexOf(g); if (j < 0) return false; left.splice(j, 1); return true; }) : got.map((g, i) => g === want[i]);
      /* two blanks that take the same word (آحاد × آحاد) take it either way */
      want.forEach((w, i) => { if (!ok[i] && want.indexOf(got[i]) >= 0 && want.filter(x => x === got[i]).length > 1) ok[i] = true; });
      if (ok.every(Boolean)) {
        done = true; mark();
        /* the chip jumps and its caption under it stays where it is */
        order.forEach((i, n) => c.later(n * 60, () => { c.kbWave(B[i].querySelector('.kb-m')); c.later(100, () => B[i].classList.add('ok')); }));
        if (!tried()) { S.firstTry[me.uid] = true; S.run = (S.run || 0) + 1; }
        call('fxPaintBar', S.run); call('paintProg', S.idx + 1);
        call('playCorrect'); c.buzz(12);
        T.forEach(t => { t.disabled = true; });
        chk.parentNode.style.visibility = 'hidden';
        const fb = scr.querySelector('#fb');
        fb.className = 'feedback good show has-crest';
        fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true"><path class="fb-crest-fill"></path><path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path></svg>
          <div class="fb-row"><div class="fb-head"><span class="fb-ok">${q.CHECK_BADGE || ''}</span> ${misses ? 'صح!' : c.pick(['ممتاز!', 'أحسنت!', 'بالضبط!'])}</div></div>
          <div class="ln-fb-note">${words ? 'حفظت القانون بكلماته' : c.fx(numLine(R, N))}</div>
          <button class="btn" id="lfNext">متابعة</button>`;
        call('fxDrawCrest');
        fb.querySelector('#lfNext').onclick = () => { c.wipe(); A_next(); };
        return;
      }
      misses++;
      if (!tried()) S.firstTry[me.uid] = false;
      S.run = 0; call('fxPaintBar', 0);
      B.forEach((b, i) => { if (ok[i]) { lock[i] = true; b.classList.add('lk'); } else { b.classList.add('no'); c.anim(b, c.SHAKE, { duration: 380 }); } });
      call('snd', 'wrong-answer', () => call('sndBad')); c.buzz([30, 40, 30]);
      chk.disabled = true;
      c.later(750, () => {
        B.forEach((b, i) => { if (!ok[i]) unplace(i); });
        target = ok.findIndex(x => !x); mark();
        const left = ok.filter(x => !x).length;
        let h;
        /* the first help points at the blank that is wrong: a term is read off the example, the answer is worked out */
        const bad = ok.findIndex(x => !x), bs = slots[bad];
        const say = chain ? `في ${N.ex.replace(/ = ؟$/, '')}: وش تحسب أول؟ وبعده؟` : words ? `فكّر بمثال: ${numLine(R, N)}`
          : bs === 0 ? `احسبها: ${numLine(R, N).replace(/ = [^=]*$/, '')} = ؟` : (N.hint && N.hint[bs]) || `«${terms[bs]}» في المثال كم؟`;
        if (misses === 1 || (chain && misses === 2)) h = `<img src="${c.FH('encourage')}" alt=""><p>${c.fx(say)}</p>`;
        else {
          if (misses === 2) T.forEach((t, ti) => { if (!want.includes(tiles[ti]) && !t.classList.contains('used')) { t.classList.add('out'); t.disabled = true; } });
          h = `<img src="${c.FH('encourage')}" alt=""><p>${misses === 2 ? 'شلت لك البطاقات اللي ما لها مكان.' : left === 1 ? 'باقي فراغ واحد، فكّر فيه مرة ثانية.' : left === 2 ? 'باقي فراغين، فكّر فيهم مرة ثانية.' : `باقي ${A(left)} فراغات، فكّر فيها مرة ثانية.`}</p>`;
        }
        help.innerHTML = h; help.classList.add('on'); fitIn(scr); c.anim(help, c.RISE, { duration: 280 });
      });
    };
    mark(); fitIn(scr);
    /* the screen comes in as the lesson's do: the card, then the tiles one after another */
    c.anim(fc.querySelector('.kb-card'), c.RISE, { duration: 360, delay: 120, easing: 'ease-out', fill: 'backwards' });
    T.forEach((t, i) => c.anim(t, c.RISE, { duration: 280, delay: 320 + i * 50, easing: 'ease-out', fill: 'backwards' }));
  }
  /* «الأعداد المكمّلة» is practised as the trick itself, not copied into blanks (the user, 2026-11-08, on «كمّل الخطوة» with
     the pairs: «people here will get a lot of thing wrong although they knew the right answer … we want the best lesson
     methods»): six numbers, three pairs that make ١٠٠. A tap picks a number and a second tap pairs it: right, the two fly into
     the next «☐ + ☐ = ١٠٠» and wave green on a tally a step higher; wrong, both shake and the sum they do make is said, and
     from the second miss the trick behind it (the units make ١٠, the tens ٩). Every tap is judged at once, so a slip never
     waits for «تحقق» to fail a whole screen, and a replay brings new numbers */
  const pairNums = to => {
    const ns = [], lo = to / 10 + 1, hi = to - lo;
    while (ns.length < 6) { const a = lo + Math.floor(Math.random() * (hi - lo + 1)); if (a % 10 === 0 || a * 2 === to || ns.includes(a) || ns.includes(to - a)) continue; ns.push(a, to - a); }
    for (let t = 0; t < 60; t++) { const o = C().shuffle(ns.slice()); if (o.every((x, i) => i === 0 || x + o[i - 1] !== to)) return o; }
    return ns;
  };
  function pairScreen(it) {
    const c = C(), q = Q(), S = q.SES, A2 = c.toAr, to = PAIRS[it.law], ns = pairNums(to), n3 = ns.length / 2;
    const scr = mount(`<div class="screen screen-full screen-session screen-learn law lw-learn lw-fill lw-pairs" data-fit="off" style="${unitStyle()}">
      ${topHtml(call('sesPct') || 0, S.safe, S.hearts, 'A.quitSession()')}
      <div class="lw-area"><div class="lw-in">
        <p class="lf-ask">وصّل كل عددين مجموعهم ${A2(to)}:</p>
        <div class="pr-box">
          <p class="pr-q">${ns.map((n, i) => `<span class="pr-n" data-i="${i}">${A2(n)}</span>`).join('<i>+</i>')}</p>
          ${ns.slice(0, n3).map(() => `<p class="pr-row"><span class="pr-chip gap"></span><i>+</i><span class="pr-chip gap"></span><i>=</i><span class="pr-to">${A2(to)}</span></p>`).join('')}
          <p class="pr-sum"><i>=</i>${ns.slice(0, n3).map(() => `<span>${A2(to)}</span>`).join('<i>+</i>')}<i>=</i><b class="pr-tot">${A2(to * n3)}</b></p><p class="pr-wait"><i>=</i>؟</p>
        </div>
        <div class="lf-help" id="lfHelp"></div>
        <div class="pr-tiles">${ns.map((n, i) => `<button type="button" class="ln-tile pr-t" data-i="${i}">${A2(n)}</button>`).join('')}</div>
      </div></div>
      <div class="action-bar"><button class="btn" id="lfChk" disabled style="visibility:hidden" aria-hidden="true" tabindex="-1">تحقق</button></div>
      <div class="feedback" id="fb" role="status"></div><div class="storm" id="storm"></div>
    </div>`);
    call('fxPaintBar', S.run);
    const T = [...scr.querySelectorAll('.pr-t')], Ns = [...scr.querySelectorAll('.pr-n')], rows = [...scr.querySelectorAll('.pr-row')], help = scr.querySelector('#lfHelp'), chk = scr.querySelector('#lfChk');
    const me = S.queue[S.idx], tried = () => !me || !S.firstTry || me.uid in S.firstTry;
    let sel = -1, made = 0, misses = 0;
    const say = html => { help.innerHTML = `<img src="${c.FH('encourage')}" alt=""><p>${html}</p>`; help.classList.add('on'); fitIn(scr); c.anim(help, c.RISE, { duration: 260 }); };
    const win = () => {
      const sum = scr.querySelector('.pr-sum'), tot = sum.querySelector('.pr-tot');
      scr.querySelector('.pr-box').classList.add('sum'); c.anim(sum, c.RISE, { duration: 320 });
      c.later(340, () => { c.anim(tot, c.POP, { duration: 420 }); c.snd('on', 1.2, .4); });
      if (!tried()) { S.firstTry[me.uid] = true; S.run = (S.run || 0) + 1; }
      call('fxPaintBar', S.run); call('paintProg', S.idx + 1);
      c.later(700, () => {
        call('playCorrect'); c.buzz(12);
        chk.parentNode.style.visibility = 'hidden';
        const fb = scr.querySelector('#fb');
        fb.className = 'feedback good show has-crest';
        fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true"><path class="fb-crest-fill"></path><path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path></svg>
          <div class="fb-row"><div class="fb-head"><span class="fb-ok">${q.CHECK_BADGE || ''}</span> ${misses ? 'صح!' : c.pick(['ممتاز!', 'أحسنت!', 'بالضبط!'])}</div></div>
          <div class="ln-fb-note">${A2(n3)} أزواج × ${A2(to)} = ${A2(to * n3)}</div>
          <button class="btn" id="lfNext">متابعة</button>`;
        call('fxDrawCrest');
        fb.querySelector('#lfNext').onclick = () => { c.wipe(); A_next(); };
      });
    };
    T.forEach((t, i) => t.onclick = () => {
      if (made === n3 || t.disabled) return;
      if (sel === i) { t.classList.remove('sel'); sel = -1; c.snd('off', 1, .3); return; }
      if (sel < 0) { sel = i; t.classList.add('sel'); call('snd', 'pair-pick', () => {}); c.buzz(5); return; }
      const j = sel, a = ns[j], b = ns[i]; sel = -1; T[j].classList.remove('sel');
      if (a + b === to) {
        const row = rows[made++], ch = [...row.querySelectorAll('.pr-chip')];
        [j, i].forEach((k, n) => { ch[n].textContent = A2(ns[k]); ch[n].classList.remove('gap'); T[k].classList.add('used'); T[k].disabled = true; Ns[k].classList.add('on'); c.flyFrom(ch[n], T[k], 380, 22); });
        c.later(360, () => { ch.forEach((x, n) => c.later(n * 50, () => c.kbWave(x))); row.classList.add('ok'); c.anim(row.querySelector('.pr-to'), c.POP, { duration: 360, delay: 120 }); });
        call('snd', 'pair-match', () => {}, 'xp-tally-' + made); c.buzz(10);
        help.classList.remove('on');
        if (made === n3) c.later(950, win);
        return;
      }
      misses++;
      if (!tried()) S.firstTry[me.uid] = false;
      S.run = 0; call('fxPaintBar', 0);
      [T[j], T[i]].forEach(x => { x.classList.add('no'); c.anim(x, c.SHAKE, { duration: 380 }); c.later(560, () => x.classList.remove('no')); });
      call('snd', 'pair-miss', () => call('sndBad')); c.buzz([30, 40, 30]);
      say(`${A2(a)} + ${A2(b)} = ${A2(a + b)}، مو ${A2(to)}.${misses > 1 ? `<br>الحيلة: الآحاد تكمّل ${A2(10)}، والعشرات تكمّل ${A2(to / 10 - 1)}.` : ''}`);
    });
    fitIn(scr);
    c.anim(scr.querySelector('.pr-box'), c.RISE, { duration: 360, delay: 120, easing: 'ease-out', fill: 'backwards' });
    T.forEach((t, i) => c.anim(t, c.RISE, { duration: 280, delay: 320 + i * 50, easing: 'ease-out', fill: 'backwards' }));
  }
  /* ───── the rule done by hand (the user, 2026-11-08, after the pairs screen: «better better better»): three more rules
     practised as the trick itself, every tap judged at once, no «تحقق», the green sheet when it is done ───── */
  const PEOPLE = ['#1CB0F6', '#FF4B4B', '#CE82FF', '#FF9600', '#58CC02', '#2B70C9', '#FF86D0'];
  const personSvg = (c, me) => `<svg viewBox="0 0 40 48" aria-hidden="true"><circle cx="20" cy="13" r="10" fill="${c}"/><path d="M4 46c0-11 7-18 16-18s16 7 16 18z" fill="${c}"/>${me ? '<circle cx="20" cy="13" r="12.5" fill="none" stroke="#FFC800" stroke-width="3"/>' : ''}</svg>`;
  /* the frame every one of them shares: the ask, the white box, فهيم's help, the button's place kept empty, the sheet */
  function playFrame(it, cls, ask, box, under) {
    const S = Q().SES;
    const scr = mount(`<div class="screen screen-full screen-session screen-learn law lw-learn lw-fill lw-play ${cls}" data-fit="off" style="${unitStyle()}">
      ${topHtml(call('sesPct') || 0, S.safe, S.hearts, 'A.quitSession()')}
      <div class="lw-area"><div class="lw-in">
        <p class="lf-ask">${ask}</p>
        <div class="pr-box pl-box">${box}</div>
        <div class="lf-help" id="lfHelp"></div>
        ${under || ''}
      </div></div>
      <div class="action-bar"><button class="btn" id="lfChk" disabled style="visibility:hidden" aria-hidden="true" tabindex="-1">تحقق</button></div>
      <div class="feedback" id="fb" role="status"></div><div class="storm" id="storm"></div>
    </div>`);
    call('fxPaintBar', S.run);
    const c = C(), me = S.queue[S.idx], help = scr.querySelector('#lfHelp');
    const tried = () => !me || !S.firstTry || me.uid in S.firstTry;
    const P = { scr, misses: 0,
      say: html => { help.innerHTML = `<img src="${c.FH('encourage')}" alt=""><p>${html}</p>`; help.classList.add('on'); fitIn(scr); c.anim(help, c.RISE, { duration: 260 }); },
      hush: () => help.classList.remove('on'),
      miss: (els, html) => {
        P.misses++;
        if (!tried()) S.firstTry[me.uid] = false;
        S.run = 0; call('fxPaintBar', 0);
        els.forEach(x => { x.classList.add('no'); c.anim(x, c.SHAKE, { duration: 380 }); c.later(560, () => x.classList.remove('no')); });
        call('snd', 'pair-miss', () => call('sndBad')); c.buzz([30, 40, 30]);
        P.say(html);
      },
      step: n => { call('snd', 'pair-match', () => {}, 'xp-tally-' + Math.min(n, 5)); c.buzz(10); },
      win: note => {
        if (!tried()) { S.firstTry[me.uid] = true; S.run = (S.run || 0) + 1; }
        call('fxPaintBar', S.run); call('paintProg', S.idx + 1);
        c.later(650, () => {
          call('playCorrect'); c.buzz(12);
          const fb = scr.querySelector('#fb');
          fb.className = 'feedback good show has-crest';
          fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true"><path class="fb-crest-fill"></path><path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path></svg>
            <div class="fb-row"><div class="fb-head"><span class="fb-ok">${Q().CHECK_BADGE || ''}</span> ${P.misses ? 'صح!' : c.pick(['ممتاز!', 'أحسنت!', 'بالضبط!'])}</div></div>
            <div class="ln-fb-note">${note}</div>
            <button class="btn" id="lfNext">متابعة</button>`;
          call('fxDrawCrest');
          fb.querySelector('#lfNext').onclick = () => { c.wipe(); A_next(); };
        });
      },
      /* the formula line under the stage: hidden until the trick is done, then it rises and its numbers pop one by one */
      reveal: el => { el.classList.add('on'); c.anim(el, c.RISE, { duration: 320 }); el.querySelectorAll('b').forEach((b, i) => c.anim(b, c.POP, { duration: 380, delay: 200 + i * 160, fill: 'backwards' })); }
    };
    fitIn(scr);
    c.anim(scr.querySelector('.pl-box'), c.RISE, { duration: 360, delay: 120, easing: 'ease-out', fill: 'backwards' });
    return P;
  }

  /* المصافحات: four people; tap two and they shake hands — a line between them, each one's count of hands, the total;
     a pair that already shook hands shakes. Done, the rule writes itself with the numbers: ٤ × ٣ ÷ ٢ = ٦ */
  function shakeScreen(it) {
    const c = C(), A2 = c.toAr, n = 4, total = n * (n - 1) / 2, NAMES = ['أ', 'ب', 'ج', 'د'];
    const at = [[70, 46], [210, 46], [210, 150], [70, 150]];
    const people = at.map(([x, y], i) => `<g class="hs-p" data-i="${i}" transform="translate(${x} ${y})"><circle class="hs-ring" r="27"/><circle r="22" fill="${PEOPLE[i]}"/><text y="7">${NAMES[i]}</text><g class="hs-n" transform="translate(19 -19)"><circle r="10"/><text y="4">${A2(0)}</text></g></g>`).join('');
    const P = playFrame(it, 'lw-shake', 'كل اثنين يتصافحون مرة. اضغط على اثنين يتصافحون:',
      `<svg class="hs-stage" viewBox="0 0 280 196"><g class="hs-lines"></g>${people}</svg>
       <p class="pl-count">المصافحات: <b id="hsN">${A2(0)}</b></p>
       <p class="pl-f" id="plF">كل واحد صافح <b>${A2(n - 1)}</b>، وهم <b>${A2(n)}</b>: ${A2(n)} × ${A2(n - 1)} = ${A2(n * (n - 1))}، وكل مصافحة انحسبت مرتين: ÷ ٢ = <b>${A2(total)}</b></p>`);
    const scr = P.scr, svg = scr.querySelector('.hs-stage'), lines = svg.querySelector('.hs-lines'), G = [...svg.querySelectorAll('.hs-p')];
    const done = new Set(), deg = Array(n).fill(0);
    let sel = -1;
    G.forEach((g, i) => g.addEventListener('click', () => {
      if (done.size === total) return;
      if (sel === i) { g.classList.remove('sel'); sel = -1; c.snd('off', 1, .3); return; }
      if (sel < 0) { sel = i; g.classList.add('sel'); call('snd', 'pair-pick', () => {}); c.buzz(5); return; }
      const a = sel, k = [a, i].sort().join(); sel = -1; G[a].classList.remove('sel');
      if (done.has(k)) { P.miss([G[a], G[i]], `«${NAMES[a]}» و«${NAMES[i]}» تصافحوا قبل! كل اثنين مرة وحدة بس.`); return; }
      done.add(k); P.hush();
      const [x1, y1] = at[a], [x2, y2] = at[i], ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      Object.entries({ x1, y1, x2, y2 }).forEach(([q, v]) => ln.setAttribute(q, v));
      lines.appendChild(ln);
      const len = Math.hypot(x2 - x1, y2 - y1);
      c.anim(ln, [{ strokeDasharray: `${len}`, strokeDashoffset: `${len}` }, { strokeDasharray: `${len}`, strokeDashoffset: '0' }], { duration: 320, easing: 'ease-out' });
      [a, i].forEach(p => { deg[p]++; const t = G[p].querySelector('.hs-n'); t.querySelector('text').textContent = A2(deg[p]); t.classList.add('on'); c.anim(t, c.POP, { duration: 320 }); if (deg[p] === n - 1) G[p].classList.add('full'); });
      const cnt = scr.querySelector('#hsN'); cnt.textContent = A2(done.size); c.anim(cnt, c.POP, { duration: 320 });
      P.step(done.size);
      if (done.size === total) c.later(500, () => { P.reveal(scr.querySelector('#plF')); P.win(`${A2(n)} × (${A2(n)} − ١) ÷ ٢ = ${A2(total)}`); });
    }));
  }

  /* مبدأ العدّ: three shirts, two trousers; a shirt and a pair of trousers make an outfit, which lands in its own cell of
     the 3 × 2 grid; the same outfit twice shakes. Done: ٣ × ٢ = ٦ */
  function outfitScreen(it) {
    const c = C(), A2 = c.toAr, SH = ['#1CB0F6', '#FF4B4B', '#58CC02'], PA = ['#3C3C3C', '#C8A064'];
    const shirt = col => `<svg viewBox="0 0 48 40" aria-hidden="true"><path d="M16 3 6 9l-4 10 7 3 3-6v22h24V16l3 6 7-3-4-10-10-6c-1 4-4 6-8 6s-7-2-8-6z" fill="${col}"/></svg>`;
    const pants = col => `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M6 3h28l3 42h-11l-6-26-6 26H3z" fill="${col}"/></svg>`;
    const cell = (r, s) => `<span class="of-c" data-r="${r}" data-s="${s}"></span>`;
    const P = playFrame(it, 'lw-outfit', 'كوّن كل اللبسات: اضغط قميص وبعده بنطلون:',
      `<div class="of-grid">${PA.map((p, r) => SH.map((x, s) => cell(r, s)).join('')).join('')}</div>
       <p class="pl-count">اللبسات: <b id="ofN">${A2(0)}</b></p>
       <p class="pl-f" id="plF">${A2(SH.length)} قمصان، ومع كل قميص ${A2(PA.length)} بناطيل: <b>${A2(SH.length)}</b> × <b>${A2(PA.length)}</b> = <b>${A2(SH.length * PA.length)}</b></p>`,
      `<div class="of-row">${SH.map((x, s) => `<button type="button" class="ln-tile of-t" data-s="${s}" aria-label="قميص">${shirt(x)}</button>`).join('')}</div>
       <div class="of-row">${PA.map((x, r) => `<button type="button" class="ln-tile of-t" data-r="${r}" aria-label="بنطلون">${pants(x)}</button>`).join('')}</div>`);
    const scr = P.scr, total = SH.length * PA.length, made = new Set(), T = [...scr.querySelectorAll('.of-t')];
    let pick = null;
    T.forEach(t => t.addEventListener('click', () => {
      if (made.size === total) return;
      const isS = t.dataset.s != null;
      if (pick && pick.el === t) { t.classList.remove('sel'); pick = null; c.snd('off', 1, .3); return; }
      if (!pick || (pick.s != null) === isS) { if (pick) pick.el.classList.remove('sel'); pick = { el: t, s: isS ? +t.dataset.s : null, r: isS ? null : +t.dataset.r }; t.classList.add('sel'); call('snd', 'pair-pick', () => {}); c.buzz(5); return; }
      const s = isS ? +t.dataset.s : pick.s, r = isS ? pick.r : +t.dataset.r, from = pick.el; pick = null; from.classList.remove('sel');
      const k = r + ':' + s, box = scr.querySelector(`.of-c[data-r="${r}"][data-s="${s}"]`);
      if (made.has(k)) { P.miss([from, t, box], 'هذي اللبسة سويتها قبل! جرّب قميص مع بنطلون ما اجتمعوا.'); return; }
      made.add(k); P.hush();
      box.innerHTML = shirt(SH[s]) + pants(PA[r]); box.classList.add('on');
      c.flyFrom(box, t, 380, 20);
      c.later(360, () => c.kbWave(box));
      const cnt = scr.querySelector('#ofN'); cnt.textContent = A2(made.size); c.anim(cnt, c.POP, { duration: 320 });
      P.step(made.size);
      if (made.size === total) c.later(600, () => { P.reveal(scr.querySelector('#plF')); T.forEach(x => { x.disabled = true; }); P.win(`عدد الطرق = ${A2(SH.length)} × ${A2(PA.length)} = ${A2(total)}`); });
    }));
  }

  /* الترتيب من الطرفين: «أنت» in a queue; add people in front and behind until your place from each end is the example's,
     then say how many are in it — the trap (adding the two places) shakes, and فهيم says why: you were counted twice */
  function queueScreen(it) {
    const c = C(), A2 = c.toAr, f = 2 + Math.floor(Math.random() * 3), b = 2 + Math.floor(Math.random() * 3), n = f + b - 1;
    const P = playFrame(it, 'lw-queue', `ترتيبك <b>${A2(f)}</b> من الأمام و<b>${A2(b)}</b> من الخلف. كوّن الطابور:`,
      `<div class="qu-ends"><span>الأمام</span><span>الخلف</span></div>
       <div class="qu-line" id="quLine"><span class="qu-p me">${personSvg('#FFC800', true)}<i>أنت</i></span></div>
       <div class="qu-tags"><span id="quF">من الأمام: <b>${A2(1)}</b> / ${A2(f)}</span><span id="quB">من الخلف: <b>${A2(1)}</b> / ${A2(b)}</span></div>
       <p class="pl-f" id="plF">أنت انحسبت مرتين، مرة من الأمام ومرة من الخلف: <b>${A2(f)}</b> + <b>${A2(b)}</b> − ١ = <b>${A2(n)}</b></p>`,
      `<div class="qu-add"><button type="button" class="ln-tile qu-t" data-w="f">+ قدّامي</button><button type="button" class="ln-tile qu-t" data-w="b">+ ورائي</button></div>
       <div class="qu-ask" id="quAsk"><p>كم واحد في الطابور؟</p><div>${c.shuffle([n, f + b, n - 1]).map(v => `<button type="button" class="ln-tile qu-c" data-v="${v}">${A2(v)}</button>`).join('')}</div></div>`);
    const scr = P.scr, line = scr.querySelector('#quLine'), me = line.querySelector('.me'), add = [...scr.querySelectorAll('.qu-t')], ask = scr.querySelector('#quAsk');
    let front = 0, back = 0, k = 0;
    const tag = (id, v, want) => { const t = scr.querySelector(id); t.querySelector('b').textContent = A2(v); c.anim(t.querySelector('b'), c.POP, { duration: 300 }); if (v === want) { t.classList.add('ok'); c.kbWave(t); } };
    add.forEach(btn => btn.addEventListener('click', () => {
      const w = btn.dataset.w;
      if ((w === 'f' && front === f - 1) || (w === 'b' && back === b - 1)) {
        P.miss([btn], w === 'f' ? `لو زدت واحد قدّامك صرت ال${A2(f + 1)} من الأمام، والمثال يقول ${A2(f)}.` : `لو زدت واحد وراك صرت ال${A2(b + 1)} من الخلف، والمثال يقول ${A2(b)}.`);
        return;
      }
      P.hush();
      const p = document.createElement('span'); p.className = 'qu-p'; p.innerHTML = personSvg(PEOPLE[k++ % PEOPLE.length]);
      if (w === 'f') { line.insertBefore(p, line.firstChild); front++; tag('#quF', front + 1, f); }
      else { line.appendChild(p); back++; tag('#quB', back + 1, b); }
      c.anim(p, [{ opacity: 0, transform: `translateX(${w === 'f' ? 30 : -30}px) scale(.6)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.3,1.4,.5,1)' });
      call('snd', 'pair-pick', () => {}); c.buzz(6);
      if (front === f - 1) add[0].disabled = true;
      if (back === b - 1) add[1].disabled = true;
      if (front === f - 1 && back === b - 1) c.later(400, () => { scr.querySelector('.qu-add').classList.add('gone'); ask.classList.add('on'); fitIn(scr); c.anim(ask, c.RISE, { duration: 320 }); });
    }));
    scr.querySelectorAll('.qu-c').forEach(btn => btn.addEventListener('click', () => {
      if (btn.disabled || ask.classList.contains('done')) return;
      const v = +btn.dataset.v;
      if (v !== n) {
        btn.disabled = true;
        P.miss([btn], v === f + b ? `عدّهم واحد واحد: «أنت» انحسبت مرتين، مرة من الأمام ومرة من الخلف.` : `عدّهم واحد واحد في الطابور.`);
        if (v === f + b) { me.classList.add('twice'); c.anim(me, c.PULSE || c.POP, { duration: 600 }); }
        return;
      }
      ask.classList.add('done'); P.hush();
      c.kbWave(btn); P.step(3);
      P.reveal(scr.querySelector('#plF'));
      P.win(`العدد = ${A2(f)} + ${A2(b)} − ١ = ${A2(n)}`);
    }));
  }
  const PLAY = { tens: it => pairScreen(it), hand: shakeScreen, ways: outfitScreen, queue: queueScreen };

  /* the fill's line is never small and never broken (the user, 2026-11-04: «very small when i filling them», then «its very bad
     UX to have it in multiple lines … but small law is also bad UX»): a rule that fits one line at 22px or more is drawn so;
     a longer one stays one line at 28px and the card becomes a camera on it (`camera`). `size` lays the blanks out again at
     each size, since their labels do not scale. Returns true when the camera is needed */
  /* the card's inside for each version: 1 and 4 lift the name and «=» into a title over the formula, 3 adds the lens */
  function lfCard(R, cell) {
    if (LFV !== 1 && LFV !== 4) return `<div class="kb-fx">${formula(R, cell)}</div>${LFV === 3 ? '<div class="lf-lens" aria-hidden="true"></div>' : ''}`;
    const f = formula(R, cell, true);
    return `${f.head ? `<div class="kb-fx lf-head">${f.head}</div>` : ''}<div class="kb-fx">${f.body}</div>`;
  }
  /* the largest size from hi down that keeps the line inside its card, never under lo */
  function fitLine(line, size, hi, lo) {
    const over = () => line.scrollWidth > line.clientWidth + 1;
    for (let fs = hi; fs > lo; fs--) { line.style.fontSize = fs + 'px'; size(); if (!over()) return fs; }
    line.style.fontSize = lo + 'px'; size();
    return lo;
  }
  /* version 3: the whole rule stays in the card as it fits, and under it a lens shows the blank being filled big, between the
     words on either side of it, with a dot per blank; a word dropped in stays in the lens a moment, then the next blank slides in */
  function lensOf(fc, B) {
    const c = C(), box = fc.querySelector('.lf-lens');
    let cur = -1, timer = 0, held = false;
    const draw = i => {
      const b = B[i], row = document.createElement('div'); row.className = 'kb-fx lf-lens-row';
      /* a blank at the edge of a fraction's top reads on past it: «=» before it, «÷ ٢» after it */
      const fq = b.parentNode.classList.contains('fq-n') ? b.parentNode.parentNode : null;
      const prev = b.previousElementSibling || (fq && fq.previousElementSibling);
      let next = b.nextElementSibling;
      if (!next && fq) { next = document.createElement('span'); next.style.display = 'inline-flex'; next.style.gap = '.2em';
        next.innerHTML = '<span class="op"><i class="dv"></i></span>' + fq.querySelector('.fq-d').innerHTML; }
      [prev, b, next].forEach(el => {
        if (!el) return;
        const k = el.cloneNode(true); k.removeAttribute('data-s'); k.tabIndex = -1;
        k.classList.add(el === b ? 'lf-me' : 'lf-near'); row.appendChild(k);
      });
      box.replaceChildren(row);
      box.insertAdjacentHTML('beforeend', `<div class="lf-dots">${B.map((x, n) => `<i class="${n === i ? 'cur' : x.classList.contains('gap') ? '' : 'on'}"></i>`).join('')}</div>`);
      return row;
    };
    return {
      hold(i) { clearTimeout(timer); cur = i; held = true; return draw(i).querySelector('.lf-me .kb-m'); },
      show(i, all) {
        clearTimeout(timer);
        const go = () => {
          if (!box.isConnected) return;
          box.classList.toggle('off', all);
          if (all) { cur = -1; return; }
          const moved = i !== cur; cur = i;
          const row = draw(i);
          if (moved) c.anim(row, [{ opacity: 0, transform: 'translateX(-30px)' }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.3,1.3,.45,1)' });
        };
        const wait = held ? 480 : 0; held = false;
        wait ? (timer = setTimeout(go, wait)) : go();
      },
    };
  }
  function bigLine(line, size) {
    const over = () => line.scrollWidth > line.clientWidth + 1;
    for (let fs = 30; fs >= 22; fs--) { line.style.fontSize = fs + 'px'; size(); if (!over()) return false; }
    line.style.fontSize = '28px'; size();
    return true;
  }
  /* the camera: the rule runs on past the card, the card follows the blank being filled with a spring and fades at the side
     where more of the rule waits, and a small map of the whole rule under it frames what is in sight (a tap on the map goes
     there; the line can be dragged too). Once every blank is filled it pulls back and the whole rule is seen in one line, at
     the size that fits, for «تحقق» and the right-answer wave; a blank emptied again flies back in to it */
  function camera(fc, line, B, pick) {
    const c = C();
    const view = document.createElement('div'); view.className = 'lf-view';
    line.parentNode.insertBefore(view, line); view.appendChild(line); line.classList.add('lf-track', 'lf-still');
    const map = document.createElement('div'); map.className = 'lf-map'; map.setAttribute('aria-hidden', 'true');
    map.innerHTML = '<div class="lf-map-in"></div><i class="lf-map-win"></i>';
    view.after(map);
    const mapIn = map.firstChild, win = map.lastChild;
    let d = 0, whole = false, timer = 0, first = true, W = 1, V = 1, sm = 1, last = 0;
    const measure = () => { W = line.offsetWidth; V = view.clientWidth; sm = mapIn.clientWidth / W; };
    /* where a blank's middle sits, counted from the line's right end, whatever the camera is doing to it now */
    const fromR = el => { const lr = line.getBoundingClientRect(), r = el.getBoundingClientRect(); return (lr.right - (r.left + r.width / 2)) / (lr.width / W); };
    const paint = () => {
      /* the whole rule sits in the middle of the card, over the room the map gives up */
      const ms = getComputedStyle(map), gap = (map.offsetHeight + parseFloat(ms.marginTop) + parseFloat(ms.marginBottom)) / 2;
      line.style.transform = whole ? `scale(${Math.min(1, V / W)})` : `translateX(${d}px)`;
      view.style.transform = whole ? `translateY(${gap}px)` : '';
      view.classList.toggle('fr', !whole && d > 1);
      view.classList.toggle('fl', !whole && d < W - V - 1);
      map.classList.toggle('off', whole);
      win.style.width = V * sm + 'px'; win.style.transform = `translateX(${-d * sm}px)`;
    };
    const sync = () => {
      const k = line.cloneNode(true);
      k.removeAttribute('style'); k.className = 'kb-fx'; k.style.fontSize = line.style.fontSize; k.style.width = W + 'px'; k.style.transform = `scale(${sm})`;
      mapIn.replaceChildren(k); mapIn.style.height = line.offsetHeight * sm + 'px';
    };
    const follow = (i, all, wait) => {
      clearTimeout(timer); last = i;
      const go = () => {
        if (!view.isConnected) return;
        measure();
        const was = d, wasW = whole;
        whole = all;
        /* it moves only as far as it must: the blank clear of the faded edges, the rule's start kept in sight while it can be */
        if (!all && B[i]) {
          const f = fromR(B[i]), h = B[i].offsetWidth / 2, m = Math.min(56, (V - 2 * h) / 2);
          if (f + h > d + V - m) d = f + h - V + m;
          else if (f - h < d + m) d = f - h - m;
          d = Math.max(0, Math.min(W - V, d));
        }
        paint(); sync();
        if (first) { first = false; requestAnimationFrame(() => requestAnimationFrame(() => line.classList.remove('lf-still'))); }
        else if (Math.abs(d - was) > 4 || wasW !== whole) c.snd('tap', whole ? 1.7 : 1.35 + Math.min(i, 5) * .05, .14);
        /* the rule complete for the first time in sight: as the camera lands, its words light up in reading order, a note up each */
        if (all && !wasW && view.isConnected) c.later(520, () => B.forEach((b, n) => c.later(n * 95, () => {
          if (!view.isConnected) return;
          c.anim(b, [{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.07)', offset: .4 }, { transform: 'none' }], { duration: 340, easing: 'ease-out' });
          c.snd('tap', c.up(n + 3), .15);
        })));
      };
      first || !wait ? go() : (timer = setTimeout(go, wait));
    };
    /* a drag moves the camera by hand; a drag is never read as a tap on a blank */
    let drag = null, eat = false;
    view.addEventListener('pointerdown', e => { if (!whole) drag = { x: e.clientX, d, moved: false }; });
    view.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      drag.moved = true; line.classList.add('lf-still'); measure();
      d = Math.max(0, Math.min(W - V, drag.d + dx)); paint();
    });
    const end = () => { if (drag && drag.moved) { line.classList.remove('lf-still'); eat = true; setTimeout(() => { eat = false; }, 0); } drag = null; };
    view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end); view.addEventListener('pointerleave', end);
    view.addEventListener('click', e => { if (eat) { e.stopPropagation(); e.preventDefault(); } }, true);
    map.onclick = e => {
      measure();
      const at = (mapIn.getBoundingClientRect().right - e.clientX) / sm;
      let best = -1, bd = 1e9;
      B.forEach((b, i) => { const f = Math.abs(fromR(b) - at); if (f < bd) { bd = f; best = i; } });
      if (best >= 0) pick(best);
    };
    addEventListener('resize', () => { if (view.isConnected) follow(last, whole, 0); });
    return { follow };
  }
  /* the example worked through, for the sheet: «٧ × ٦ ÷ ٢ = ٢١» */
  function numLine(R, N) {
    if (N.line) return N.line;
    let n = 0;
    const xs = R.tok.slice(2).map(x => typeof x === 'string' ? x : N.v[++n]);
    const cut = R.tail ? R.tail - 2 : xs.length, d = xs.slice(0, cut).indexOf('÷');
    const grp = p => { const t = p.join(' '); return p.length > 1 || /[+−×] /.test(t) ? `(${t})` : t; };
    const s = d < 0 ? xs.join(' ') : [grp(xs.slice(0, d)), '÷', grp(xs.slice(d + 1, cut)), ...xs.slice(cut)].join(' ');
    return (s + ' = ' + N.v[0]).replace(/\( /g, '(').replace(/ \)/g, ')').replace(/ +/g, ' ');
  }
  /* the one screen both the lesson and the review use: فهيم, the header, the card; returns through `onGo` */
  function play(scr, R, review, onGo, onRemember) {
    const c = C(), tx = scr.querySelector('.tx'), fc = scr.querySelector('#fc'), go = scr.querySelector('#lwGo'), st = scr.querySelector('#stage');
    c.anim(scr.querySelector('.obs-duo'), [{ opacity: 0, transform: 'translateY(30px) scale(.82)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: 120, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' });
    const t = c.sayInto(tx, review ? `تذكر *${R.name}*؟ وش الناقص فيه؟` : R.say, 380);
    const line = () => fc.querySelector('.kb-fx');
    /* the card fits its rule again once every word is in, and gives the choices' room back */
    const ready = () => { const k = fc.querySelector('.kb-card'); if (k) k.classList.add('asked'); c.later(60, () => { if (line()) c.fit(line(), least()); }); };
    const cue = () => { go.disabled = false; c.later(500, () => { if (scr.isConnected) c.sayInto(tx, R.cue, 0); }); c.jump(go, 400); };
    let t2 = t;
    if (!review) {
      const ic = scr.querySelector('.nw-ic'), ws = [...scr.querySelectorAll('.tx .w')], wi = Math.max(0, ws.findIndex(w => w.querySelector('em')));
      c.nwShuffle(ic, 250);
      c.setNW(c.reduce ? null : c.nwSprite(R));
      const launch = Math.max(380 + wi * 85 + 260, 950);
      c.later(launch, () => c.nwFly(ws[wi], ic));
      t2 = Math.max(t, launch + c.NW_LAND + 350);
      st.style.visibility = 'hidden';
      /* the path's very first lesson shows its rule whole: nobody can name a missing word they have never seen (the user, 2026-11-08) */
      fc._whole = firstLes();
      c.CARD.intro(fc, R, t2).then(() => { if (!fc.isConnected) return; ready(); st.style.visibility = ''; proof(scr, R, cue); });
    } else {
      const tag = scr.querySelector('.lw-rv');
      c.anim(tag, [{ opacity: 0, transform: 'translateX(10px)' }, { opacity: 1, transform: 'none' }], { duration: 330, delay: 250, easing: 'cubic-bezier(.14,.76,0,1)', fill: 'backwards' });
      st.style.visibility = 'hidden';
      reviewAsk(fc, R, ok => {
        ready(); st.style.visibility = '';
        if (ok) {
          st.style.display = 'none';
          c.later(900, () => { const p = scr.querySelector('#dcap'); if (p && scr.isConnected) { p.classList.add('lw-cue'); p.innerHTML = c.fx(R.cue); c.anim(p, c.RISE, { duration: 300 }); } });
          c.sayInto(tx, c.pick(['صح! *تذكرته* من أول مرة.', 'كفو! ما *نسيته*.', 'بالضبط! *ثابت* عندك.']), 150);
          go.disabled = false; c.jump(go, 700);
          if (onRemember) onRemember();
        } else { c.sayInto(tx, c.pick(['ولا يهمك، شوفه مرة ثانية.', 'قريب! خلّنا نشوفه مرة ثانية.']), 100); c.later(350, () => proof(scr, R, cue)); }
      });
    }
    st.onclick = () => { if (!go.disabled) { c.snd('tap'); proof(scr, R, cue); } };
    go.onclick = () => { if (go.disabled) return; c.snd('tap'); onGo(); };
  }

  /* ───── «تقدّمك اليوم»: the rule joins the set ───── */
  let WIN = null;
  function winCard(W) {
    WIN = null;
    const list = (pending || []).filter(p => p.fresh); pending = [];
    if (!W || !W.learn) return '';
    const was = RULES().filter(r => real(r.key)).length, Rs = [];
    list.forEach(p => { const R = rule(p.k); if (!R || real(R.key)) return; ST[R.key] = { lv: 1, due: day() + 1, met: day() }; Rs.push(R); });
    if (!Rs.length) return '';
    save();
    WIN = { Rs, was, now: was + Rs.length };
    const still = !!call('motionReduced') || !window.gsap, one = Rs.length === 1;
    const names = Rs.length < 3 ? Rs.map(x => x.name).join(' و') : Rs.slice(0, -1).map(x => x.name).join('، ') + ' و' + Rs[Rs.length - 1].name;
    /* drawn as the lesson's card above it (the user, 2026-11-08: «make the UI for laws better like the above one … lot of
       animation»): the rule's gold hexagon where the tick is, its name and the set's count, its five steps as the lesson's bar,
       and when it comes back; the card turns gold once the rule lands */
    return `<div class="wp-card wp-law wl2${one ? '' : ' many'}${still ? ' won' : ''}">
      <span class="wl-clip" aria-hidden="true"><i class="wl-band"></i></span>
      <span class="wl-hx n${Math.min(Rs.length, 3)}">${Rs.slice(0, 3).map(x => hexSvg(x)).join('')}<i class="wl-spark a"></i><i class="wl-spark b"></i></span>
      <span class="wn-tx">
        <b><span class="wl-name">${names}</span><span class="wn-count"><span id="wlN">${A(still ? WIN.now : was)}</span>/${A(RULES().length)}</span></b>
        <span class="wn-bar wl-bar" role="img" aria-label="الخطوة الأولى من ${A(LADDER.length)}">${LADDER.map((x, i) => `<i${i === 0 && still ? ' class="on"' : ''}><u></u></i>`).join('')}</span>
        <span class="wn-next wl-next">${one ? 'قانون جديد في مجموعتك — يرجع لك بكرة' : `${Rs.length === 2 ? 'قانونين جديدين' : A(Rs.length) + ' قوانين جديدة'} في مجموعتك — ترجع لك بكرة`}</span>
      </span>
    </div>`;
  }
  function winPlay(c, tl, at) {
    const hxs = [...c.querySelectorAll('.wl-hx > svg')], seg = c.querySelector('.wl-bar i'), n = document.getElementById('wlN'), k = C();
    const done = () => { c.classList.add('won'); if (seg) seg.classList.add('on'); if (n && WIN) n.textContent = A(WIN.now); };
    if (!WIN || !window.gsap) { done(); return 0; }
    const name = c.querySelector('.wl-name'), band = c.querySelector('.wl-band'), sp = [...c.querySelectorAll('.wl-spark')], u = seg && seg.querySelector('u');
    /* each hexagon is tossed in from above, turning over like the path's coin, and lands with a squash, a note higher each */
    const gap = .26;
    hxs.forEach((hx, i) => {
      const t = at + i * gap;
      tl.fromTo(hx, { y: -70, scale: .35, rotationY: 540, opacity: 0 }, { y: 0, scale: 1, rotationY: 0, opacity: 1, duration: .7, ease: 'power3.out', immediateRender: true }, t)
        .to(hx, { keyframes: [{ scaleY: .78, scaleX: 1.16, duration: .09, ease: 'power2.in' }, { scaleY: 1.1, scaleX: .94, duration: .14, ease: 'power2.out' }, { scaleY: 1, scaleX: 1, duration: .22, ease: 'back.out(3)' }] }, t + .62)
        .call(() => { k.snd('on', 1.1 * k.up(i), .42); k.buzz(10); if (n) n.textContent = A(WIN.was + i + 1); }, null, t + .62)
        .fromTo(n.parentNode, { scale: 1.5 }, { scale: 1, duration: .45, ease: 'back.out(3)', immediateRender: false }, t + .62);
    });
    const land = at + (hxs.length - 1) * gap + .7;
    /* the card turns gold, two glints turn by the hexagon, the name rises in and a light crosses the card */
    tl.call(() => { c.classList.add('won'); k.snd('hint', 1.15, .38); }, null, land + .05)
      .fromTo(c, { scale: 1 }, { keyframes: [{ scale: 1.05, duration: .14, ease: 'power2.out' }, { scale: 1, duration: .4, ease: 'back.out(3)' }] }, land + .05)
      .fromTo(sp, { scale: 0, rotation: -60, opacity: 1 }, { scale: 1, rotation: 30, opacity: 1, duration: .32, ease: 'back.out(3)', stagger: .09, immediateRender: false }, land + .1)
      .to(sp, { scale: 0, rotation: 90, opacity: 0, duration: .3, ease: 'power2.in', stagger: .09 }, land + .5)
      .fromTo(name, { y: 8, opacity: .4 }, { y: 0, opacity: 1, duration: .45, ease: 'back.out(2.5)', immediateRender: false }, land + .05)
      .fromTo(band, { x: 260 }, { x: -560, duration: .9, ease: 'power2.inOut', immediateRender: true }, land + .2);
    /* then its first of five steps fills as the lesson's bar does, and the count settles */
    if (u) tl.call(() => { k.snd('click', k.up(4), .5); k.buzz(12); }, null, land + .45)
      .fromTo(u, { scaleX: 0 }, { scaleX: 1, duration: .42, ease: 'power2.out', immediateRender: true }, land + .45)
      .fromTo(seg, { scaleY: 1 }, { keyframes: [{ scaleY: 1.6, duration: .12 }, { scaleY: 1, duration: .3, ease: 'back.out(3)' }] }, land + .85)
      .call(() => { seg.classList.add('on'); if (n) n.textContent = A(WIN.now); }, null, land + .9);
    return land - at + 1.3;
  }

  /* ───── «القانون»: the rule again from any screen after it in the lesson (the user, 2026-11-08: «in every screen after the law
     screen immediately add a button to return back … if one want to see the law again make this on every page»): a white 3D
     pill under the lesson's bar, and a sheet that rises with the rule card lighting term by term ───── */
  const seenLaws = () => {
    const S = Q().SES; if (!S || S.mode !== 'learn' || !S.queue) return [];
    const ks = []; for (let i = 0; i < S.idx; i++) { const it = S.queue[i]; if (it && it.law && !it.fill && !ks.includes(it.law)) ks.push(it.law); }
    return ks;
  };
  function peekMount() {
    const scr = $app.firstElementChild; if (!scr || !scr.classList.contains('screen-session') || scr.querySelector('.lw-peek')) return;
    const S = Q().SES, it = S && S.queue && S.queue[S.idx];
    if (!it || (it.law && !it.fill)) return;
    const ks = seenLaws(), top = scr.querySelector('.session-top'); if (!ks.length || !top) return;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'lw-peek';
    b.innerHTML = `<span class="lw-peek-hx">${hexSvg(rule(ks[ks.length - 1]))}</span><span>${ks.length > 1 ? 'القوانين' : 'القانون'}</span>`;
    b.onclick = () => peekOpen(ks);
    top.after(b);
    /* the button takes room the screen was fitted without: fit it again (the pairs' tiles ran under the button at 375 wide) */
    if (scr._fit) scr._fit();
    C().anim(b, [{ opacity: 0, transform: 'translateY(-6px) scale(.9)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 120, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' });
  }
  new MutationObserver(peekMount).observe($app, { childList: true });
  function peekOpen(ks) {
    const c = C(), Rs = ks.map(rule).reverse();
    closeSheet(); c.snd('tap', 1.2, .4); c.buzz(6);
    const say = R => c.fx(String(R.say || '').replace(/\*([^*]+)\*/g, '<em>$1</em>'));
    const veil = document.createElement('div');
    veil.className = 'lw-veil lw-pk-veil';
    veil.innerHTML = `<div class="lw-pk law" role="dialog" aria-label="القانون"><i class="lw-pk-grip" aria-hidden="true"></i>
      ${Rs.map(R => `<div class="lw-pk-r"><div class="lw-pk-h"><span class="lw-pk-hx">${hexSvg(R)}</span><b>${R.name}</b></div>
        <div class="lw-fc lw-pk-fc">${c.CARD.html(R)}</div><p class="lw-pk-say">${say(R)}</p></div>`).join('')}
      <button type="button" class="btn lw-pk-ok">تمام</button></div>`;
    document.body.appendChild(veil);
    const sheet = veil.firstElementChild;
    const close = () => { if (!veil.isConnected) return; c.snd('off', 1, .3);
      c.anim(sheet, [{ transform: 'none' }, { transform: 'translateY(105%)' }], { duration: 260, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
      c.anim(veil, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, fill: 'forwards' }).finished.then(() => veil.remove()); };
    veil.onclick = e => { if (e.target === veil) close(); };
    sheet.querySelector('.lw-pk-ok').onclick = close;
    c.anim(veil, [{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    c.anim(sheet, [{ transform: 'translateY(100%)' }, { transform: 'translateY(-10px)', offset: .75 }, { transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.2,.9,.3,1)' });
    sheet.querySelectorAll('.lw-pk-fc').forEach((fc, i) => {
      fc._R = Rs[i]; c.kbFit(fc);
      const card = fc.querySelector('.kb-card');
      c.anim(card, [{ opacity: 0, transform: 'translateY(14px) scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: 220 + i * 160, easing: 'cubic-bezier(.3,1.3,.45,1)', fill: 'backwards' });
      c.kbIn(fc, 380 + i * 160);
    });
    sheet.querySelectorAll('.lw-pk-say').forEach((p, i) => c.anim(p, c.RISE, { duration: 320, delay: 700 + i * 160, fill: 'backwards' }));
  }

  /* ───── the path ───── */
  const dueList = () => RULES().filter(r => status(r.key) === 'due').sort((a, b) => ST[a.key].due - ST[b.key].due);
  /* the path's card shows once the student holds three rules or more (the user, 2026-11-08: «make it apper if i have 3 or more laws») */
  function pathCard() {
    const met = RULES().filter(r => real(r.key));
    if (met.length < 3) return '';
    const due = dueList();
    if (due.length) {
      const mins = Math.round(due.length * 25 / 60), time = mins < 1 ? 'أقل من دقيقة' : mins === 1 ? 'قرابة دقيقة' : mins === 2 ? 'قرابة دقيقتين' : `قرابة ${A(mins)} دقائق`;
      if (window.LAWDECK && LAWDECK.V) return LAWDECK.card(due.slice(0, 3), { total: due.length, count: plural(due.length), mins: time });
      return `<button type="button" class="due-card lw-due" onclick="LAWX.review()">
        <span class="lw-stack n${Math.min(due.length, 3)}"><i class="lw-sh"></i>${due.slice(0, 3).reverse().map((R, i) => `<span class="lw-sx" style="--i:${i}">${hexSvg(R)}</span>`).join('')}<b class="lw-n">${A(due.length)}</b></span>
        <span class="due-tx"><b>قوانين تراجعها اليوم</b><span>${plural(due.length)} — ${mins < 1 ? 'أقل من دقيقة' : mins === 1 ? 'قرابة دقيقة' : mins === 2 ? 'قرابة دقيقتين' : `قرابة ${A(mins)} دقائق`}</span></span>
        <span class="due-go">راجع</span>
      </button>`;
    }
    const next = Math.min(...met.map(r => ST[r.key].due)) - day(), last = met.slice().sort((a, b) => ST[b.key].met - ST[a.key].met)[0];
    /* one line, as the card for rules due (the user, 2026-11-08): the latest rule's gold hexagon, where the student stands
       and «قوانيني»; a rule missed today is back tomorrow, so the day's review can be done before every rule is settled */
    return `<button type="button" class="due-card lw-due lw-due4 lw-ok" onclick="LAWX.collection()">
      <span class="lw4-hx">${hexSvg(last)}</span><b class="lw4-t">${next <= 1 ? 'خلّصت مراجعة اليوم' : 'قوانينك ثابتة'}</b><span class="lw4-go">قوانيني</span>
    </button>`;
  }
  function popLine(key, at) {
    const set = window.QLEARN && window.QLEARN[key];
    if (!set || at < 0 || !set.lessons[at]) return '';
    const ks = lawsOf(key, set.lessons[at].id).filter(k => !real(k));
    if (!ks.length) return '';
    const Rs = ks.map(rule), names = Rs.map(x => `<b>${x.name}</b>`).join(' و');
    return `<div class="lp-law"><span class="lp-law-hx">${hexSvg(Rs[0])}</span><span>${Rs.length === 1 ? 'فيه قانون جديد:' : Rs.length === 2 ? 'فيه قانونين جديدين:' : `فيه ${A(Rs.length)} قوانين جديدة:`} ${names}</span></div>`;
  }

  /* ───── the review: a short session of its own, in the lesson's frame ───── */
  let RV = null;
  function review() {
    const list = dueList();
    if (!list.length) { collection(); return; }
    try { call('sndWarm'); } catch (e) {}
    C().snd('start', 1, .35);
    RV = { list, i: 0, step: 0, steps: list.length * 2, run: 0, res: {} };
    list.forEach(R => { RV.res[R.key] = { first: false, q: null, from: ST[R.key].lv }; });
    rvRecall();
  }
  const rvPct = () => Math.round(RV.step / RV.steps * 100);
  function rvRecall() {
    const R = RV.list[RV.i];
    const scr = mount(`<div class="screen screen-full screen-session screen-learn law lw-learn lw-review" data-fit="off">
      ${topHtml(rvPct(), true, 0, 'LAWX.rvQuit()')}
      <div class="lw-area">${revTag()}${obs('teach')}
        <div class="lw-fc" id="fc">${C().CARD.html(R)}</div>
        <div class="stage" id="stage" title="أعد الرسم"></div><p class="dcap" id="dcap"></p></div>
      <div class="action-bar"><button class="btn" id="lwGo" disabled>كمّل</button></div>
      <div class="feedback" id="fb"></div><div class="storm" id="storm"></div>
    </div>`);
    call('fxPaintBar', RV.run);
    let first = false;
    play(scr, R, true, () => { RV.step++; rvQuestion(); }, () => {
      first = true; RV.res[R.key].first = true; RV.run++;
      /* what is at stake: the next of its five steps pulses, and the question after this one earns it */
      const lv = ST[R.key].lv, gold = lv + 1 >= LADDER.length;
      C().later(1500, () => { const area = scr.querySelector('.lw-area'); if (!area || !scr.isConnected) return;
        const e = document.createElement('div'); e.className = 'lw-earn' + (gold ? ' gold' : '');
        e.innerHTML = dots(lv).replace('<i>', '<i class="next">') + '<span>' + (lv >= LADDER.length ? 'ذهبي! جاوب سؤاله صح ويرجع لك بعد *شهر*' : gold ? 'جاوب سؤاله صح ويصير *ذهبي*!' : 'جاوب سؤاله صح وتتقدّم *خطوة*').replace(/\*([^*]+)\*/g, '<em>$1</em>') + '</span>';
        area.appendChild(e); C().anim(e, C().POP, { duration: 360, easing: 'ease-out' }); C().snd('on', 1.3, .25); });
      call('fxPaintBar', RV.run);
      rvBar(); if (RV.run >= 3) call('snd', 'answer-run');
    });
    /* a miss before the right word counts against the rule */
    const pickWatch = setInterval(() => { if (!scr.isConnected) clearInterval(pickWatch); else if (scr.querySelector('.kb-ch.no') && !first) { RV.run = 0; call('fxPaintBar', 0); clearInterval(pickWatch); } }, 120);
  }
  function rvBar() {
    const p = rvPct(), bar = SCR && SCR.querySelectorAll('.progress i');
    if (bar) bar.forEach(i => { i.style.width = Math.max(p, 4) + '%'; });
  }
  function rvQuestion() {
    const R = RV.list[RV.i], c = C(), G = c.G[R.key](c.rnd(0, 5));
    RV.Q = G; RV.sel = null;
    const scr = mount(`<div class="screen screen-full screen-session screen-learn law lw-q">
      ${topHtml(rvPct(), true, 0, 'LAWX.rvQuit()')}
      <div class="q-area ln-area lt-pick"><div class="ln-tag exam">${call('ico', 'star', 14) || ''}سؤال قدرات — ${R.name}</div>
        <div class="ln-q">${call('learnFmt', G.q) || G.q}</div>
        <div class="choices ln-choices" role="radiogroup">${G.ch.map((o, i) => `<div class="slot"><span class="base" aria-hidden="true"></span>
          <button class="choice" data-ci="${i}" role="radio" style="--d:${(.05 + i * .07).toFixed(2)}s" onclick="LAWX.rvPick(${i})"><span class="ch-shine" aria-hidden="true"></span>
          <i class="ch-spk k1"></i><i class="ch-spk k2"></i><i class="ch-spk k3"></i><span class="ch-txt">${call('learnFmt', o) || o}</span></button></div>`).join('')}</div></div>
      <div class="action-bar"><button class="btn" id="checkBtn" disabled onclick="LAWX.rvCheck()">تحقق</button></div>
      <div class="feedback" id="fb" role="status"></div><div class="storm" id="storm"></div>
    </div>`);
    call('fxPaintBar', RV.run);
  }
  function rvPick(i) {
    if (!RV || RV.locked) return;
    RV.sel = i;
    call('snd', 'choice-select', null, 'assessment-click-option-' + (Math.min(i, 3) + 1));
    SCR.querySelectorAll('.choice').forEach((b, j) => b.classList.toggle('sel', j === i));
    SCR.querySelector('#checkBtn').disabled = false;
  }
  function rvCheck() {
    if (!RV || RV.sel === null || RV.locked) return;
    RV.locked = true;
    const R = RV.list[RV.i], G = RV.Q, chs = [...SCR.querySelectorAll('.choice')], card = chs[RV.sel], ok = G.ch[RV.sel] === G.ans;
    const right = chs[G.ch.indexOf(G.ans)];
    RV.res[R.key].q = ok; RV.step++;
    chs.forEach(b => { b.disabled = true; if (b !== card && b !== right) b.classList.add('dim'); });
    SCR.querySelector('.action-bar').style.visibility = 'hidden';
    const fb = SCR.querySelector('#fb'), fmt = s => call('learnFmt', s) || s;
    if (ok) {
      RV.run++; card.classList.remove('sel'); card.classList.add('correct');
      call('playCorrect'); rvBar(); call('fxPaintBar', RV.run);
      fb.className = 'feedback good show has-crest';
      fb.innerHTML = `<svg class="fb-crest" viewBox="0 0 380 90" preserveAspectRatio="none" aria-hidden="true"><path class="fb-crest-fill"></path><path class="fb-crest-line" fill="none" stroke-width="4" vector-effect="non-scaling-stroke" stroke-linecap="round"></path></svg>
        <div class="fb-row"><div class="fb-head"><span class="fb-ok">${Q().CHECK_BADGE || ''}</span> ${C().pick(['أحسنت!', 'صح!', 'كفو!', 'ممتاز!'])}</div></div>
        <div class="ln-fb-note">${fmt(G.sol)}</div>
        <button class="btn" onclick="LAWX.rvNext()">متابعة</button>`;
      call('fxDrawCrest'); call('answerFx', card, RV.run); call('ansBuzz', true);
    } else {
      RV.run = 0; card.classList.remove('sel'); card.classList.add('wrong'); if (right) right.classList.add('correct');
      call('snd', 'wrong-answer', () => call('sndBad')); call('fxPaintBar', 0); rvBar();
      fb.className = 'feedback bad show';
      fb.innerHTML = `<div class="fb-head"><span class="fb-x">✕</span> ليست صحيحة</div>
        <div class="fb-correct">الصحيح: <b>${fmt(G.ans)}</b></div>
        <div class="ln-why">${fmt(G.sol)}</div>
        <div class="lw-trap"><img src="${C().FH('encourage')}" alt=""><p><b>الفخ:</b> ${fmt(R.trap)}</p></div>
        <button class="btn btn-red" onclick="LAWX.rvNext()">فهمت</button>`;
      call('answerFxFail', card); call('ansBuzz', false);
    }
  }
  /* each rule is settled as its question is answered, so leaving half way keeps what was done */
  function settle(R) {
    const r = RV.res[R.key]; if (r.lv) return;
    const from = r.from;
    r.pass = !!(r.first && r.q);
    r.lv = r.pass ? Math.min(from + 1, LADDER.length) : r.first || r.q ? from : Math.max(from - 1, 1);
    r.gap = r.pass ? LADDER[r.lv - 1] : 1;
    ST[R.key] = Object.assign({}, ST[R.key], { lv: r.lv, due: day() + r.gap });
    save();
  }
  function rvNext() {
    if (!RV || !RV.locked) return;                     /* only after an answer: a second tap on «متابعة» is not a skip */
    settle(RV.list[RV.i]);
    RV.locked = false; RV.i++;
    if (RV.i < RV.list.length) rvRecall(); else rvDone();
  }
  function rvQuit() { RV = null; closeSheet(); C().wipe(); window.A.go('path'); }

  /* the end: each rule's next step lights, a note higher for each; the fifth turns the rule gold */
  function rvDone() {
    const c = C(), rows = RV.list.map(R => { const r = RV.res[R.key]; return { R, from: r.from, lv: r.lv, gap: r.gap, pass: r.pass, first: r.first }; });
    const passed = rows.filter(x => x.pass).length, firsts = rows.filter(x => x.first).length;
    const scr = mount(`<div class="screen screen-full law lw-end${rows.length > 3 ? ' many' : ''}" data-fit="off">
      <div class="lw-end-body"><div class="lw-in">
        <div class="obt"><p class="obs-bubble"><span class="tx"></span></p><img class="obt-duo" src="${c.FH(passed === rows.length ? 'celebrate' : 'cheer')}" alt=""></div>
        <div class="lw-rows">${rows.map(x => `<div class="lw-row${x.from >= LADDER.length && x.lv >= LADDER.length ? ' gold' : ''}">
          <span class="lw-row-hx">${hexSvg(x.R)}</span>
          <span class="lw-row-t"><b>${x.R.name}</b>${dots(x.from)}</span>
          <span class="lw-when${x.pass ? '' : ' soon'}">${inDays(x.gap)}</span></div>`).join('')}</div>
      </div></div>
      <div class="action-bar"><button class="btn" id="lwEnd" disabled onclick="LAWX.rvQuit()">متابعة</button></div>
    </div>`);
    const img = scr.querySelector('.obt-duo');
    c.anim(img, [{ opacity: 0, transform: 'translateY(60px) scale(.7)' }, { opacity: 1, transform: 'translateY(-14px) scale(1.04)', offset: .6 }, { opacity: 1, transform: 'none' }], { duration: 620, delay: 120, easing: 'ease-out', fill: 'backwards' });
    c.snd('done', 1, .5); c.buzz([20, 60, 30]);
    /* a step is earned by remembering the rule and answering its question, both right */
    const line = passed === rows.length ? `تذكرتها كلها وجاوبت أسئلتها! *${A(passed)} من ${A(rows.length)}* تقدّمت خطوة.`
      : passed ? `*${A(passed)} من ${A(rows.length)}* تقدّمت خطوة. اللي غلطت فيها أرجّعها لك *بكرة*.`
      : firsts ? `تذكرت *${A(firsts)} من ${A(rows.length)}*، بس غلطت في أسئلتها. أرجّعها لك *بكرة*.` : `ولا يهمك، أرجّعها لك *بكرة* ونثبّتها.`;
    const t = c.sayInto(scr.querySelector('.tx'), line, 600);
    fitIn(scr);
    /* the button comes once the bubble has spoken, so a second tap on the last «متابعة» cannot skip this screen */
    c.later(Math.min(t, 1400), () => { const b = scr.querySelector('#lwEnd'); if (b) b.disabled = false; });
    const els = [...scr.querySelectorAll('.lw-row')];
    els.forEach((el, i) => c.anim(el, c.RISE, { duration: 320, delay: t + 100 + i * 120, easing: 'ease-out', fill: 'backwards' }));
    let k = 0;
    rows.forEach((x, i) => {
      if (x.lv === x.from) return;
      const at = t + 700 + i * 120 + (k++) * 420, el = els[i], ds = [...el.querySelectorAll('.lw-dots i')];
      c.later(at, () => {
        if (x.lv > x.from) {
          const d = ds[x.lv - 1]; d.classList.add('on');
          c.anim(d, [{ transform: 'scale(.3)' }, { transform: 'scale(1.35)', offset: .6 }, { transform: 'none' }], { duration: 420, easing: 'ease-out' });
          c.snd('click', c.up(k * 2 + 2), .5); c.buzz(10);
          if (x.lv >= LADDER.length) c.later(380, () => { el.classList.add('gold'); el.querySelector('.lw-dots').classList.add('gold'); ds.forEach((dd, j) => { c.jump(dd, j * 60); c.later(j * 60, () => c.snd('tap', c.up(j * 2 + 5), .3)); }); c.snd('hint', 1, .45); });
        } else { const d = ds[x.from - 1]; d.classList.remove('on'); el.querySelector('.lw-dots').classList.remove('gold'); c.anim(d, c.SHAKE, { duration: 380 }); c.snd('off', 1, .35); }
      });
    });
    RV = null;
  }

  /* ───── «القوانين»: the unit's book, from the unit banner (and a lesson's «دفتر القوانين») ─────
     The user, 2026-11-03: «fix this screen please it was old and we forget it make it very nice UI and amazing screen».
     Two pages in one sheet: the unit — its banner in the unit's colour, how many of its rules the student has met, and
     each lesson as the path draws it (its hexagon and sign, gold once finished, grey before it opens) with how many of its
     rules are met and the gold rules it holds; then a lesson — its rules as cards (the name, the rule in a tinted strip, when
     it is used), a tick on the ones taught, «!» on the ones missed, paged sideways when they do not fit (nothing scrolls),
     and the rules of the student's set it holds, each opening its page. */
  const BOOK_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" fill="#fff" opacity=".95"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5A2.5 2.5 0 0 1 4 20.5z" fill="#fff" opacity=".6"/><path d="M8 7.5h8M8 11h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const BACK_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const TICK_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const WHEN_IC = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>';
  const signAttrs = g => g.replace(/class="s"/g, 'fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"').replace(/class="f j"|class="j"/g, 'fill="currentColor" stroke="currentColor" stroke-width="3" stroke-linejoin="round"').replace(/class="f"/g, 'fill="currentColor"');
  /* a lesson's node as the path draws it: the rounded hexagon on its lip, the lesson's own sign */
  function lesHex(d, key, st) {
    const q = Q(), U = q.UNIT_COLORS || {}, u = U[d && d.color] || U.green || { c: '#58CC02', s: '#58A700' };
    const face = st === 'done' ? '#FFC800' : st === 'lock' ? '#E5E5E5' : u.c, lip = st === 'done' ? '#E6A000' : st === 'lock' ? '#AFAFAF' : u.s;
    const ink = st === 'done' ? '#C57A1C' : st === 'lock' ? '#AFAFAF' : '#fff', hx = q.NODE_HEX || '', ic = (q.LESSON_ICON || {})[key] || q.LESSON_ICON_STAR || '';
    return `<svg class="bk2-hx" viewBox="0 0 71 65" aria-hidden="true"><path d="${hx}" fill="${lip}" transform="translate(0 7)"/><path d="${hx}" fill="${face}"/>${st === 'done' ? `<path d="${hx}" fill="#FFD940" opacity=".55" clip-path="inset(0 0 0 62%)"/>` : ''}<svg x="17" y="10" width="37" height="37" viewBox="0 0 40 40" style="color:${ink}">${signAttrs(ic)}</svg></svg>`;
  }
  function unitBook(domKey, lesKey) {
    const q = Q(), S = q.S || {}, d = window.QBANK && window.QBANK[domKey]; if (!d) return;
    const c = C(), U = q.UNIT_COLORS || {}, u = U[d.color] || U.green || { c: '#58CC02', s: '#58A700', h: '#71DC1A', pale: '#CBE6B5' };
    const esc = t => (q.esc ? q.esc(t) : String(t)), fr = t => (q.fracs ? q.fracs(t) : t);
    const unitN = Object.keys(window.QBANK).indexOf(domKey) + 1;
    const les = d.lessons.map((l, i) => {
      const key = domKey + '.' + l.key, done = !!(S.lessons && S.lessons[key] && S.lessons[key].stars > 0);
      const prev = i === 0 || !!(S.lessons && S.lessons[domKey + '.' + d.lessons[i - 1].key] && S.lessons[domKey + '.' + d.lessons[i - 1].key].stars > 0);
      const rec = (S.teach || {})[key] || { taught: [], missed: [] };
      const rs = (l.rules || []).map(x => ({ r: x, st: done || (rec.taught || []).includes(x.n) ? 'done' : (rec.missed || []).includes(x.n) ? 'miss' : '' }));
      const laws = lawsOf(key);
      return { l, i, st: done ? 'done' : prev ? 'open' : 'lock', rs, seen: rs.filter(x => x.st === 'done').length, laws };
    }).filter(x => x.rs.length);
    const total = les.reduce((a, x) => a + x.rs.length, 0), seen = les.reduce((a, x) => a + x.seen, 0);
    closeSheet(); document.querySelectorAll('.book-veil').forEach(v => v.remove());
    const veil = document.createElement('div'); veil.className = 'lw-veil law lw-book';
    veil.style.cssText = `--u:${u.c};--u-s:${u.s};--u-h:${u.h || u.c};--u-p:${u.pale || '#E5E5E5'}`;
    veil.innerHTML = '<div class="lw-sheet bk2" role="dialog" aria-label="القوانين"><div class="lw-grab"></div><div class="bk2-stage"></div></div>';
    document.body.appendChild(veil);
    const sh = veil.querySelector('.lw-sheet'), stage = veil.querySelector('.bk2-stage');
    c.setMute(S.sound === false); c.audio();
    veil.onclick = e => { if (e.target === veil) closeSheet(); };
    const show = (html, dir) => {
      const old = stage.firstElementChild, v = document.createElement('div'); v.className = 'bk2-view'; v.innerHTML = html; stage.appendChild(v);
      if (old) { c.anim(old, [{ transform: 'none', opacity: 1 }, { transform: `translateX(${dir * 28}%)`, opacity: 0 }], { duration: 240, easing: 'ease-in' }); setTimeout(() => old.remove(), 230);
        c.anim(v, [{ transform: `translateX(${-dir * 28}%)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, delay: 60, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }); }
      v.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { c.snd('tap'); closeSheet(); });
      return v;
    };
    /* a lesson's rules in the set: the ones met (four at most), and one chip for all of them, which opens «قوانيني» on the lesson */
    const lawRow = x => { const met = x.laws.filter(real), n = x.laws.length;
      return `<div class="bk2-laws"><span class="bk2-laws-h">قوانين مجموعتك من هذا الدرس</span><div class="bk2-laws-r">${met.slice(0, 4).map(lawChip).join('')}
        ${n > Math.min(met.length, 4) ? `<button type="button" class="bk2-law more" data-node="${domKey}.${x.l.key}">${met.length ? `كلها (${A(n)})` : `${A(n)} ${n <= 10 ? 'قوانين' : 'قانون'} تنفتح في دروسه القصيرة`}</button>` : ''}</div></div>`; };
    const lawChip = k => { const R = rule(k), met = real(k); return `<button type="button" class="bk2-law${met ? '' : ' lock'}" data-k="${k}"${met ? '' : ' disabled'}>${hexSvg(R, !met)}<span>${met ? R.name : 'قانون مقفل'}</span></button>`; };
    /* the unit */
    const home = (dir) => {
      const pct = total ? Math.round(seen / total * 100) : 0;
      const v = show(`
        <div class="bk2-hero"><div class="bk2-hero-ic">${BOOK_IC}</div>
          <div class="bk2-hero-t"><small>القسم ١، الوحدة ${A(unitN)}</small><h2>${esc(d.title)}</h2></div>
          <div class="bk2-meter"><div class="duo-bar"><i style="width:${Math.max(pct, 3)}%;--bar-c:#fff;--bar-shine:rgba(255,255,255,.55)"></i></div>
            <span>شفت <b>${A(seen)}</b> من ${A(total)} قانون</span></div></div>
        <div class="lw-gbox bk2-listbox"><div class="lw-in"><div class="bk2-list">${les.map(x => `
          <button type="button" class="bk2-les ${x.st}" data-i="${x.i}">
            ${lesHex(d, x.l.key, x.st)}
            <span class="bk2-les-t"><small>الدرس ${A(x.i + 1)}${x.st === 'lock' ? ' — ما وصلته' : x.st === 'done' ? ' — خلّصته' : ''}</small><b>${esc(x.l.title)}</b></span>
            <span class="bk2-les-r">${x.laws.length ? `<span class="bk2-gold" title="قوانين المجموعة">${hexSvg(rule(x.laws[0]), !x.laws.some(real))}<i>${A(x.laws.length)}</i></span>` : ''}
              <span class="bk2-cnt"><b>${A(x.seen)}</b>/${A(x.rs.length)}</span></span>
            <span class="bk2-chev">${BACK_IC}</span>
          </button>`).join('')}</div></div></div>
        <div class="lw-sheet-foot"><button class="btn btn-white" data-close>تمام</button></div>`, dir);
      fitIn(v);
      v.querySelectorAll('.bk2-les').forEach((b, i) => { c.anim(b, c.RISE, { duration: 300, delay: 120 + i * 45, easing: 'ease-out', fill: 'backwards' });
        b.onclick = () => { c.snd('tap'); lesson(+b.dataset.i, 1); }; });
      c.anim(v.querySelector('.bk2-hero-ic'), [{ transform: 'scale(.4) rotate(-20deg)' }, { transform: 'scale(1.12) rotate(6deg)', offset: .6 }, { transform: 'none' }], { duration: 520, delay: 80, easing: 'ease-out', fill: 'backwards' });
    };
    /* a lesson */
    const lesson = (li, dir) => {
      const x = les.find(y => y.i === li); if (!x) return home(-1);
      const v = show(`
        <div class="bk2-top"><button type="button" class="bk2-back" aria-label="كل الدروس">${BACK_IC}</button>
          ${lesHex(d, x.l.key, x.st)}<span class="bk2-top-t"><small>الدرس ${A(x.i + 1)}</small><b>${esc(x.l.title)}</b></span>
          <span class="bk2-cnt"><b>${A(x.seen)}</b>/${A(x.rs.length)}</span></div>
        ${x.laws.length ? lawRow(x) : ''}
        <div class="bk2-pages"><div class="bk2-track"></div></div>
        <div class="bk2-pager"><button type="button" class="bk2-arr pv">${BACK_IC}<span>السابق</span></button>
          <span class="bk2-ix"><em></em><span class="bk2-dots"></span></span>
          <button type="button" class="bk2-arr nx"><span>التالي</span>${BACK_IC}</button></div>`, dir);
      v.querySelector('.bk2-back').onclick = () => { c.snd('tap'); home(-1); };
      v.querySelectorAll('.bk2-law[data-k]:not(.lock)').forEach(b => b.onclick = () => detail(veil, rule(b.dataset.k), () => { if (veil.isConnected) unitBook(domKey, x.l.key); }));
      v.querySelectorAll('.bk2-law.more').forEach(b => b.onclick = () => { c.snd('tap'); collection(b.dataset.node); });
      const cards = x.rs.map(({ r: R0, st }) => `<div class="bk2-rule ${st}"><span class="bk2-num">${st === 'done' ? TICK_IC : st === 'miss' ? '!' : A(R0.n)}</span>
        <div class="bk2-rt"><b>${esc(R0.name)}</b><div class="bk2-f">${fr(esc(R0.formula))}</div>${R0.when ? `<p class="bk2-w">${WHEN_IC}<span>${fr(esc(R0.when))}</span></p>` : ''}</div></div>`);
      /* pages cut by measuring: as many cards as fit the room, a page sideways for the rest */
      const box = v.querySelector('.bk2-pages'), track = v.querySelector('.bk2-track'), pager = v.querySelector('.bk2-pager'), dotsEl = v.querySelector('.bk2-dots'), where = v.querySelector('.bk2-ix em');
      const cut = () => {
        const W = box.clientWidth, H = box.clientHeight;
        const m = document.createElement('div'); m.className = 'bk2-pg'; m.style.cssText = `position:absolute;visibility:hidden;width:${W}px`; box.appendChild(m);
        const pages = [[]]; let h = 0;
        cards.forEach(html => { m.innerHTML = html; const ch = m.firstElementChild.offsetHeight + 8;
          if (h + ch > H && pages[pages.length - 1].length) { pages.push([]); h = 0; } pages[pages.length - 1].push(html); h += ch; });
        m.remove();
        track.innerHTML = pages.map(p => `<div class="bk2-pg">${p.join('')}</div>`).join('');
        pager.hidden = pages.length < 2;
        dotsEl.innerHTML = pages.map(() => '<i></i>').join(''); dotsEl.hidden = pages.length > 9;
        return pages.length;
      };
      let n = cut(), at = 0;
      const go = i => { at = Math.max(0, Math.min(n - 1, i)); track.scrollTo({ left: -at * track.clientWidth, behavior: 'smooth' }); };
      const mark = () => { at = Math.round(Math.abs(track.scrollLeft) / Math.max(1, track.clientWidth));
        dotsEl.querySelectorAll('i').forEach((d0, i) => d0.classList.toggle('on', i === at)); where.textContent = `صفحة ${A(at + 1)} من ${A(n)}`;
        v.querySelector('.bk2-arr.pv').disabled = at === 0; v.querySelector('.bk2-arr.nx').disabled = at >= n - 1; };
      track.onscroll = () => requestAnimationFrame(mark); mark();
      v.querySelector('.bk2-arr.nx').onclick = () => { c.snd('tap'); go(at + 1); };
      v.querySelector('.bk2-arr.pv').onclick = () => { c.snd('tap'); go(at - 1); };
      track.querySelectorAll('.bk2-pg:first-child .bk2-rule').forEach((e, i) => c.anim(e, c.RISE, { duration: 300, delay: 160 + i * 60, easing: 'ease-out', fill: 'backwards' }));
      v.querySelectorAll('.bk2-law').forEach((e, i) => c.anim(e, c.POP, { duration: 320, delay: 120 + i * 70, easing: 'ease-out', fill: 'backwards' }));
      addEventListener('resize', function re() { if (!v.isConnected) return removeEventListener('resize', re); n = cut(); go(0); mark(); });
    };
    c.anim(sh, [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.3,1.2,.5,1)' });
    c.snd('on', 1, .3);
    const li = lesKey ? d.lessons.findIndex(l => l.key === lesKey) : -1;
    if (li >= 0 && les.some(x => x.i === li)) lesson(li, 0); else home(0);
  }

  /* ───── «قوانيني»: the student's set, every rule a gold hexagon once met ─────
     Thirty-five rules do not fit one page, so the set is cut as the path is: a tab for each of the path's lessons (its node
     hexagon, «الدرس ١», how many of its rules are met), and under it the lesson's rules in the order they are met, each saying
     which short lesson teaches it. A rule not met yet is its grey hexagon; a rule due today wears the review's orange. */
  function collection(tab) {
    closeSheet();
    const q = Q(), S = q.S || {}, QB = window.QBANK || {}, all = ordered(), met = all.filter(real);
    const nodes = [...new Set(all.map(k => WHERE[k][0]))];
    if (typeof tab === 'string') tab = Math.max(0, nodes.indexOf(tab));
    if (tab == null) {
      const due = dueList()[0], last = met.slice().sort((x, y) => ST[y].met - ST[x].met)[0];
      tab = Math.max(0, nodes.indexOf(due ? WHERE[due.key][0] : last ? WHERE[last][0] : nodes[0]));
    }
    const veil = document.createElement('div'); veil.className = 'lw-veil law';
    const chip = k => {
      const R = rule(k), s0 = real(k) && ST[k], l = lessonOf(k), from = `<small>${l ? l.title : ''}</small>`;
      if (!s0) return `<div class="lw-ch lock">${hexSvg(R, true)}<span class="lw-ch-t"><b>قانون مقفل</b>${from}</span></div>`;
      const st = status(k);
      return `<button type="button" class="lw-ch${s0.lv >= LADDER.length ? ' gold' : ''}${st === 'due' ? ' due' : ''}" data-k="${k}">${hexSvg(R)}<span class="lw-ch-t"><b>${R.name}</b>${from}${dots(s0.lv)}</span></button>`;
    };
    const tabs = nodes.map((key, i) => {
      const [dom, lk] = key.split('.'), d = QB[dom], li = d ? d.lessons.findIndex(l => l.key === lk) : -1, ks = all.filter(k => WHERE[k][0] === key);
      const done = !!(S.lessons && S.lessons[key] && S.lessons[key].stars > 0), prev = li <= 0 || !!(S.lessons && S.lessons[dom + '.' + d.lessons[li - 1].key] && S.lessons[dom + '.' + d.lessons[li - 1].key].stars > 0);
      return `<button type="button" class="lw-tb${i === tab ? ' on' : ''}" data-t="${i}" role="tab" aria-selected="${i === tab}">${lesHex(d, lk, done ? 'done' : prev ? 'open' : 'lock')}
        <span><b>الدرس ${A(li + 1)}</b><em>${A(ks.filter(real).length)}/${A(ks.length)}</em></span></button>`;
    }).join('');
    const page = i => `<div class="lw-grid2">${all.filter(k => WHERE[k][0] === nodes[i]).map(chip).join('')}</div>`;
    const ti = () => { const key = nodes[tab], [dom, lk] = key.split('.'), d = QB[dom], l = d && d.lessons.find(x => x.key === lk); return l ? l.title : ''; };
    veil.innerHTML = `<div class="lw-sheet lw-coll" role="dialog" aria-label="قوانيني"><div class="lw-grab"></div>
      <h2>قوانيني</h2><p class="lw-sub">${A(met.length)} من ${A(all.length)} — كل قانون يصير ذهبي بعد أربع مراجعات</p>
      <div class="lw-tabs" role="tablist">${tabs}</div>
      <p class="lw-tt">${ti()}</p>
      <div class="lw-gbox"><div class="lw-in">${page(tab)}</div></div>
      <div class="lw-sheet-foot">${dueList().length ? `<button class="btn" onclick="LAWX.closeSheet(); LAWX.review()">راجع ${plural(dueList().length)}</button>` : ''}<button class="btn btn-white" onclick="LAWX.closeSheet()">تمام</button></div></div>`;
    document.body.appendChild(veil);
    const c = C();
    c.setMute(S.sound === false); c.audio(); c.snd('on', 1, .3);
    c.anim(veil.querySelector('.lw-sheet'), [{ transform: 'translateY(100%)' }, { transform: 'none' }], { duration: 340, easing: 'cubic-bezier(.3,1.2,.5,1)' });
    const wire = (dir, d0) => {
      const inn = veil.querySelector('.lw-in');
      fitIn(veil);
      inn.querySelectorAll('.lw-ch').forEach((t, i) => c.anim(t, dir ? [{ opacity: 0, transform: `translateX(${dir * 24}px)` }, { opacity: 1, transform: 'none' }] : c.POP, { duration: dir ? 260 : 320, delay: d0 + i * (dir ? 25 : 40), easing: 'ease-out', fill: 'backwards' }));
      inn.querySelectorAll('.lw-ch[data-k]').forEach(t => t.onclick = () => detail(veil, rule(t.dataset.k), () => collection(tab)));
    };
    wire(0, 180);
    veil.querySelectorAll('.lw-tb').forEach(b => b.onclick = () => {
      const i = +b.dataset.t; if (i === tab) return;
      const dir = i > tab ? -1 : 1; tab = i; c.snd('tap', c.up(i), .35);
      veil.querySelectorAll('.lw-tb').forEach(x => { const on = +x.dataset.t === tab; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
      veil.querySelector('.lw-tt').textContent = ti();
      veil.querySelector('.lw-in').innerHTML = page(tab);
      wire(dir, 0);
    });
    veil.onclick = e => { if (e.target === veil) closeSheet(); };
  }
  /* one rule from the set: its card in words, as the lesson left it */
  function detail(veil, R, back) {
    const c = C(), sh = veil.querySelector('.lw-sheet'), s = ST[R.key], l = lessonOf(R.key), nd = nodeOf(R.key);
    c.snd('tap');
    sh.innerHTML = `<div class="lw-grab"></div><div class="lw-dt-top">${hexSvg(R)}<div><h2>${R.name}</h2>${dots(s.lv)}</div></div>
      <div class="lw-fc">${c.CARD.html(R)}</div>
      <p class="lw-dt-cue"><b>متى يجيك:</b> ${c.fx(R.cue)}</p>
      <div class="lw-trap"><img src="${c.FH('encourage')}" alt=""><p><b>الفخ:</b> ${c.fx(R.trap)}</p></div>
      ${nd ? `<button type="button" class="lw-dt-from" id="lwFrom">${lesHex(window.QBANK[nd.dom], nd.key, 'done')}<span><small>تعلّمته في الدرس ${A(nd.i + 1)}</small><b>${nd.title}</b>${l ? `<em>«${l.title}»</em>` : ''}</span><span class="lw-dt-go">قوانين الدرس</span></button>` : ''}
      <div class="lw-sheet-foot"><button class="btn btn-white" id="lwBack">رجوع</button></div>`;
    c.fit(sh.querySelector('.kb-fx'), 15);
    c.anim(sh.querySelector('.kb-card'), c.POP, { duration: 360, easing: 'ease-out' });
    sh.querySelector('#lwBack').onclick = () => { c.snd('tap'); (back || collection)(); };
    const fr = sh.querySelector('#lwFrom'); if (fr) fr.onclick = () => unitBook(nd.dom, nd.key);
  }
  function closeSheet() { document.querySelectorAll('.lw-veil').forEach(v => v.remove()); }

  /* the lab's own controls: the page around the phone sends them, and a hash opens one on load */
  /* the panel's list: the path's lessons that hold rules, each short lesson with its rules */
  function catalog() {
    const QB = window.QBANK || {}, QL = window.QLEARN || {};
    return [...new Set(ordered().map(k => WHERE[k][0]))].map(node => {
      const [d, l] = node.split('.'), i = QB[d].lessons.findIndex(x => x.key === l);
      return { node, i, title: QB[d].lessons[i].title, lessons: QL[node].lessons.map((x, idx) => ({ idx, id: x.id, title: x.title, laws: lawsOf(node, x.id).map(k => ({ key: k, name: rule(k).name })) })).filter(x => x.laws.length) };
    });
  }
  function cmd(k) {
    closeSheet();
    /* «les:skills.keylaws:3» plays that short lesson from its start, «rule:gifts» jumps to the rule's own screen; either way its
       rules play as new */
    /* «fill:ops:words» opens that rule's «كمّل القانون» (or «nums», «حطّ أرقام المثال») straight away */
    if (/^fill:/.test(k)) {
      const [, key, f] = k.split(':'), node = WHERE[key][0], QL = window.QLEARN[node], idx = QL.lessons.findIndex(l => l.id === WHERE[key][1]);
      window.A.startLearn(node.split('.')[0], node.split('.')[1], idx);
      if (window.A.debugLearnGo) window.A.debugLearnGo(it => it && it.law === key && it.fill === (f || 'words'));
      return;
    }
    if (/^(les|rule):/.test(k)) {
      const [t, a, b] = k.split(':'), key = t === 'rule' ? a : null, node = key ? WHERE[key][0] : a, QL = window.QLEARN[node];
      const idx = key ? QL.lessons.findIndex(l => l.id === WHERE[key][1]) : +b;
      lawsOf(node, QL.lessons[idx].id).forEach(x => { if (!key || x === key) delete ST[x]; }); save();
      window.A.startLearn(node.split('.')[0], node.split('.')[1], idx);
      if (key && window.A.debugLearnGo) window.A.debugLearnGo(it => it && it.law === key && !it.fill);
      return;
    }
    /* the panel's «شغّله», «شوفه» and the fill buttons always show the rule as new, however often they are pressed */
    const fresh = { law: 'hand', win: 'hand', 'fill-words': 'hand', 'fill-nums': 'hand', 'law-mean': 'mean', 'fill-mean': 'mean', 'law-prob': 'prob' }[k];
    if (fresh && ST[fresh]) { delete ST[fresh]; save(); }
    if (k === 'review') { window.A.go('path'); review(); }
    else if (k === 'collection') { window.A.go('path'); collection(); }
    else if (k === 'law' || k === 'law-mean' || k === 'law-prob') {
      const at = { law: ['keylaws', 2], 'law-mean': ['probstats', 4], 'law-prob': ['probstats', 0] }[k];
      window.A.startLearn('skills', at[0], at[1]);
      if (window.A.debugLearnGo) window.A.debugLearnGo(it => it && it.law);
    } else if (k === 'fill-words' || k === 'fill-nums' || k === 'fill-mean') {
      const at = k === 'fill-mean' ? ['probstats', 4] : ['keylaws', 2];
      window.A.startLearn('skills', at[0], at[1]);
      if (window.A.debugLearnGo) window.A.debugLearnGo(k === 'fill-nums' ? (it => it && it.rf === 'nums') : (it => it && it.law && it.fill === 'words'));
    } else if (k === 'win' || k === 'win2') {
      /* «شوفه»: the shake lesson's win; win2 shows it with both its rules, «المصافحات» and «الهدايا» */
      const ks = k === 'win2' ? ['hand', 'gifts'] : ['hand'];
      ks.forEach(x => { delete ST[x]; }); save();
      window.A.startLearn('skills', 'keylaws', 2);
      pending = ks.map(x => ({ k: x, fresh: true }));
      if (window.A.debugLearnFinish) window.A.debugLearnFinish(0);
    } else if (k === 'due') { Object.keys(ST).forEach(x => { ST[x].due = day(); }); save(); window.A.go('path'); }
    else if (k === 'gold') { Object.keys(ST).forEach(x => { ST[x].lv = Math.max(ST[x].lv, 4); ST[x].due = day(); }); save(); window.A.go('path'); }
    else if (k === 'path') window.A.go('path');
    else if (k === 'book') { window.A.go('path'); unitBook('skills'); }
  }
  if (DEV) addEventListener('message', e => { if (e.data && e.data.law) cmd(e.data.law); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.lw-veil')) { e.stopImmediatePropagation(); closeSheet(); } }, true);
  function ready() {
    if (window.A) { window.A.openUnitBook = d => unitBook(d); window.A.openBook = (d, l) => unitBook(d, l); }
    if (!DEV) return;
    const h = location.hash.replace('#', '');
    if (h) setTimeout(() => cmd(h), 300);
    try { parent.postMessage({ lawReady: true }, '*'); } catch (e) {}
  }

  window.LAWX = { dbgAns: () => RV && RV.Q ? RV.Q.ch.indexOf(RV.Q.ans) : -1, begin, swap, render, winCard, winPlay, pathCard, popLine, review, rvPick, rvCheck, rvNext, rvQuit, collection, closeSheet, ready, cmd, unitBook, catalog };
})();
