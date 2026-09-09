#!/usr/bin/env node
/* «طرق الحل» — qudrat-methods.html, generated from the question bank.

   Every lesson in js/data/*.js carries a `method`: four numbered steps and a
   💡 tip, the same text the «كيف أحلّها؟» sheet shows inside the game. This
   writes them all onto one crawlable page, unit by unit, so a student who
   searches for how to solve a topic lands on the game's own method for it.

       node tools/build_methods_page.js          # rewrites qudrat-methods.html

   Run it after any change to a lesson's title or method. Never hand-edit
   the output. */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://qudrati.xyz/";
const PAGE = SITE + "qudrat-methods.html";
const ORDER = ["skills", "numbers", "ratios", "geometry"];

global.window = global;
for (const k of ORDER) require(path.join(ROOT, "js", "data", k + ".js"));
const BANK = global.window.QBANK;

const AR = "٠١٢٣٤٥٦٧٨٩";
const toAr = n => String(n).replace(/[0-9]/g, d => AR[d]);
const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const slug = (unit, i) => `${unit}-${i + 1}`;

/* "١) step" lines become the steps; a "💡 …" line is the tip */
function parseMethod(text) {
  const steps = [], tips = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith("💡")) tips.push(line.replace(/^💡\s*/, ""));
    else steps.push(line.replace(/^[٠-٩0-9]+\)\s*/, ""));
  }
  return { steps, tips };
}

const units = ORDER.map(k => {
  const d = BANK[k];
  const lessons = Object.values(d.lessons).map((l, i) => ({ id: slug(k, i), title: l.title, icon: l.icon || "", ...parseMethod(l.method || "") }));
  return { key: k, title: d.title, lessons };
});
const total = units.reduce((n, u) => n + u.lessons.length, 0);
for (const u of units) for (const l of u.lessons) if (!l.steps.length) throw new Error("no steps: " + l.title);

const H1 = `طرق حل أسئلة القسم الكمي في اختبار القدرات — ${toAr(total)} درساً بخطوات واضحة`;
const TITLE = `طرق حل أسئلة القسم الكمي في اختبار القدرات (${toAr(total)} درساً) | قدراتي`;
const DESC = `طريقة الحل خطوة بخطوة لكل موضوع في القسم الكمي من اختبار القدرات العامة (قياس): ${units.map(u => u.title).join("، ")} — ${toAr(total)} درساً من لعبة قدراتي المجانية، مع نصيحة لكل درس.`;
const today = new Date().toISOString().slice(0, 10);

const jsonld = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Article", "@id": PAGE + "#article", headline: H1, description: DESC, inLanguage: "ar", url: PAGE,
      mainEntityOfPage: PAGE, datePublished: "2026-09-09", dateModified: today, image: SITE + "assets/og.png",
      author: { "@id": SITE + "#org" }, publisher: { "@id": SITE + "#org" }, isPartOf: { "@id": SITE + "#website" },
      about: { "@type": "Thing", name: "اختبار القدرات العامة — القسم الكمي", alternateName: "GAT quantitative section" } },
    { "@type": "Organization", "@id": SITE + "#org", name: "قدراتي", alternateName: "Qudrati", url: SITE,
      logo: { "@type": "ImageObject", url: SITE + "assets/app-icon/icon-512.png", width: 512, height: 512 } },
    { "@type": "WebSite", "@id": SITE + "#website", url: SITE, name: "قدراتي", alternateName: "Qudrati", inLanguage: "ar" },
    { "@type": "BreadcrumbList", "@id": PAGE + "#breadcrumb", itemListElement: [
      { "@type": "ListItem", position: 1, name: "قدراتي", item: SITE },
      { "@type": "ListItem", position: 2, name: "طرق الحل", item: PAGE }] },
    { "@type": "ItemList", "@id": PAGE + "#lessons", name: "دروس القسم الكمي في قدراتي", numberOfItems: total,
      itemListElement: units.flatMap(u => u.lessons).map((l, i) => ({ "@type": "ListItem", position: i + 1, name: l.title, url: PAGE + "#" + l.id })) },
  ],
};
const JSONLD = JSON.stringify(jsonld, null, 1);
if (JSONLD.includes("</script")) throw new Error("json-ld contains a closing script tag");

