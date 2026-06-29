// Subject-specific MCQ assessments. Each entry is one of:
//   'علوم', 'عربي', 'رياضيات', 'English'
// Each question: { q: <Arabic question text>, options: { A, B, C, D } }
// Correct answers are determined by Claude at grading time (see /api/grade-assessment).
// Optional: set `answer` to override Claude's grading with an explicit answer key.

const ASSESSMENTS = {
  "علوم": [
    {
      q: "تسمى مجموعة العبارات المترابطة التي توضع في نموذج يساعد في جمع المعلومات من عينة الدراسة المختارة من قبل الباحث:",
      options: { A: "المقابلات", B: "الملاحظات", C: "الاختبارات", D: "الاستبانات" },
    },
    {
      q: "في إحدى الحصص، وأثناء عمل الطلبة في أربع مجموعات، لاحظ المعلم أن ثلاثة طلبة في مجموعات مختلفة لا يقومون بأي عمل أثناء عمل المجموعات وغير مندمجين في المهمة التي تقوم بها المجموعة، ما التصرف السليم في هذه الحالة؟",
      options: {
        A: "إعادة توزيع الطلبة غير المندمجين في المجموعات واستكمال المهمات مع زملائهم في المجموعات الجديدة.",
        B: "التوجه نحو المجموعات التي تضم الطلبة غير المندمجين ومناقشتهم في المهمات المسندة لأعضاء الفريق.",
        C: "الطلب من الطلبة الثلاثة غير المندمجين استكمال المهمة بشكل مستقل ومناقشتها مع المعلم بشكل فردي.",
        D: "تجاهل الموضوع مؤقتاً لعدم إحراج الطلبة، ثم التحدث معهم على انفراد بعد انتهاء الحصة خارج الصف.",
      },
    },
    {
      q: "إن أفضل إجراء من أجل أن تُظهِر نتائج الاختبارات الدولية (TIMSS) الواقع الحقيقي لطلبة المدارس الأردنية هو:",
      options: {
        A: "تدريب الطلبة على فنيات الاختبارات الدولية من خلال الأنشطة داخل الصف",
        B: "تدريب الطلبة على فنيات الاختبارات الدولية من خلال الأنشطة خارج الصف",
        C: "تدريب المعلمين على البحث العلمي",
        D: "تدريب الطلبة على البحث العلمي",
      },
    },
    {
      q: "الغاز الذي يُعكِّر ماء الجير هو:",
      options: { A: "N₂", B: "CO₂", C: "O₂", D: "H₂O" },
    },
    {
      q: "إذا تأكسد H₂S وأنتج H₂SO₄ فإنّ مقدار التّغير في عدد تأكسد الكبريت S هو:",
      options: { A: "2", B: "6", C: "4", D: "8" },
    },
    {
      q: "كتلة LiOH الموجودة في 2 L من محلول تركيزه 0.04M تساوي (علماً بأن الكتلة المولية LiOH تساوي 24 g/mol):",
      options: { A: "1.92", B: "1.44", C: "0.96", D: "0.48" },
    },
    {
      q: "عدد روابط سيجما وباي في الجزيء CH₃CH = CH₂ هو:",
      options: { A: "2π, 8σ", B: "1π, 9σ", C: "1π, 8σ", D: "2π, 9σ" },
    },
    {
      q: "الجدول التالي يمثل التفاعل A + B → 2C عند درجة حرارة معينة. التجربة 1: [A]=0.1، [B]=0.1، السرعة الإبتدائية = 3×10⁻³. التجربة 2: [A]=0.1، [B]=0.3، السرعة الإبتدائية = 9×10⁻³. فإذا علمت أنّ الرتبة الكلية للتفاعل تساوي (1)، فإن رتبة التفاعل بالنسبة للمادة A تساوي:",
      options: { A: "صفر", B: "½", C: "1", D: "2" },
    },
    {
      q: "اعتماداً على الجدول التالي، الملح الأكثر تميُّهاً هو: محلول الحمض (1 مول/لتر) — HA: Ka = 6×10⁻⁵، HB: Ka = 4×10⁻⁴، HC: Ka = 1×10⁻²، HD: Ka = 2×10⁻⁴.",
      options: { A: "KD", B: "KC", C: "KB", D: "KA" },
    },
    {
      q: "عدد مولات أيونات H⁺ اللازمة لموازنة نصف التفاعل: N₂H₄ → NO يساوي:",
      options: { A: "2", B: "4", C: "6", D: "8" },
    },
    {
      q: "يُعدّ الكوليسترول من:",
      options: { A: "البروتينات", B: "الكربوهيدرات", C: "الدهون", D: "الستيرويدات" },
    },
    {
      q: "الذي يساعد على وقف النزيف وتخثر الدم:",
      options: {
        A: "الصفائح الدموية",
        B: "كريات الدم الحمراء",
        C: "كريات الدم البيضاء",
        D: "البلازما",
      },
    },
    {
      q: "يتم إنتاج العصارة الصفراوية في:",
      options: { A: "الحويصلة الصفراوية", B: "البنكرياس", C: "الأمعاء الدقيقة", D: "الكبد" },
    },
    {
      q: "يرجع تحول بروتين البيض من اللون الشفاف إلى اللون الأبيض بعد تسخينه إلى:",
      options: {
        A: "تحول الـ DNA.",
        B: "تحول البروتين إلى كربوهيدرات.",
        C: "التغير في التركيب الجزيئي للبروتين.",
        D: "توقف تكوين البروتين بسبب الحرارة.",
      },
    },
    {
      q: "الوظيفة الأساسية للزهرة في النباتات هي:",
      options: { A: "التكاثر", B: "جذب الحشرات", C: "تكوين الثمار", D: "تطور النبات" },
    },
    {
      q: "يتم تدمير البكتيريا التي تدخل الجسم من قبل أي نوع من الخلايا؟",
      options: {
        A: "خلايا الدم الحمراء",
        B: "خلايا الدم البيضاء",
        C: "خلايا الكلى",
        D: "خلايا الرئة",
      },
    },
    {
      q: "الشخص الذي فصيلة دمه (+A) يمكنه استقبال خلايا دم حمراء من شخص فصيلة دمه (حسب نظام ABO):",
      options: { A: "-AB", B: "+AB", C: "+B", D: "-A" },
    },
    {
      q: "أيًّا من الآتية يسمح للسمكة بالتحكم في عمق غوصها:",
      options: { A: "ذيل السمكة", B: "الزعانف", C: "مثانة العوم", D: "الخط الجانبي" },
    },
    {
      q: "المجال المغناطيسي المتولد داخل ملف دائري يسري فيه تيار يكون:",
      options: {
        A: "منتظماً وخطوطه في مركز الملف مستقيمة معامدة لمستوى الملف",
        B: "غير منتظم وخطوطه في مركز الملف مستقيمة معامدة لمستوى الملف",
        C: "منتظماً وخطوطه في مركز الملف مستقيمة موازية لمستوى الملف",
        D: "غير منتظم وخطوطه في مركز الملف مستقيمة موازية لمستوى الملف",
      },
    },
    {
      q: "لاعب سيرك كتلته 60 كغ، ينطلق من فوهة مدفع بسرعة أفقية مقدارها 16 م/ث، وتتم هذه العملية بالاستعانة بنابض يوضع داخل فوهة المدفع، إذا كان طول المدفع (4) أمتار وقوة الاحتكاك بين اللاعب والمسار داخل المدفع تساوي (40) نيوتن، وارتفاع فوهة المدفع عن موقع استقرار اللعب يساوي (2 متر) فإن ثابت النابض الذي ستستخدمه لتصميم المدفع يجب أن يساوي (استخدم تسارع السقوط الحر 10 م/ث²):",
      options: { A: "985 N/m", B: "965 N/m", C: "957 N/m", D: "962 N/m" },
    },
    {
      q: "في تجربة لقياس عمق البحر سمع الصوت المنعكس بعد 3 ثوانٍ، فإذا كانت سرعة الصوت في الماء تساوي 1320 م/ث، فإنّ عمق البحر يساوي:",
      options: { A: "3960 متر", B: "13200 متر", C: "1980 متر", D: "1.980 كم" },
    },
    {
      q: "عند مضاعفة سرعة جسم فإنّ طاقته الحركيّة:",
      options: {
        A: "تبقى ثابتة.",
        B: "تتضاعف مرتين.",
        C: "تتضاعف أربع مرات.",
        D: "تتضاعف ثماني مرات.",
      },
    },
    {
      q: "إذا كان فرق الجهد لجهاز كهربائي ما يساوي 20 فولت، وكانت مقاومته الكهربائيّة تساوي 5 أوم، فإن مقدار التّيار الكهربائي المار في الجهاز يساوي:",
      options: { A: "100 أمبير", B: "10 أمبير", C: "5 أمبير", D: "4 أمبير" },
    },
    {
      q: "أُطلقت قذيفة كتلتها 60 kg بسرعة 500 m/s من مدفع ساكن كتلته 2000 kg، ما السرعة التي سيتحرك بها المدفع بعد إطلاق القذيفة؟",
      options: { A: "10 m/s", B: "20 m/s", C: "-15 m/s", D: "15 m/s" },
    },
    {
      q: "أيهما ينتج عنه تيّار أكبر عند وَصل مصباحين مع بطارية بحيث يكون المصباحين:",
      options: {
        A: "على التّوالي مع أسلاك سميكة",
        B: "على التّوالي مع أسلاك رفيعة",
        C: "على التّوازي مع أسلاك سميكة",
        D: "على التّوازي مع أسلاك رفيعة",
      },
    },
  ],

  // ─────────────────────────────────────────────────────
  // Arabic has TWO variants picked by grade level:
  //   "عربي - المرحلة الدنيا" → معلّم صف 1-3 (Elementary)
  //   "عربي - المرحلة العليا" → معلّم صف 4-10 and معلّم صف 11-12 (Upper grades)
  // Each question may carry these optional fields:
  //   type: "mcq4" (default) | "mcq3" | "truefalse" | "openended" | "vowelization" | "numbers_to_words"
  //   passage: long reading-comprehension text shown above the question
  //   sectionStart: header text shown above this question (groups questions)
  //   marks: marks awarded (default 1). Used in grading total.
  //   rubric: optional grading guidance for non-MCQ types
  // For backwards compatibility, "عربي" still maps to the elementary variant.
  // ─────────────────────────────────────────────────────
  "عربي - المرحلة الدنيا": [
    // ─── Q1: Reading Comprehension (5 MCQs + 1 open-ended) ───
    {
      sectionStart: "السؤال الأوّل — فهم المقروء (١٢ علامة)",
      passage: "قَدِمَ وَفْدٌ عَلَى الْخَلِيفَةِ الْأُمَوِيِّ عُمَرَ بْنِ عَبْدِ الْعَزِيزِ يُهَنِّئُهُ بِالْخِلَافَةِ، فَتَقَدَّمَ أَصْغَرُهُمْ سِنًّا، وَطَلَبَ أَنْ يَتَكَلَّمَ، فَلَمْ يَسْمَحْ لَهُ الْخَلِيفَةُ وَقَالَ لَهُ: اصْمُتْ لِيَتَكَلَّمَ مَنْ هُوَ أَسَنُّ مِنْكَ، فَهُوَ أَوْلَى مِنْكَ بِالْكَلَامِ.\nفَقَالَ الْغُلَامُ: يَا أَمِيرَ الْمُؤْمِنِينَ، إِذَا مُنِحَ الْإِنْسَانُ قَلْبًا حَافِظًا، وَلِسَانًا لَافِظًا، كَانَ أَحَقَّ بِالْكَلَامِ، وَلَوْ كَانَ الْأَفْضَلُ هُوَ الْأَكْبَرَ سِنًّا، لَكَانَ فِي هَذِهِ الْأُمَّةِ مَنْ هُوَ أَحَقُّ مِنْكَ بِالْخِلَافَةِ.",
      type: "mcq4",
      marks: 2,
      q: "معنى كلمة (أسنّ) في عبارة (اصمت ليتكلّم من هو أسنّ منك) :",
      options: { A: "أحكم", B: "أقوى", C: "أفصح", D: "أكبر" },
    },
    {
      type: "mcq4", marks: 2,
      q: "في عبارة (ولو كان الأفضل هو الأكبر سنًّا، لكان في هذه الأمّة من هو أحقّ منك بالخلافة) تشير إلى أنّ الخليفة:",
      options: { A: "أكبر الناس سنًّا", B: "أصغر الناس", C: "ليس أحقّ الناس بالخلافة", D: "ليس شرطًا أن يكون الأكبر" },
    },
    {
      type: "mcq4", marks: 2,
      q: "معنى كلمة (أولى) في عبارة (من هو أولى منك بالكلام) :",
      options: { A: "أحكم", B: "أفصح", C: "أحقّ", D: "أقدر" },
    },
    {
      type: "mcq4", marks: 2,
      q: "العنوان الأنسب لموضوع القصّة هو:",
      options: { A: "شروط الخلافة", B: "ذكاء الغلام", C: "الاحترام واجب", D: "الخليفة المتسلّط" },
    },
    {
      type: "mcq4", marks: 2,
      q: "تدلّ إجابة الغلام على الخليفة في جملة (لكان في هذه الأمّة من هو أحقّ منك بالخلافة) على:",
      options: { A: "العناد والتّكبّر", B: "التّسرّع في الإجابة", C: "عدم احترام مكانة النّاس", D: "سرعة الإجابة" },
    },
    {
      type: "openended", marks: 2,
      q: "احتوى النّصّ على قيم سلوكيّة، اذكر اثنين منها مع التّوضيح.",
      rubric: "كل قيمة سلوكية صحيحة مع توضيح مناسب = 1 علامة. أمثلة مقبولة: احترام الكبير، فضل العلم على السنّ، التواضع، حسن الاستماع، التروّي قبل الكلام. يجب ذكر اثنتين مع توضيح للحصول على العلامة الكاملة.",
    },

    // ─── Q2: True/False (15 items, 2 marks each) ───
    {
      sectionStart: "السؤال الثّاني — صح أو خطأ (٣٠ علامة)",
      type: "truefalse", marks: 2,
      q: "أحمدُ الله على نعمه؛ نوع كلمة (أحمد) من أقسام الكلام هنا: اسم.",
    },
    { type: "truefalse", marks: 2, q: "الأفعال التّالية كلّها أفعال مضارعة (أقولُ، نكتبُ، سمعْتُ، تُساهمُ)." },
    { type: "truefalse", marks: 2, q: "نعلّم الطّالب طريقة تمييز اللّام الشّمسيّة بالتّأكّد من أنّ الحرف الّذي يليها مُشدّد." },
    { type: "truefalse", marks: 2, q: "من الطّرق المستخدمة لمعرفة الاسم وضع حرف جرّ قبله." },
    { type: "truefalse", marks: 2, q: "ندعوا الله أن يلطف بنا. كتابة (ندعوا) خاطئة." },
    { type: "truefalse", marks: 2, q: "من الطّرق المستخدمة للتّمييز بين الهاء والتّاء المربوطة هي تحريكها." },
    { type: "truefalse", marks: 2, q: "تناولُ المشروبات السّاخنة يمنح الدّفء للجسم. كلمة (تناولُ) فعل مضارع." },
    { type: "truefalse", marks: 2, q: "همزة (الْتِفات) همزة وصل لأنّها تبدأ ب (ال التّعريف)." },
    { type: "truefalse", marks: 2, q: "الكلمات التّالية كلّها جمع مذكّر سالم (معلّمونَ، مراقبينَ، عالِمونَ، بساتينَ، مساعدينَ)." },
    { q: "استعانتِ المعلّمة بوسيلةٍ لإيضاح الدّرس. التّاء في (استعانت) هي تاء التّأنيث.", type: "mcq4", marks: 2,
      options: { A: "KD", B: "KC", C: "KB", D: "KA" } },
    { type: "truefalse", marks: 2, q: "مساعدو الإدارة نظّموا العمل. كتابة كلمة (مساعدو) خاطئة دون ألف." },
    { type: "truefalse", marks: 2, q: "عندما يقع الطّالب بخطأ أثناء القراءة، على المعلّم تصويب هذا الخطأ بنفسه." },
    { type: "truefalse", marks: 2, q: "الكلمات التّالية كلّها أفعال (يساعدُ، صاعد، انتبهْ، يتفاعلُ)." },
    { type: "truefalse", marks: 2, q: "نستخدم حرفي (الواو، والفاء) للتّمييز بين همزة الوصل وهمزة القطع." },
    { type: "truefalse", marks: 2, q: "جميع الكلمات التّالية مثنّى (كتابانِ، عالميْنِ، صديقانِ، يدرسانِ، بيتيْنِ)." },

    // ─── Q3: 4 grammar MCQs (2 marks each) ───
    {
      sectionStart: "السؤال الثّالث — اختيار من متعدّد (٨ علامات)",
      type: "mcq4", marks: 2,
      q: "الكتابة الصّحيحة لكلمة (دَ، فِ، يْ، ءَ، ة) هي:",
      options: { A: "دفيأة", B: "دفيئة", C: "دَفيأة", D: "دفئية" },
    },
    {
      type: "mcq4", marks: 2,
      q: "الجملة الاسميّة هي:",
      options: {
        A: "سأعملُ على تحقيق هدفي.",
        B: "لِيكُنْ عملكَ بمحبّة.",
        C: "تعالى الله أحسن الخالقين.",
        D: "تعامُلُكَ بلطفٍ يكسبك محبّة الآخرين.",
      },
    },
    {
      type: "mcq4", marks: 2,
      q: "خالدٌ من الرّجال ___________ عرفوا بشجاعتهم. الاسم الموصول المناسب:",
      options: { A: "اللّذينَ", B: "الّذينَ", C: "اللّذانِ", D: "اللّذينِ" },
    },
    {
      type: "mcq4", marks: 2,
      q: "الكتابة الصّحيحة لكلمة (رِ، ءْ، ي) هي:",
      options: { A: "رِءي", B: "رئي", C: "رأي", D: "رؤي" },
    },
  ],

  "عربي - المرحلة العليا": [
    // ─── Q1: Reading Comprehension (5 open-ended + 1 vocabulary lookup, 20 marks) ───
    {
      sectionStart: "السؤال الأوّل — فهم المقروء: قصّة قطرات العطر (٢٠ علامة)",
      passage: "كانَتْ صَبِيَّةً، وَكانَتْ خادِمَةً، إِحْدى الْخَادِمَاتِ الْقَلَائِلِ فِي مِصْرَ اللَّائِي عَمِلْنَ فِي بَيْتٍ واحِدٍ أَكْثَرَ مِنْ خَمْسِ سَنَواتٍ، وَكانَتِ الْأَمانَةُ أَبْرَزَ صِفاتِها، لَمْ تَسْرِقْ أَبَدًا شَيْئًا، بَلْ لَمْ تَخْطُرْ لَها السَّرِقَةُ عَلَى بالٍ، وَقَرَّبَتْها أَمانَتُها مِنْ سَيِّدَةِ الْبَيْتِ، فَوَضَعَتْها فِي مَصافِّ أَفْرادِ الْعائِلَةِ، وَتَرَكَتْ لَها كُلَّ الْمَفاتيحِ، وَكُلَّ الْبَيْتِ.\n\nوَكَبُرَتِ الصَّبِيَّةُ، وَأَصْبَحَتْ شابَّةً جَميلَةً، وَلكِنَّها لَمْ تُحِسَّ بِشَبابِها وَجَمالِها، إِلّا عِنْدَما عَرَفَتْ سائِقَ إِحْدى سَيّاراتِ الْأُجْرَةِ، وَازْدادَ إِحْساسُها بِالشَّبابِ وَالْجَمالِ عِنْدَما دَعاها فِي سَيّارَتِهِ، ثُمَّ أَصْبَحَتْ كُلُّها شَبابًا وَجَمالًا عِنْدَما أَحَبَّتْهُ.\n\nوَوَقَفَتْ أَمامَ الْمِرْآةِ مُعْجَبَةً بِنَفْسِها، ثُمَّ اعْتَقَدَتْ أَنَّ هُناكَ شَيْئًا يُرْضي شَبابَها وَجَمالَها، وَمَدَّتْ يَدَها لِتَسْرِقَ هذا الشَّيْءَ. كانَتِ الْمَرَّةَ الْأولى الَّتي تَسْرِقُ فيها، وَلَمْ تَسْرِقْ سِوى قَطَراتٍ مِنْ زُجاجَةِ عِطْرٍ تَمْلِكُها سَيِّدَتُها...\n\n(تابع القصّة كاملة في الأصل: لاحظت السيّدة تناقص العطر، ثمّ اتّهمت الخادمة بالسرقة وصفعتها، فهربت الخادمة وأخذت معها زجاجة العطر كلّها، وعَلِمَت الآنَ أنّها لِصّة.)",
      type: "openended", marks: 4,
      q: "اذكر دليلين على أمانة الخادمة.",
      rubric: "أمثلة مقبولة: عملت في البيت أكثر من خمس سنوات دون سرقة، لم تخطر لها السرقة على بال، أعطتها سيّدتها كل المفاتيح والبيت بناءً على ثقتها بها، وُضعت في مصافّ أفراد العائلة. كل دليل واضح = 2 علامة، علامة كاملة = 4.",
    },
    {
      type: "openended", marks: 4,
      q: "ما القضيّة الّتي تطرحها قصّة قطرات العطر؟",
      rubric: "القضيّة المركزيّة: أنّ الاتّهام الظالم أو الإهانة قد تدفع الإنسان الأمين إلى الانحراف الفعليّ، أو أنّ الإنسان الذي يُعامَل كلصّ قد يصبح لصًّا فعلًا. يقبل أيضًا: قضيّة الثقة، أو خطر التهمة الجائرة. علامة كاملة = 4 لإجابة تطرح القضيّة بوضوح.",
    },
    {
      type: "openended", marks: 4,
      q: "وجّه الكاتب عدّة رسائل من خلال هذه القصّة. وضّح إحداها.",
      rubric: "أمثلة مقبولة: لا تتسرّع في الحكم على الآخرين، الاتّهام الظالم يدفع للجريمة، احترام كرامة العاملين، الأمانة قد تُهدر بكلمة، خطر الكِبر في التعامل. إجابة واحدة موضّحة = 4 علامات.",
    },
    {
      type: "openended", marks: 4,
      q: "كيف يمكن أن نفيد من قصّة قطرات العطر في صفوفنا؟",
      rubric: "يقبل: تعليم الطلبة عدم التسرّع في اتّهام أحد، احترام مشاعر الآخرين، إدارة الأخطاء بحكمة دون إهانة، بناء الثقة مع الطلبة، تمثيل القصّة لاستخراج العبر. إجابة تطبيقيّة عمليّة = 4 علامات.",
    },
    {
      type: "openended", marks: 4,
      q: "ابحث عن الكلمات الّتي حملت المعاني الآتية في النصّ: (بساطة) (منزلة) (ضربه بكفّه).",
      rubric: "الإجابة الصحيحة: بساطة = سذاجة، منزلة = مصافّ، ضربه بكفّه = صفعته. كل كلمة صحيحة ≈ 1.3 علامة. الإجابة الكاملة الثلاث = 4 علامات.",
    },

    // ─── Q2: True/False (10 items, 1 mark each = 10 marks) ───
    {
      sectionStart: "السؤال الثّاني — صح أو خطأ (١٠ علامات)",
      type: "truefalse", marks: 1,
      q: "كلّ شيء هالك إلّا وجهه. إعراب (وجه) مفعول به لاسم الفاعل.",
    },
    { type: "truefalse", marks: 1, q: "تعرج الملائكة والرّوح إليه في يومٍ كان مقداره خمسينَ ألفَ سنةٍ، (ألفَ) هنا تمييز منصوب." },
    { type: "truefalse", marks: 1, q: "وجّه الأب أبنائه إلى التّجارة. رسم الهمزة في الجملة صحيح." },
    { type: "truefalse", marks: 1, q: "(أليس ذلك بقادرٍ على أن يحيي الموتى) — (قادرٍ): اسم مجرور بالباء، خبر ليس مجرور لفظًا منصوب محلًّا." },
    { type: "truefalse", marks: 1, q: "الصّحيفة مقروأة على نطاق واسع. تكتب الهمزة على ألف لأنّها مفتوحة وما قبلها ساكن." },
    { type: "truefalse", marks: 1, q: "(قالوا يا موسى إنَّ فيها قومًا جبّارينَ) — (قومًا): خبر إنّ منصوب." },
    { type: "truefalse", marks: 1, q: "تدرّبتُ جيّدًا راغبةً في الفوز، كلمة (راغبةً) مفعول لأجله منصوب." },
    { type: "truefalse", marks: 1, q: "مهما يكن عملك فأنتَ ملومٌ، (مهما) أداة شرط جازمة في محلّ نصب خبر مقدّم." },
    { type: "truefalse", marks: 1, q: "أسلوب هذه الأمّ في التّربية أسلوب قديم. إعراب (هذه) خبر المبتدأ." },
    { type: "truefalse", marks: 1, q: "(إذا السّماءُ انشقّت) — (السّماءُ): فاعل مرفوع." },

    // ─── Q3: Vowelization — اشكل (4 items, 2 marks each = 8 marks) ───
    {
      sectionStart: "السؤال الثّالث — اشكل أواخر الكلمات المخطوط تحتها (٨ علامات)",
      type: "vowelization", marks: 2,
      q: "أجرى الوفد <u>مفاوضات مكثّفة</u>.\nاشكل أواخر الكلمتين (مفاوضات مكثّفة).",
      rubric: "الإجابة الصحيحة: مفاوضاتٍ مكثّفةً (مفاوضات: مفعول به منصوب وعلامة نصبه الكسرة لأنه جمع مؤنث سالم؛ مكثّفة: نعت منصوب). علامة كاملة = 2 إذا ضبطت الكلمتان بشكل صحيح.",
    },
    {
      type: "vowelization", marks: 2,
      q: "يتميّز النّاس في بلادنا <u>بأسماء خاصّة</u>.\nاشكل أواخر الكلمتين (أسماء خاصّة).",
      rubric: "الإجابة الصحيحة: بأسماءَ خاصّةٍ (أسماء: ممنوع من الصرف مجرور بالفتحة؛ خاصّة: نعت مجرور بالكسرة). علامة كاملة = 2.",
    },
    {
      type: "vowelization", marks: 2,
      q: "قد يتنازع النّاس في <u>أشياء تافهة</u>.\nاشكل أواخر الكلمتين (أشياء تافهة).",
      rubric: "الإجابة الصحيحة: أشياءَ تافهةٍ (أشياء: ممنوع من الصرف مجرور بالفتحة؛ تافهة: نعت مجرور بالكسرة). علامة كاملة = 2.",
    },
    {
      type: "vowelization", marks: 2,
      q: "يحفظ الطّلبة <u>الأبيات الشّعريّة</u> الّتي تروقهم.\nاشكل أواخر الكلمتين (الأبيات الشّعريّة).",
      rubric: "الإجابة الصحيحة: الأبياتَ الشّعريّةَ (الأبيات: مفعول به منصوب بالفتحة؛ الشّعريّة: نعت منصوب). علامة كاملة = 2.",
    },

    // ─── Q5: 14 3-option MCQs (1 mark each = 14 marks) ───
    {
      sectionStart: "السؤال الخامس — اختيار من متعدّد (١٤ علامة)",
      type: "mcq3", marks: 1,
      q: "إعراب المصدر المؤوّل في جملة (يسرّني أنْ تتفوّقَ في الامتحان) هو:",
      options: { A: "فاعل", B: "نائب فاعل", C: "مفعول به" },
    },
    {
      type: "mcq3", marks: 1,
      q: "إعراب كلمة (جميعًا) في قوله تعالى: (واعتصموا بحبل الله جميعًا ولا تفرّقوا) هو:",
      options: { A: "توكيد معنويّ منصوب", B: "مفعول به منصوب", C: "حال منصوبة" },
    },
    {
      type: "mcq3", marks: 1,
      q: "الحركة الصّحيحة لكلمة (شهداء) في قوله تعالى (جئنا بأربعةِ شهداء):",
      options: { A: "شهداءَ", B: "شهداءُ", C: "شهداءٍ" },
    },
    {
      type: "mcq3", marks: 1,
      q: "(قل إنّما حرّم ربّي الفواحشَ ما ظهر منها وما بطن) — (ما) هنا:",
      options: { A: "بدل بعض من كلّ", B: "بدل تفصيليّ", C: "بدل اشتمال" },
    },
    {
      type: "mcq3", marks: 1,
      q: "قال تعالى (كأنّهم حُمُرٌ مستنفرةٌ فرّت من قسورة) — نوع التّشبيه هنا:",
      options: { A: "مرسل مفصّل", B: "مرسل مجمل", C: "مؤكّد مجمل" },
    },
    {
      type: "mcq3", marks: 1,
      q: "ما يحتمل مضمونها الصّدق أو الكذب هي:",
      options: { A: "الجملة الخبريّة", B: "الجملة الإنشائيّة", C: "الجملة الطّلبيّة" },
    },
    {
      type: "mcq3", marks: 1,
      q: "(كم شهيدٍ تحت الأنقاض في غزّة) — نوع (كم) وإعرابها:",
      options: {
        A: "خبريّة: اسم مبنيّ على السّكون في محلّ رفع مبتدأ",
        B: "خبريّة: اسم مبنيّ على السّكون في محلّ نصب مفعول به",
        C: "استفهاميّة: اسم مبنيّ على السّكون في محلّ رفع مبتدأ",
      },
    },
    {
      type: "mcq3", marks: 1,
      q: "واحدة من العبارات الآتية جاءت فيها (ما) مصدريّة زمانيّة:",
      options: {
        A: "آمنوا كما آمن النّاس.",
        B: "وضاقت عليهم الأرض بما رحبت.",
        C: "إن أريد الإصلاح ما استطعت.",
      },
    },
    {
      type: "mcq3", marks: 1,
      q: "(أريني جوادًا مات هزلًا لعلّني أرى ما ترين أو بخيلًا مخلّدًا) — المعنى البلاغيّ للأمر:",
      options: { A: "التّعجيز", B: "التّمنّي", C: "الدّعاء" },
    },
    {
      type: "mcq3", marks: 1,
      q: "(كلّ أمٍّ وطفلُها) — سبب رجحان واو العطف على المعيّة:",
      options: {
        A: "عدم المشاركة في الحكم",
        B: "لم تأتِ الواو بمعنى (مع)",
        C: "لم تُسبق بجملة تامّة المعنى",
      },
    },
    {
      type: "mcq3", marks: 1,
      q: "(وما ظلمهم الله ولكن كانوا أنفسَهم يظلمون) — (أنفسهم) هنا:",
      options: { A: "خبر كانوا", B: "توكيد معنويّ", C: "مفعول به مقدّم" },
    },
    {
      type: "mcq3", marks: 1,
      q: "الصّيغة الّتي جاء عليها الأمر في (عليكَ نفسك هذّبها):",
      options: { A: "اسم فعل", B: "مصدر نائب عن فعل الأمر", C: "فعل أمر" },
    },
    {
      type: "mcq3", marks: 1,
      q: "الفاعل في قوله تعالى (فجاءته إحداهما تمشي على استحياء):",
      options: { A: "الضّمير المتّصل في (جاءته)", B: "إحداهما", C: "ضمير مستتر" },
    },
    {
      type: "mcq3", marks: 1,
      q: "نوع (ما) في قول الشّاعر (ما كلّ ما يتمنّى المرء يدركه — تجري الرّياح بما لا تشتهي السّفن) على التّرتيب:",
      options: {
        A: "موصولة — موصولة — نافية",
        B: "نافية — موصولة — نافية",
        C: "نافية — موصولة — موصولة",
      },
    },

    // ─── Q6: vowelization — اضبط حركة الحرف + 5 vocative items (6 marks total) ───
    {
      sectionStart: "السؤال السّادس — اضبط حركة الحرف الّذي تحته خطٌّ في الكلمات الآتية (٦ علامات)",
      type: "vowelization", marks: 1,
      q: "اضبط حركة الحرف الّذي تحته خطّ في الكلمات المخطوط تحتها في الجمل الآتية:\nيا سعيد — (اسم علم).\nاضبط (سعيد).",
      rubric: "الإجابة الصحيحة: يا سعيدُ (المنادى علم مبني على الضم). علامة كاملة = 1.",
    },
    {
      type: "vowelization", marks: 1,
      q: "يا معلّم — (نكرة مقصودة بالنّداء).\nاضبط (معلّم).",
      rubric: "الإجابة الصحيحة: يا معلّمُ (نكرة مقصودة مبنية على الضم). علامة كاملة = 1.",
    },
    {
      type: "vowelization", marks: 1,
      q: "يا معلّم — (نكرة غير مقصودة بالنّداء).\nاضبط (معلّم).",
      rubric: "الإجابة الصحيحة: يا معلّمًا (نكرة غير مقصودة منصوبة بالفتحة المنوّنة). علامة كاملة = 1.",
    },
    {
      type: "vowelization", marks: 1,
      q: "يا سامع الصّوت — (مضافًا).\nاضبط (سامع).",
      rubric: "الإجابة الصحيحة: يا سامعَ الصّوتِ (المنادى المضاف منصوب بالفتحة). علامة كاملة = 1.",
    },
    {
      type: "vowelization", marks: 1,
      q: "يا طيّب قلبه — (شبيه بالمضاف).\nاضبط (طيّب).",
      rubric: "الإجابة الصحيحة: يا طيّبًا قلبُه (الشبيه بالمضاف منصوب بالفتحة المنوّنة). علامة كاملة = 1.",
    },

    // ─── Q7: 2 numbers-to-words cheque conversions (1.5 marks each = 3 marks) ───
    {
      sectionStart: "السّؤال السّابع — حوّل الأرقام في الشّيكات التّالية إلى كلمات مراعيًا أحكام العدد وحركة المعدود من كلّ وجهٍ (ثلاث علامات)",
      type: "numbers_to_words", marks: 1,
      q: "ادفعوا لأمر السّيّد ________________________ 75 ( درهمًا ) فقط.\nاكتب العدد 75 بالكلمات مع (درهمًا) معدودًا، مراعيًا أحكام العدد.",
      rubric: "الإجابة الصحيحة: خمسةٌ وسبعونَ درهمًا (العدد المركب من عقود: الجزء الأول يخالف المعدود فـ(خمسة) لأن درهم مذكّر، والعقد (سبعون) لا يتأثر. المعدود منصوب منوّن لأنه تمييز). علامة كاملة = 1.",
    },
    {
      type: "numbers_to_words", marks: 2,
      q: "ادفعوا لأمر السّيّد ________________________ 315 ( درهمًا ) فقط.\nاكتب العدد 315 بالكلمات مع (درهمًا) معدودًا، مراعيًا أحكام العدد.",
      rubric: "الإجابة الصحيحة: خمسةَ عشرَ وثلاثمئةِ درهمًا (أو: ثلاثمئةٍ وخمسةَ عشرَ درهمًا). المئات (ثلاثمئة) لا تتأثر بالجنس. العشرة: (خمسةَ عشرَ) لأن درهم مذكّر فيخالف في الجزء الأول. المعدود تمييز منصوب منوّن. علامة كاملة = 2.",
    },
  ],

  // Legacy "عربي" key — points to elementary as default (for any old API calls).
  "عربي": [],

  "رياضيات": [
    // Source: Math-FINAL001.docx — 20 questions
    // All questions rendered as imageOnly — each image contains the full question
    // header, body, diagram (where applicable), and all answer options.
    // EMF-broken images (Q4, Q13, Q18, Q19, Q20) are sourced from the clean PDF render.
    // imageOnly:true → client shows letter buttons A/B/C/D below the image.

    { image: "/assets/math/q01.png", imageOnly: true },  // Q1  — تعريف الاستبانة
    { image: "/assets/math/q02.png", imageOnly: true },  // Q2  — إدارة الصف
    { image: "/assets/math/q03.png", imageOnly: true },  // Q3  — ناتج 10+6÷2×3
    { image: "/assets/math/q04.png", imageOnly: true },  // Q4  — قيمة (2¹⁰×5¹⁵)/10¹⁰
    { image: "/assets/math/q05.png", imageOnly: true },  // Q5  — TIMSS
    { image: "/assets/math/q06.png", imageOnly: true },  // Q6  — خط الأعداد
    { image: "/assets/math/q07.png", imageOnly: true },  // Q7  — معادلة كتب صالح
    { image: "/assets/math/q08.png", imageOnly: true },  // Q8  — f(x)=x²+3x+k
    { image: "/assets/math/q09.png", imageOnly: true },  // Q9  — عدد المثلثات النمط السادس
    { image: "/assets/math/q10.png", imageOnly: true },  // Q10 — a·b=105، أقل b−a
    { image: "/assets/math/q11.png", imageOnly: true },  // Q11 — هندسة الظل
    { image: "/assets/math/q12.png", imageOnly: true },  // Q12 — ثلاث دوائر متماسة
    { image: "/assets/math/q13.png", imageOnly: true },  // Q13 — مربع NC و MC (√14/√13)
    { image: "/assets/math/q14.png", imageOnly: true },  // Q14 — متوازي الأضلاع
    { image: "/assets/math/q15.png", imageOnly: true },  // Q15 — مربع abcd 28cm مظلل
    { image: "/assets/math/q16.png", imageOnly: true },  // Q16 — عائلة في مطعم
    { image: "/assets/math/q17.png", imageOnly: true },  // Q17 — غرفة مستطيلة 48م
    { image: "/assets/math/q18.png", imageOnly: true },  // Q18 — مثلث 6cm زاوية 60° (6√2/3√2)
    { image: "/assets/math/q19.png", imageOnly: true },  // Q19 — ضعف 2⁸ (2¹⁶/2¹⁰/2⁹/2¹²)
    { image: "/assets/math/q20.png", imageOnly: true },  // Q20 — دائرة في مربع 900cm² (15√2-15)
  ],

  "English": [
    { q: "Which of the following is NOT an effective teaching strategy for new teachers?",
      options: { A: "Lecture-style teaching", B: "Inquiry-based learning", C: "Collaborative learning", D: "Project-based learning" } },
    { q: "Which of the following is an effective way to engage students in the classroom?",
      options: { A: "Providing students with lengthy notes to copy", B: "Allowing students to work independently", C: "Asking open-ended questions", D: "Talking for the majority of class time" } },
    { q: "Which of the following is an effective way to manage student behavior in the classroom?",
      options: { A: "Using punishments to enforce rules", B: "Providing clear expectations and consequences", C: "Ignoring disruptive behavior", D: "Criticizing students in front of their peers" } },
    { q: "Which of the following is an effective way to differentiate instruction for diverse learners?",
      options: { A: "Using a one-size-fits-all approach", B: "Providing students with the same assignments and activities", C: "Offering multiple modes of instruction and assessment", D: "Ignoring students who are struggling" } },
    { q: "Which of the following is an effective way to create a positive classroom culture?",
      options: { A: "Focusing only on academic achievement and ignoring social-emotional needs", B: "Creating a sense of community and belonging among students", C: "Criticizing and punishing students who don't meet expectations", D: "Encouraging competition and individual achievement" } },
    { q: "What is an effective way to provide feedback on student writing?",
      options: { A: "Only pointing out errors and mistakes", B: "Giving a final grade without explanation or feedback", C: "Providing specific, constructive feedback on both strengths and weaknesses", D: "Ignoring student writing completely" } },
    { q: "What is an effective way to build students' vocabulary while reading?",
      options: { A: "Assigning reading passages with simple, easy-to-understand words", B: "Ignoring any new words that students may encounter", C: "Encouraging students to look up new words and use them in context", D: "Discouraging students from using any new vocabulary words they come across" } },
    { q: "Which of the following is an example of a rhetorical question?",
      options: { A: "\"Can you pass me the salt, please?\"", B: "\"I wonder what time it is.\"", C: "\"Why do we even bother trying to fix the world's problems?\"", D: "\"I'm so hungry I could eat a horse.\"" } },
    { q: "What is anaphora?",
      options: { A: "The repetition of a word or phrase at the beginning of successive clauses or sentences", B: "The use of words with opposite meanings to create a contrast", C: "A comparison between two unlike things", D: "The use of words to create a picture in the reader's mind" } },
    { q: "From William Shakespeare's Sonnet 14: \"Nor can I fortune to brief minutes tell, By oft predict that I in heaven find\". Which describes the purpose of lines 5-8?",
      options: { A: "To compare the lives of the wealthy with the poor", B: "The speaker searches for the best way to get to heaven", C: "To compare the changing nature of love to the weather", D: "The speaker cannot determine each person's fate" } },
    { q: "Which of the following is an example of alliteration?",
      options: { A: "\"She sells seashells by the seashore.\"", B: "\"The cat in the hat sat on the mat.\"", C: "\"Peter Piper picked a peck of pickled peppers.\"", D: "\"How much wood would a woodchuck chuck if a woodchuck could chuck wood?\"" } },
    { q: "Teacher: \"Who has a vehicle that can carry twenty people at once? Hint, many of you rode in one today!\" Students: \"A bus driver.\" The previous scenario is an example of a teaching strategy used in listening and speaking classes. It is known as ______.",
      options: { A: "selecting", B: "inferring", C: "elaborating", D: "anticipating" }, correct: "B" },
    { q: "A student wrote, \"I was looking to my lost wallet and the plane took away.\" This student needs help with ______.",
      options: { A: "adverbs", B: "prepositions", C: "phrasal verbs", D: "transactional verbs" }, correct: "C" },
    { q: "The team's ___ efforts resulted in a groundbreaking scientific discovery.",
      options: { A: "collaborative", B: "ambivalent", C: "facetious", D: "eclectic" } },
    { q: "Which sentence is correct?",
      options: { A: "Each of the students were given a different assignment.", B: "Each of the students was given a different assignment.", C: "Each of the students are given a different assignment.", D: "None of them." } },
    { q: "I'd done badly in my exams and really ______ faith in myself, but my sister helped me to keep going.",
      options: { A: "sustained", B: "channeled into", C: "liaising with", D: "lost" } },
    { q: "There is a lot of ______ between the sisters to achieve the best results at school.",
      options: { A: "aptitude", B: "futile", C: "rivalry", D: "discipline" } },
    { q: "She gave a ______ shrug when asked if she wanted to go to the party, clearly showing she didn't really care about the plan.",
      options: { A: "breeze through", B: "valiant", C: "run on empty", D: "half-hearted" } },
    { q: "\"I should have been practising every day, but I hadn't taken the trumpet out of the box for weeks.\" The underlined verb in the sentence is used to indicate ______.",
      options: { A: "strong obligation", B: "deduction", C: "no obligation", D: "mild obligation" }, correct: "D" },
    { q: "\"You shouldn't have told him the answers.\" The sentence that has the same meaning as the above is:",
      options: { A: "You were meant to tell him the answers.", B: "You aren't meant to tell him the answers.", C: "You weren't bound to tell him the answers.", D: "You weren't meant to tell him the answers." } },
    { q: "\"Because they know critical thinking is important, teachers try to include it in lessons.\" The sentence with the correct participle clause version is:",
      options: { A: "Known critical thinking is important; teachers try to include it in lessons.", B: "Knowing critical thinking is important, teachers tried to include it in lessons.", C: "They knowing critical thinking is important, teachers try to include it in lessons.", D: "Knowing critical thinking is important, teachers try to include it in lessons." } },
    { q: "Which sentence shows continuation up to a future point?",
      options: { A: "By 2027, I will have been living here for 10 years.", B: "I lived here last year.", C: "I live here now.", D: "I will live here tomorrow." } },
    { q: "Whenever I see illusions like this, it's completely ______.",
      options: { A: "baffling", B: "mesmerising", C: "mind-boggling", D: "riveting" } },
    { q: "The statement \"This group is clearly far more intelligent than the others\" functions to express ______.",
      options: { A: "neutrality", B: "factual reporting", C: "bias", D: "grammatical correction" } },
    { q: "Which root word is associated with the meaning \"to speak\"?",
      options: { A: "scrib", B: "chro", C: "dict", D: "port" } },
    { q: "What does the suffix \"-ate\" mean in \"regulate\" and \"activate\"?",
      options: { A: "become", B: "glorify", C: "glance", D: "increment" } },
    { q: "Rearrange the words to form a correct sentence: \"The of first-ever amazed library the referred to by fashion talented show a his editor, designer, British invention\".",
      options: {
        A: "The British fashion designer amazed his editor by his first-ever show referred to as a \"library of invention\".",
        B: "The fashion British editor amazed his designer by the first-ever show referred to as a \"library of invention\".",
        C: "The editor amazed British fashion designer his by first-ever referred show to a \"library of invention\".",
        D: "The British editor amazed his fashion designer by referred to first-ever a \"library of invention\" show.",
      } },
    { q: "Which word has the stress on the second syllable?",
      options: { A: "Photograph", B: "Photography", C: "Photographer", D: "Philosophical" } },
    { q: "If she _____ harder, she would have succeeded.",
      options: { A: "studied", B: "had studied", C: "studies", D: "would study" } },
    { q: "The school is believed _____ substantial progress over the last decade.",
      options: { A: "making", B: "to make", C: "to have made", D: "having made" } },
    { q: "_____ the curriculum thoroughly, she felt confident answering every question.",
      options: { A: "Having reviewed", B: "Reviewed", C: "Being reviewed", D: "To review" } },
    { q: "\"John was a very skilled painter and amazed everyone at the exhibition.\" Choose the correct rewording:",
      options: {
        A: "Such a skilled painter John was that he amazed everyone at the exhibition.",
        B: "Such a skilled painter was John that he amazed everyone at the exhibition.",
        C: "Such a skilled painter was John that he amaze everyone at the exhibition.",
        D: "Such skilled paintor that he amaze everyone at the exhibition.",
      } },
    { q: "What is the function of the phrase \"That's a weight off my mind\"?",
      options: { A: "Expressing sadness", B: "Expressing disbelief", C: "Expressing relief", D: "Expressing excitement" } },
    { q: "Because he was talking all the time, I didn't get a word in ______.",
      options: { A: "sideways", B: "railways", C: "anyways", D: "edgeways" } },
    { q: "\"When I told her I was going to be a few minutes late, she got really angry.\" The idiom that has a similar meaning is ______.",
      options: { A: "jump down somebody's throat", B: "put somebody on the spot", C: "fire questions at someone", D: "refuse to let something drop" } },
    { q: "\"There's no need to worry. You'll be great!\" The underlined expression can be replaced by ______.",
      options: { A: "I'm so sorry to hear that", B: "What's the worst that could happen?", C: "I am worried sick", D: "I am walking on air" } },
    { q: "In natural speech, what happens in the phrase \"next day\"?",
      options: { A: "Elision", B: "Intrusion", C: "Assimilation", D: "Linking" }, correct: "C" },
    { q: "What is the correct phonetic transcription for the word \"schedule\" (British English)?",
      options: { A: "/skɛduːl/", B: "/ʃɛdjuːl/", C: "/ʃɛdʒuːl/", D: "/skɛdʒuːl/" } },
    { q: "Complete: \"I'll have to ___\"",
      options: { A: "mend me the watch", B: "mend me my watch", C: "have my watch mended", D: "have mended my watch" } },
    { q: "Complete: \"____ two tickets for the new play at the Grand Theatre on Saturday ____ and see it together?\"",
      options: { A: "They have been given to me / May we go", B: "I have been given / Shall we go", C: "I am given / Do you like to go", D: "They are given to me / Will we go" } },
    { q: "Millions of Americans were down and out in the 30's. The closest meaning to the underlined idiom is:",
      options: { A: "illiterate", B: "imprudent", C: "impoverished", D: "querulous" } },
    { q: "The government's developing a new jobs program seems an indisputable fact. The closest meaning to the underlined word is:",
      options: { A: "indefinite", B: "indispensable", C: "indefinable", D: "unquestionable" } },
  ],
};

// Alias: bare "عربي" key falls back to elementary (safer default than empty).
ASSESSMENTS["عربي"] = ASSESSMENTS["عربي - المرحلة الدنيا"];

module.exports = ASSESSMENTS;
