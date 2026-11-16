/* Node 1, «جمع وطرح وضرب وقسمة الأعداد الكبيرة» (skills.bigsum): every rule card of its short lessons that law-core does not
   carry, as a rule of its own — the card, its proof, «كمّل القانون», «حطّ أرقام المثال» and its exam question. */
(function () {
  'use strict';
  const C = window.LAWCORE, M = window.LAWMORE; if (!C || !M) return;
  const H = M.h, { A, fx, anim, RISE, POP, pulse, pop, show, up, rnd, pick, shuffle, four } = C;
  const $ = (st, s) => st.querySelector(s), $$ = (st, s) => [...st.querySelectorAll(s)];
  const S = 'green';

  const rules = [
    /* a rule said as a sentence, not «name = …» (the user, 2026-11-08: «make the law say دور الازواج اللي مجموعها ١٠ ١٠٠ ١٠٠٠») */
    { key: 'tens', name: 'الأعداد المكمّلة', tok: ['دوّر', 'الأزواج', 'اللي', 'مجموعها', { t: '١٠' }, 'أو', { t: '١٠٠' }, 'أو', { t: '١٠٠٠' }], any: true, decoys: ['٥٠', '٥٠٠', '٩٩', '٢٠'],
      say: 'دوّر الأزواج اللي تكمّل *١٠* أو *١٠٠* أو *١٠٠٠*، واجمعها أول.', cue: 'تجيك لما تشوف جمع أعداد كثيرة طويلة، والوقت ما يكفي تجمعها بالترتيب.',
      trap: 'لا تجمعها بالترتيب اللي جات فيه، رتّبها أزواجاً تكمّل بعض.', notDecoy: ['الباقي'] },
    { key: 'ops', name: 'ترتيب العمليات', tok: [{ t: 'الناتج' }, '=', { t: 'القوس' }, '←', { t: 'الأس' }, '←', { t: '× ÷' }, '←', { t: '+ −' }],
      say: 'مين يبدأ أول؟ *القوس*، بعده الأس، بعده الضرب والقسمة، وآخر شي الجمع والطرح.', cue: 'تجيك في أي مسألة فيها أكثر من عملية: «٢ + ٣ × ٤».',
      trap: 'الضرب قبل الجمع حتى لو جا بعده، والضرب والقسمة بالترتيب من اليمين.' },
    { key: 'common', name: 'العدد المشترك', tok: [{ t: 'المجموع', r: 'ans' }, '=', { t: 'العدد المشترك', r: 'in' }, '×', { t: 'مجموع الباقي', r: 'mk' }], wswap: [1, 2],
      say: 'كلها من جدول واحد؟ أخرج *العدد المشترك* برّا، واجمع الباقي بقانون من ١.', cue: 'تجيك لما تشوف «٥ + ١٠ + ١٥ + … + ٥٠» أو «٣ + ٦ + ٩ + …».',
      trap: 'الباقي يبدأ من ١: آخر عدد ÷ العدد المشترك.' },
    { key: 'oddsum', name: 'مجموع الفردية', tok: [{ t: 'مجموع الفردية' }, '=', { t: 'عددها' }, '×', { t: 'عددها' }],
      say: '*الفردية* من ١: مجموعها عددها في نفسه.', cue: 'تجيك لما تشوف «١ + ٣ + ٥ + …» من ١.',
      trap: 'تضرب عدد الأعداد في نفسه، مو آخر عدد.', notDecoy: ['العدد', 'آخر فردي'] },
    { key: 'oddcnt', name: 'عدد الفردية', tok: [{ t: 'عدد الفردية' }, '=', { t: '(آخر فردي + ١)' }, '÷', '٢'],
      say: 'كم عدد فردي من ١ لين آخر واحد؟ زد على *آخر فردي* واحد، وخذ النص.', cue: 'تجيك قبل مجموع الفردية: تعرف عددها، وبعدين تربّعه.',
      trap: 'زد ١ قبل ما تقسم، مو بعد.' },
    { key: 'evensum', name: 'مجموع الزوجية', tok: [{ t: 'مجموع الزوجية' }, '=', { t: 'نص الأخير' }, '×', { t: '(نص الأخير + ١)' }], wswap: [1, 2],
      say: '*الزوجية* من ٢: خذ نص آخر عدد، واضربه في اللي بعده.', cue: 'تجيك لما تشوف «٢ + ٤ + ٦ + …» من ٢.',
      trap: 'خذ نص آخر عدد أول، مو آخر عدد نفسه.' },
    { key: 'oddeven', name: 'الفردية ناقص الزوجية', tok: [{ t: 'الفرق' }, '=', '−١', '×', { t: 'عدد الأزواج' }],
      say: 'فردي ناقص الزوجي اللي بعده يعطي دايماً *−١*، والفرق سالب عدد الأزواج.', cue: 'تجيك لما تشوف مجموع فردية ناقص مجموع زوجية: «(١ + ٣ + ٥) − (٢ + ٤ + ٦)».',
      trap: 'الناتج سالب: الزوجية أكبر.' },
    { key: 'bigger', name: 'الزيادة الأكبر تكسب', tok: [{ t: 'الضرب' }, '=', { t: 'الأساس' }, '+', { t: 'الزيادة' }],
      say: 'قارن *الزيادة* بس: الأساس نفسه في الاثنين، واللي زيادته أكبر يكسب.', cue: 'تجيك في المقارنة: «٢٠ × ٣١» و«٢١ × ٣٠».',
      trap: 'لا تضرب الاثنين كاملين، قارن الزيادة.' },
  ];

  /* «العدد المشترك»'s steps, and the 1-to-n rule's own that stand in for them while the sum of the rest is worked */
  const steps = (L, tag) => (tag ? `<b class="tq-tag">${tag}</b>` : '') + L.map(([t, r]) => `<span class="${r}">${t}</span>`).join('<i>←</i>');
  const CM_ST = () => steps([['العدد المشترك', 'r-in'], ['مجموع الباقي', 'r-mk'], ['اضربهم', '']]);
  const TRI_ST = () => steps([['آخر عدد', 'r-in'], ['نصّه', 'r-cn'], ['× اللي بعده', 'r-mk']], 'قانون ١ إلى ن');

  const dia = {
    tens: {
      html: () => `<div class="dg"><div class="cells tn">${[37, 25, 63, 75].map((v, i) => `<span class="cell" data-i="${i}">${A(v)}</span>`).join('')}</div>
        <div class="tn-s"><span class="p1">١٠٠</span><span class="p2">١٠٠</span></div>
        ${H.lab([['الزوج الأول'], ['الزوج الثاني'], ['المجموع', '؟']])}</div>`,
      async run(st, c) {
        const row = $(st, '.tn'), cs = $$(st, '.cell'), p1 = $(st, '.p1'), p2 = $(st, '.p2'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        H.rise(cs, 0, 70); await c.wait(560);
        c.cap('دوّر عددين يكمّلون بعض لـ١٠٠');
        await c.wait(500);
        cs[0].classList.add('on'); pulse(cs[0]); c.s('t1', 1, .42); await c.wait(380);
        cs[2].classList.add('on'); pulse(cs[2]); c.s('t2', 1, .42); await c.wait(420);
        H.flip(row, [cs[0], cs[2], cs[1], cs[3]]); c.s('drop', 1, .4); await c.wait(560);
        pop(p1); H.set(n1, '١٠٠'); c.s('hint', 1, .4); await c.wait(600);
        cs[1].classList.add('on2'); cs[3].classList.add('on2'); pulse(cs[1]); pulse(cs[3], 60); c.s('t3', 1, .42); await c.wait(420);
        pop(p2); H.set(n2, '١٠٠'); c.s('hint', 1.12, .4); await c.wait(600);
        c.cap('١٠٠ + ١٠٠ = ٢٠٠ — بدون ما تجمع ٣٧ + ٢٥'); H.set(n3, '٢٠٠'); c.s('on', 1.1, .45);
        await c.wait(620);
      },
    },
    ops: {
      html: () => `<div class="dg"><div class="ex">${['١٠', '−', '(', '١', '+', '٢', ')', '²', '÷', '٣'].map(t => `<span class="${t === '²' ? 'sup' : /[−+÷()]/.test(t) ? 'o' : ''}">${fx(t)}</span>`).join('')}</div>
        <div class="ex-st">${['القوس', 'الأس', '× ÷', '+ −'].map(t => `<span>${t}</span>`).join('<i>←</i>')}</div></div>`,
      async run(st, c) {
        const ex = $(st, '.ex'), stp = $$(st, '.ex-st span');
        H.rise($$(st, '.ex span'), 0, 45); await c.wait(700);
        const steps = [[2, 7, '٣', 'القوس أول: ١ + ٢ = ٣'], [2, 4, '٩', 'بعده الأس: ٣² = ٩'], [2, 5, '٣', 'بعدها القسمة: ٩ ÷ ٣ = ٣'], [0, 3, '٧', 'وآخر شي الطرح: ١٠ − ٣ = ٧']];
        for (let i = 0; i < steps.length; i++) {
          const [a, b, v, cap] = steps[i], sp = [...ex.children].slice(a, b);
          stp.forEach((x, j) => x.classList.toggle('on', j === i)); pulse(stp[i]);
          sp.forEach(x => x.classList.add('hl')); c.s('t' + (i + 1), 1, .42); c.cap(cap);
          await c.wait(900);
          const r = document.createElement('span'); r.className = 'res'; r.textContent = v;
          ex.insertBefore(r, sp[0]); sp.forEach(x => x.remove()); pop(r, 340); c.s('drop', up(i), .35);
          c.val(i + 1, v, r); await c.wait(760);
          r.classList.remove('res');
        }
        stp.forEach(x => x.classList.remove('on'));
        const last = ex.firstElementChild; last.classList.add('ans'); pulse(last); c.s('hint', 1, .45);
        await c.wait(300); c.val(0, '٧', last); await c.wait(300);
      },
    },
    /* the proof in «مجموع ١ إلى ن»'s grammar (the user, 2026-11-16: «do the same thing you did to 1 to n law exactly»): the example
       big and its three steps under it. Every number gives up its ٥, which arcs into one ٥ in front, and what is left closes into
       brackets: «١ + ٢ + … + ٢٠», the very sum of the 1-to-n proof. فهيم says so, the steps under it become that rule's own, and it
       plays exactly as it did there (the user: «make it like مجموع الباقي is like what we have learned and exactly like before … so
       they say oh! then it is easy»); then ٥ × ٢١٠ lands green, each number flying into the card */
    common: {
      html: () => `<div class="dg tq"><div class="ex tq-ex">${['٥', '+', '١٠', '+', '١٥', '+', '…', '+', '١٠٠'].map(t => `<span class="${/[+…]/.test(t) ? 'o' : ''}">${t}</span>`).join('')}</div>
        <div class="ex-st tq-st">${CM_ST()}</div></div>`,
      async run(st, c) {
        const ex = $(st, '.ex'), row = $(st, '.ex-st'), toks = [...ex.children], k = () => C.scaleOf(ex), all = () => [...ex.children];
        const mk = (t, cls = '') => { const e = document.createElement('span'); e.className = cls; e.textContent = t; return e; };
        const say = t => { if (c.say) c.say(t); };
        /* whatever stays glides to its new place when the line changes around it */
        const glide = (els, f) => { const a = els.map(e => e.getBoundingClientRect()); f(); els.forEach((e, i) => { if (!e.isConnected) return; const b = e.getBoundingClientRect(), dx = (a[i].left - b.left) / k();
          if (Math.abs(dx) > .5) anim(e, [{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: 380, easing: C.XO }); }); };
        const on = i => { const sp = $$(st, '.ex-st span'); sp.forEach((x, j) => { x.classList.toggle('on', j === i); x.classList.toggle('dn', j < i); }); pulse(sp[i]); };
        /* the steps under the example, swapped for the 1-to-n rule's own while its sum is worked, and back */
        const swap = async html => {
          anim(row, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(6px)' }], { duration: 170, easing: 'ease-in', fill: 'forwards' });
          await c.wait(180);
          row.getAnimations().forEach(a => a.cancel()); row.innerHTML = html;
          anim(row, [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: C.XO });
        };
        /* the drawing is sized once for its widest lines, so it is never scaled again mid-proof */
        const probe = L => { const p = ex.cloneNode(false); p.style.cssText = 'position:absolute;visibility:hidden';
          p.innerHTML = L.map(([t, cl]) => `<span class="${cl}">${t}</span>`).join(''); st.appendChild(p); const w = p.offsetWidth; p.remove(); return w; };
        const O = t => [t, 'o'];
        ex.style.minWidth = Math.max(ex.offsetWidth,
          probe([['٥', 'res'], O('×'), O('('), ['١', ''], O('+'), ['٢', ''], O('+'), ['٣', ''], O('+'), O('…'), O('+'), ['٢٠', 'hl'], O(')')]),
          probe([['٥', 'res'], O('×'), O('('), ['١٠', 'res'], O('×'), O('('), ['٢٠', 'hl'], O('+'), ['١', 'hl'], O(')'), O(')')])) + 'px';
        toks.forEach((x, i) => anim(x, RISE, { duration: 280, delay: i * 45, fill: 'backwards' }));
        anim(row, [{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 420, fill: 'backwards' });
        await c.wait(900);

        /* 1. العدد المشترك: every number lights as a multiple of ٥ */
        const ns = toks.filter(x => !x.classList.contains('o'));
        on(0); c.s('t1', 1, .42); c.cap('كلها من جدول ٥');
        for (let i = 0; i < ns.length; i++) { ns[i].classList.add('hl', 'r-in'); pulse(ns[i]); c.s('tap', up(i), .3); await c.wait(240); }
        await c.wait(560);
        /* each number gives its ٥ up, which rises out of it, and stays as what is left: ١، ٢، ٣، ٢٠ */
        c.cap('أخرج ٥ من كل عدد: ١٠ ÷ ٥ = ٢، ١٥ ÷ ٥ = ٣ …');
        const s = k(), gr = st.getBoundingClientRect(), LIFT = 44, Q = ['١', '٢', '٣', '٢٠'];
        const gs = ns.map((n, i) => {
          if (C.reduce) { n.textContent = Q[i]; n.classList.remove('hl', 'r-in'); return null; }
          const r = n.getBoundingClientRect(), g = mk('٥', 'tq-g'); st.appendChild(g);
          const cx = (r.left + r.width / 2 - gr.left) / s, cy = (r.top + r.height / 2 - gr.top) / s;
          Object.assign(g.style, { left: cx - g.offsetWidth / 2 + 'px', top: cy - g.offsetHeight / 2 + 'px' });
          anim(g, [{ transform: 'scale(.5)', opacity: 0 }, { transform: `translateY(${-LIFT * .6}px)`, opacity: 1, offset: .5 }, { transform: `translateY(${-LIFT}px)`, opacity: 1 }],
            { duration: 380, delay: i * 110, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'both' });
          C.later(i * 110 + 120, () => { n.textContent = Q[i]; n.classList.remove('hl', 'r-in'); pop(n, 260); c.s('tap', up(i), .3); });
          return { g, cx, cy };
        }).filter(Boolean);
        await c.wait(ns.length * 110 + 650);
        /* then the line opens in front for one ٥ and its brackets, and the risen ٥s gather into it */
        c.cap('كل عدد فيه ٥: طلّعها برّا مرة وحدة');
        const f5 = mk('٥', 'res r-in'), tm = mk('×', 'o'), b1 = mk('(', 'o'), b2 = mk(')', 'o');
        glide(toks, () => { ex.prepend(f5, tm, b1); ex.append(b2); });
        const to = f5.getBoundingClientRect(), tx = (to.left + to.width / 2 - gr.left) / s, ty = (to.top + to.height / 2 - gr.top) / s;
        [tm, b1, b2].forEach((e, i) => anim(e, RISE, { duration: 280, delay: 120 + i * 60, fill: 'backwards' }));
        anim(f5, [{ opacity: 0, transform: 'scale(.4)' }, { opacity: 1, transform: 'none' }], { duration: 200, delay: 360, easing: 'cubic-bezier(.3,1.5,.5,1)', fill: 'backwards' });
        gs.forEach(({ g, cx, cy }, i) => {
          const dx = tx - cx, dy = ty - cy;
          g.getAnimations().forEach(a => a.cancel());
          anim(g, [{ transform: `translateY(${-LIFT}px)`, opacity: 1 }, { transform: `translate(${dx * .5}px, ${Math.min(dy, -LIFT) - 16}px)`, opacity: 1, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(.8)`, opacity: 0 }],
            { duration: 520, delay: i * 80, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' });
          C.later(i * 80 + 560, () => g.remove());
          if (i) C.later(i * 80 + 480, () => { c.s('tap', 1 + i * .06, .26); anim(f5, [{ transform: 'none' }, { transform: 'scale(1.12)', offset: .4 }, { transform: 'none' }], { duration: 200 }); });
        });
        await c.wait(gs.length * 80 + 520);
        c.s('drop', 1, .38); c.val(1, '٥', f5);
        await c.wait(950);

        /* 2. مجموع الباقي: the brackets hold «١ + ٢ + … + ٢٠», the sum the 1-to-n rule was just proved on. فهيم says so, and the
           steps under it turn into that rule's own */
        on(1); c.s('t2', 1, .42);
        const inner = all().slice(3, -1);
        say('*١\u00A0+\u00A0٢\u00A0+\u00A0…\u00A0+\u00A0٢٠*؟ هذا *قانون\u00A0١\u00A0إلى\u00A0ن* اللي تعلّمته قبل شوي!');   /* the sum and the rule's name never break across lines */
        c.cap('هذا قانون ١ إلى ن اللي تعلّمته!');
        [b1, ...inner, b2].forEach((x, i) => anim(x, [{ transform: 'none' }, { transform: 'translateY(-7px)', offset: .4 }, { transform: 'none' }], { duration: 360, delay: i * 40, easing: 'ease-out' }));
        C.later(120, () => c.s('hint', 1.2, .4));
        await c.wait(1700);
        await swap(TRI_ST());
        await c.wait(650);

        /* the 1-to-n proof, as it played on its own: آخر عدد, the rest folding into it */
        const last = inner[inner.length - 1], rest = inner.slice(0, -1);
        on(0); last.classList.add('hl', 'r-in'); pulse(last); c.s('t1', 1, .42); c.cap('خذ آخر عدد: ٢٠');
        await c.wait(900);
        const lr = last.getBoundingClientRect();
        rest.forEach((x, i) => {
          const r = x.getBoundingClientRect(), dx = (lr.left + lr.width / 2 - r.left - r.width / 2) / k();
          anim(x, [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx * .55}px, -14px) scale(.8)`, opacity: .9, offset: .55 }, { transform: `translate(${dx}px, 0) scale(.2)`, opacity: 0 }],
            { duration: 460, delay: i * 50, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' });
          if (!x.classList.contains('o')) C.later(i * 50 + 380, () => { c.s('tap', 1 + i * .05, .26); anim(last, [{ transform: 'none' }, { transform: 'scale(1.08)', offset: .4 }, { transform: 'none' }], { duration: 200 }); });
        });
        await c.wait(rest.length * 50 + 480);
        glide(all(), () => { rest.forEach(x => x.remove()); last.classList.remove('hl'); last.classList.add('res'); });
        pop(last, 340); c.s('drop', 1, .38);
        await c.wait(900);

        /* نصّه: «÷ ٢» joins it, the number is cut in two halves, and one half drops away */
        on(1); c.s('t2', 1, .42); c.cap('نصّه: ٢٠ ÷ ٢ = ١٠');
        const dv = mk('÷', 'o'), two = mk('٢', 'hl r-cn');
        glide(all(), () => b2.before(dv, two));
        [dv, two].forEach((e, i) => anim(e, RISE, { duration: 280, delay: i * 70, fill: 'backwards' }));
        await c.wait(950);
        glide(all(), () => { dv.remove(); two.remove(); });
        const cut = document.createElement('i'); cut.className = 'tq-cut'; last.appendChild(cut);
        anim(cut, [{ transform: 'scaleY(0)', opacity: 1 }, { transform: 'scaleY(1)', opacity: 1, offset: .6 }, { transform: 'scaleY(1)', opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
        c.s('off', 1.2, .36);
        await c.wait(300);
        const h1 = mk('١٠', 'res r-cn'), h2 = mk('١٠', 'res r-cn tq-gone'), c0 = last.getBoundingClientRect(), mid = c0.left + c0.width / 2;
        last.replaceWith(h1); h1.after(h2);
        [h1, h2].forEach(h => { const r = h.getBoundingClientRect(), dx = (mid - r.left - r.width / 2) / k();
          anim(h, [{ transform: `translateX(${dx}px) scale(.6)`, opacity: 0 }, { opacity: 1, offset: .45 }, { transform: 'none', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.3,1.4,.5,1)' }); });
        c.s('click', 1.2, .4);
        await c.wait(560);
        anim(h2, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(22px) rotate(-14deg)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' });
        await c.wait(420);
        glide(all(), () => h2.remove());
        pulse(h1); c.s('drop', up(1), .36);
        await c.wait(1000);

        /* × اللي بعده: the number after twenty comes in brackets, closes to ٢١, and the product lands green, as it did there */
        on(2); c.s('t3', 1, .42); c.cap('اضربه في اللي بعده: ٢٠ + ١ = ٢١');
        const br = ['×', '(', '٢٠', '+', '١', ')'].map(t => mk(t, /[×()+]/.test(t) ? 'o' : 'hl r-mk'));
        glide(all(), () => b2.before(...br));
        br.forEach((e, i) => anim(e, RISE, { duration: 260, delay: i * 50, fill: 'backwards' }));
        await c.wait(1050);
        const r21 = mk('٢١', 'res r-mk');
        glide(all(), () => { br[1].before(r21); br.slice(1).forEach(e => e.remove()); });
        pop(r21, 340); c.s('drop', up(2), .36);
        await c.wait(950);
        c.cap('١٠ × ٢١ = ٢١٠');
        [h1, br[0], r21].forEach(e => anim(e, [{ transform: 'none' }, { transform: 'translateY(-5px)', offset: .4 }, { transform: 'none' }], { duration: 360 }));
        await c.wait(650);
        const s210 = mk('٢١٠', 'ans');
        glide(all(), () => { h1.replaceWith(s210); br[0].remove(); r21.remove(); });
        pop(s210, 380); $$(st, '.ex-st span').forEach(x => { x.classList.remove('on'); x.classList.add('dn'); }); c.s('hint', 1, .45);
        say('شفت؟ *نفس* اللي قبل بالضبط: *٢١٠*. سهلة!');
        await c.wait(1500);

        /* back to the rule's own steps: the brackets go, and ٢١٠ is the sum of the rest */
        await swap(CM_ST());
        on(1); c.cap('مجموع الباقي = ٢١٠');
        glide(all(), () => { b1.remove(); b2.remove(); s210.classList.remove('ans'); s210.classList.add('res', 'r-mk'); });
        c.s('drop', up(1), .38); c.val(2, '٢١٠', s210);
        await c.wait(1300);

        /* 3. اضربهم: the common number times the sum of the rest, and the product lands green */
        on(2); c.s('t3', 1, .42); c.cap('٥ × ٢١٠ = ١٠٥٠');
        [f5, tm, s210].forEach(e => anim(e, [{ transform: 'none' }, { transform: 'translateY(-5px)', offset: .4 }, { transform: 'none' }], { duration: 360 }));
        await c.wait(750);
        const ans = mk('١٠٥٠', 'ans');
        glide([], () => { f5.replaceWith(ans); tm.remove(); s210.remove(); });
        pop(ans, 380); $$(st, '.ex-st span').forEach(x => { x.classList.remove('on'); x.classList.add('dn'); }); c.s('hint', 1, .45);
        await c.wait(320); c.val(0, '١٠٥٠', ans); await c.wait(300);
      },
    },
    oddsum: {
      html: () => {
        let d = '';
        for (let r = 0; r < 4; r++) for (let k = 0; k < 4; k++) d += `<circle data-l="${Math.max(r, k)}" cx="${30 + k * 30}" cy="${22 + r * 30}" r="11" style="opacity:0"/>`;
        return `<div class="dg"><div class="os"><svg class="d" width="150" height="134" viewBox="0 0 150 134">${d}
          <text class="lw" x="75" y="132" font-size="14" fill="#1899D6" text-anchor="middle" style="opacity:0">٤</text>
          <text class="lh" x="143" y="70" font-size="14" fill="#1899D6" text-anchor="middle" style="opacity:0">٤</text></svg>
          <div class="os-l">${['١', '١ + ٣', '١ + ٣ + ٥', '١ + ٣ + ٥ + ٧'].map((t, i) => `<span data-l="${i}">${t} = <b>${A((i + 1) * (i + 1))}</b></span>`).join('')}</div></div>
          ${H.lab([['عددها'], ['المجموع']])}</div>`;
      },
      async run(st, c) {
        const dots = $$(st, 'circle'), rows = $$(st, '.os-l span'), lw = $(st, '.lw'), lh = $(st, '.lh'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        const COL = ['#1CB0F6', '#CE82FF', '#FF9600', '#58CC02'];
        rows.forEach(x => show(x, false));
        for (let l = 0; l < 4; l++) {
          dots.filter(x => +x.dataset.l === l).forEach((x, i) => { x.setAttribute('fill', COL[l]); show(x); anim(x, [{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: i * 50, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'backwards' }); x.style.transformOrigin = 'center'; x.style.transformBox = 'fill-box'; });
          show(rows[l]); anim(rows[l], RISE, { duration: 280 }); H.set(n1, l + 1); H.set(n2, (l + 1) * (l + 1)); c.s('t' + (l + 1), 1, .42);
          await c.wait(l ? 720 : 520);
        }
        c.cap('كل فردي يلفّ المربع، والمربع ضلعه عدد الفردية');
        pop(lh); c.val(1, '٤', lh); await c.wait(520);
        pop(lw); c.val(2, '٤', lw); c.s('click', 1.1, .4); await c.wait(560);
        c.cap('٤ × ٤ = ١٦'); pulse(n2); c.s('hint', 1, .45);
        await c.wait(320); c.val(0, '١٦', n2); await c.wait(300);
      },
    },
    oddcnt: {
      html: () => `<div class="dg"><div class="oc">${H.cells([1, 3, 5, 7, 9, 11, 13, 15, 17, 19], 'sm oc1')}${H.cells([2, 4, 6, 8, 10, 12, 14, 16, 18, 20], 'sm oc2')}</div>
        ${H.lab([['آخر فردي + ١ ='], ['عدد الفردية', '؟']])}</div>`,
      async run(st, c) {
        const od = $$(st, '.oc1 .cell'), ev = $$(st, '.oc2 .cell'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        ev.forEach(x => show(x, false));
        H.rise(od, 0, 40); await c.wait(700);
        c.cap('كم عدد فردي من ١ إلى ١٩؟'); await c.wait(700);
        od[9].classList.add('on'); pulse(od[9]); c.s('t1', 1, .42); await c.wait(400);
        c.cap('زد على آخر فردي ١ ← ١٩ + ١ = ٢٠'); H.set(n1, '٢٠'); c.val(1, '٢٠', od[9]); await c.wait(700);
        for (let i = 0; i < 10; i++) { show(ev[i]); anim(ev[i], RISE, { duration: 240 }); c.s('tap', up(i) * .75, .24); await c.wait(70); }
        c.cap('من ١ إلى ٢٠، نصّها فردي ونصّها زوجي'); await c.wait(900);
        ev.forEach(x => x.classList.add('dim')); od.forEach((x, i) => C.later(i * 40, () => x.classList.add('on')));
        H.set(n2, '١٠'); c.s('hint', 1, .45); c.cap('٢٠ ÷ ٢ = ١٠ ← عددها ١٠');
        await c.wait(400); c.val(0, '١٠', n2); await c.wait(300);
      },
    },
    evensum: {
      html: () => {
        let d = '';
        for (let r = 0; r < 5; r++) for (let k = 0; k < 12; k++) { const b = k < (r + 1) * 2; d += `<circle class="${b ? 'b' : 'o'}" data-r="${r}" cx="${258 - k * 22}" cy="${16 + r * 22}" r="8" fill="${b ? '#1CB0F6' : '#FF9600'}" style="opacity:0"/>`; }
        return `<div class="dg"><svg class="d" width="276" height="136" viewBox="0 0 276 136">${d}
          <text class="lr" x="137" y="132" font-size="13" fill="#A568CC" text-anchor="middle" style="opacity:0">١٢ في كل صف</text></svg>
          ${H.lab([['آخر عدد'], ['آخر عدد + ٢ ='], ['المجموع', '٠']])}</div>`;
      },
      async run(st, c) {
        const B = $$(st, 'circle.b'), O = $$(st, 'circle.o'), lr = $(st, '.lr'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        let sum = 0;
        for (let r = 0; r < 5; r++) { B.filter(x => +x.dataset.r === r).forEach((x, i) => { show(x); anim(x, [{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: i * 25, fill: 'backwards' }); }); sum += (r + 1) * 2; H.set(n3, sum); c.s('t' + (r + 1), 1, .42); await c.wait(340); }
        H.set(n1, '١٠'); c.val(1, '١٠', n1); await c.wait(560);
        c.cap('نسخة ثانية مقلوبة تكمّل الدرج مستطيل');
        O.forEach((x, i) => { show(x); anim(x, [{ opacity: 0, transform: 'translate(-30px, -30px)' }, { opacity: 1, transform: 'none' }], { duration: 340, delay: i * 12, easing: 'cubic-bezier(.3,1.2,.5,1)', fill: 'backwards' }); });
        c.s('drop', 1, .4); await c.wait(820);
        pop(lr); H.set(n2, '١٢'); c.s('click', 1.1, .4); c.val(2, '١٢', lr); await c.wait(620);
        c.cap('٥ صفوف × ١٢ = ٦٠ — و٥ صفوف هي ١٠ ÷ ٢'); H.set(n3, '٦٠'); await c.wait(1100);
        O.forEach(x => { x.style.opacity = .15; anim(x, [{ opacity: 1 }, { opacity: .15 }], { duration: 420 }); });
        c.cap('الدرج نصّ المستطيل ← ١٠ × ١٢ ÷ ٤ = ٣٠'); H.set(n3, '٣٠'); c.s('hint', 1, .45);
        await c.wait(380); c.val(0, '٣٠', n3); await c.wait(300);
      },
    },
    oddeven: {
      html: () => `<div class="dg"><div class="df">${[[1, 2], [3, 4], [5, 6]].map(([o, e]) => `<div class="df-c"><span class="cell od">${A(o)}</span><span class="df-m">−</span><span class="cell ev">${A(e)}</span><span class="df-r">−١</span></div>`).join('')}</div>
        ${H.lab([['عدد الأزواج'], ['الفرق', '؟']])}</div>`,
      async run(st, c) {
        const col = $$(st, '.df-c'), od = $$(st, '.od'), ev = $$(st, '.ev'), ms = $$(st, '.df-m'), rs = $$(st, '.df-r'), n1 = $(st, '.n1'), n2 = $(st, '.n2');
        [...ms, ...rs].forEach(x => show(x, false));
        H.rise(od, 0, 60); await c.wait(300); H.rise(ev, 0, 60);
        c.cap('(١ + ٣ + ٥) − (٢ + ٤ + ٦)'); await c.wait(1000);
        c.cap('كل فردي مع الزوجي اللي بعده');
        for (let i = 0; i < 3; i++) {
          col[i].classList.add('on'); pop(ms[i], 260); c.s('tap', up(i * 2), .3); await c.wait(340);
          pop(rs[i], 320); H.set(n1, i + 1); c.s('t' + (i + 1), 1, .42); await c.wait(460);
        }
        c.val(1, '٣', n1); await c.wait(560);
        c.cap('٣ أزواج، كل زوج −١ ← −١ × ٣ = −٣'); rs.forEach((x, i) => pulse(x, i * 80));
        H.set(n2, '−٣'); c.s('hint', 1, .45); await c.wait(380); c.val(0, '−٣', n2); await c.wait(300);
      },
    },
    bigger: {
      html: () => `<div class="dg"><svg class="d" width="270" height="176" viewBox="0 0 270 176">
          <text x="66" y="14" font-size="15" font-weight="800" fill="#4B4B4B" text-anchor="middle">٢٠ × ٣١</text>
          <text x="200" y="14" font-size="15" font-weight="800" fill="#4B4B4B" text-anchor="middle">٢١ × ٣٠</text>
          <rect class="b1" x="26" y="40" width="80" height="120" rx="6" fill="#E5E5E5" stroke="#AFAFAF" stroke-width="2" style="opacity:0"/>
          <rect class="b2" x="150" y="40" width="80" height="120" rx="6" fill="#E5E5E5" stroke="#AFAFAF" stroke-width="2" style="opacity:0"/>
          <text class="bt" x="66" y="104" font-size="13" font-weight="800" fill="#777" text-anchor="middle" style="opacity:0">٢٠ × ٣٠</text>
          <text class="bt" x="190" y="104" font-size="13" font-weight="800" fill="#777" text-anchor="middle" style="opacity:0">٢٠ × ٣٠</text>
          <rect class="sa" x="26" y="24" width="80" height="12" rx="4" fill="#84D8FF" style="opacity:0"/>
          <rect class="sb" x="234" y="40" width="12" height="120" rx="4" fill="#84D8FF" style="opacity:0"/>
          <text class="ta" x="66" y="174" font-size="14" font-weight="800" fill="#1899D6" text-anchor="middle" style="opacity:0">+ ٢٠</text>
          <text class="tb" x="200" y="174" font-size="14" font-weight="800" fill="#1899D6" text-anchor="middle" style="opacity:0">+ ٣٠</text></svg>
        ${H.lab([['الأساس'], ['الزيادة الأكبر'], ['الأكبر', '؟']])}</div>`,
      async run(st, c) {
        const b = [$(st, '.b1'), $(st, '.b2')], bt = $$(st, '.bt'), sa = $(st, '.sa'), sb = $(st, '.sb'), ta = $(st, '.ta'), tb = $(st, '.tb'), n1 = $(st, '.n1'), n2 = $(st, '.n2'), n3 = $(st, '.n3');
        b.forEach((x, i) => { show(x); x.style.transformOrigin = 'bottom'; x.style.transformBox = 'fill-box'; anim(x, [{ transform: 'scaleY(.1)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, delay: i * 120, easing: 'cubic-bezier(.3,1.3,.5,1)', fill: 'backwards' }); });
        c.s('on', 1, .35); await c.wait(700);
        bt.forEach(x => pop(x)); c.cap('الاثنين فيهم ٢٠ × ٣٠ = ٦٠٠'); H.set(n1, '٦٠٠'); c.s('t1', 1, .42); await c.wait(600);
        c.val(1, '٦٠٠', bt[0]); await c.wait(700);
        c.cap('٢٠ × ٣١ تزيد صف واحد: ٢٠');
        show(sa); sa.style.transformBox = 'fill-box'; sa.style.transformOrigin = 'center'; anim(sa, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }); pop(ta); c.s('t2', 1, .42); await c.wait(900);
        c.cap('٢١ × ٣٠ تزيد عمود واحد: ٣٠');
        show(sb); sb.style.transformBox = 'fill-box'; sb.style.transformOrigin = 'bottom'; anim(sb, [{ transform: 'scaleY(0)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' }); pop(tb); c.s('t3', 1, .42); await c.wait(900);
        sb.setAttribute('fill', '#58CC02'); tb.setAttribute('fill', '#58A700'); pulse(tb); H.set(n2, '٣٠'); c.s('click', 1.2, .4);
        c.val(2, '٣٠', tb); await c.wait(620);
        c.cap('الزيادة الأكبر تكسب ← ٢١ × ٣٠ أكبر (٦٣٠)'); H.set(n3, '٦٣٠'); c.s('hint', 1, .45);
        await c.wait(380); c.val(0, '٦٣٠', n3); await c.wait(300);
      },
    },
  };

  /* the review's exam question, new numbers each time */
  const CMP = ['القيمة الأولى أكبر', 'القيمة الثانية أكبر', 'القيمتان متساويتان', 'المعطيات غير كافية'];
  const g = {
    tens(i) {
      const base = pick([100, 100, 1000]), a = rnd(11, base / 2 - 1), b = rnd(11, base / 2 - 1), x = [a, base - a, b, base - b];
      const ord = i % 2 ? [x[0], x[2], x[1], x[3]] : [x[2], x[0], x[3], x[1]], sum = 2 * base;
      return { q: `${ord.map(A).join(' + ')} = ؟`, ans: A(sum), ch: four(A(sum), [A(sum - 10), A(sum + 10), A(sum - 100 > 0 ? sum - 100 : sum + 20)]),
        sol: `(${A(a)} + ${A(base - a)}) + (${A(b)} + ${A(base - b)}) = ${A(base)} + ${A(base)} = ${A(sum)}` };
    },
    ops(i) {
      const k = i % 3; let q, ans, ds, sol;
      if (k === 0) { const a = rnd(2, 9), b = rnd(2, 9), d = rnd(2, 9); ans = a + b * d; q = `${A(a)} + ${A(b)} × ${A(d)} = ؟`; ds = [(a + b) * d, a * b + d, a + b + d]; sol = `الضرب أول: ${A(b)} × ${A(d)} = ${A(b * d)} ← ${A(a)} + ${A(b * d)} = ${A(ans)}`; }
      else if (k === 1) { const a = rnd(1, 3), b = rnd(1, 3), d = pick([2, 3]), s = (a + b) * (a + b) * d, t = rnd(s + 2, s + 30); ans = t - (a + b) * (a + b) * d;
        q = `${A(t)} − (${A(a)} + ${A(b)})² × ${A(d)} = ؟`; ds = [(t - (a + b) * (a + b)) * d, t - (a + b) * 2 * d, t - (a * a + b * b) * d]; sol = `القوس: ${A(a + b)} ← الأس: ${A((a + b) * (a + b))} ← الضرب: ${A(s)} ← الطرح: ${A(t)} − ${A(s)} = ${A(ans)}`; }
      else { const d = rnd(2, 5), m = rnd(2, 6), b = d * m * rnd(1, 3), a = rnd(2, 9); ans = a + b / d * m; q = `${A(a)} + ${A(b)} ÷ ${A(d)} × ${A(m)} = ؟`; ds = [a + b / (d * m), (a + b) / d * m, (a + b / d) * m];
        sol = `من اليمين: ${A(b)} ÷ ${A(d)} = ${A(b / d)} ← × ${A(m)} = ${A(b / d * m)} ← ${A(a)} + ${A(b / d * m)} = ${A(ans)}`; }
      return { q, ans: A(ans), ch: four(A(ans), ds.filter(x => Number.isInteger(x) && x > 0).map(A)), sol };
    },
    common(i) {
      let k, n; do { k = pick([2, 3, 4, 5, 6, 10]); n = pick([10, 12, 15, 20]); } while (k === 2 && n === 20);   /* not bank bigsum-05 */
      const r = k * n * (n + 1) / 2;
      return { q: `${A(k)} + ${A(2 * k)} + ${A(3 * k)} + … + ${A(n * k)} = ؟`, ans: A(r), ch: four(A(r), [A(n * (n + 1) / 2), A(k * n * (n - 1) / 2), A(k * n * n)]),
        sol: `${A(k)} × (١ + ٢ + … + ${A(n)}) = ${A(k)} × ${A(n * (n + 1) / 2)} = ${A(r)}` };
    },
    oddsum(i) {
      const n = pick([6, 7, 8, 9, 10, 12, 15]), last = 2 * n - 1;
      const q = i % 2 ? `١ + ٣ + ٥ + … + ${A(last)} = ؟` : `ما مجموع أول ${A(n)} ${n > 10 ? 'عدداً فردياً' : 'أعداد فردية'}؟`;
      return { q, ans: A(n * n), ch: four(A(n * n), [A(last * last), A(n * (n + 1)), A(n * n - n)]), sol: `عددها ${A(n)} ← ${A(n)} × ${A(n)} = ${A(n * n)}` };
    },
    oddcnt(i) {
      const n = pick([12, 15, 18, 20, 25, 30]), last = 2 * n - 1;
      return { q: `كم عدداً فردياً من ١ إلى ${A(last)}؟`, ans: A(n), ch: four(A(n), [A(n - 1), A(last), A(n + 1)]), sol: `(${A(last)} + ١) ÷ ٢ = ${A(n)}` };
    },
    evensum(i) {
      const L = pick([12, 16, 20, 24, 30, 36]), r = L * (L + 2) / 4;   /* not ٤٠, bank bigsum-05 */
      const q = i % 2 ? `٢ + ٤ + ٦ + … + ${A(L)} = ؟` : `ما مجموع الأعداد الزوجية من ٢ إلى ${A(L)}؟`;
      return { q, ans: A(r), ch: four(A(r), [A(L * (L + 2) / 2), A(L * (L + 1) / 4 | 0), A((L / 2) * (L / 2))]), sol: `نص ${A(L)} = ${A(L / 2)} ← ${A(L / 2)} × ${A(L / 2 + 1)} = ${A(r)}` };
    },
    oddeven(i) {
      const n = pick([10, 15, 20, 25, 30, 40]);   /* never ٥٠: that is bank question bigsum-10 itself (QA, 2026-11-08) */
      return { q: `(١ + ٣ + ٥ + … + ${A(2 * n - 1)}) − (٢ + ٤ + ٦ + … + ${A(2 * n)}) = ؟`, ans: '−' + A(n), ch: shuffle(['−' + A(n), A(n), '−' + A(2 * n), '−١']),
        sol: `${A(n)} ${n > 10 ? 'زوجاً' : 'أزواج'}، كل زوج −١ ← −${A(n)}` };
    },
    bigger(i) {
      const a = rnd(2, 8) * 10, b = a + rnd(1, 4) * 10, first = i % 2 === 0;
      /* a × (b + 1) = ab + a، (a + 1) × b = ab + b: the second gains more */
      const v1 = first ? `${A(a)} × ${A(b + 1)}` : `${A(a + 1)} × ${A(b)}`, v2 = first ? `${A(a + 1)} × ${A(b)}` : `${A(a)} × ${A(b + 1)}`;
      return { q: 'قارن بين القيمتين:', v1, v2, ans: CMP[first ? 1 : 0], ch: CMP.slice(),
        sol: `الأساس ${A(a)} × ${A(b)} في الاثنين ← ${v1} يزيد ${A(first ? a : b)}، و${v2} يزيد ${A(first ? b : a)} ← الزيادة الأكبر تكسب` };
    },
  };

  const sign = {
    tens: [S, '<circle class="s" cx="14" cy="20" r="8"/><circle class="s" cx="26" cy="20" r="8"/>'],
    ops: [S, '<path class="s" d="M13 7q-7 13 0 26M27 7q7 13 0 26"/><path class="s" d="M17 20h6"/>'],
    common: [S, '<path class="s" d="M8 13l8 8M16 13l-8 8"/><path class="s" d="M24 8q-5 12 0 24M33 8q5 12 0 24"/>'],
    oddsum: [S, '<rect class="s" x="7" y="7" width="26" height="26" rx="4"/><path class="s" d="M7 20h13V7"/>'],
    oddcnt: [S, '<circle class="f" cx="9" cy="20" r="3.4"/><circle class="f" cx="20" cy="20" r="3.4"/><circle class="f" cx="31" cy="20" r="3.4"/><path class="s" d="M6 31h28"/>'],
    evensum: [S, '<path class="s" d="M7 33V27h7v-7h7v-7h7V7h5"/>'],
    oddeven: [S, '<path class="s" d="M8 20h24"/><circle class="f" cx="20" cy="11" r="3"/><circle class="f" cx="20" cy="29" r="3"/>'],
    bigger: [S, '<path class="s" d="M8 30h24M14 30V18M26 30V8"/>'],
  };
  const where = {
    tens: ['skills.bigsum', 'tens', /^اجمع أولاً كل عددين/], ops: ['skills.bigsum', 'ops', /^\*القوس\*/], common: ['skills.bigsum', 'series', /^أخرج \*العدد المشترك\*/],
    oddsum: ['skills.bigsum', 'odd', /^\*مجموع الفردية\*/], oddcnt: ['skills.bigsum', 'odd', /^\*عددها\* =/], evensum: ['skills.bigsum', 'even', /^\*الزوجية\*/],
    oddeven: ['skills.bigsum', 'diff', /^كل \*زوج\* يعطي/], bigger: ['skills.bigsum', 'units', /^\*الزيادة الأكبر\*/],
  };
  const nums = {
    tens: { ex: '٤٦ + ٣٨ + ٥٤ + ٦٢ = ؟', v: ['٢٠٠', '١٠٠', '١٠٠'], more: ['٨٤', '١١٦', '١٩٠'], line: '(٤٦ + ٥٤) + (٣٨ + ٦٢) = ١٠٠ + ١٠٠ = ٢٠٠', hint: { 1: '٤٦ يكمّله ٥٤: ٤٦ + ٥٤ = ؟', 2: '٣٨ يكمّله ٦٢: ٣٨ + ٦٢ = ؟' } },
    ops: { ex: '٢٠ − (٢ + ١)² × ٢ = ؟', v: ['٢', '٣', '٩', '١٨', '٢'], more: ['٢٢', '٣٦', '٦'], line: '٢٠ − ٣² × ٢ = ٢٠ − ٩ × ٢ = ٢٠ − ١٨ = ٢',
      hint: { 1: 'القوس: ٢ + ١ = ؟', 2: 'الأس: ٣² = ٣ × ٣ = ؟', 3: 'الضرب: ٩ × ٢ = ؟', 4: 'الطرح: ٢٠ − ١٨ = ؟' } },
    common: { ex: '٣ + ٦ + ٩ + … + ٣٠ = ؟', v: ['١٦٥', '٣', '٥٥'], more: ['١٠', '٣٠', '٣٣٠'], hint: { 1: 'كل الأعداد تنقسم على كم؟', 2: 'الباقي ١ + ٢ + … + ١٠: كم؟' } },
    oddsum: { ex: '١ + ٣ + ٥ + ٧ + ٩ = ؟', v: ['٢٥', '٥', '٥'], more: ['٩', '١٠', '٨١'], hint: { 1: 'كم عدد فردي في المثال؟', 2: 'كم عدد فردي في المثال؟' } },
    oddcnt: { ex: 'كم عدداً فردياً في ١ + ٣ + ٥ + … + ١٥؟', v: ['٨', '١٦'], line: '(١٥ + ١) ÷ ٢ = ٨', more: ['١٥', '٧', '٦٤'], hint: { 1: 'آخر فردي ١٥، زد عليه ١: كم؟' } },
    evensum: { ex: '٢ + ٤ + ٦ + … + ٥٠ = ؟', v: ['٦٥٠', '٢٥', '٢٦'], more: ['٥٠', '٥١', '١٣٠٠'], hint: { 1: 'آخر عدد ٥٠، نصه كم؟', 2: 'نص الأخير + ١ = ؟' } },
    oddeven: { ex: '(١ + ٣ + ٥ + ٧) − (٢ + ٤ + ٦ + ٨) = ؟', v: ['−٤', '٤'], more: ['−١', '٨', '−٨'], hint: { 1: 'كم زوج (فردي − زوجي) في المثال؟' } },
    bigger: { ex: 'أيهم أكبر: ٤٠ × ٥١ ولا ٤١ × ٥٠؟', v: ['٢٠٥٠', '٢٠٠٠', '٥٠'], more: ['٤٠', '٢٠٤٠', '٢١٠٠'], line: '٤١ × ٥٠ = ٤٠ × ٥٠ + ٥٠ = ٢٠٠٠ + ٥٠ = ٢٠٥٠',
      hint: { 1: 'الأساس في الاثنين: ٤٠ × ٥٠ = ؟', 2: '٤٠ × ٥١ يزيد ٤٠، و٤١ × ٥٠ يزيد ٥٠: أيهم أكبر؟' } },
  };

  const css = `
.law .cells.sm { gap: 4px; }
.law .cells.sm .cell { width: 27px; height: 32px; font-size: 14px; border-radius: 8px; }
.law .cell { transition: background .2s, border-color .2s, color .2s, opacity .2s; }
.law .cell.on2 { background: var(--purple); border-color: var(--purple-dk, #A568CC); color: #fff; }
.law .cell.dim { opacity: .3; }
.law .cells.tn .cell { width: 48px; height: 44px; font-size: 21px; }
.law .cells.tn { gap: 8px; }
.law .tn-s { display: grid; grid-template-columns: 104px 104px; gap: 8px; margin-top: -4px; }
.law .tn-s span { opacity: 0; text-align: center; font-size: 17px; font-weight: 800; color: var(--blue-dk); border-top: 3px solid var(--blue); border-radius: 3px; padding-top: 2px; }
.law .tn-s .p2 { color: var(--purple-dk, #A568CC); border-color: var(--purple); }
.law .ex { display: flex; align-items: center; gap: 5px; font-size: 32px; font-weight: 800; color: var(--ink2); line-height: 1.3; min-height: 54px; }
.law .ex span { padding: 0 3px; border-radius: 9px; transition: background .2s, color .2s; }
.law .ex .o { color: var(--gray-icon); }
.law .ex .sup { font-size: 20px; align-self: flex-start; margin-inline-start: -6px; }
.law .ex .hl { background: var(--blue-light); color: var(--blue-dk); }
.law .ex .res { background: var(--blue); color: #fff; padding: 0 9px; }
.law .ex .ans { background: var(--green-bg); color: var(--green-dk); padding: 0 9px; }
.law .ex-st { display: flex; align-items: center; gap: 4px; font-size: 13px; font-weight: 800; color: var(--gray); }
.law .ex-st span { border: 2px solid var(--line); border-radius: 9px; padding: 1px 7px; transition: all .2s; white-space: nowrap; }
.law .ex-st span.on { border-color: var(--blue); color: var(--blue-dk); background: var(--blue-light); }
.law .ex-st i { font-style: normal; color: var(--gray-icon); }
.law .os { display: flex; align-items: center; gap: 14px; }
.law .os circle { transform-box: fill-box; transform-origin: center; }
.law .os-l { display: flex; flex-direction: column; gap: 6px; font-size: 15px; font-weight: 800; color: var(--gray); white-space: nowrap; }
.law .os-l b { color: var(--blue-dk); }
.law .oc { display: flex; flex-direction: column; gap: 5px; }
.law .df { display: flex; gap: 14px; }
.law .df-c { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px; border-radius: 12px; transition: background .25s; }
.law .df-c.on { background: var(--blue-light); }
.law .df-c .od { background: var(--blue); border-color: var(--blue-dk); color: #fff; }
.law .df-c .ev { background: var(--purple); border-color: #A568CC; color: #fff; }
.law .df-m { font-size: 18px; font-weight: 800; color: var(--gray-icon); line-height: 1; }
.law .df-r { margin-top: 4px; font-size: 18px; font-weight: 800; color: var(--green-dk); background: var(--green-bg); border-radius: 8px; padding: 0 7px; }
`;
  M.add({ rules, dia, g, sign, where, nums, css });
})();
