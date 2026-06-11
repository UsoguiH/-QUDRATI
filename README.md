<div dir="rtl">

<div align="center">

# 🦉 قدراتي — QUDRATI

**لعبة تدريب على القسم الكمي من اختبار القدرات العامة (قياس) بأسلوب Duolingo**

عربية بالكامل · واجهة RTL · بدون خادم · بدون تثبيت

<br>

# 🎮 [اضغط هنا للعب الآن](https://qudrati-lime.vercel.app/) 🎮

### العب مجاناً من المتصفح — بدون تحميل وبدون تسجيل

[![العب الآن](https://img.shields.io/badge/%E2%96%B6%EF%B8%8F%20%D8%A7%D9%84%D8%B9%D8%A8%20%D8%A7%D9%84%D8%A2%D9%86-qudrati--lime.vercel.app-58cc02.svg?style=for-the-badge&logoColor=white)](https://qudrati-lime.vercel.app/)

```
🔗  https://qudrati-lime.vercel.app
```

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Made with Vanilla JS](https://img.shields.io/badge/Made%20with-Vanilla%20JS-f7df1e.svg)](js/app.js)
[![RTL Arabic](https://img.shields.io/badge/%D8%A7%D9%84%D9%84%D8%BA%D8%A9-%D8%A7%D9%84%D8%B9%D8%B1%D8%A8%D9%8A%D8%A9-2ecc71.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-المساهمة)

[🕹️ كيف تلعب](#%EF%B8%8F-كيف-تلعب) · [📱 تحميل APK](Qudrati.apk) · [✨ الميزات](#-الميزات) · [➕ إضافة أسئلة](#-إضافة-أسئلة)

</div>

---

## 📖 عن المشروع

**قدراتي** لعبة ويب خفيفة تحوّل التحضير للقسم الكمي من اختبار القدرات العامة (GAT) إلى تجربة ممتعة بأسلوب Duolingo: مسار دروس متعرّج، قلوب، نقاط خبرة، سلسلة أيام، ونجوم — كل ذلك بأسئلة أصلية مكتوبة بصيغة الاختبار الرسمي وبحلول تفصيلية خطوة بخطوة.

المشروع HTML/CSS/JS خالص — لا أطر عمل، لا اعتماديات، لا خادم. افتح الملف والعب.

## ✨ الميزات

- 🗺️ **مسار دروس متعرّج** بأسلوب Duolingo: 4 وحدات (الحساب، الجبر، الهندسة، التحليل والإحصاء) × 18 درساً، تُفتح بالتتابع.
- 📚 **216 سؤالاً أصلياً** بصيغة الاختبار الرسمي: اختيار من متعدد + أسئلة **المقارنات** بخياراتها الثابتة الأربعة، مع حل تفصيلي لكل سؤال، وأشكال SVG للهندسة وجداول/رسوم للإحصاء.
- 🎮 **نظام اللعبة**: ٣ قلوب ❤️ لكل مستوى (خسارتها تعيد المستوى من البداية)، مؤقت ⏰ ٩٠ ثانية لكل سؤال، نقاط خبرة ⚡، سلسلة أيام 🔥، نجوم لكل درس، وإعادة الأسئلة الخاطئة في نهاية الجلسة.
- 🎓 **مساران**: علمي / أدبي (الأدبي يستبعد الأسئلة الموسومة `sci`).
- 💾 **حفظ تلقائي**: التقدم كاملاً في `localStorage` — لا حسابات ولا إنترنت.
- 📱 **متجاوب**: يعمل على الجوال والحاسب (بعرض تطبيق جوال 430px)، ومتوفر كتطبيق أندرويد عبر Capacitor.
- ⚖️ **إخلاء مسؤولية** عند أول تشغيل وفي «حول التطبيق»، مع رابط لموقع هيئة تقويم التعليم والتدريب الرسمي.

## 🕹️ كيف تلعب؟

اللعبة تعمل مباشرة من المتصفح — على الجوال أو الحاسب — بدون تحميل ولا تثبيت ولا إنشاء حساب:

### 1️⃣ افتح الرابط: [qudrati-lime.vercel.app](https://qudrati-lime.vercel.app/) ← هذا كل ما تحتاجه!

2. **اختر مسارك** — علمي 🔬 أو أدبي 📖 (يمكن تغييره لاحقاً من الإعدادات).
3. **ابدأ من أول درس** في مسار الدروس المتعرّج، وافتح الدروس التالية بالتتابع.
4. **حافظ على قلوبك** ❤️ — لديك ٣ قلوب لكل مستوى و⏰ ٩٠ ثانية لكل سؤال.
5. **تقدّمك يُحفظ تلقائياً** في جهازك — أغلق الصفحة وارجع متى شئت من نفس المتصفح.

> 💡 **نصيحة للجوال:** افتح الرابط ثم من قائمة المتصفح اختر «إضافة إلى الشاشة الرئيسية» لتحصل على أيقونة تفتح اللعبة كأنها تطبيق.

**🤖 تفضّل تطبيق أندرويد؟** حمّل [`Qudrati.apk`](Qudrati.apk) وثبّته مباشرة — نفس اللعبة بغلاف Capacitor.

## 🧑‍💻 للمطوّرين — التشغيل محلياً

لا تحتاج خادماً ولا تثبيتاً:

1. انسخ المشروع:
   ```bash
   git clone https://github.com/UsoguiH/-QUDRATI.git
   ```
2. افتح `index.html` مباشرة في المتصفح.

**للمعاينة أثناء التطوير:** افتح `preview.html#<screen>` حيث `<screen>` إحدى:
`path` | `lesson` | `pop` | `fb` | `done` | `exam` | `stats` | `settings`
(يتجاوز شاشة الإخلاء ويملأ حالة تجريبية).

## 🗂 بنية المشروع

```
index.html          ← هيكل التطبيق
preview.html        ← معاينة تطوير (تجاوز الإخلاء + حالة تجريبية)
css/style.css       ← نظام التصميم: قيم مطابقة لملف Figma «DuoLingo Design System» + خط Baloo Bhaijaan 2
js/app.js           ← منطق اللعبة كاملاً (الحالة في localStorage)
js/data/*.js        ← بنك الأسئلة (ملف لكل مجال: arithmetic, algebra, geometry, statistics)
assets/icons/*.svg  ← أيقونات مُصدَّرة من ملف Figma نفسه
tools/validate.js   ← مدقق بنية بنك الأسئلة
Qudrati.apk         ← تطبيق أندرويد جاهز (Capacitor)
```

## ➕ إضافة أسئلة

أضف كائن سؤال إلى مصفوفة `questions` في الدرس المناسب داخل `js/data/<domain>.js`:

```js
{
  id: "ar-frac-13",            // معرف فريد
  format: "mcq",               // أو "comparison"
  difficulty: 2,               // 1 سهل، 2 متوسط، 3 صعب
  track: "both",               // أو "sci" (للمسار العلمي فقط)
  stem: "نص السؤال…",
  choices: ["…","…","…","…"],  // mcq فقط (بدون أحرف أ ب ج د)
  // value1: "…", value2: "…", // comparison فقط
  answer: 0,                    // فهرس الإجابة الصحيحة 0-3
  solution: "الحل خطوة بخطوة…", // افصل الخطوات بـ \n
  figure: null                  // أو SVG/جدول HTML
}
```

ثم تحقّق من سلامة البنية:

```bash
node tools/validate.js
```

## 🤝 المساهمة

المساهمات مرحّب بها! خاصة:

- ✍️ **أسئلة جديدة** — الهدف الوصول إلى آلاف الأسئلة الأصلية. التزم بالصيغة أعلاه وشغّل المدقق قبل إرسال الطلب.
- 🐛 إصلاح الأخطاء وتحسين الواجهة.
- 🌍 أفكار لميزات جديدة (افتح Issue للنقاش أولاً).

**قاعدة ذهبية:** جميع الأسئلة يجب أن تكون **أصلية 100%** — يُمنع نسخ أو إعادة إنتاج أسئلة قياس الحقيقية (فهي سرّية ومحمية بحقوق النشر).

## 📄 الرخصة

هذا المشروع مرخّص برخصة [MIT](LICENSE) — استخدمه وعدّله ووزّعه بحرية مع الإبقاء على إشعار الحقوق.

## ⚠️ إخلاء مسؤولية

هذا التطبيق أداة دراسية مستقلة، **غير تابع وغير معتمد** من هيئة تقويم التعليم والتدريب (قياس / ETEC). جميع الأسئلة مادة تدريبية أصلية كُتبت بأسلوب الاختبار الرسمي فقط. للتسجيل والاختبارات الرسمية: [etec.gov.sa](https://etec.gov.sa)

</div>

---

<details>
<summary><b>🇬🇧 English</b></summary>

## QUDRATI — Duolingo-style GAT Quantitative Trainer

A fully Arabic, RTL, dependency-free web game for practicing the quantitative section of the Saudi General Aptitude Test (GAT / Qiyas) — Duolingo style.

### ▶️ How to play — just open this link: **[qudrati-lime.vercel.app](https://qudrati-lime.vercel.app/)**

Works in any browser on phone or desktop — no download, no install, no sign-up. Pick your track (scientific/humanities), start the first lesson, and your progress saves automatically on your device. Prefer a native app? Install [`Qudrati.apk`](Qudrati.apk).

**Highlights**

- Winding lesson path: 4 units (Arithmetic, Algebra, Geometry, Statistics) × 18 lessons, unlocked sequentially.
- **216 original questions** in the official exam format: multiple choice + the signature **quantitative comparison** format, each with a step-by-step solution; SVG figures for geometry, tables/charts for statistics.
- Game systems: 3 hearts per level, 90-second timer, XP, daily streak, stars per lesson, wrong-answer retry queue.
- Two tracks: scientific / humanities.
- Progress saved in `localStorage` — no accounts, no server. Pure HTML/CSS/JS.
- Android build available as [`Qudrati.apk`](Qudrati.apk) (Capacitor wrapper).

**Run it:** clone and open `index.html` in any browser. Dev preview: `preview.html#path|lesson|pop|fb|done|exam|stats|settings`.

**Add questions:** append to `questions` in `js/data/<domain>.js` (schema in the Arabic section above), then run `node tools/validate.js`.

**License:** [MIT](LICENSE).

**Disclaimer:** This is an independent study tool, NOT affiliated with or endorsed by ETEC/Qiyas. All questions are original practice material written in the official exam's style. Official site: [etec.gov.sa](https://etec.gov.sa)

</details>