const toc = units.map(u =>
  `        <li><a href="#${u.key}">${esc(u.title)}</a> <span>(${toAr(u.lessons.length)} دروس)</span></li>`).join("\n");

const body = units.map(u => `
      <section class="methods-unit" id="${u.key}">
        <h2>${esc(u.title)}</h2>
${u.lessons.map(l => `        <article class="method" id="${l.id}">
          <h3><span class="method-ico" aria-hidden="true">${l.icon}</span>${esc(l.title)}</h3>
          <ol class="guide-list">
${l.steps.map(s => `            <li>${esc(s)}</li>`).join("\n")}
          </ol>
${l.tips.map(t => `          <p class="method-tip"><strong>نصيحة:</strong> ${esc(t)}</p>`).join("\n")}
        </article>`).join("\n")}
      </section>`).join("\n");

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#58CC02">
<title>${esc(TITLE)}</title>
<meta name="description" content="${esc(DESC)}">
<link rel="canonical" href="${PAGE}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta property="og:type" content="article">
<meta property="og:site_name" content="قدراتي">
<meta property="og:title" content="${esc(H1)} — قدراتي">
<meta property="og:description" content="${esc(DESC)}">
<meta property="og:url" content="${PAGE}">
<meta property="og:image" content="${SITE}assets/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="قدراتي — تدرّب على القسم الكمي وأنت تلعب">
<meta property="og:locale" content="ar_SA">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(H1)} — قدراتي">
<meta name="twitter:description" content="${esc(DESC)}">
<meta name="twitter:image" content="${SITE}assets/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="css/style.css?v=45">
<link rel="icon" href="favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="96x96" href="assets/app-icon/favicon-96.png">
<link rel="icon" type="image/png" sizes="32x32" href="assets/app-icon/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="assets/app-icon/apple-touch-icon.png">
<script type="application/ld+json">
${JSONLD}
</script>
</head>
<body class="guide-body">
  <main class="guide">
    <nav class="guide-crumb" aria-label="مسار الصفحة">
      <a href="./"><img src="assets/app-icon/favicon-96.png" width="22" height="22" alt="">قدراتي</a>
      <span aria-hidden="true">›</span>
      <span>طرق الحل</span>
    </nav>

    <article>
      <h1>${esc(H1)}</h1>
      <p class="guide-lead">لكل موضوع في القسم الكمي طريقة حل ثابتة: أربع خطوات ونصيحة. هذه هي الطرق نفسها التي يعرضها زر «كيف أحلّها؟» داخل لعبة قدراتي، مجموعةً في صفحة واحدة لتراجعها قبل الاختبار. إن أردت الخلفية أولاً فاقرأ <a href="qudrat-kami.html">دليل القسم الكمي</a>.</p>

      <nav class="methods-toc" aria-label="الوحدات">
        <ul>
${toc}
        </ul>
      </nav>
${body}

      <section class="guide-cta" aria-label="ابدأ التدريب">
        <img src="assets/app-icon/icon-192.webp" width="72" height="72" alt="">
        <h2>طبّق كل طريقة على أسئلة حقيقية</h2>
        <p>كل درس هنا له في قدراتي أسئلة أصلية بأسلوب الاختبار، ومؤقّت بإيقاع الاختبار، ومراجعة لأخطائك. مجاناً وبدون تسجيل، على الويب وأندرويد.</p>
        <a class="btn guide-btn" href="./">ابدأ التدريب الآن</a>
      </section>

      <p class="guide-note">قدراتي مبادرة مستقلة غير تابعة لهيئة تقويم التعليم والتدريب (قياس) وغير معتمدة منها، وأسئلته أصلية لا تمثّل أسئلة الاختبار الفعلية.</p>
    </article>
  </main>
</body>
</html>
`;

fs.writeFileSync(path.join(ROOT, "qudrat-methods.html"), html);
console.log(`qudrat-methods.html: ${units.length} units, ${total} lessons`);
