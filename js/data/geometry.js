window.QBANK = window.QBANK || {};
window.QBANK.geometry = {
  key: "geometry",
  title: "الهندسة",
  color: "purple",
  lessons: [
    {
      key: "angles",
      title: "الزوايا والمستقيمات",
      icon: "📐",
      questions: [
        {
          id: "ge-ang-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، زاويتان على مستقيم، قياس إحداهما ٦٥°. ما قياس الزاوية س؟",
          choices: ["١١٥°", "٢٥°", "٦٥°", "١٢٥°"],
          answer: 0,
          solution: "الزاويتان على مستقيم واحد، فهما متكاملتان ومجموعهما ١٨٠°.\nس = ١٨٠ − ٦٥ = ١١٥°.\nانتبه: ٢٥° هي المتممة (مجموع ٩٠°) وليست المطلوبة.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='160' x2='280' y2='160' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='160' x2='104' y2='60' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><path d='M178,160 A28,28 0 0 0 138,135' fill='none' stroke='#CE82FF' stroke-width='2.5'/><path d='M128,160 A22,22 0 0 1 140,138' fill='none' stroke='#1CB0F6' stroke-width='2.5'/><text x='195' y='138' font-size='16' fill='#4B4B4B' text-anchor='middle'>س</text><text x='105' y='140' font-size='16' fill='#4B4B4B' text-anchor='middle'>٦٥°</text></svg>"
        },
        {
          id: "ge-ang-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "زاويتان متتامتان، قياس إحداهما ضعف قياس الأخرى. ما قياس الزاوية الصغرى؟",
          choices: ["٦٠°", "٣٠°", "٤٥°", "١٥°"],
          answer: 1,
          solution: "متتامتان يعني مجموعهما ٩٠°.\nنفرض الصغرى س، فتكون الكبرى ٢س.\nس + ٢س = ٩٠ ومنها ٣س = ٩٠ أي س = ٣٠°.\nانتبه: ٦٠° هي الزاوية الكبرى وليست الصغرى.",
          figure: null
        },
        {
          id: "ge-ang-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، مستقيمان متقاطعان. إذا كان قياس إحدى الزاويتين ٤٠°، فما قياس الزاوية س المقابلة لها بالرأس؟",
          choices: ["١٤٠°", "٥٠°", "٤٠°", "٨٠°"],
          answer: 2,
          solution: "الزاويتان المتقابلتان بالرأس متساويتان في القياس.\nإذن س = ٤٠°.\nانتبه: ١٤٠° هي قياس الزاوية المجاورة (المتكاملة) وليست المقابلة بالرأس.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='40' y1='40' x2='260' y2='160' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='40' y1='160' x2='260' y2='40' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='225' y='105' font-size='16' fill='#4B4B4B' text-anchor='middle'>٤٠°</text><text x='75' y='105' font-size='16' fill='#4B4B4B' text-anchor='middle'>س</text></svg>"
        },
        {
          id: "ge-ang-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "مجموع قياسي زاويتين متكاملتين",
          value2: "قياس الزاوية المستقيمة",
          answer: 2,
          solution: "الزاويتان المتكاملتان مجموع قياسيهما ١٨٠°.\nالزاوية المستقيمة قياسها ١٨٠° أيضًا.\nإذن القيمتان متساويتان.",
          figure: null
        },
        {
          id: "ge-ang-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، مستقيمان متوازيان يقطعهما قاطع. إذا كان قياس إحدى الزاويتين ١١٠°، فما قياس الزاوية س؟",
          choices: ["٧٠°", "١١٠°", "٢٠°", "٩٠°"],
          answer: 0,
          solution: "الزاويتان داخليتان وفي جهة واحدة من القاطع (متحالفتان)، ومجموعهما مع التوازي ١٨٠°.\nس = ١٨٠ − ١١٠ = ٧٠°.\nانتبه: لو كانتا متبادلتين داخليًا لكانتا متساويتين، لكن وضعهما هنا في الجهة نفسها.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='30' y1='70' x2='270' y2='70' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='30' y1='140' x2='270' y2='140' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='90' y1='30' x2='210' y2='180' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='158' y='95' font-size='16' fill='#4B4B4B' text-anchor='middle'>١١٠°</text><text x='208' y='133' font-size='16' fill='#4B4B4B' text-anchor='middle'>س</text><path d='M255,63 l10,7 l-10,7' fill='none' stroke='#AFAFAF' stroke-width='2'/><path d='M255,133 l10,7 l-10,7' fill='none' stroke='#AFAFAF' stroke-width='2'/></svg>"
        },
        {
          id: "ge-ang-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "ثلاث زوايا حول نقطة، النسبة بين قياساتها ٢ : ٣ : ٤. ما قياس أكبرها؟",
          choices: ["٨٠°", "١٢٠°", "١٦٠°", "١٨٠°"],
          answer: 2,
          solution: "مجموع الزوايا حول نقطة = ٣٦٠°.\nمجموع أجزاء النسبة = ٢ + ٣ + ٤ = ٩، فقيمة الجزء = ٣٦٠ ÷ ٩ = ٤٠°.\nأكبر زاوية = ٤ × ٤٠ = ١٦٠°.\nانتبه: لو كان المجموع ١٨٠° (على مستقيم) لكان الجواب ٨٠°.",
          figure: null
        },
        {
          id: "ge-ang-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، ثلاث زوايا على مستقيم قياساتها: س، ٢س، ٣س. ما قياس أكبر الزوايا الثلاث؟",
          choices: ["٣٠°", "٦٠°", "٩٠°", "١٢٠°"],
          answer: 2,
          solution: "مجموع الزوايا على المستقيم = ١٨٠°.\nس + ٢س + ٣س = ٦س = ١٨٠ ومنها س = ٣٠°.\nأكبر الزوايا = ٣س = ٣ × ٣٠ = ٩٠°.\nانتبه: ٣٠° هي قيمة س وليست أكبر زاوية.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='160' x2='280' y2='160' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='160' x2='237' y2='110' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='160' x2='150' y2='60' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='215' y='152' font-size='16' fill='#4B4B4B' text-anchor='middle'>س</text><text x='190' y='110' font-size='16' fill='#4B4B4B' text-anchor='middle'>٢س</text><text x='100' y='115' font-size='16' fill='#4B4B4B' text-anchor='middle'>٣س</text></svg>"
        },
        {
          id: "ge-ang-08",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "زاويتان متتامتان، قياس إحداهما أكبر من ٤٥°",
          value1: "قياس الزاوية الأخرى",
          value2: "٤٥°",
          answer: 1,
          solution: "مجموع المتتامتين ٩٠°.\nإذا كانت إحداهما أكبر من ٤٥°، فإن الأخرى = ٩٠ − (أكبر من ٤٥) أي أقل من ٤٥°.\nإذن القيمة الثانية (٤٥°) أكبر.",
          figure: null
        },
        {
          id: "ge-ang-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "",
          value1: "قياس زاوية منعكسة",
          value2: "١٨٠°",
          answer: 0,
          solution: "الزاوية المنعكسة قياسها أكبر من ١٨٠° وأصغر من ٣٦٠°.\nإذن قياسها أكبر من ١٨٠° دائمًا، فالقيمة الأولى أكبر.",
          figure: null
        },
        {
          id: "ge-ang-10",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، مستقيمان متوازيان يقطعهما قاطع، والزاويتان المبينتان متبادلتان داخليًا. ما قيمة س؟",
          choices: ["٢٠", "٢٥", "٣٠", "٤٠"],
          answer: 2,
          solution: "الزاويتان المتبادلتان داخليًا بين مستقيمين متوازيين متساويتان.\n٢س − ١٠ = ٥٠.\n٢س = ٦٠ ومنها س = ٣٠.\nانتبه: من يجعل مجموعهما ١٨٠° يحصل على س = ٧٠ وهو غير موجود بين الخيارات أصلًا.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='30' y1='70' x2='270' y2='70' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='30' y1='140' x2='270' y2='140' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='90' y1='30' x2='210' y2='180' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='175' y='95' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٢س − ١٠)°</text><text x='138' y='133' font-size='16' fill='#4B4B4B' text-anchor='middle'>٥٠°</text><path d='M255,63 l10,7 l-10,7' fill='none' stroke='#AFAFAF' stroke-width='2'/><path d='M255,133 l10,7 l-10,7' fill='none' stroke='#AFAFAF' stroke-width='2'/></svg>"
        },
        {
          id: "ge-ang-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "ما قياس الزاوية (الصغرى) بين عقربي الساعة عند الساعة ٣:٣٠؟",
          choices: ["٩٠°", "٧٥°", "٦٠°", "١٠٥°"],
          answer: 1,
          solution: "عقرب الدقائق عند الدقيقة ٣٠ يشير إلى الرقم ٦، أي بزاوية ١٨٠° من اتجاه الرقم ١٢.\nعقرب الساعات تجاوز الرقم ٣ بنصف المسافة نحو الرقم ٤: ٩٠° + ١٥° = ١٠٥°.\nالزاوية بينهما = ١٨٠ − ١٠٥ = ٧٥°.\nانتبه: من ينسى أن عقرب الساعات يتحرك مع الدقائق يحصل على ٩٠° وهي إجابة خاطئة.",
          figure: null
        },
        {
          id: "ge-ang-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "مستقيمان غير متوازيين يقطعهما قاطع",
          value1: "مجموع قياسي الزاويتين الداخليتين الواقعتين في جهة واحدة من القاطع",
          value2: "١٨٠°",
          answer: 3,
          solution: "لو كان المستقيمان متوازيين لكان المجموع ١٨٠° تمامًا.\nبما أنهما غير متوازيين فالمجموع لا يساوي ١٨٠°، لكنه قد يكون أكبر أو أصغر بحسب اتجاه ميل المستقيمين.\nلا يمكن تحديد أيهما أكبر، فالمعطيات غير كافية.",
          figure: null
        }
      ]
    },
    {
      key: "triangles",
      title: "المثلثات وفيثاغورس",
      icon: "🔺",
      questions: [
        {
          id: "ge-tri-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "مثلث قياسا زاويتين فيه ٥٥° و ٦٥°. ما قياس الزاوية الثالثة؟",
          choices: ["٧٠°", "٦٠°", "٥٠°", "١٢٠°"],
          answer: 1,
          solution: "مجموع زوايا المثلث = ١٨٠°.\nالزاوية الثالثة = ١٨٠ − (٥٥ + ٦٥) = ١٨٠ − ١٢٠ = ٦٠°.",
          figure: null
        },
        {
          id: "ge-tri-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، مثلث قائم الزاوية طولا ضلعي القائمة فيه ٦ سم و ٨ سم. ما طول الوتر؟",
          choices: ["٧ سم", "١٠ سم", "١٢ سم", "١٤ سم"],
          answer: 1,
          solution: "بنظرية فيثاغورس: الوتر² = ٦² + ٨² = ٣٦ + ٦٤ = ١٠٠.\nالوتر = √١٠٠ = ١٠ سم.\nانتبه: ١٤ هي مجموع الضلعين وليست الوتر.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M60,160 L240,160 L60,40 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M60,142 L78,142 L78,160' fill='none' stroke='#4B4B4B' stroke-width='2'/><text x='150' y='184' font-size='16' fill='#4B4B4B' text-anchor='middle'>٨ سم</text><text x='38' y='105' font-size='16' fill='#4B4B4B' text-anchor='middle'>٦ سم</text><text x='168' y='90' font-size='18' fill='#4B4B4B' text-anchor='middle'>؟</text></svg>"
        },
        {
          id: "ge-tri-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "مثلث متطابق الضلعين، قياس زاوية الرأس فيه ٤٠°. ما قياس كل من زاويتي القاعدة؟",
          choices: ["٤٠°", "٥٥°", "٧٠°", "١٤٠°"],
          answer: 2,
          solution: "زاويتا القاعدة في المثلث المتطابق الضلعين متساويتان.\nمجموعهما = ١٨٠ − ٤٠ = ١٤٠°.\nقياس كل منهما = ١٤٠ ÷ ٢ = ٧٠°.",
          figure: null
        },
        {
          id: "ge-tri-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، مثلث أ ب جـ قائم الزاوية في جـ",
          value1: "طول الضلع أ ب",
          value2: "طول الضلع أ جـ",
          answer: 0,
          solution: "الضلع أ ب هو الوتر لأنه يقابل الزاوية القائمة.\nالوتر هو أطول أضلاع المثلث القائم لأنه يقابل أكبر زاوية.\nإذن أ ب أكبر من أ جـ، فالقيمة الأولى أكبر.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M60,40 L60,160 L240,160 Z' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M60,142 L78,142 L78,160' fill='none' stroke='#4B4B4B' stroke-width='2'/><text x='52' y='30' font-size='16' fill='#4B4B4B' text-anchor='middle'>أ</text><text x='45' y='175' font-size='16' fill='#4B4B4B' text-anchor='middle'>جـ</text><text x='255' y='175' font-size='16' fill='#4B4B4B' text-anchor='middle'>ب</text></svg>"
        },
        {
          id: "ge-tri-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، سلّم طوله ١٣ مترًا يستند إلى جدار رأسي، وقاعدته تبعد ٥ أمتار عن الجدار. على أي ارتفاع يلامس السلّم الجدار؟",
          choices: ["٨ م", "١١ م", "١٢ م", "١٨ م"],
          answer: 2,
          solution: "السلّم والجدار والأرض يكوّنون مثلثًا قائم الزاوية، والسلّم هو الوتر.\nالارتفاع² = ١٣² − ٥² = ١٦٩ − ٢٥ = ١٤٤.\nالارتفاع = √١٤٤ = ١٢ مترًا.\nهذه الأعداد ثلاثية فيثاغورية مشهورة: ٥، ١٢، ١٣.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='70' y1='30' x2='70' y2='170' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='40' y1='170' x2='260' y2='170' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='190' y1='170' x2='70' y2='60' stroke='#CE82FF' stroke-width='3' stroke-linecap='round'/><path d='M70,152 L88,152 L88,170' fill='none' stroke='#4B4B4B' stroke-width='2'/><text x='150' y='100' font-size='16' fill='#4B4B4B' text-anchor='middle'>١٣ م</text><text x='130' y='190' font-size='16' fill='#4B4B4B' text-anchor='middle'>٥ م</text><text x='50' y='110' font-size='18' fill='#4B4B4B' text-anchor='middle'>؟</text></svg>"
        },
        {
          id: "ge-tri-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "النسبة بين قياسات زوايا مثلث هي ١ : ٢ : ٣. ما نوع هذا المثلث؟",
          choices: ["حاد الزوايا", "قائم الزاوية", "منفرج الزاوية", "متطابق الأضلاع"],
          answer: 1,
          solution: "مجموع أجزاء النسبة = ١ + ٢ + ٣ = ٦، فقيمة الجزء = ١٨٠ ÷ ٦ = ٣٠°.\nالزوايا هي: ٣٠°، ٦٠°، ٩٠°.\nوجود زاوية قياسها ٩٠° يجعل المثلث قائم الزاوية.",
          figure: null
        },
        {
          id: "ge-tri-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، مُدَّ ضلع المثلث لتتكوّن زاوية خارجية س. إذا كان قياسا الزاويتين الداخليتين البعيدتين ٤٥° و ٦٥°، فما قياس س؟",
          choices: ["٧٠°", "١٠٠°", "١١٠°", "١٢٠°"],
          answer: 2,
          solution: "قياس الزاوية الخارجية للمثلث يساوي مجموع قياسي الزاويتين الداخليتين البعيدتين عنها.\nس = ٤٥ + ٦٥ = ١١٠°.\nطريقة أخرى: الزاوية الداخلية المجاورة = ١٨٠ − ١١٠ = ٧٠، والمجموع ٤٥ + ٦٥ + ٧٠ = ١٨٠ ✓.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M70,160 L210,160 L140,60 Z' fill='#FFF1C1' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><line x1='210' y1='160' x2='272' y2='160' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='140' y='95' font-size='16' fill='#4B4B4B' text-anchor='middle'>٤٥°</text><text x='98' y='150' font-size='16' fill='#4B4B4B' text-anchor='middle'>٦٥°</text><text x='238' y='143' font-size='16' fill='#4B4B4B' text-anchor='middle'>س</text></svg>"
        },
        {
          id: "ge-tri-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "أي من المجموعات التالية يمكن أن تكون أطوال أضلاع مثلث؟",
          choices: ["٢، ٣، ٦", "٤، ٥، ١٠", "٥، ٧، ١١", "١، ٢، ٣"],
          answer: 2,
          solution: "شرط تكوين المثلث: مجموع أي ضلعين أكبر من الضلع الثالث.\n٢ + ٣ = ٥ < ٦ ✗، و ٤ + ٥ = ٩ < ١٠ ✗، و ١ + ٢ = ٣ = ٣ ✗ (المساواة لا تكفي).\nأما ٥ + ٧ = ١٢ > ١١ ✓ وبقية الشروط متحققة، فهي المجموعة الصالحة.",
          figure: null
        },
        {
          id: "ge-tri-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "مثلث أطوال أضلاعه ٧ و ١٠ و س، حيث س عدد صحيح",
          value1: "أصغر قيمة ممكنة للعدد س",
          value2: "٥",
          answer: 1,
          solution: "بمتباينة المثلث: س أكبر من الفرق وأصغر من المجموع.\n١٠ − ٧ < س < ١٠ + ٧ أي ٣ < س < ١٧.\nأصغر عدد صحيح يحقق ذلك هو س = ٤.\nبما أن ٤ < ٥ فالقيمة الثانية أكبر.",
          figure: null
        },
        {
          id: "ge-tri-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، مثلث أ ب جـ فيه: قياس الزاوية أ = ٧٠°، وقياس الزاوية ب = ٦٠°",
          value1: "طول الضلع ب جـ",
          value2: "طول الضلع أ ب",
          answer: 0,
          solution: "قياس الزاوية جـ = ١٨٠ − (٧٠ + ٦٠) = ٥٠°.\nالضلع ب جـ يقابل الزاوية أ (٧٠°)، والضلع أ ب يقابل الزاوية جـ (٥٠°).\nالضلع المقابل للزاوية الأكبر يكون أطول.\nبما أن ٧٠° > ٥٠° فإن ب جـ > أ ب، فالقيمة الأولى أكبر.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M150,45 L60,160 L240,160 Z' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='150' y='35' font-size='16' fill='#4B4B4B' text-anchor='middle'>أ</text><text x='45' y='175' font-size='16' fill='#4B4B4B' text-anchor='middle'>ب</text><text x='255' y='175' font-size='16' fill='#4B4B4B' text-anchor='middle'>جـ</text><text x='150' y='80' font-size='15' fill='#4B4B4B' text-anchor='middle'>٧٠°</text><text x='92' y='150' font-size='15' fill='#4B4B4B' text-anchor='middle'>٦٠°</text></svg>"
        },
        {
          id: "ge-tri-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "مثلث قائم الزاوية ومتطابق الضلعين، طول وتره ٨ سم. ما مساحته بالسنتيمتر المربع؟",
          choices: ["١٦", "٣٢", "٦٤", "٨√٢"],
          answer: 0,
          solution: "نفرض طول كل من ضلعي القائمة س.\nبفيثاغورس: س² + س² = ٨² أي ٢س² = ٦٤ ومنها س² = ٣٢.\nالمساحة = (س × س) ÷ ٢ = س² ÷ ٢ = ٣٢ ÷ ٢ = ١٦ سم².\nلاحظ أننا لم نحتج لقيمة س نفسها، بل لقيمة س² فقط.",
          figure: null
        },
        {
          id: "ge-tri-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "مثلث حاد الزوايا",
          value1: "قياس أكبر زاوية فيه",
          value2: "٨٥°",
          answer: 3,
          solution: "في المثلث الحاد الزوايا، كل زاوية أصغر من ٩٠°.\nلكن أكبر زاوية قد تكون مثلًا ٨٠° (أصغر من ٨٥°) أو ٨٩° (أكبر من ٨٥°).\nكلتا الحالتين ممكنة، فالمعطيات غير كافية للمقارنة.",
          figure: null
        }
      ]
    },
    {
      key: "circles",
      title: "الدائرة",
      icon: "⭕",
      questions: [
        {
          id: "ge-cir-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، دائرة نصف قطرها ٧ سم. ما محيطها؟ (اعتبر ط = ٢٢/٧)",
          choices: ["٢٢ سم", "٤٤ سم", "٨٨ سم", "١٥٤ سم"],
          answer: 1,
          solution: "المحيط = ٢ × ط × نق.\n= ٢ × ٢٢/٧ × ٧ = ٢ × ٢٢ = ٤٤ سم.\nانتبه: ١٥٤ هي المساحة (ط نق²) وليست المحيط.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><circle cx='150' cy='100' r='70' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5'/><circle cx='150' cy='100' r='3' fill='#4B4B4B'/><line x1='150' y1='100' x2='220' y2='100' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='185' y='90' font-size='16' fill='#4B4B4B' text-anchor='middle'>٧ سم</text></svg>"
        },
        {
          id: "ge-cir-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "دائرة قطرها ١٠ سم. ما مساحتها بالسنتيمتر المربع؟",
          choices: ["١٠٠ط", "٥٠ط", "٢٥ط", "١٠ط"],
          answer: 2,
          solution: "نصف القطر = القطر ÷ ٢ = ١٠ ÷ ٢ = ٥ سم.\nالمساحة = ط × نق² = ط × ٢٥ = ٢٥ط سم².\nانتبه: استخدام القطر بدل نصف القطر يعطي ١٠٠ط وهو خطأ شائع.",
          figure: null
        },
        {
          id: "ge-cir-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، أ ب قطر في الدائرة، و جـ نقطة على الدائرة. ما قياس الزاوية أ جـ ب؟",
          choices: ["٤٥°", "٦٠°", "٩٠°", "١٨٠°"],
          answer: 2,
          solution: "الزاوية المحيطية المرسومة على القطر قياسها ٩٠° دائمًا.\nلأنها ترسم على قوس نصف دائرة، والزاوية المحيطية نصف المركزية (١٨٠ ÷ ٢ = ٩٠).",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><circle cx='150' cy='100' r='70' fill='none' stroke='#4B4B4B' stroke-width='2.5'/><line x1='80' y1='100' x2='220' y2='100' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='80' y1='100' x2='150' y2='30' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='220' y1='100' x2='150' y2='30' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='66' y='96' font-size='16' fill='#4B4B4B' text-anchor='middle'>أ</text><text x='234' y='96' font-size='16' fill='#4B4B4B' text-anchor='middle'>ب</text><text x='150' y='20' font-size='16' fill='#4B4B4B' text-anchor='middle'>جـ</text></svg>"
        },
        {
          id: "ge-cir-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "قطر دائرة محيطها ١٢ط",
          value2: "نصف قطر دائرة مساحتها ٣٦ط",
          answer: 0,
          solution: "الأولى: المحيط = ط × القطر، إذن القطر = ١٢ط ÷ ط = ١٢.\nالثانية: المساحة = ط نق² = ٣٦ط، إذن نق² = ٣٦ ومنها نق = ٦.\nبما أن ١٢ > ٦ فالقيمة الأولى أكبر.",
          figure: null
        },
        {
          id: "ge-cir-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "دائرة مساحتها تساوي محيطها عدديًا. ما طول نصف قطرها؟",
          choices: ["١", "٢", "٤", "ط"],
          answer: 1,
          solution: "نساوي بين المساحة والمحيط: ط نق² = ٢ ط نق.\nنقسم الطرفين على ط نق (وهو لا يساوي صفرًا): نق = ٢.",
          figure: null
        },
        {
          id: "ge-cir-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "دائرة نصف قطرها ٦ سم، فيها زاوية مركزية قياسها ٦٠°. ما طول القوس المقابل لها؟",
          choices: ["ط سم", "٢ط سم", "٣ط سم", "٦ط سم"],
          answer: 1,
          solution: "طول القوس = (قياس الزاوية ÷ ٣٦٠) × المحيط.\nالمحيط = ٢ × ط × ٦ = ١٢ط.\nطول القوس = (٦٠ ÷ ٣٦٠) × ١٢ط = (١/٦) × ١٢ط = ٢ط سم.",
          figure: null
        },
        {
          id: "ge-cir-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، قطاع دائري زاويته ٩٠° ونصف قطره ٤ سم. ما مساحة القطاع؟",
          choices: ["١٦ط سم²", "٨ط سم²", "٤ط سم²", "٢ط سم²"],
          answer: 2,
          solution: "مساحة القطاع = (قياس الزاوية ÷ ٣٦٠) × مساحة الدائرة.\nمساحة الدائرة = ط × ٤² = ١٦ط.\nمساحة القطاع = (٩٠ ÷ ٣٦٠) × ١٦ط = (١/٤) × ١٦ط = ٤ط سم².",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M150,140 L150,50 A90,90 0 0 1 240,140 Z' fill='#FFF1C1' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M150,122 L168,122 L168,140' fill='none' stroke='#4B4B4B' stroke-width='2'/><text x='132' y='95' font-size='16' fill='#4B4B4B' text-anchor='middle'>٤ سم</text></svg>"
        },
        {
          id: "ge-cir-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا تضاعف نصف قطر دائرة، فإن مساحتها:",
          choices: ["تبقى كما هي", "تتضاعف", "تصبح ٣ أمثالها", "تصبح ٤ أمثالها"],
          answer: 3,
          solution: "المساحة = ط نق². إذا أصبح نصف القطر ٢نق:\nالمساحة الجديدة = ط × (٢نق)² = ٤ ط نق².\nأي ٤ أمثال المساحة الأصلية.\nانتبه: المحيط هو الذي يتضاعف فقط، لأن علاقته بنق من الدرجة الأولى.",
          figure: null
        },
        {
          id: "ge-cir-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، زاوية مركزية (س) وزاوية محيطية (ص) مرسومتان على القوس نفسه",
          value1: "قياس الزاوية المركزية س",
          value2: "ضعف قياس الزاوية المحيطية ص",
          answer: 2,
          solution: "قياس الزاوية المركزية يساوي ضعف قياس الزاوية المحيطية المشتركة معها في القوس نفسه.\nس = ٢ص.\nإذن القيمتان متساويتان.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><circle cx='150' cy='105' r='81' fill='none' stroke='#4B4B4B' stroke-width='2.5'/><circle cx='150' cy='105' r='3' fill='#4B4B4B'/><line x1='150' y1='105' x2='90' y2='160' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='105' x2='210' y2='160' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='24' x2='90' y2='160' stroke='#1CB0F6' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='24' x2='210' y2='160' stroke='#1CB0F6' stroke-width='2.5' stroke-linecap='round'/><text x='150' y='130' font-size='15' fill='#4B4B4B' text-anchor='middle'>س</text><text x='150' y='60' font-size='15' fill='#1899D6' text-anchor='middle'>ص</text></svg>"
        },
        {
          id: "ge-cir-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "",
          value1: "محيط دائرة نصف قطرها ٣",
          value2: "محيط مربع طول ضلعه ٥",
          answer: 1,
          solution: "محيط الدائرة = ٢ × ط × ٣ = ٦ط ≈ ٦ × ٣٫١٤ = ١٨٫٨ تقريبًا.\nمحيط المربع = ٤ × ٥ = ٢٠.\nبما أن ٢٠ > ١٨٫٨ فالقيمة الثانية أكبر.",
          figure: null
        },
        {
          id: "ge-cir-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "في الشكل، دائرتان متحدتا المركز، نصفا قطريهما ٣ سم و ٥ سم. ما مساحة المنطقة المحصورة بينهما؟",
          choices: ["٢ط سم²", "٤ط سم²", "١٦ط سم²", "٢٥ط سم²"],
          answer: 2,
          solution: "مساحة المنطقة المحصورة = مساحة الكبرى − مساحة الصغرى.\n= ط × ٥² − ط × ٣² = ٢٥ط − ٩ط = ١٦ط سم².\nانتبه: من يحسب ط × (٥ − ٣)² يحصل على ٤ط وهو خطأ شائع، لأن فرق المربعات ليس مربع الفرق.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><circle cx='150' cy='100' r='80' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5'/><circle cx='150' cy='100' r='48' fill='#FFFFFF' stroke='#4B4B4B' stroke-width='2.5'/><circle cx='150' cy='100' r='3' fill='#4B4B4B'/><line x1='150' y1='100' x2='198' y2='100' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><line x1='150' y1='100' x2='150' y2='20' stroke='#4B4B4B' stroke-width='2.5' stroke-linecap='round'/><text x='174' y='92' font-size='15' fill='#4B4B4B' text-anchor='middle'>٣</text><text x='138' y='55' font-size='15' fill='#4B4B4B' text-anchor='middle'>٥</text></svg>"
        },
        {
          id: "ge-cir-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "دائرة نصف قطرها نق، حيث نق أكبر من ١",
          value1: "مساحة الدائرة",
          value2: "محيط الدائرة",
          answer: 3,
          solution: "المساحة = ط نق² والمحيط = ٢ط نق.\nنقارن بقسمة الطرفين على ط نق: المقارنة تصبح بين نق و ٢.\nإذا كانت نق = ١٫٥ فالمحيط أكبر، وإذا كانت نق = ٣ فالمساحة أكبر.\nبما أن نق قد تكون بين ١ و ٢ أو أكبر من ٢، فالمعطيات غير كافية.",
          figure: null
        }
      ]
    },
    {
      key: "areas",
      title: "المساحات والمحيطات",
      icon: "🟩",
      questions: [
        {
          id: "ge-are-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، مستطيل بعداه ٨ سم و ٥ سم. ما مساحته؟",
          choices: ["١٣ سم²", "٢٦ سم²", "٤٠ سم²", "٨٠ سم²"],
          answer: 2,
          solution: "مساحة المستطيل = الطول × العرض.\n= ٨ × ٥ = ٤٠ سم².\nانتبه: ٢٦ هي قيمة المحيط ٢ × (٨ + ٥) وليست المساحة.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><rect x='70' y='60' width='160' height='100' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' rx='2'/><text x='150' y='184' font-size='16' fill='#4B4B4B' text-anchor='middle'>٨ سم</text><text x='48' y='115' font-size='16' fill='#4B4B4B' text-anchor='middle'>٥ سم</text></svg>"
        },
        {
          id: "ge-are-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "مربع محيطه ٣٦ سم. ما مساحته؟",
          choices: ["٨١ سم²", "١٨ سم²", "٣٦ سم²", "١٤٤ سم²"],
          answer: 0,
          solution: "طول الضلع = المحيط ÷ ٤ = ٣٦ ÷ ٤ = ٩ سم.\nالمساحة = الضلع × الضلع = ٩ × ٩ = ٨١ سم².",
          figure: null
        },
        {
          id: "ge-are-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، مثلث طول قاعدته ١٠ سم وارتفاعه ٦ سم. ما مساحته؟",
          choices: ["٦٠ سم²", "٣٠ سم²", "١٦ سم²", "٤٥ سم²"],
          answer: 1,
          solution: "مساحة المثلث = (القاعدة × الارتفاع) ÷ ٢.\n= (١٠ × ٦) ÷ ٢ = ٦٠ ÷ ٢ = ٣٠ سم².\nانتبه: نسيان القسمة على ٢ يعطي ٦٠ وهو خطأ شائع.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M60,160 L240,160 L120,50 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><line x1='120' y1='50' x2='120' y2='160' stroke='#4B4B4B' stroke-width='2' stroke-dasharray='6 5'/><path d='M120,142 L138,142 L138,160' fill='none' stroke='#4B4B4B' stroke-width='1.8'/><text x='150' y='184' font-size='16' fill='#4B4B4B' text-anchor='middle'>١٠ سم</text><text x='143' y='110' font-size='15' fill='#4B4B4B' text-anchor='middle'>٦ سم</text></svg>"
        },
        {
          id: "ge-are-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "مساحة مربع طول ضلعه ٦",
          value2: "مساحة مستطيل بعداه ٩ و ٤",
          answer: 2,
          solution: "مساحة المربع = ٦ × ٦ = ٣٦.\nمساحة المستطيل = ٩ × ٤ = ٣٦.\nالقيمتان متساويتان.",
          figure: null
        },
        {
          id: "ge-are-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، متوازي أضلاع طول قاعدته ١٢ سم وارتفاعه ٥ سم. ما مساحته؟",
          choices: ["٣٠ سم²", "١٢٠ سم²", "٦٠ سم²", "١٧ سم²"],
          answer: 2,
          solution: "مساحة متوازي الأضلاع = القاعدة × الارتفاع.\n= ١٢ × ٥ = ٦٠ سم².\nانتبه: لا نقسم على ٢ هنا؛ القسمة على ٢ خاصة بالمثلث.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M60,160 L200,160 L240,60 L100,60 Z' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><line x1='100' y1='60' x2='100' y2='160' stroke='#4B4B4B' stroke-width='2' stroke-dasharray='6 5'/><path d='M100,142 L118,142 L118,160' fill='none' stroke='#4B4B4B' stroke-width='1.8'/><text x='130' y='184' font-size='16' fill='#4B4B4B' text-anchor='middle'>١٢ سم</text><text x='80' y='115' font-size='15' fill='#4B4B4B' text-anchor='middle'>٥ سم</text></svg>"
        },
        {
          id: "ge-are-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "شبه منحرف طولا قاعدتيه المتوازيتين ٦ سم و ١٠ سم، وارتفاعه ٤ سم. ما مساحته؟",
          choices: ["٣٢ سم²", "٤٠ سم²", "٦٤ سم²", "١٦ سم²"],
          answer: 0,
          solution: "مساحة شبه المنحرف = نصف مجموع القاعدتين × الارتفاع.\n= ((٦ + ١٠) ÷ ٢) × ٤.\n= ٨ × ٤ = ٣٢ سم².",
          figure: null
        },
        {
          id: "ge-are-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، قطعة أرض على شكل مستطيل أبعاده ٨ م × ٦ م، اقتُطع من ركنها مربع طول ضلعه ٢ م. ما مساحة الشكل الباقي؟",
          choices: ["٤٨ م²", "٤٤ م²", "٤٠ م²", "٥٢ م²"],
          answer: 1,
          solution: "مساحة المستطيل الكامل = ٨ × ٦ = ٤٨ م².\nمساحة المربع المقتطع = ٢ × ٢ = ٤ م².\nالمساحة الباقية = ٤٨ − ٤ = ٤٤ م².",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M70,160 L70,40 L190,40 L190,80 L230,80 L230,160 Z' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='150' y='184' font-size='16' fill='#4B4B4B' text-anchor='middle'>٨ م</text><text x='50' y='105' font-size='16' fill='#4B4B4B' text-anchor='middle'>٦ م</text><text x='178' y='64' font-size='14' fill='#4B4B4B' text-anchor='middle'>٢</text><text x='210' y='98' font-size='14' fill='#4B4B4B' text-anchor='middle'>٢</text></svg>"
        },
        {
          id: "ge-are-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا زاد طول ضلع مربع بنسبة ٥٠٪، فإن مساحته تزداد بنسبة:",
          choices: ["٥٠٪", "١٠٠٪", "١٢٥٪", "٢٢٥٪"],
          answer: 2,
          solution: "نفرض الضلع ١٠، فالمساحة ١٠٠.\nبعد الزيادة: الضلع = ١٥، والمساحة = ٢٢٥.\nالزيادة = ٢٢٥ − ١٠٠ = ١٢٥، أي بنسبة ١٢٥٪.\nانتبه: ٢٢٥٪ هي نسبة المساحة الجديدة إلى الأصلية، أما الزيادة فهي ١٢٥٪.",
          figure: null
        },
        {
          id: "ge-are-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "مستطيلان مختلفان، محيط كل منهما ٢٤ سم",
          value1: "مساحة المستطيل الأول",
          value2: "مساحة المستطيل الثاني",
          answer: 3,
          solution: "تساوي المحيطين لا يعني تساوي المساحتين.\nمثال: مستطيل ١ × ١١ محيطه ٢٤ ومساحته ١١، ومستطيل ٤ × ٨ محيطه ٢٤ ومساحته ٣٢.\nلا نعرف أبعاد كل مستطيل، فالمعطيات غير كافية.",
          figure: null
        },
        {
          id: "ge-are-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "",
          value1: "محيط مثلث متطابق الأضلاع طول ضلعه ٨",
          value2: "محيط مربع طول ضلعه ٥",
          answer: 0,
          solution: "محيط المثلث المتطابق الأضلاع = ٣ × ٨ = ٢٤.\nمحيط المربع = ٤ × ٥ = ٢٠.\nبما أن ٢٤ > ٢٠ فالقيمة الأولى أكبر.",
          figure: null
        },
        {
          id: "ge-are-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "في الشكل، مربع طول قطره ١٠ سم. ما مساحته؟",
          choices: ["١٠٠ سم²", "٥٠ سم²", "٢٥ سم²", "٧٥ سم²"],
          answer: 1,
          solution: "مساحة المربع = مربع القطر ÷ ٢.\n= ١٠² ÷ ٢ = ١٠٠ ÷ ٢ = ٥٠ سم².\nالتحقق بفيثاغورس: الضلع² + الضلع² = ١٠٠، أي الضلع² = ٥٠، والمساحة = الضلع² = ٥٠ ✓.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><rect x='95' y='45' width='110' height='110' fill='#FFF1C1' stroke='#4B4B4B' stroke-width='2.5' rx='2'/><line x1='95' y1='155' x2='205' y2='45' stroke='#4B4B4B' stroke-width='2' stroke-dasharray='6 5'/><text x='168' y='105' font-size='15' fill='#4B4B4B' text-anchor='middle'>١٠ سم</text></svg>"
        },
        {
          id: "ge-are-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "مربع ومستطيل (ليس مربعًا) لهما المساحة نفسها",
          value1: "محيط المربع",
          value2: "محيط المستطيل",
          answer: 1,
          solution: "من بين جميع المستطيلات التي لها المساحة نفسها، يكون المربع صاحب أصغر محيط.\nمثال: مساحة ٣٦: المربع ٦ × ٦ محيطه ٢٤، والمستطيل ٤ × ٩ محيطه ٢٦، والمستطيل ٣ × ١٢ محيطه ٣٠.\nإذن محيط المستطيل أكبر دائمًا، فالقيمة الثانية أكبر.",
          figure: null
        }
      ]
    },
    {
      key: "volumes",
      title: "الحجوم",
      icon: "📦",
      questions: [
        {
          id: "ge-vol-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، متوازي مستطيلات أبعاده ٥ سم و ٤ سم و ٣ سم. ما حجمه؟",
          choices: ["١٢ سم³", "٦٠ سم³", "٤٧ سم³", "٩٤ سم³"],
          answer: 1,
          solution: "حجم متوازي المستطيلات = الطول × العرض × الارتفاع.\n= ٥ × ٤ × ٣ = ٦٠ سم³.\nانتبه: ٩٤ هي المساحة الكلية لأوجهه وليست الحجم.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M60,80 L200,80 L200,170 L60,170 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M60,80 L100,50 L240,50 L200,80 Z' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M200,80 L240,50 L240,140 L200,170 Z' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='130' y='192' font-size='15' fill='#4B4B4B' text-anchor='middle'>٥ سم</text><text x='42' y='130' font-size='15' fill='#4B4B4B' text-anchor='middle'>٣ سم</text><text x='232' y='40' font-size='15' fill='#4B4B4B' text-anchor='middle'>٤ سم</text></svg>"
        },
        {
          id: "ge-vol-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، مكعب طول حرفه ٤ سم. ما حجمه؟",
          choices: ["١٦ سم³", "٤٨ سم³", "٦٤ سم³", "١٢٨ سم³"],
          answer: 2,
          solution: "حجم المكعب = الحرف × الحرف × الحرف.\n= ٤ × ٤ × ٤ = ٦٤ سم³.\nانتبه: ١٦ هي مساحة وجه واحد فقط (٤²).",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M85,75 L195,75 L195,180 L85,180 Z' fill='#FFF1C1' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M85,75 L120,45 L230,45 L195,75 Z' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M195,75 L230,45 L230,150 L195,180 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='140' y='198' font-size='15' fill='#4B4B4B' text-anchor='middle'>٤ سم</text></svg>"
        },
        {
          id: "ge-vol-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "مكعب حجمه ٢٧ سم³. ما طول حرفه؟",
          choices: ["٣ سم", "٤ سم", "٩ سم", "١٣٫٥ سم"],
          answer: 0,
          solution: "حجم المكعب = الحرف³.\nنبحث عن عدد مكعبه ٢٧: بما أن ٣ × ٣ × ٣ = ٢٧، فالحرف = ٣ سم.\nانتبه: ٩ هي ناتج ٢٧ ÷ ٣ وليست الجذر التكعيبي.",
          figure: null
        },
        {
          id: "ge-vol-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "حجم مكعب طول حرفه ٢",
          value2: "حجم متوازي مستطيلات أبعاده ٣ و ٣ و ١",
          answer: 1,
          solution: "حجم المكعب = ٢ × ٢ × ٢ = ٨.\nحجم متوازي المستطيلات = ٣ × ٣ × ١ = ٩.\nبما أن ٩ > ٨ فالقيمة الثانية أكبر.",
          figure: null
        },
        {
          id: "ge-vol-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، أسطوانة نصف قطر قاعدتها ٣ سم وارتفاعها ١٠ سم. ما حجمها؟",
          choices: ["٣٠ط سم³", "٦٠ط سم³", "٩٠ط سم³", "١٨٠ط سم³"],
          answer: 2,
          solution: "حجم الأسطوانة = مساحة القاعدة × الارتفاع = ط نق² × ع.\n= ط × ٣² × ١٠ = ط × ٩ × ١٠ = ٩٠ط سم³.\nانتبه: استخدام ٢نق بدل نق² يعطي ٦٠ط وهو خطأ شائع.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M95,50 L95,150 A55,16 0 0 0 205,150 L205,50' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><ellipse cx='150' cy='50' rx='55' ry='16' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5'/><line x1='150' y1='50' x2='205' y2='50' stroke='#4B4B4B' stroke-width='2' stroke-dasharray='5 4'/><text x='178' y='42' font-size='14' fill='#4B4B4B' text-anchor='middle'>نق = ٣</text><text x='232' y='105' font-size='15' fill='#4B4B4B' text-anchor='middle'>١٠ سم</text></svg>"
        },
        {
          id: "ge-vol-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "خزان ماء على شكل متوازي مستطيلات أبعاده من الداخل ٢ م و ٣ م و ٤ م. كم لترًا من الماء يتسع الخزان؟ (المتر المكعب = ١٠٠٠ لتر)",
          choices: ["٢٤٠٠٠ لتر", "٢٤٠٠ لتر", "٢٤٠ لتر", "٢٤ لترًا"],
          answer: 0,
          solution: "الحجم = ٢ × ٣ × ٤ = ٢٤ م³.\nبالتحويل إلى اللترات: ٢٤ × ١٠٠٠ = ٢٤٠٠٠ لتر.",
          figure: null
        },
        {
          id: "ge-vol-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، مكعب مساحة وجهه الواحد ٢٥ سم². ما حجمه؟",
          choices: ["١٢٥ سم³", "٧٥ سم³", "١٥٠ سم³", "٦٢٥ سم³"],
          answer: 0,
          solution: "مساحة الوجه = الحرف² = ٢٥، إذن الحرف = ٥ سم.\nالحجم = ٥³ = ١٢٥ سم³.\nانتبه: ١٥٠ هي المساحة الكلية للأوجه الستة (٦ × ٢٥) وليست الحجم.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M85,75 L195,75 L195,180 L85,180 Z' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M85,75 L120,45 L230,45 L195,75 Z' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M195,75 L230,45 L230,150 L195,180 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='140' y='122' font-size='14' fill='#4B4B4B' text-anchor='middle'>المساحة</text><text x='140' y='142' font-size='14' fill='#4B4B4B' text-anchor='middle'>٢٥ سم²</text></svg>"
        },
        {
          id: "ge-vol-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا تضاعف طول حرف مكعب، فإن حجمه:",
          choices: ["يتضاعف", "يصبح ٤ أمثاله", "يصبح ٦ أمثاله", "يصبح ٨ أمثاله"],
          answer: 3,
          solution: "الحجم = الحرف³. إذا أصبح الحرف ٢س:\nالحجم الجديد = (٢س)³ = ٨س³.\nأي ٨ أمثال الحجم الأصلي.\nانتبه: ٤ أمثال هي نسبة تغير المساحة (تربيع) وليس الحجم (تكعيب).",
          figure: null
        },
        {
          id: "ge-vol-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "",
          value1: "حجم أسطوانة نصف قطرها ٢ وارتفاعها ٩",
          value2: "حجم أسطوانة نصف قطرها ٣ وارتفاعها ٤",
          answer: 2,
          solution: "حجم الأولى = ط × ٢² × ٩ = ٣٦ط.\nحجم الثانية = ط × ٣² × ٤ = ٣٦ط.\nالقيمتان متساويتان.",
          figure: null
        },
        {
          id: "ge-vol-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "في الشكل مكعبان، طول حرف الأول ٣ سم وطول حرف الثاني ٤ سم",
          value1: "حجم المكعب الأول",
          value2: "ثلث حجم المكعب الثاني",
          answer: 0,
          solution: "حجم الأول = ٣³ = ٢٧ سم³.\nحجم الثاني = ٤³ = ٦٤ سم³، وثلثه = ٦٤ ÷ ٣ ≈ ٢١٫٣ سم³.\nبما أن ٢٧ > ٢١٫٣ فالقيمة الأولى أكبر.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M50,110 L120,110 L120,180 L50,180 Z' fill='#D7FFB8' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M50,110 L74,90 L144,90 L120,110 Z' fill='#FFF1C1' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M120,110 L144,90 L144,160 L120,180 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='85' y='198' font-size='14' fill='#4B4B4B' text-anchor='middle'>٣ سم</text><path d='M170,90 L260,90 L260,180 L170,180 Z' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M170,90 L198,66 L288,66 L260,90 Z' fill='#FFF1C1' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><path d='M260,90 L288,66 L288,156 L260,180 Z' fill='#DDF4FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='215' y='198' font-size='14' fill='#4B4B4B' text-anchor='middle'>٤ سم</text></svg>"
        },
        {
          id: "ge-vol-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "أسطوانة حجمها ٥٤ط سم³ ونصف قطر قاعدتها ٣ سم. ما ارتفاعها؟",
          choices: ["٣ سم", "٦ سم", "٩ سم", "١٨ سم"],
          answer: 1,
          solution: "الحجم = ط نق² × ع.\n٥٤ط = ط × ٩ × ع.\nنقسم الطرفين على ٩ط: ع = ٥٤ ÷ ٩ = ٦ سم.",
          figure: null
        },
        {
          id: "ge-vol-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "صندوقان على شكل متوازي مستطيلات لهما الحجم نفسه",
          value1: "ارتفاع الصندوق الأول",
          value2: "ارتفاع الصندوق الثاني",
          answer: 3,
          solution: "تساوي الحجمين لا يحدد الارتفاعين.\nمثال: صندوق ٢ × ٣ × ١٠ حجمه ٦٠ وارتفاعه ١٠، وصندوق ٤ × ٥ × ٣ حجمه ٦٠ وارتفاعه ٣.\nوقد يحدث العكس، فالمعطيات غير كافية.",
          figure: null
        }
      ]
    },
    {
      key: "coordinates",
      title: "الهندسة الإحداثية",
      icon: "🗺️",
      questions: [
        {
          id: "ge-coo-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، في أي ربع من المستوى الإحداثي تقع النقطة (٣، ٢)؟",
          choices: ["الأول", "الثاني", "الثالث", "الرابع"],
          answer: 0,
          solution: "الإحداثي السيني ٣ موجب، والإحداثي الصادي ٢ موجب.\nالنقطة التي إحداثياها موجبان تقع في الربع الأول.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='160' x2='280' y2='160' stroke='#AFAFAF' stroke-width='2'/><line x1='60' y1='15' x2='60' y2='190' stroke='#AFAFAF' stroke-width='2'/><line x1='135' y1='160' x2='135' y2='110' stroke='#1CB0F6' stroke-width='2' stroke-dasharray='5 4'/><line x1='60' y1='110' x2='135' y2='110' stroke='#1CB0F6' stroke-width='2' stroke-dasharray='5 4'/><circle cx='135' cy='110' r='6' fill='#FF4B4B'/><text x='168' y='102' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٣، ٢)</text><text x='275' y='178' font-size='14' fill='#4B4B4B' text-anchor='middle'>س</text><text x='47' y='25' font-size='14' fill='#4B4B4B' text-anchor='middle'>ص</text></svg>"
        },
        {
          id: "ge-coo-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في أي ربع من المستوى الإحداثي تقع النقطة (−٢، ٥)؟",
          choices: ["الأول", "الثاني", "الثالث", "الرابع"],
          answer: 1,
          solution: "الإحداثي السيني −٢ سالب، والإحداثي الصادي ٥ موجب.\n(سالب، موجب) تعني الربع الثاني.",
          figure: null
        },
        {
          id: "ge-coo-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "في الشكل، ما المسافة بين النقطتين (٢، ٣) و (٢، ٨)؟",
          choices: ["٣", "٥", "٦", "١١"],
          answer: 1,
          solution: "النقطتان لهما الإحداثي السيني نفسه (٢)، فالقطعة بينهما رأسية.\nالمسافة = الفرق بين الإحداثيين الصاديين = ٨ − ٣ = ٥ وحدات.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='170' x2='280' y2='170' stroke='#AFAFAF' stroke-width='2'/><line x1='60' y1='15' x2='60' y2='190' stroke='#AFAFAF' stroke-width='2'/><line x1='90' y1='125' x2='90' y2='50' stroke='#CE82FF' stroke-width='2.5'/><circle cx='90' cy='125' r='6' fill='#FF4B4B'/><circle cx='90' cy='50' r='6' fill='#FF4B4B'/><text x='133' y='130' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٢، ٣)</text><text x='133' y='55' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٢، ٨)</text></svg>"
        },
        {
          id: "ge-coo-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "بُعد النقطة (٣، ٤) عن نقطة الأصل",
          value2: "بُعد النقطة (٥، ٠) عن نقطة الأصل",
          answer: 2,
          solution: "بُعد (٣، ٤) عن الأصل = √(٣² + ٤²) = √٢٥ = ٥.\nبُعد (٥، ٠) عن الأصل = ٥ مباشرة لأنها على المحور السيني.\nالقيمتان متساويتان.",
          figure: null
        },
        {
          id: "ge-coo-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، ما إحداثيا نقطة منتصف القطعة المستقيمة الواصلة بين (٢، ٤) و (٦، ١٠)؟",
          choices: ["(٢، ٣)", "(٤، ٧)", "(٨، ١٤)", "(٤، ٦)"],
          answer: 1,
          solution: "نقطة المنتصف = (متوسط السينيين، متوسط الصاديين).\nالسيني = (٢ + ٦) ÷ ٢ = ٤، والصادي = (٤ + ١٠) ÷ ٢ = ٧.\nنقطة المنتصف هي (٤، ٧).\nانتبه: (٨، ١٤) ناتج الجمع دون القسمة على ٢.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='180' x2='280' y2='180' stroke='#AFAFAF' stroke-width='2'/><line x1='40' y1='15' x2='40' y2='195' stroke='#AFAFAF' stroke-width='2'/><line x1='64' y1='132' x2='112' y2='60' stroke='#CE82FF' stroke-width='2.5'/><circle cx='64' cy='132' r='6' fill='#FF4B4B'/><circle cx='112' cy='60' r='6' fill='#FF4B4B'/><circle cx='88' cy='96' r='6' fill='#1CB0F6'/><text x='108' y='140' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٢، ٤)</text><text x='160' y='62' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٦، ١٠)</text><text x='123' y='100' font-size='16' fill='#1899D6' text-anchor='middle'>؟</text></svg>"
        },
        {
          id: "ge-coo-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "ما ميل المستقيم المار بالنقطتين (١، ٢) و (٣، ٨)؟",
          choices: ["١/٣", "٢", "٣", "٦"],
          answer: 2,
          solution: "الميل = فرق الصادات ÷ فرق السينات.\n= (٨ − ٢) ÷ (٣ − ١) = ٦ ÷ ٢ = ٣.\nانتبه: قلب النسبة يعطي ١/٣ وهو خطأ شائع.",
          figure: null
        },
        {
          id: "ge-coo-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "في الشكل، ما المسافة بين النقطتين (١، ١) و (٤، ٥)؟",
          choices: ["٤", "٥", "٦", "٧"],
          answer: 1,
          solution: "فرق السينات = ٤ − ١ = ٣، وفرق الصادات = ٥ − ١ = ٤.\nبقانون المسافة (فيثاغورس): المسافة = √(٣² + ٤²) = √(٩ + ١٦) = √٢٥ = ٥.\nلاحظ الثلاثية الفيثاغورية ٣، ٤، ٥.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='180' x2='280' y2='180' stroke='#AFAFAF' stroke-width='2'/><line x1='50' y1='15' x2='50' y2='195' stroke='#AFAFAF' stroke-width='2'/><line x1='70' y1='150' x2='130' y2='70' stroke='#CE82FF' stroke-width='2.5'/><line x1='70' y1='150' x2='130' y2='150' stroke='#4B4B4B' stroke-width='2' stroke-dasharray='5 4'/><line x1='130' y1='150' x2='130' y2='70' stroke='#4B4B4B' stroke-width='2' stroke-dasharray='5 4'/><circle cx='70' cy='150' r='6' fill='#FF4B4B'/><circle cx='130' cy='70' r='6' fill='#FF4B4B'/><text x='100' y='168' font-size='14' fill='#4B4B4B' text-anchor='middle'>٣</text><text x='145' y='115' font-size='14' fill='#4B4B4B' text-anchor='middle'>٤</text><text x='178' y='66' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٤، ٥)</text><text x='70' y='195' font-size='15' fill='#4B4B4B' text-anchor='middle'>(١، ١)</text></svg>"
        },
        {
          id: "ge-coo-08",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "النقطة (س، ٣) تبعد ٥ وحدات عن النقطة (١، ٣). أي مما يلي قيمة ممكنة للعدد س؟",
          choices: ["٦", "٥", "٤", "٣"],
          answer: 0,
          solution: "النقطتان لهما الصادي نفسه، فالمسافة أفقية: |س − ١| = ٥.\nإذن س − ١ = ٥ أو س − ١ = −٥.\nأي س = ٦ أو س = −٤.\nمن الخيارات المتاحة، القيمة الممكنة هي ٦.",
          figure: null
        },
        {
          id: "ge-coo-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "",
          value1: "ميل المستقيم المار بالنقطتين (١، ١) و (٣، ٥)",
          value2: "ميل المستقيم المار بالنقطتين (٠، ٠) و (٢، ٦)",
          answer: 1,
          solution: "ميل الأول = (٥ − ١) ÷ (٣ − ١) = ٤ ÷ ٢ = ٢.\nميل الثاني = (٦ − ٠) ÷ (٢ − ٠) = ٦ ÷ ٢ = ٣.\nبما أن ٣ > ٢ فالقيمة الثانية أكبر.",
          figure: null
        },
        {
          id: "ge-coo-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "",
          value1: "بُعد النقطة (−٤، ٣) عن نقطة الأصل",
          value2: "بُعد النقطة (٢، ٤) عن نقطة الأصل",
          answer: 0,
          solution: "بُعد الأولى = √((−٤)² + ٣²) = √(١٦ + ٩) = √٢٥ = ٥.\nبُعد الثانية = √(٢² + ٤²) = √(٤ + ١٦) = √٢٠ وهو أقل من √٢٥.\nإذن القيمة الأولى أكبر.",
          figure: null
        },
        {
          id: "ge-coo-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "في الشكل، مثلث رؤوسه: نقطة الأصل (٠، ٠) والنقطتان (٦، ٠) و (٠، ٨). ما مساحته؟",
          choices: ["٤٨", "٢٤", "١٤", "١٠"],
          answer: 1,
          solution: "المثلث قائم الزاوية عند نقطة الأصل لأن ضلعيه على المحورين.\nالقاعدة = ٦ والارتفاع = ٨.\nالمساحة = (٦ × ٨) ÷ ٢ = ٤٨ ÷ ٢ = ٢٤ وحدة مربعة.\nملاحظة: ١٠ هي طول الوتر (ثلاثية ٦، ٨، ١٠) وليست المساحة.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='20' y1='170' x2='280' y2='170' stroke='#AFAFAF' stroke-width='2'/><line x1='60' y1='15' x2='60' y2='190' stroke='#AFAFAF' stroke-width='2'/><path d='M60,170 L144,170 L60,58 Z' fill='#F3E0FF' stroke='#4B4B4B' stroke-width='2.5' stroke-linejoin='round'/><text x='150' y='188' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٦، ٠)</text><text x='95' y='52' font-size='15' fill='#4B4B4B' text-anchor='middle'>(٠، ٨)</text></svg>"
        },
        {
          id: "ge-coo-12",
          format: "comparison",
          difficulty: 3,
          track: "sci",
          stem: "النقطة (س، ص) تقع على المحور السيني ولا تنطبق على نقطة الأصل",
          value1: "س",
          value2: "ص",
          answer: 3,
          solution: "كل نقطة على المحور السيني إحداثيها الصادي صفر، إذن ص = ٠.\nأما س فقد تكون موجبة (مثل ٣) فتكون أكبر من ص، أو سالبة (مثل −٣) فتكون أصغر من ص.\nالحالتان ممكنتان، فالمعطيات غير كافية.",
          figure: null
        }
      ]
    }
  ]
};
