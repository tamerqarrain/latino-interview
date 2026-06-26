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

  // Other subjects will be filled in when the user shares those documents.
  "عربي": [],

  "رياضيات": [
    // Math questions are image-based (questions contain diagrams/formulas).
    // Each entry has `image` referencing a cropped PNG of the original question.
    // The frontend renders the image; the candidate selects A/B/C/D.
    // Q1 — Definition of questionnaires
    { image: "/assets/math/q01.png", imageOnly: true },
    // Q2 — Classroom management (students not engaged in groups)
    { image: "/assets/math/q02.png", imageOnly: true },
    // Q3 — 10 + 6 ÷ 2 × 3
    { image: "/assets/math/q03.png", imageOnly: true },
    // Q4 — (2^10 × 5^15) / 10^10
    { image: "/assets/math/q04.png", imageOnly: true },
    // Q5 — TIMSS best practice
    { image: "/assets/math/q05.png", imageOnly: true },
    // Q6 — number line, smallest squared
    { image: "/assets/math/q06.png", imageOnly: true },
    // Q7 — Saleh bought 3 books (word problem, equation form)
    { image: "/assets/math/q07.png", imageOnly: true },
    // Q8 — f(x) = x^2+3x+k, find f(1)
    { image: "/assets/math/q08.png", imageOnly: true },
    // Q9 — Number of triangles in 6th pattern
    { image: "/assets/math/q09.png", imageOnly: true },
    // Q10 — a.b=105 integers, b-a min
    { image: "/assets/math/q10.png", imageOnly: true },
    // Q11 — Shadow/wall geometry
    { image: "/assets/math/q11.png", imageOnly: true },
    // Q12 — Three tangent circles triangle area
    { image: "/assets/math/q12.png", imageOnly: true },
    // Q13 — Square divided into 3 equal areas, length MC
    { image: "/assets/math/q13.png", imageOnly: true },
    // Q14 — Parallelogram concept
    { image: "/assets/math/q14.png", imageOnly: true },
    // Q15 — Square abcd, length 28cm, area calc
    { image: "/assets/math/q15.png", imageOnly: true },
    // Q16 — Family of 7 at restaurant, meal pricing
    { image: "/assets/math/q16.png", imageOnly: true },
    // Q17 — Rectangle perimeter 48m → square area
    { image: "/assets/math/q17.png", imageOnly: true },
    // Q18 — Triangle two sides 6cm, 60° angle, third side
    { image: "/assets/math/q18.png", imageOnly: true },
    // Q19 — Double of 2^8
    { image: "/assets/math/q19.png", imageOnly: true },
    // Q20 — Circle inscribed in 900cm² square, distance A,B
    { image: "/assets/math/q20.png", imageOnly: true },
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
      options: { A: "selecting", B: "inferring", C: "elaborating", D: "anticipating" } },
    { q: "A student wrote, \"I was looking to my lost wallet and the plane took away.\" This student needs help with ______.",
      options: { A: "adverbs", B: "prepositions", C: "phrasal verbs", D: "transactional verbs" } },
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
      options: { A: "strong obligation", B: "deduction", C: "no obligation", D: "mild obligation" } },
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
      options: { A: "Elision", B: "Intrusion", C: "Assimilation", D: "Linking" } },
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

module.exports = ASSESSMENTS;
