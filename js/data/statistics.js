window.QBANK = window.QBANK || {};
window.QBANK.statistics = {
  key: "statistics",
  title: "التحليل والإحصاء",
  color: "yellow",
  lessons: [
    {
      key: "charts",
      title: "قراءة الجداول والرسوم البيانية",
      icon: "📊",
      questions: [
        {
          id: "st-cha-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "يبين الجدول مبيعات متجر خلال أربعة أيام. في أي يوم كانت المبيعات الأقل؟",
          choices: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء"],
          answer: 2,
          solution: "نقارن قيم المبيعات في الجدول: ٢٤٠، ٣١٠، ١٨٠، ٢٧٠.\nأصغر هذه القيم هو ١٨٠ ريالاً.\nوهي مبيعات يوم الثلاثاء، فهو اليوم الأقل مبيعات.",
          figure: "<table class='q-table'><tr><th>اليوم</th><th>المبيعات (ريال)</th></tr><tr><td>الأحد</td><td>٢٤٠</td></tr><tr><td>الاثنين</td><td>٣١٠</td></tr><tr><td>الثلاثاء</td><td>١٨٠</td></tr><tr><td>الأربعاء</td><td>٢٧٠</td></tr></table>"
        },
        {
          id: "st-cha-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "يبين الرسم البياني عدد الطلاب في أربعة فصول (أ، ب، ج، د) بإحدى المدارس. كم يزيد عدد طلاب الفصل (د) على عدد طلاب الفصل (أ)؟",
          choices: ["١٠", "١٥", "٢٠", "٢٥"],
          answer: 1,
          solution: "من الرسم: عدد طلاب الفصل (د) = ٣٥ طالباً، وعدد طلاب الفصل (أ) = ٢٠ طالباً.\nالفرق = ٣٥ − ٢٠ = ١٥ طالباً.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='35' y1='170' x2='290' y2='170' stroke='#AFAFAF' stroke-width='2'/><line x1='35' y1='20' x2='35' y2='170' stroke='#AFAFAF' stroke-width='2'/><rect x='55' y='90' width='40' height='80' rx='4' fill='#1CB0F6'/><text x='75' y='84' fill='#4B4B4B' font-size='14' text-anchor='middle'>٢٠</text><text x='75' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>أ</text><rect x='115' y='50' width='40' height='120' rx='4' fill='#1CB0F6'/><text x='135' y='44' fill='#4B4B4B' font-size='14' text-anchor='middle'>٣٠</text><text x='135' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>ب</text><rect x='175' y='70' width='40' height='100' rx='4' fill='#1CB0F6'/><text x='195' y='64' fill='#4B4B4B' font-size='14' text-anchor='middle'>٢٥</text><text x='195' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>ج</text><rect x='235' y='30' width='40' height='140' rx='4' fill='#1CB0F6'/><text x='255' y='24' fill='#4B4B4B' font-size='14' text-anchor='middle'>٣٥</text><text x='255' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>د</text></svg>"
        },
        {
          id: "st-cha-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "يبين القطاع الدائري الرياضة المفضلة لدى ٢٠٠ طالب في إحدى المدارس. كم طالباً يفضل السباحة؟",
          choices: ["٢٥", "٣٠", "٤٠", "٥٠"],
          answer: 3,
          solution: "من الرسم: نسبة من يفضلون السباحة = ٢٥٪.\nعدد الطلاب = ٢٥٪ × ٢٠٠ = ٢٥/١٠٠ × ٢٠٠ = ٥٠ طالباً.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M100,100 L100,35 A65,65 0 0 1 100,165 Z' fill='#58CC02'/><path d='M100,100 L100,165 A65,65 0 0 1 35,100 Z' fill='#1CB0F6'/><path d='M100,100 L35,100 A65,65 0 0 1 62,47 Z' fill='#FFC800'/><path d='M100,100 L62,47 A65,65 0 0 1 100,35 Z' fill='#FF4B4B'/><text x='140' y='105' fill='#FFFFFF' font-size='14' text-anchor='middle'>٥٠٪</text><text x='72' y='133' fill='#FFFFFF' font-size='14' text-anchor='middle'>٢٥٪</text><text x='64' y='87' fill='#FFFFFF' font-size='14' text-anchor='middle'>١٥٪</text><text x='88' y='67' fill='#FFFFFF' font-size='14' text-anchor='middle'>١٠٪</text><rect x='278' y='39' width='12' height='12' rx='2' fill='#58CC02'/><text x='272' y='50' fill='#4B4B4B' font-size='14' text-anchor='end'>كرة قدم</text><rect x='278' y='69' width='12' height='12' rx='2' fill='#1CB0F6'/><text x='272' y='80' fill='#4B4B4B' font-size='14' text-anchor='end'>سباحة</text><rect x='278' y='99' width='12' height='12' rx='2' fill='#FFC800'/><text x='272' y='110' fill='#4B4B4B' font-size='14' text-anchor='end'>كرة سلة</text><rect x='278' y='129' width='12' height='12' rx='2' fill='#FF4B4B'/><text x='272' y='140' fill='#4B4B4B' font-size='14' text-anchor='end'>جري</text></svg>"
        },
        {
          id: "st-cha-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "يبين الجدول درجات الحرارة العظمى في مدينة الرياض خلال أربعة أيام.",
          value1: "درجة الحرارة يوم الاثنين",
          value2: "درجة الحرارة يوم الأحد",
          answer: 1,
          solution: "من الجدول: درجة الحرارة يوم الاثنين = ٣٩، ودرجة الحرارة يوم الأحد = ٤١.\nبما أن ٤١ أكبر من ٣٩، فإن القيمة الثانية أكبر.",
          figure: "<table class='q-table'><tr><th>اليوم</th><th>درجة الحرارة (°م)</th></tr><tr><td>السبت</td><td>٣٨</td></tr><tr><td>الأحد</td><td>٤١</td></tr><tr><td>الاثنين</td><td>٣٩</td></tr><tr><td>الثلاثاء</td><td>٣٦</td></tr></table>"
        },
        {
          id: "st-cha-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين الرسم البياني عدد الكتب التي استعارها طلاب مدرسة من المكتبة خلال خمسة أسابيع متتالية (من الأسبوع ١ إلى الأسبوع ٥). ما الوسط الحسابي لعدد الكتب المستعارة أسبوعياً؟",
          choices: ["٤٦", "٤٨", "٥٠", "٥٢"],
          answer: 1,
          solution: "من الرسم: أعداد الكتب هي ٢٠، ٦٠، ٥٠، ٧٠، ٤٠.\nالمجموع = ٢٠ + ٦٠ + ٥٠ + ٧٠ + ٤٠ = ٢٤٠.\nالوسط الحسابي = المجموع ÷ العدد = ٢٤٠ ÷ ٥ = ٤٨ كتاباً.\nتنبيه: ٥٠ هو الوسيط بعد الترتيب وليس الوسط الحسابي.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='35' y1='170' x2='290' y2='170' stroke='#AFAFAF' stroke-width='2'/><line x1='35' y1='20' x2='35' y2='170' stroke='#AFAFAF' stroke-width='2'/><rect x='45' y='130' width='36' height='40' rx='4' fill='#58CC02'/><text x='63' y='124' fill='#4B4B4B' font-size='14' text-anchor='middle'>٢٠</text><text x='63' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>١</text><rect x='93' y='50' width='36' height='120' rx='4' fill='#58CC02'/><text x='111' y='44' fill='#4B4B4B' font-size='14' text-anchor='middle'>٦٠</text><text x='111' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>٢</text><rect x='141' y='70' width='36' height='100' rx='4' fill='#58CC02'/><text x='159' y='64' fill='#4B4B4B' font-size='14' text-anchor='middle'>٥٠</text><text x='159' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>٣</text><rect x='189' y='30' width='36' height='140' rx='4' fill='#58CC02'/><text x='207' y='24' fill='#4B4B4B' font-size='14' text-anchor='middle'>٧٠</text><text x='207' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>٤</text><rect x='237' y='90' width='36' height='80' rx='4' fill='#58CC02'/><text x='255' y='84' fill='#4B4B4B' font-size='14' text-anchor='middle'>٤٠</text><text x='255' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>٥</text></svg>"
        },
        {
          id: "st-cha-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين القطاع الدائري توزيع مصروف أسرة شهري قدره ٤٠٠٠ ريال. كم ريالاً تنفق الأسرة على الغذاء والمواصلات معاً؟",
          choices: ["١٢٠٠", "١٦٠٠", "٢٠٠٠", "٢٤٠٠"],
          answer: 2,
          solution: "من الرسم: الغذاء = ٣٠٪ والمواصلات = ٢٠٪.\nالنسبة معاً = ٣٠٪ + ٢٠٪ = ٥٠٪.\nالمبلغ = ٥٠٪ × ٤٠٠٠ = ٢٠٠٠ ريال.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M100,100 L100,35 A65,65 0 0 1 138,153 Z' fill='#58CC02'/><path d='M100,100 L138,153 A65,65 0 0 1 38,120 Z' fill='#1CB0F6'/><path d='M100,100 L38,120 A65,65 0 0 1 62,47 Z' fill='#FFC800'/><path d='M100,100 L62,47 A65,65 0 0 1 100,35 Z' fill='#FF4B4B'/><text x='138' y='93' fill='#FFFFFF' font-size='14' text-anchor='middle'>٤٠٪</text><text x='88' y='143' fill='#FFFFFF' font-size='14' text-anchor='middle'>٣٠٪</text><text x='62' y='93' fill='#FFFFFF' font-size='14' text-anchor='middle'>٢٠٪</text><text x='88' y='67' fill='#FFFFFF' font-size='14' text-anchor='middle'>١٠٪</text><rect x='278' y='39' width='12' height='12' rx='2' fill='#58CC02'/><text x='272' y='50' fill='#4B4B4B' font-size='14' text-anchor='end'>سكن</text><rect x='278' y='69' width='12' height='12' rx='2' fill='#1CB0F6'/><text x='272' y='80' fill='#4B4B4B' font-size='14' text-anchor='end'>غذاء</text><rect x='278' y='99' width='12' height='12' rx='2' fill='#FFC800'/><text x='272' y='110' fill='#4B4B4B' font-size='14' text-anchor='end'>مواصلات</text><rect x='278' y='129' width='12' height='12' rx='2' fill='#FF4B4B'/><text x='272' y='140' fill='#4B4B4B' font-size='14' text-anchor='end'>أخرى</text></svg>"
        },
        {
          id: "st-cha-07",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "يبين الرسم البياني عدد زوار أحد المتاحف خلال أربعة أيام.",
          value1: "الوسط الحسابي لعدد الزوار في يومي الأحد والاثنين",
          value2: "عدد زوار يوم الاثنين مضافاً إليه ١٥",
          answer: 2,
          solution: "من الرسم: زوار الأحد = ١٢٠ وزوار الاثنين = ٩٠.\nالقيمة الأولى = (١٢٠ + ٩٠) ÷ ٢ = ٢١٠ ÷ ٢ = ١٠٥.\nالقيمة الثانية = ٩٠ + ١٥ = ١٠٥.\nإذن القيمتان متساويتان.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='35' y1='170' x2='290' y2='170' stroke='#AFAFAF' stroke-width='2'/><line x1='35' y1='20' x2='35' y2='170' stroke='#AFAFAF' stroke-width='2'/><rect x='55' y='50' width='40' height='120' rx='4' fill='#1CB0F6'/><text x='75' y='44' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٢٠</text><text x='75' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>الأحد</text><rect x='115' y='80' width='40' height='90' rx='4' fill='#1CB0F6'/><text x='135' y='74' fill='#4B4B4B' font-size='14' text-anchor='middle'>٩٠</text><text x='135' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>الاثنين</text><rect x='175' y='20' width='40' height='150' rx='4' fill='#1CB0F6'/><text x='195' y='14' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٥٠</text><text x='195' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>الثلاثاء</text><rect x='235' y='80' width='40' height='90' rx='4' fill='#1CB0F6'/><text x='255' y='74' fill='#4B4B4B' font-size='14' text-anchor='middle'>٩٠</text><text x='255' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>الأربعاء</text></svg>"
        },
        {
          id: "st-cha-08",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول التكراري توزيع درجات ٢٠ طالباً في اختبار قصير من ٩ درجات.",
          value1: "عدد الطلاب الحاصلين على أقل من ٧ درجات",
          value2: "عدد الطلاب الحاصلين على أكثر من ٧ درجات",
          answer: 0,
          solution: "الحاصلون على أقل من ٧: درجة ٥ (طالبان) + درجة ٦ (٥ طلاب) = ٧ طلاب.\nالحاصلون على أكثر من ٧: درجة ٨ (٣ طلاب) + درجة ٩ (طالبان) = ٥ طلاب.\nبما أن ٧ أكبر من ٥، فإن القيمة الأولى أكبر.",
          figure: "<table class='q-table'><tr><th>الدرجة</th><td>٥</td><td>٦</td><td>٧</td><td>٨</td><td>٩</td></tr><tr><th>عدد الطلاب</th><td>٢</td><td>٥</td><td>٨</td><td>٣</td><td>٢</td></tr></table>"
        },
        {
          id: "st-cha-09",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول مبيعات متجر خلال أربعة فصول من السنة. ما النسبة المئوية لمبيعات الفصل الثاني من مجموع مبيعات السنة؟",
          choices: ["٢٥٪", "٣٠٪", "٣٥٪", "٤٠٪"],
          answer: 1,
          solution: "مجموع المبيعات = ٢٠٠ + ٣٠٠ + ٢٥٠ + ٢٥٠ = ١٠٠٠ ألف ريال.\nمبيعات الفصل الثاني = ٣٠٠ ألف ريال.\nالنسبة = ٣٠٠/١٠٠٠ × ١٠٠٪ = ٣٠٪.",
          figure: "<table class='q-table'><tr><th>الفصل</th><th>المبيعات (ألف ريال)</th></tr><tr><td>الأول</td><td>٢٠٠</td></tr><tr><td>الثاني</td><td>٣٠٠</td></tr><tr><td>الثالث</td><td>٢٥٠</td></tr><tr><td>الرابع</td><td>٢٥٠</td></tr></table>"
        },
        {
          id: "st-cha-10",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين الرسم البياني عدد المشتركين في نادٍ رياضي خلال أربعة أعوام. في أي عام كانت الزيادة في عدد المشتركين عن العام السابق هي الأكبر؟",
          choices: ["١٤٤١", "١٤٤٢", "١٤٤٣", "لا يمكن التحديد"],
          answer: 1,
          solution: "نحسب الزيادة عن كل عام سابق:\nعام ١٤٤١: ١٠٠ − ٨٠ = ٢٠ مشتركاً.\nعام ١٤٤٢: ١٤٠ − ١٠٠ = ٤٠ مشتركاً.\nعام ١٤٤٣: ١٦٠ − ١٤٠ = ٢٠ مشتركاً.\nأكبر زيادة كانت في عام ١٤٤٢.\nتنبيه: العمود الأطول (١٤٤٣) لا يعني أن الزيادة فيه هي الأكبر.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><line x1='35' y1='170' x2='290' y2='170' stroke='#AFAFAF' stroke-width='2'/><line x1='35' y1='20' x2='35' y2='170' stroke='#AFAFAF' stroke-width='2'/><rect x='55' y='98' width='40' height='72' rx='4' fill='#58CC02'/><text x='75' y='92' fill='#4B4B4B' font-size='14' text-anchor='middle'>٨٠</text><text x='75' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٤٤٠</text><rect x='115' y='80' width='40' height='90' rx='4' fill='#58CC02'/><text x='135' y='74' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٠٠</text><text x='135' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٤٤١</text><rect x='175' y='44' width='40' height='126' rx='4' fill='#58CC02'/><text x='195' y='38' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٤٠</text><text x='195' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٤٤٢</text><rect x='235' y='26' width='40' height='144' rx='4' fill='#58CC02'/><text x='255' y='20' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٦٠</text><text x='255' y='188' fill='#4B4B4B' font-size='14' text-anchor='middle'>١٤٤٣</text></svg>"
        },
        {
          id: "st-cha-11",
          format: "comparison",
          difficulty: 3,
          track: "both",
          stem: "يبين القطاع الدائري توزيع طلاب إحدى الثانويات حسب المسار الدراسي.",
          value1: "عدد طلاب المسار العلمي",
          value2: "١٥٠ طالباً",
          answer: 3,
          solution: "الرسم يعطي النسبة المئوية لطلاب المسار العلمي (٤٠٪) فقط.\nلحساب العدد نحتاج إلى العدد الكلي لطلاب الثانوية، وهو غير معطى.\nفقد يكون العدد الكلي ٢٠٠ فيكون العلمي ٨٠، وقد يكون ٥٠٠ فيكون العلمي ٢٠٠.\nإذن المعطيات غير كافية للمقارنة.",
          figure: "<svg viewBox='0 0 300 200' xmlns='http://www.w3.org/2000/svg'><path d='M100,100 L100,35 A65,65 0 0 1 138,153 Z' fill='#58CC02'/><path d='M100,100 L138,153 A65,65 0 0 1 35,100 Z' fill='#1CB0F6'/><path d='M100,100 L35,100 A65,65 0 0 1 100,35 Z' fill='#FFC800'/><text x='138' y='93' fill='#FFFFFF' font-size='14' text-anchor='middle'>٤٠٪</text><text x='82' y='141' fill='#FFFFFF' font-size='14' text-anchor='middle'>٣٥٪</text><text x='72' y='77' fill='#FFFFFF' font-size='14' text-anchor='middle'>٢٥٪</text><rect x='278' y='49' width='12' height='12' rx='2' fill='#58CC02'/><text x='272' y='60' fill='#4B4B4B' font-size='14' text-anchor='end'>علمي</text><rect x='278' y='84' width='12' height='12' rx='2' fill='#1CB0F6'/><text x='272' y='95' fill='#4B4B4B' font-size='14' text-anchor='end'>أدبي</text><rect x='278' y='119' width='12' height='12' rx='2' fill='#FFC800'/><text x='272' y='130' fill='#4B4B4B' font-size='14' text-anchor='end'>إداري</text></svg>"
        },
        {
          id: "st-cha-12",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "يبين الجدول عدد الطلاب والوسط الحسابي لدرجاتهم في فصلين. ما الوسط الحسابي لدرجات طلاب الفصلين معاً؟",
          choices: ["٨١", "٨٠", "٨٢", "٧٩"],
          answer: 0,
          solution: "مجموع درجات الفصل (أ) = ٢٠ × ٧٥ = ١٥٠٠.\nمجموع درجات الفصل (ب) = ٣٠ × ٨٥ = ٢٥٥٠.\nالمجموع الكلي = ١٥٠٠ + ٢٥٥٠ = ٤٠٥٠، وعدد الطلاب الكلي = ٢٠ + ٣٠ = ٥٠.\nالوسط الحسابي = ٤٠٥٠ ÷ ٥٠ = ٨١.\nتنبيه: أخذ متوسط المتوسطين (٨٠) خطأ شائع لأن عددي الطلاب غير متساويين.",
          figure: "<table class='q-table'><tr><th>الفصل</th><th>عدد الطلاب</th><th>الوسط الحسابي للدرجات</th></tr><tr><td>أ</td><td>٢٠</td><td>٧٥</td></tr><tr><td>ب</td><td>٣٠</td><td>٨٥</td></tr></table>"
        }
      ]
    },
    {
      key: "averages",
      title: "الوسط والوسيط والمنوال",
      icon: "🎯",
      questions: [
        {
          id: "st-avg-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما الوسط الحسابي للأعداد: ٤، ٧، ٩، ١٢؟",
          choices: ["٦", "٧", "٨", "٩"],
          answer: 2,
          solution: "الوسط الحسابي = مجموع الأعداد ÷ عددها.\nالمجموع = ٤ + ٧ + ٩ + ١٢ = ٣٢.\nالوسط الحسابي = ٣٢ ÷ ٤ = ٨.",
          figure: null
        },
        {
          id: "st-avg-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "ما الوسيط للأعداد: ٨، ٣، ٩، ٥، ١١؟",
          choices: ["٧٫٢", "٨", "٩", "١١"],
          answer: 1,
          solution: "لإيجاد الوسيط نرتب الأعداد تصاعدياً أولاً: ٣، ٥، ٨، ٩، ١١.\nالوسيط هو القيمة الوسطى بعد الترتيب، أي القيمة الثالثة = ٨.\nتنبيه: أخذ العدد الأوسط دون ترتيب (٩) خطأ شائع، و٧٫٢ هو الوسط الحسابي وليس الوسيط.",
          figure: null
        },
        {
          id: "st-avg-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "سجل بائع أحذية المقاسات المباعة في ساعة واحدة: ٦، ٤، ٦، ٨، ٦، ٤. ما المنوال لهذه القيم؟",
          choices: ["٤", "٥", "٦", "٨"],
          answer: 2,
          solution: "المنوال هو القيمة الأكثر تكراراً.\nالمقاس ٦ تكرر ثلاث مرات، والمقاس ٤ تكرر مرتين، والمقاس ٨ مرة واحدة.\nإذن المنوال = ٦.",
          figure: null
        },
        {
          id: "st-avg-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "الوسط الحسابي للأعداد ٢، ٤، ٦",
          value2: "الوسيط للأعداد ٢، ٤، ٦",
          answer: 2,
          solution: "الوسط الحسابي = (٢ + ٤ + ٦) ÷ ٣ = ١٢ ÷ ٣ = ٤.\nالأعداد مرتبة تصاعدياً، والوسيط هو القيمة الوسطى = ٤.\nإذن القيمتان متساويتان.",
          figure: null
        },
        {
          id: "st-avg-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول درجات سالم في ثلاثة اختبارات. كم درجة يحتاج في الاختبار الرابع ليصبح الوسط الحسابي لدرجاته في الاختبارات الأربعة ٨٥؟",
          choices: ["٨٦", "٩٠", "٩٢", "٩٤"],
          answer: 1,
          solution: "ليكون الوسط الحسابي ٨٥ لأربعة اختبارات، يجب أن يكون المجموع = ٨٥ × ٤ = ٣٤٠.\nمجموع درجاته الحالية = ٨٤ + ٧٦ + ٩٠ = ٢٥٠.\nالدرجة المطلوبة = ٣٤٠ − ٢٥٠ = ٩٠.",
          figure: "<table class='q-table'><tr><th>الاختبار</th><th>الدرجة</th></tr><tr><td>الأول</td><td>٨٤</td></tr><tr><td>الثاني</td><td>٧٦</td></tr><tr><td>الثالث</td><td>٩٠</td></tr></table>"
        },
        {
          id: "st-avg-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول التكراري عدد أفراد الأسرة لعينة من ٢٠ أسرة. ما المنوال لعدد أفراد الأسرة؟",
          choices: ["٤", "٥", "٦", "٧"],
          answer: 1,
          solution: "المنوال هو القيمة التي لها أكبر تكرار.\nأكبر تكرار في الجدول هو ٧، ويقابل القيمة ٥.\nإذن المنوال = ٥ أفراد.\nتنبيه: اختيار التكرار نفسه (٧) بدلاً من القيمة خطأ شائع.",
          figure: "<table class='q-table'><tr><th>عدد أفراد الأسرة</th><td>٣</td><td>٤</td><td>٥</td><td>٦</td></tr><tr><th>عدد الأسر (التكرار)</th><td>٤</td><td>٦</td><td>٧</td><td>٣</td></tr></table>"
        },
        {
          id: "st-avg-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "درجات الحرارة العظمى في الرياض خلال أسبوع كانت: ٣٦، ٣٩، ٤١، ٣٨، ٤٠، ٤٢، ٣٧. ما المدى لهذه القيم؟",
          choices: ["٦", "٣٩", "٤٢", "٣٦"],
          answer: 0,
          solution: "المدى = أكبر قيمة − أصغر قيمة.\nأكبر قيمة = ٤٢، وأصغر قيمة = ٣٦.\nالمدى = ٤٢ − ٣٦ = ٦.\nتنبيه: ٣٩ هو الوسط الحسابي لهذه القيم وليس المدى.",
          figure: null
        },
        {
          id: "st-avg-08",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول درجات مجموعتين من الطلاب في اختبار.",
          value1: "وسيط درجات المجموعة (أ)",
          value2: "وسيط درجات المجموعة (ب)",
          answer: 1,
          solution: "درجات المجموعة (أ) مرتبة: ١٢، ١٤، ١٦، ١٨، وعددها زوجي.\nوسيط (أ) = (١٤ + ١٦) ÷ ٢ = ١٥.\nدرجات المجموعة (ب) مرتبة: ١٠، ١٥، ١٧، ١٨.\nوسيط (ب) = (١٥ + ١٧) ÷ ٢ = ١٦.\nبما أن ١٦ أكبر من ١٥، فإن القيمة الثانية أكبر.",
          figure: "<table class='q-table'><tr><th>المجموعة (أ)</th><td>١٢</td><td>١٤</td><td>١٦</td><td>١٨</td></tr><tr><th>المجموعة (ب)</th><td>١٠</td><td>١٥</td><td>١٧</td><td>١٨</td></tr></table>"
        },
        {
          id: "st-avg-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "خمسة أعداد موجبة مجموعها ٦٠.",
          value1: "الوسط الحسابي للأعداد الخمسة",
          value2: "وسيط الأعداد الخمسة",
          answer: 3,
          solution: "الوسط الحسابي = ٦٠ ÷ ٥ = ١٢، وهو محدد تماماً.\nأما الوسيط فيعتمد على قيم الأعداد نفسها وهي غير معلومة.\nمثال ١: الأعداد ١٠، ١١، ١٢، ١٣، ١٤ وسيطها ١٢ (مساوٍ للوسط).\nمثال ٢: الأعداد ١، ٢، ٣، ٤، ٥٠ وسيطها ٣ (أصغر من الوسط).\nإذن المعطيات غير كافية.",
          figure: null
        },
        {
          id: "st-avg-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "متوسط أعمار أربعة إخوة ١٥ سنة، ثم انضم إليهم أخ خامس عمره ٢٠ سنة.",
          value1: "متوسط أعمار الإخوة الخمسة",
          value2: "١٥ سنة",
          answer: 0,
          solution: "مجموع أعمار الإخوة الأربعة = ٤ × ١٥ = ٦٠ سنة.\nبعد انضمام الخامس: المجموع = ٦٠ + ٢٠ = ٨٠ سنة.\nالمتوسط الجديد = ٨٠ ÷ ٥ = ١٦ سنة.\nبما أن ١٦ أكبر من ١٥، فإن القيمة الأولى أكبر.",
          figure: null
        },
        {
          id: "st-avg-11",
          format: "mcq",
          difficulty: 3,
          track: "both",
          stem: "الوسط الحسابي لدرجات ١٠ طلاب هو ٧٢. عند المراجعة تبين أن درجة أحد الطلاب رُصدت ٧٠ والصحيح ٩٠. ما الوسط الحسابي الصحيح؟",
          choices: ["٧٢", "٧٣", "٧٤", "٧٦"],
          answer: 2,
          solution: "مجموع الدرجات قبل التصحيح = ١٠ × ٧٢ = ٧٢٠.\nالزيادة بعد التصحيح = ٩٠ − ٧٠ = ٢٠.\nالمجموع الصحيح = ٧٢٠ + ٢٠ = ٧٤٠.\nالوسط الحسابي الصحيح = ٧٤٠ ÷ ١٠ = ٧٤.",
          figure: null
        },
        {
          id: "st-avg-12",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "الوسط الحسابي لستة أعداد هو ١٠. حُذف أحد الأعداد فأصبح الوسط الحسابي للأعداد الخمسة الباقية ٩. ما العدد المحذوف؟",
          choices: ["٥", "٩", "١٢", "١٥"],
          answer: 3,
          solution: "مجموع الأعداد الستة = ٦ × ١٠ = ٦٠.\nمجموع الأعداد الخمسة الباقية = ٥ × ٩ = ٤٥.\nالعدد المحذوف = ٦٠ − ٤٥ = ١٥.",
          figure: null
        }
      ]
    },
    {
      key: "probability",
      title: "الاحتمالات",
      icon: "🎲",
      questions: [
        {
          id: "st-pro-01",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "عند رمي حجر نرد منتظم مرة واحدة، ما احتمال ظهور عدد زوجي؟",
          choices: ["١/٦", "١/٣", "١/٢", "٢/٣"],
          answer: 2,
          solution: "فراغ العينة = {١، ٢، ٣، ٤، ٥، ٦} وعدد عناصره ٦.\nالأعداد الزوجية هي {٢، ٤، ٦} وعددها ٣.\nالاحتمال = ٣/٦ = ١/٢.",
          figure: null
        },
        {
          id: "st-pro-02",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "يبين الجدول محتويات كيس من الكرات. سُحبت كرة واحدة عشوائياً، ما احتمال أن تكون حمراء؟",
          choices: ["٣/٨", "٥/٨", "٣/٥", "١/٣"],
          answer: 0,
          solution: "العدد الكلي للكرات = ٣ + ٥ = ٨.\nعدد الكرات الحمراء = ٣.\nالاحتمال = عدد النواتج الممكنة للحدث ÷ عدد عناصر فراغ العينة = ٣/٨.\nتنبيه: قسمة عدد الحمراء على عدد الزرقاء (٣/٥) خطأ شائع.",
          figure: "<table class='q-table'><tr><th>لون الكرة</th><th>العدد</th></tr><tr><td>أحمر</td><td>٣</td></tr><tr><td>أزرق</td><td>٥</td></tr></table>"
        },
        {
          id: "st-pro-03",
          format: "mcq",
          difficulty: 1,
          track: "both",
          stem: "بطاقات متماثلة مرقمة من ١ إلى ١٠، سُحبت بطاقة واحدة عشوائياً. ما احتمال أن تحمل عدداً أكبر من ٧؟",
          choices: ["١/١٠", "٣/١٠", "٤/١٠", "٧/١٠"],
          answer: 1,
          solution: "فراغ العينة يتكون من ١٠ بطاقات.\nالأعداد الأكبر من ٧ هي {٨، ٩، ١٠} وعددها ٣.\nالاحتمال = ٣/١٠.\nتنبيه: إدخال العدد ٧ ضمن النواتج (٤/١٠) خطأ شائع، فالمطلوب أكبر من ٧ وليس ٧ فأكثر.",
          figure: null
        },
        {
          id: "st-pro-04",
          format: "comparison",
          difficulty: 1,
          track: "both",
          stem: "",
          value1: "احتمال ظهور الصورة عند رمي قطعة نقود منتظمة مرة واحدة",
          value2: "احتمال ظهور عدد أكبر من ٣ عند رمي حجر نرد منتظم مرة واحدة",
          answer: 2,
          solution: "القيمة الأولى: قطعة النقود لها ناتجان متساويان، فاحتمال الصورة = ١/٢.\nالقيمة الثانية: الأعداد الأكبر من ٣ هي {٤، ٥، ٦}، فالاحتمال = ٣/٦ = ١/٢.\nإذن القيمتان متساويتان.",
          figure: null
        },
        {
          id: "st-pro-05",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "إذا كان احتمال فوز فريق في مباراة يساوي ٢/٥، فما احتمال عدم فوزه؟",
          choices: ["٢/٥", "٣/٥", "١/٥", "٢/٣"],
          answer: 1,
          solution: "احتمال الحدث المكمل = ١ − احتمال الحدث.\nاحتمال عدم الفوز = ١ − ٢/٥ = ٣/٥.",
          figure: null
        },
        {
          id: "st-pro-06",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول توزيع طلاب نشاط الروبوت حسب الصف. اختير طالب واحد عشوائياً، ما احتمال أن يكون من الصف الثالث؟",
          choices: ["١/٥", "٣/١٠", "٢/٥", "١/٢"],
          answer: 3,
          solution: "العدد الكلي للطلاب = ١٠ + ١٥ + ٢٥ = ٥٠ طالباً.\nعدد طلاب الصف الثالث = ٢٥.\nالاحتمال = ٢٥/٥٠ = ١/٢.",
          figure: "<table class='q-table'><tr><th>الصف</th><th>عدد الطلاب</th></tr><tr><td>الأول</td><td>١٠</td></tr><tr><td>الثاني</td><td>١٥</td></tr><tr><td>الثالث</td><td>٢٥</td></tr></table>"
        },
        {
          id: "st-pro-07",
          format: "mcq",
          difficulty: 2,
          track: "both",
          stem: "عند رمي حجري نرد منتظمين معاً، ما احتمال أن يكون مجموع العددين الظاهرين ٧؟",
          choices: ["١/١٢", "١/٩", "١/٦", "٧/٣٦"],
          answer: 2,
          solution: "عدد عناصر فراغ العينة = ٦ × ٦ = ٣٦ ناتجاً.\nالنواتج التي مجموعها ٧: (١،٦)، (٢،٥)، (٣،٤)، (٤،٣)، (٥،٢)، (٦،١) وعددها ٦.\nالاحتمال = ٦/٣٦ = ١/٦.",
          figure: null
        },
        {
          id: "st-pro-08",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "كيس فيه كرات حمراء وزرقاء فقط، وعدد الكرات الحمراء ٦. سُحبت كرة واحدة عشوائياً.",
          value1: "احتمال أن تكون الكرة المسحوبة زرقاء",
          value2: "١/٢",
          answer: 3,
          solution: "احتمال سحب زرقاء = عدد الزرقاء ÷ العدد الكلي، وعدد الكرات الزرقاء غير معلوم.\nلو كان عدد الزرقاء ٦ لكان الاحتمال ١/٢، ولو كان ٣ لكان الاحتمال ٣/٩ = ١/٣.\nإذن المعطيات غير كافية للمقارنة.",
          figure: null
        },
        {
          id: "st-pro-09",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "بطاقات متماثلة مرقمة من ١ إلى ١٠، سُحبت بطاقة واحدة عشوائياً.",
          value1: "احتمال أن تحمل البطاقة عدداً أولياً",
          value2: "احتمال أن تحمل البطاقة عدداً يقبل القسمة على ٣",
          answer: 0,
          solution: "الأعداد الأولية من ١ إلى ١٠ هي {٢، ٣، ٥، ٧}، فالقيمة الأولى = ٤/١٠.\nالأعداد التي تقبل القسمة على ٣ هي {٣، ٦، ٩}، فالقيمة الثانية = ٣/١٠.\nبما أن ٤/١٠ أكبر من ٣/١٠، فإن القيمة الأولى أكبر.\nتذكر: العدد ١ ليس عدداً أولياً.",
          figure: null
        },
        {
          id: "st-pro-10",
          format: "comparison",
          difficulty: 2,
          track: "both",
          stem: "يبين الجدول نتائج استبانة عن الوجبة المفضلة لدى ٤٠ طالباً. اختير طالب واحد عشوائياً.",
          value1: "احتمال أن يفضل الطالب الكبسة",
          value2: "احتمال أن يفضل الطالب البرجر أو الشاورما",
          answer: 1,
          solution: "القيمة الأولى = ١٦/٤٠ = ٢/٥.\nالقيمة الثانية = (١٢ + ٨)/٤٠ = ٢٠/٤٠ = ١/٢.\nبتوحيد المقامات: ٢/٥ = ٤/١٠ و ١/٢ = ٥/١٠.\nبما أن ١/٢ أكبر من ٢/٥، فإن القيمة الثانية أكبر.",
          figure: "<table class='q-table'><tr><th>الوجبة</th><td>كبسة</td><td>برجر</td><td>شاورما</td><td>أخرى</td></tr><tr><th>عدد الطلاب</th><td>١٦</td><td>١٢</td><td>٨</td><td>٤</td></tr></table>"
        },
        {
          id: "st-pro-11",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "كيس فيه ٤ كرات حمراء و٦ كرات خضراء. سُحبت كرتان واحدة تلو الأخرى دون إرجاع، ما احتمال أن تكون الكرتان حمراوين؟",
          choices: ["٢/٥", "٤/٢٥", "٢/١٥", "١/١٥"],
          answer: 2,
          solution: "احتمال أن تكون الكرة الأولى حمراء = ٤/١٠.\nبعد سحبها دون إرجاع يتبقى ٣ كرات حمراء من أصل ٩ كرات.\nاحتمال أن تكون الثانية حمراء = ٣/٩.\nالاحتمال المطلوب = ٤/١٠ × ٣/٩ = ١٢/٩٠ = ٢/١٥.\nتنبيه: الناتج ٤/٢٥ يحدث عند افتراض الإرجاع، والسحب هنا دون إرجاع.",
          figure: null
        },
        {
          id: "st-pro-12",
          format: "mcq",
          difficulty: 3,
          track: "sci",
          stem: "عند رمي قطعة نقود منتظمة ثلاث مرات متتالية، ما احتمال ظهور الصورة مرة واحدة على الأقل؟",
          choices: ["١/٨", "٣/٨", "١/٢", "٧/٨"],
          answer: 3,
          solution: "عدد عناصر فراغ العينة = ٢ × ٢ × ٢ = ٨ نواتج.\nالحدث المكمل هو عدم ظهور الصورة إطلاقاً، أي ظهور الكتابة في الرميات الثلاث، وله ناتج واحد فقط.\nاحتمال الحدث المكمل = ١/٨.\nالاحتمال المطلوب = ١ − ١/٨ = ٧/٨.",
          figure: null
        }
      ]
    }
  ]
};
