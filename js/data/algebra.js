window.QBANK = window.QBANK || {};
window.QBANK.algebra = {
  key: "algebra",
  title: "الجبر",
  color: "blue",
  lessons: [
    {
      key: "equations",
      title: "المعادلات والمتباينات",
      icon: "🧮",
      questions: [
        {
          id: "al-eq-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "إذا كان ٣س + ٥ = ٢٠، فما قيمة س؟",
          choices: ["٤", "٥", "١٥", "٢٥/٣"],
          answer: 1,
          solution: "ننقل ٥ إلى الطرف الآخر: ٣س = ٢٠ − ٥ = ١٥\nنقسم الطرفين على ٣: س = ١٥ ÷ ٣ = ٥",
          figure: null
        },
        {
          id: "al-eq-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "إذا كان س − ٧ = ٢س + ١، فما قيمة س؟",
          choices: ["−٨", "٨", "−٦", "٦"],
          answer: 0,
          solution: "نجمع الحدود المتشابهة: س − ٢س = ١ + ٧\nأي: −س = ٨\nإذن: س = −٨",
          figure: null
        },
        {
          id: "al-eq-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "إذا كان ٢س − ٣ < ٧، فما أكبر عدد صحيح يحققه س؟",
          choices: ["٣", "٥", "٦", "٤"],
          answer: 3,
          solution: "نضيف ٣ إلى الطرفين: ٢س < ١٠\nنقسم على ٢: س < ٥\nالمتباينة لا تشمل ٥ (أصغر من تمامًا)، فأكبر عدد صحيح يحققها هو ٤",
          figure: null
        },
        {
          id: "al-eq-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "إذا كان س + ص = ١٠ و س − ص = ٤",
          value1: "س",
          value2: "ص",
          answer: 0,
          solution: "نجمع المعادلتين: (س + ص) + (س − ص) = ١٠ + ٤\nأي: ٢س = ١٤ ومنها س = ٧\nبالتعويض: ص = ١٠ − ٧ = ٣\nإذن س = ٧ أكبر من ص = ٣، فالقيمة الأولى أكبر",
          figure: null
        },
        {
          id: "al-eq-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان ٢(س − ٣) = ٥س + ٩، فما قيمة س؟",
          choices: ["٥", "−٥", "−٤", "١"],
          answer: 1,
          solution: "نفك القوس: ٢س − ٦ = ٥س + ٩\nننقل الحدود: −٦ − ٩ = ٥س − ٢س\nأي: −١٥ = ٣س\nإذن: س = −٥",
          figure: null
        },
        {
          id: "al-eq-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان س/٣ + س/٤ = ٧، فما قيمة س؟",
          choices: ["٧", "٢١", "٤٩", "١٢"],
          answer: 3,
          solution: "نوحّد المقامات (المضاعف المشترك ١٢): ٤س/١٢ + ٣س/١٢ = ٧\nأي: ٧س/١٢ = ٧\nنضرب الطرفين في ١٢: ٧س = ٨٤\nإذن: س = ١٢",
          figure: null
        },
        {
          id: "al-eq-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "مجموع ثلاثة أعداد صحيحة متتالية يساوي ٧٢، فما أكبر هذه الأعداد؟",
          choices: ["٢٣", "٢٤", "٢٥", "٢٦"],
          answer: 2,
          solution: "نفرض الأعداد: ن، ن + ١، ن + ٢\nالمجموع: ٣ن + ٣ = ٧٢ ومنها ٣ن = ٦٩ أي ن = ٢٣\nالأعداد هي ٢٣، ٢٤، ٢٥\nأكبرها هو ٢٥",
          figure: null
        },
        {
          id: "al-eq-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان ٥ − ٢س ≥ ١١، فأي مما يلي صحيح؟",
          choices: ["س ≤ −٣", "س ≥ −٣", "س ≤ ٣", "س ≥ ٣"],
          answer: 0,
          solution: "نطرح ٥ من الطرفين: −٢س ≥ ٦\nنقسم على −٢ مع عكس اتجاه المتباينة (لأننا نقسم على عدد سالب):\nس ≤ −٣",
          figure: null
        },
        {
          id: "al-eq-09",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "إذا كان ٣س = ٤ص، حيث س و ص عددان موجبان",
          value1: "ص",
          value2: "س",
          answer: 1,
          solution: "من المعادلة: س = ٤ص/٣\nبما أن ص موجب فإن ٤ص/٣ أكبر من ص\nمثال: لو ص = ٣ فإن س = ٤\nإذن س أكبر من ص، فالقيمة الثانية أكبر",
          figure: null
        },
        {
          id: "al-eq-10",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "إذا كان س² = ٩",
          value1: "س",
          value2: "٢",
          answer: 3,
          solution: "للمعادلة س² = ٩ حلان: س = ٣ أو س = −٣\nإذا كان س = ٣ فالقيمة الأولى أكبر\nوإذا كان س = −٣ فالقيمة الثانية أكبر\nبما أن النتيجة تختلف حسب قيمة س، فالمعطيات غير كافية",
          figure: null
        },
        {
          id: "al-eq-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "إذا كان |٢س − ٣| = ٧، فما مجموع قيمتي س اللتين تحققان المعادلة؟",
          choices: ["٣", "٥", "٧", "−٢"],
          answer: 0,
          solution: "الحالة الأولى: ٢س − ٣ = ٧ ومنها ٢س = ١٠ أي س = ٥\nالحالة الثانية: ٢س − ٣ = −٧ ومنها ٢س = −٤ أي س = −٢\nمجموع القيمتين: ٥ + (−٢) = ٣",
          figure: null
        },
        {
          id: "al-eq-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "إذا كان ٣س − ص = ٧ و س + ص = ٩",
          value1: "٢س",
          value2: "ص + ٣",
          answer: 2,
          solution: "نجمع المعادلتين: (٣س − ص) + (س + ص) = ٧ + ٩\nأي: ٤س = ١٦ ومنها س = ٤\nبالتعويض: ص = ٩ − ٤ = ٥\nالقيمة الأولى: ٢س = ٨، والقيمة الثانية: ص + ٣ = ٨\nإذن القيمتان متساويتان",
          figure: null
        }
      ]
    },
    {
      key: "sequences",
      title: "المتتاليات",
      icon: "🪜",
      questions: [
        {
          id: "al-seq-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في المتتالية الحسابية: ٣، ٧، ١١، ١٥، ... ما الحد التالي؟",
          choices: ["١٧", "١٨", "١٩", "٢١"],
          answer: 2,
          solution: "الأساس (الفرق المشترك): ٧ − ٣ = ٤\nالحد التالي: ١٥ + ٤ = ١٩",
          figure: null
        },
        {
          id: "al-seq-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في المتتالية الهندسية: ٢، ٦، ١٨، ٥٤، ... ما الأساس (النسبة المشتركة)؟",
          choices: ["٢", "٣", "٤", "٦"],
          answer: 1,
          solution: "في المتتالية الهندسية نقسم أي حد على الحد الذي قبله:\n٦ ÷ ٢ = ٣، وكذلك ١٨ ÷ ٦ = ٣\nإذن الأساس = ٣\n(انتبه: ٤ هو الفرق ٦ − ٢ وليس النسبة)",
          figure: null
        },
        {
          id: "al-seq-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "متتالية حسابية حدها الأول ٤ وأساسها ٥، فما حدها الرابع؟",
          choices: ["١٤", "١٩", "٢٤", "٢٠"],
          answer: 1,
          solution: "الحد الرابع = الحد الأول + ٣ × الأساس\n= ٤ + ٣ × ٥ = ٤ + ١٥ = ١٩\n(الخطأ الشائع: ضرب الأساس في ٤ بدلًا من ٣)",
          figure: null
        },
        {
          id: "al-seq-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "متتالية حسابية حدها الأول ٥ وأساسها ٣",
          value1: "الحد الخامس",
          value2: "١٥",
          answer: 0,
          solution: "الحد الخامس = الحد الأول + ٤ × الأساس\n= ٥ + ٤ × ٣ = ٥ + ١٢ = ١٧\n١٧ أكبر من ١٥، فالقيمة الأولى أكبر",
          figure: null
        },
        {
          id: "al-seq-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في المتتالية الحسابية: ٢، ٩، ١٦، ٢٣، ... ما الحد العاشر؟",
          choices: ["٥٨", "٦٣", "٦٥", "٧٢"],
          answer: 2,
          solution: "الأساس: ٩ − ٢ = ٧\nالحد العاشر = الحد الأول + ٩ × الأساس\n= ٢ + ٩ × ٧ = ٢ + ٦٣ = ٦٥",
          figure: null
        },
        {
          id: "al-seq-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "متتالية هندسية حدها الثالث ١٢ وأساسها ٢، فما حدها الأول؟",
          choices: ["٣", "٦", "٢٤", "٤٨"],
          answer: 0,
          solution: "للرجوع من الحد الثالث إلى الأول نقسم على الأساس مرتين:\nالحد الثاني = ١٢ ÷ ٢ = ٦\nالحد الأول = ٦ ÷ ٢ = ٣",
          figure: null
        },
        {
          id: "al-seq-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في متتالية حسابية، الحد الثالث يساوي ١١ والحد السابع يساوي ٢٣، فما أساس المتتالية؟",
          choices: ["٢", "٤", "٦", "٣"],
          answer: 3,
          solution: "بين الحد الثالث والحد السابع أربع خطوات (٧ − ٣ = ٤)\nالفرق بين الحدين: ٢٣ − ١١ = ١٢\nالأساس = ١٢ ÷ ٤ = ٣",
          figure: null
        },
        {
          id: "al-seq-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "متتالية حسابية حدها الأول ٣ وأساسها ٤، فما مجموع حدودها العشرة الأولى؟",
          choices: ["١٩٥", "٢٣٠", "٤٢٠", "٢١٠"],
          answer: 3,
          solution: "الحد العاشر = ٣ + ٩ × ٤ = ٣٩\nالمجموع = عدد الحدود × (الحد الأول + الحد الأخير) ÷ ٢\n= ١٠ × (٣ + ٣٩) ÷ ٢ = ١٠ × ٤٢ ÷ ٢ = ٢١٠",
          figure: null
        },
        {
          id: "al-seq-09",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "متتالية هندسية حدها الأول ٢ وأساسها ٣",
          value1: "الحد الرابع",
          value2: "٦٠",
          answer: 1,
          solution: "الحد الرابع = الحد الأول × الأساس³\n= ٢ × ٣³ = ٢ × ٢٧ = ٥٤\n٥٤ أصغر من ٦٠، فالقيمة الثانية أكبر",
          figure: null
        },
        {
          id: "al-seq-10",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "في متتالية حسابية، الحد الثاني يساوي ٧ والحد الخامس يساوي ١٩",
          value1: "أساس المتتالية",
          value2: "٤",
          answer: 2,
          solution: "بين الحد الثاني والحد الخامس ثلاث خطوات (٥ − ٢ = ٣)\nالفرق بين الحدين: ١٩ − ٧ = ١٢\nالأساس = ١٢ ÷ ٣ = ٤\nإذن القيمتان متساويتان",
          figure: null
        },
        {
          id: "al-seq-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "متتالية هندسية جميع حدودها موجبة، حدها الثاني ٦ وحدها الرابع ٥٤، فما حدها الخامس؟",
          choices: ["٨١", "١٠٨", "١٦٢", "٤٨٦"],
          answer: 2,
          solution: "من الحد الثاني إلى الرابع خطوتان: ر² = ٥٤ ÷ ٦ = ٩\nبما أن الحدود موجبة: ر = ٣\nالحد الخامس = الحد الرابع × ر = ٥٤ × ٣ = ١٦٢",
          figure: null
        },
        {
          id: "al-seq-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "متتالية هندسية حدها الأول ٤ وحدها الثالث ٣٦",
          value1: "الحد الثاني",
          value2: "٠",
          answer: 3,
          solution: "من الحد الأول إلى الثالث خطوتان: ر² = ٣٦ ÷ ٤ = ٩\nإذن ر = ٣ أو ر = −٣\nإذا كان ر = ٣ فالحد الثاني = ١٢ (موجب، الأولى أكبر)\nوإذا كان ر = −٣ فالحد الثاني = −١٢ (سالب، الثانية أكبر)\nإذن المعطيات غير كافية",
          figure: null
        }
      ]
    },
    {
      key: "exponents",
      title: "الأسس والجذور",
      icon: "🚀",
      questions: [
        {
          id: "al-exp-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما ناتج ٢³ × ٢⁴؟",
          choices: ["٢⁷", "٢¹²", "٤⁷", "٤¹²"],
          answer: 0,
          solution: "عند ضرب قوتين لهما الأساس نفسه نجمع الأسس:\n٢³ × ٢⁴ = ٢^(٣ + ٤) = ٢⁷\n(الخطأ الشائع: ضرب الأسس أو ضرب الأساسين)",
          figure: null
        },
        {
          id: "al-exp-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما قيمة √٦٤ + √٣٦؟",
          choices: ["١٠", "١٢", "١٤", "٥٠"],
          answer: 2,
          solution: "√٦٤ = ٨ و √٣٦ = ٦\nالمجموع: ٨ + ٦ = ١٤\n(انتبه: √٦٤ + √٣٦ لا تساوي √١٠٠ = ١٠، فالجذر لا يوزَّع على الجمع)",
          figure: null
        },
        {
          id: "al-exp-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما ناتج (٣²)³؟",
          choices: ["٣⁵", "٣⁶", "٩⁶", "٣⁹"],
          answer: 1,
          solution: "عند رفع قوة إلى قوة نضرب الأسين:\n(٣²)³ = ٣^(٢ × ٣) = ٣⁶\n(الخطأ الشائع: جمع الأسين فيكون ٣⁵)",
          figure: null
        },
        {
          id: "al-exp-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "٢⁵",
          value2: "٥²",
          answer: 0,
          solution: "القيمة الأولى: ٢⁵ = ٣٢\nالقيمة الثانية: ٥² = ٢٥\n٣٢ أكبر من ٢٥، فالقيمة الأولى أكبر",
          figure: null
        },
        {
          id: "al-exp-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان ٣^س = ٨١، فما قيمة س؟",
          choices: ["٣", "٤", "٥", "٢٧"],
          answer: 1,
          solution: "نكتب ٨١ كقوة للعدد ٣:\n٨١ = ٣ × ٣ × ٣ × ٣ = ٣⁴\nإذن ٣^س = ٣⁴ ومنها س = ٤",
          figure: null
        },
        {
          id: "al-exp-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "ما ناتج √٢ × √١٨؟",
          choices: ["√٢٠", "٦", "١٢", "٣٦"],
          answer: 1,
          solution: "عند ضرب جذرين نضرب ما تحت الجذر:\n√٢ × √١٨ = √(٢ × ١٨) = √٣٦ = ٦\n(انتبه: لا نجمع ما تحت الجذرين)",
          figure: null
        },
        {
          id: "al-exp-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "ما قيمة (٢⁰ + ٢²)²؟",
          choices: ["١٦", "١٧", "٢٠", "٢٥"],
          answer: 3,
          solution: "٢⁰ = ١ (أي عدد لا يساوي صفرًا مرفوع للأس صفر يساوي ١)\n٢² = ٤\nداخل القوس: ١ + ٤ = ٥\nالناتج: ٥² = ٢٥\n(الخطأ الشائع: تربيع كل حد على حدة فيكون ١ + ١٦ = ١٧)",
          figure: null
        },
        {
          id: "al-exp-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان ٩^س = ٢٧، فما قيمة س؟",
          choices: ["٣", "٢/٣", "٣/٢", "٢"],
          answer: 2,
          solution: "نوحّد الأساس: ٩ = ٣² و ٢٧ = ٣³\nإذن (٣²)^س = ٣³ أي ٣^(٢س) = ٣³\nبمساواة الأسين: ٢س = ٣ ومنها س = ٣/٢",
          figure: null
        },
        {
          id: "al-exp-09",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "",
          value1: "√٥٠",
          value2: "٨",
          answer: 1,
          solution: "نكتب ٨ على صورة جذر: ٨ = √٦٤\nبما أن ٥٠ أصغر من ٦٤ فإن √٥٠ أصغر من √٦٤\nإذن القيمة الثانية أكبر",
          figure: null
        },
        {
          id: "al-exp-10",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "",
          value1: "٤⁶",
          value2: "٢¹²",
          answer: 2,
          solution: "نوحّد الأساس: ٤ = ٢²\nإذن ٤⁶ = (٢²)⁶ = ٢^(٢ × ٦) = ٢¹²\nالقيمتان متساويتان",
          figure: null
        },
        {
          id: "al-exp-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "إذا كان ٢^س = ٥، فما قيمة ٢^(س + ٣)؟",
          choices: ["١٥", "٢٥", "٤٠", "١٢٥"],
          answer: 2,
          solution: "٢^(س + ٣) = ٢^س × ٢³\n= ٥ × ٨ = ٤٠\n(الخطأ الشائع: ٥ × ٣ = ١٥ أو ٥³ = ١٢٥)",
          figure: null
        },
        {
          id: "al-exp-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "إذا كان س عددًا حقيقيًا لا يساوي صفرًا",
          value1: "س²",
          value2: "س⁴",
          answer: 3,
          solution: "نجرّب قيمًا مختلفة:\nإذا كان س = ٢: س² = ٤ و س⁴ = ١٦، فالثانية أكبر\nإذا كان س = ١/٢: س² = ١/٤ و س⁴ = ١/١٦، فالأولى أكبر\nوإذا كان س = ١ تتساوى القيمتان\nالنتيجة تختلف حسب قيمة س، فالمعطيات غير كافية",
          figure: null
        }
      ]
    },
    {
      key: "factoring",
      title: "التحليل والمقادير الجبرية",
      icon: "🧩",
      questions: [
        {
          id: "al-fa-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما تحليل المقدار س² − ٩؟",
          choices: ["(س − ٣)²", "(س + ٣)²", "(س − ٣)(س + ٣)", "س(س − ٩)"],
          answer: 2,
          solution: "المقدار فرق بين مربعين: س² − ٣²\nوالفرق بين مربعين يحلَّل إلى: (س − ٣)(س + ٣)",
          figure: null
        },
        {
          id: "al-fa-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما أبسط صورة للمقدار (٣س + ٦) ÷ ٣؟",
          choices: ["س + ٢", "س + ٦", "٣س + ٢", "س"],
          answer: 0,
          solution: "نأخذ ٣ عاملًا مشتركًا من البسط: ٣س + ٦ = ٣(س + ٢)\nثم نختصر: ٣(س + ٢) ÷ ٣ = س + ٢\n(الخطأ الشائع: قسمة الحد الأول فقط على ٣ فيكون س + ٦)",
          figure: null
        },
        {
          id: "al-fa-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما ناتج فك (س + ٤)(س + ٢)؟",
          choices: ["س² + ٨س + ٦", "س² + ٦س + ٨", "س² + ٦س + ٦", "س² + ٨"],
          answer: 1,
          solution: "نفك بالتوزيع:\n(س + ٤)(س + ٢) = س² + ٢س + ٤س + ٨\n= س² + ٦س + ٨\n(الحد الأوسط مجموع العددين ٤ + ٢، والحد الأخير حاصل ضربهما ٤ × ٢)",
          figure: null
        },
        {
          id: "al-fa-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "إذا كان س = ٥",
          value1: "(س + ١)²",
          value2: "س² + ١",
          answer: 0,
          solution: "القيمة الأولى: (٥ + ١)² = ٦² = ٣٦\nالقيمة الثانية: ٥² + ١ = ٢٥ + ١ = ٢٦\n(تذكّر: (س + ١)² = س² + ٢س + ١ وليس س² + ١)\nإذن القيمة الأولى أكبر",
          figure: null
        },
        {
          id: "al-fa-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان س² − ص² = ٢٤ و س − ص = ٤، فما قيمة س + ص؟",
          choices: ["٤", "٦", "٢٠", "٩٦"],
          answer: 1,
          solution: "نحلل الفرق بين مربعين: س² − ص² = (س − ص)(س + ص)\nإذن: ٢٤ = ٤ × (س + ص)\nومنها: س + ص = ٢٤ ÷ ٤ = ٦",
          figure: null
        },
        {
          id: "al-fa-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "أي مما يلي حل للمعادلة س² − ٧س + ١٢ = ٠؟",
          choices: ["−٣", "٢", "٣", "٦"],
          answer: 2,
          solution: "نبحث عن عددين حاصل ضربهما ١٢ ومجموعهما ٧، وهما ٣ و ٤\nالتحليل: (س − ٣)(س − ٤) = ٠\nإذن س = ٣ أو س = ٤\nمن الخيارات، الحل هو ٣\n(انتبه لإشارة الحل: العوامل (س − ٣) تعطي س = ٣ وليس −٣)",
          figure: null
        },
        {
          id: "al-fa-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "ما أبسط صورة للمقدار (س² − ٢٥) ÷ (س − ٥)، حيث س ≠ ٥؟",
          choices: ["س − ٥", "س + ٥", "س + ٢٥", "س − ٢٥"],
          answer: 1,
          solution: "نحلل البسط فرقًا بين مربعين: س² − ٢٥ = (س − ٥)(س + ٥)\nنختصر (س − ٥) من البسط والمقام:\nالناتج = س + ٥",
          figure: null
        },
        {
          id: "al-fa-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان أ + ب = ٧ و أب = ١٠، فما قيمة أ² + ب²؟",
          choices: ["٢٩", "٣٩", "٤٩", "٥٩"],
          answer: 0,
          solution: "نستخدم المتطابقة: (أ + ب)² = أ² + ٢أب + ب²\nإذن: أ² + ب² = (أ + ب)² − ٢أب\n= ٧² − ٢ × ١٠ = ٤٩ − ٢٠ = ٢٩\n(الخطأ الشائع: اعتبار أ² + ب² = (أ + ب)² = ٤٩)",
          figure: null
        },
        {
          id: "al-fa-09",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "إذا كان س عددًا موجبًا",
          value1: "(س − ٢)²",
          value2: "س² + ٤",
          answer: 1,
          solution: "نفك القيمة الأولى: (س − ٢)² = س² − ٤س + ٤\nنقارنها بالقيمة الثانية س² + ٤\nالفرق بينهما: (س² − ٤س + ٤) − (س² + ٤) = −٤س\nبما أن س موجب فإن −٤س سالب، أي الأولى أصغر دائمًا\nإذن القيمة الثانية أكبر",
          figure: null
        },
        {
          id: "al-fa-10",
          format: "comparison",
          difficulty: 2,
          track: "sci",
          stem: "إذا كان س + ص = ٦",
          value1: "س² + ٢س ص + ص²",
          value2: "٣٦",
          answer: 2,
          solution: "القيمة الأولى مربع كامل: س² + ٢س ص + ص² = (س + ص)²\n= ٦² = ٣٦\nإذن القيمتان متساويتان",
          figure: null
        },
        {
          id: "al-fa-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "إذا كان س + ١/س = ٤، فما قيمة س² + ١/س²؟",
          choices: ["١٦", "١٨", "٨", "١٤"],
          answer: 3,
          solution: "نربّع الطرفين: (س + ١/س)² = ١٦\nالفك: س² + ٢ × س × (١/س) + ١/س² = ١٦\nأي: س² + ٢ + ١/س² = ١٦\nإذن: س² + ١/س² = ١٦ − ٢ = ١٤\n(الخطأ الشائع: تربيع كل حد على حدة فتكون الإجابة ١٦)",
          figure: null
        },
        {
          id: "al-fa-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "إذا كان س ص = ١٢",
          value1: "س + ص",
          value2: "٧",
          answer: 3,
          solution: "نجرّب قيمًا تحقق س ص = ١٢:\nإذا كان س = ٣ و ص = ٤ فإن س + ص = ٧ (تساوي)\nإذا كان س = ٢ و ص = ٦ فإن س + ص = ٨ (الأولى أكبر)\nإذا كان س = −٣ و ص = −٤ فإن س + ص = −٧ (الثانية أكبر)\nالنتيجة تختلف حسب القيم، فالمعطيات غير كافية",
          figure: null
        }
      ]
    }
  ]
};
