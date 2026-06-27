require('dotenv').config();
const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const Anthropic  = require('@anthropic-ai/sdk');
const { DeepgramClient } = require('@deepgram/sdk');
const multer     = require('multer');
const path       = require('path');
const fs         = require('fs');
const { Resend } = require('resend');
const { google } = require('googleapis');
const QUESTIONS  = require('./questions');
const ASSESSMENTS = require('./assessments');

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const upload    = multer({ storage: multer.memoryStorage() });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEEPGRAM_API_KEY   = process.env.DEEPGRAM_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID           = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

// Email (Resend) — reports are emailed to HR, hidden from candidates
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const HR_EMAIL       = process.env.HR_EMAIL;                       // where reports are sent
const FROM_EMAIL     = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const resend         = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Google Sheets — appends every report as a row for searchable history
const GOOGLE_SHEET_ID            = process.env.GOOGLE_SHEET_ID;
const GOOGLE_SERVICE_EMAIL       = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_SERVICE_KEY         = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n');
const GOOGLE_SERVICE_JSON        = process.env.GOOGLE_SERVICE_ACCOUNT_JSON; // alternative: paste entire JSON
const SHEETS_TAB                 = process.env.GOOGLE_SHEET_TAB || 'Sheet1';

let sheetsClient = null;
let sheetsAuth   = null;

async function initSheets() {
  if (!GOOGLE_SHEET_ID) return;

  try {
    let credentials;

    if (GOOGLE_SERVICE_JSON) {
      // Preferred: paste the entire service-account JSON as one env var
      try {
        credentials = JSON.parse(GOOGLE_SERVICE_JSON);
        console.log('Sheets: using GOOGLE_SERVICE_ACCOUNT_JSON');
      } catch (e) {
        console.error('Sheets: GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON:', e.message);
        return;
      }
    } else if (GOOGLE_SERVICE_EMAIL && GOOGLE_SERVICE_KEY) {
      credentials = {
        client_email: GOOGLE_SERVICE_EMAIL,
        private_key:  GOOGLE_SERVICE_KEY,
      };
      console.log('Sheets: using GOOGLE_SERVICE_ACCOUNT_EMAIL + KEY');
    } else {
      console.warn('Sheets: no credentials configured');
      return;
    }

    sheetsAuth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // CRITICAL: explicitly authorize now so we see auth errors at startup, not later.
    const authClient = await sheetsAuth.getClient();
    const tokenInfo  = await authClient.getAccessToken();
    if (!tokenInfo || !tokenInfo.token) {
      console.error('Sheets: getAccessToken returned empty — auth failed silently');
      return;
    }

    sheetsClient = google.sheets({ version: 'v4', auth: sheetsAuth });
    console.log(`Sheets: ✓ authenticated as ${credentials.client_email} → sheet ${GOOGLE_SHEET_ID}`);
  } catch (e) {
    console.error('Sheets init failed:', e.message);
    if (e.response?.data) console.error('Sheets init detail:', JSON.stringify(e.response.data));
  }
}
initSheets();

// ─────────────────────────────────────────────────────
//  ASSESSMENT GRADING (via Claude)
// ─────────────────────────────────────────────────────
// Escape HTML for safe inclusion in email templates
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Sends the full assessment + candidate selections to Claude for grading.
// Returns: { score, total, percentage, perQuestion: [{ correct, selected, isCorrect, explanation }] }
//
// Supports multiple question shapes:
//   - Text MCQ:    { q, options: {A,B,C,D}, type: 'mcq4' }       (default)
//   - 3-option MCQ:{ q, options: {A,B,C},   type: 'mcq3' }
//   - True/False:  { q, type: 'truefalse' }                       (candidate selects 'T' or 'F')
//   - Open-ended:  { q, type: 'openended', marks, rubric }        (candidate types free text)
//   - Vowelization:{ q, type: 'vowelization', marks, rubric }     (candidate types diacritic-marked text)
//   - Number→words:{ q, type: 'numbers_to_words', marks, rubric }
//   - Image:       { image: '/assets/.../qNN.png', imageOnly: true }
// Each question may have `marks` (default 1) and `passage` (long reading text).
// For image questions, the PNG is loaded and sent to Claude's vision API.
// Score is computed as sum of earned marks across all questions.
async function gradeAssessment({ subject, candidateAnswers }) {
  const qs = ASSESSMENTS[subject];
  if (!qs || qs.length === 0) throw new Error(`No assessment questions found for subject: ${subject}`);

  const subjectName = subject.startsWith('English') ? 'اللغة الإنجليزية'
                    : subject.startsWith('عربي')    ? 'اللغة العربية'
                    : subject;

  // Build a multimodal content array.
  const contentBlocks = [];
  contentBlocks.push({
    type: 'text',
    text: `أنت مُصحِّح خبير في مادة ${subjectName} ضمن مقابلة توظيف معلمين في الأردن. مهمتك تصحيح إجابات المرشح على كل سؤال أدناه وتقييمها وفق نوع السؤال.

أنواع الأسئلة:
- mcq4/mcq3: اختيار من متعدّد، حدد الحرف الصحيح (A/B/C/D أو A/B/C) وقارنه باختيار المرشح.
- truefalse: صح أو خطأ، حدد الإجابة الصحيحة كـ T (صحيح) أو F (خطأ).
- openended/vowelization/numbers_to_words: إجابة كتابيّة حرّة. قيّم إجابة المرشح وفق المعيار المرفق (rubric). امنح علامة جزئيّة 0 إلى marks حسب جودة الإجابة.

للأسئلة العلمية والنحوية: اعتمد المعرفة الأكاديمية الصحيحة.
للأسئلة التربوية والموقفية: اعتمد أفضل الممارسات المعترف بها.
بعض الأسئلة قد تكون صورًا — اقرأ السؤال والخيارات من الصورة.

سأرسل ${qs.length} سؤالاً. لكل سؤال، قيّم إجابة المرشح وأعد النتيجة.

`,
  });

  for (let i = 0; i < qs.length; i++) {
    const item = qs[i];
    const sel  = candidateAnswers[i] || '(لم تتم الإجابة)';
    const marks = item.marks || 1;
    const type = item.type || (item.image ? 'mcq4' : 'mcq4');

    if (item.image) {
      const imgPath = path.join(__dirname, 'public', item.image.replace(/^\//, ''));
      try {
        const buf = fs.readFileSync(imgPath);
        const b64 = buf.toString('base64');
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: 'image/png', data: b64 },
        });
        contentBlocks.push({
          type: 'text',
          text: `^ السؤال ${i + 1} (نوع: mcq4، علامات: ${marks}) — اختيار المرشح: ${sel}`,
        });
      } catch (e) {
        console.error(`Failed to load image for Q${i + 1}:`, imgPath, e.message);
        contentBlocks.push({
          type: 'text',
          text: `السؤال ${i + 1}: [تعذر تحميل صورة السؤال] — اختيار المرشح: ${sel}`,
        });
      }
      continue;
    }

    // Text-based question — format depends on type
    let qText = `السؤال ${i + 1} (نوع: ${type}، علامات: ${marks}):\n`;
    if (item.passage) qText += `النصّ المرجعيّ:\n${item.passage}\n\n`;
    qText += item.q + '\n';

    if (type === 'mcq4') {
      qText += `A) ${item.options.A}\nB) ${item.options.B}\nC) ${item.options.C}\nD) ${item.options.D}\n`;
    } else if (type === 'mcq3') {
      qText += `A) ${item.options.A}\nB) ${item.options.B}\nC) ${item.options.C}\n`;
    } else if (type === 'truefalse') {
      qText += `T) صحيح\nF) خطأ\n`;
    } else {
      // openended / vowelization / numbers_to_words
      if (item.rubric) qText += `معيار التصحيح: ${item.rubric}\n`;
    }

    qText += `إجابة المرشح: ${sel}`;
    contentBlocks.push({ type: 'text', text: qText });
  }

  contentBlocks.push({
    type: 'text',
    text: `\nأعد JSON صحيحاً فقط — بدون markdown أو نصوص خارجية:
{
  "perQuestion": [
    {
      "correct": "<الإجابة الصحيحة: حرف للMCQ، T أو F، أو نص نموذجي للأسئلة الكتابية>",
      "earnedPoints": <رقم 0 إلى marks للسؤال>,
      "maxPoints": <marks للسؤال>,
      "isCorrect": <true إذا earnedPoints == maxPoints، false غير ذلك>,
      "explanation": "<شرح موجز بجملة واحدة>"
    }
  ]
}

تأكد أن مصفوفة perQuestion تحتوي على ${qs.length} عناصر بالترتيب نفسه. للأسئلة الكتابية امنح علامة جزئيّة بناءً على جودة الإجابة (مثلاً 1 من 4 إذا كانت ناقصة، 4 من 4 إذا كانت كاملة وصحيحة).`,
  });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 12000,
    messages: [{ role: 'user', content: contentBlocks }],
  });

  const raw   = message.content.map(b => b.text || '').join('');
  const clean = raw.replace(/```json|```/g, '').trim();
  let jsonText = clean;
  const firstBrace = clean.indexOf('{');
  const lastBrace  = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = clean.slice(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(jsonText);

  // Fold the candidate's selection into each perQuestion entry and clamp scores
  parsed.perQuestion = (parsed.perQuestion || []).map((pq, i) => {
    const q = qs[i] || {};
    const maxPoints = q.marks || 1;
    const earned = Math.max(0, Math.min(maxPoints, Number(pq.earnedPoints) || 0));
    return {
      correct: pq.correct || '?',
      earnedPoints: earned,
      maxPoints,
      isCorrect: earned >= maxPoints,
      explanation: pq.explanation || '',
      selected: candidateAnswers[i] || '',
    };
  });

  // Compute totals from per-question marks
  const totalEarned   = parsed.perQuestion.reduce((s, pq) => s + (pq.earnedPoints || 0), 0);
  const totalPossible = parsed.perQuestion.reduce((s, pq) => s + (pq.maxPoints   || 0), 0);
  parsed.score      = totalEarned;
  parsed.total      = totalPossible;
  parsed.percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;

  return parsed;
}

// Append one row per interview to the Google Sheet (creates header row first time)
async function appendReportToSheet({ name, email, phone, exp, role, location, expectedSalary, subject, assessmentResult, questions, answers, result }) {
  if (!sheetsClient) return;
  try {
    // Ensure header row exists
    const HEADER = [
      'التاريخ والوقت', 'اسم المرشح', 'البريد الإلكتروني', 'رقم الهاتف',
      'الوظيفة', 'سنوات الخبرة', 'مكان السكن', 'الراتب المتوقع (دينار)',
      'مادة التقييم', 'نتيجة التقييم', 'النسبة المئوية للتقييم',
      'النتيجة', 'التقدير', 'القرار', 'سبب القرار', 'الملخص التنفيذي',
      'نقاط القوة', 'مجالات التطوير',
      'س1 سؤال', 'س1 إجابة', 'س1 درجة', 'س1 تقييم',
      'س2 سؤال', 'س2 إجابة', 'س2 درجة', 'س2 تقييم',
      'س3 سؤال', 'س3 إجابة', 'س3 درجة', 'س3 تقييم',
      'س4 سؤال', 'س4 إجابة', 'س4 درجة', 'س4 تقييم',
      'س5 سؤال', 'س5 إجابة', 'س5 درجة', 'س5 تقييم',
      'س6 سؤال', 'س6 إجابة', 'س6 درجة', 'س6 تقييم',
      'س7 سؤال', 'س7 إجابة', 'س7 درجة', 'س7 تقييم',
      'س8 سؤال', 'س8 إجابة', 'س8 درجة', 'س8 تقييم',
    ];

    // Check if header exists
    const existing = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${SHEETS_TAB}!A1:A1`,
    });
    if (!existing.data.values || existing.data.values.length === 0) {
      // Write header row first
      await sheetsClient.spreadsheets.values.update({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `${SHEETS_TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [HEADER] },
      });
    }

    // Build the row
    const date = new Date().toLocaleString('ar-EG', { timeZone: 'Asia/Amman' });
    const row = [
      date, name, email || '', phone || '', role, exp, location || '', expectedSalary || '',
      subject || '',
      assessmentResult ? `${assessmentResult.score}/${assessmentResult.total}` : '',
      assessmentResult ? `${assessmentResult.percentage}%` : '',
      result.overallScore, result.grade,
      result.recommendation === 'PASS' ? 'مؤهَّل للامتحان التأهيلي' : 'غير مؤهَّل',
      result.recommendationReason || '',
      result.summary || '',
      (result.strengths || []).join(' • '),
      (result.areasForGrowth || []).join(' • '),
    ];
    // Append per-question columns (up to 8)
    for (let i = 0; i < 8; i++) {
      const q = questions[i];
      const ev = (result.questionEvals || [])[i] || {};
      row.push(q ? (q.display || q.q) : '');
      row.push(answers[i] || '');
      row.push(ev.score || '');
      row.push(ev.evaluation || '');
    }

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: `${SHEETS_TAB}!A1`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });
    console.log(`Sheet: appended row for ${name}`);
  } catch (err) {
    console.error('Sheet append failed:', err.message);
    if (err.response?.data) {
      console.error('Sheet error details:', JSON.stringify(err.response.data, null, 2));
    }
    if (err.errors) {
      console.error('Sheet error array:', JSON.stringify(err.errors, null, 2));
    }
  }
}

// ─────────────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    elevenlabs: !!ELEVENLABS_API_KEY,
    deepgram:   !!DEEPGRAM_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
    email:      !!(RESEND_API_KEY && HR_EMAIL),
    sheets:     !!sheetsClient,
    voice:      VOICE_ID,
  });
});

// ─────────────────────────────────────────────────────
//  QUESTIONS
// ─────────────────────────────────────────────────────
app.get('/api/questions/:role', (req, res) => {
  const role = decodeURIComponent(req.params.role);
  const qs   = QUESTIONS[role];
  if (!qs) return res.status(404).json({ error: 'Unknown role' });
  res.json(qs);
});

// ─────────────────────────────────────────────────────
//  ASSESSMENT  (Subject-specific MCQ for teacher roles)
// ─────────────────────────────────────────────────────
app.get('/api/assessment/:subject', (req, res) => {
  const subject = decodeURIComponent(req.params.subject);
  const qs      = ASSESSMENTS[subject];
  if (!qs) return res.status(404).json({ error: 'Unknown subject' });
  // Return question shape. Strip rubric/answer fields (clients never see grading info).
  const cleaned = qs.map(({ q, options, image, imageOnly, type, passage, sectionStart, marks }) => {
    if (image) return { image, imageOnly: !!imageOnly, type: 'mcq4' };
    return {
      q,
      options: options || null,
      type: type || 'mcq4',
      passage: passage || null,
      sectionStart: sectionStart || null,
      marks: marks || 1,
    };
  });
  res.json(cleaned);
});

// ─────────────────────────────────────────────────────
//  TEXT → SPEECH  (ElevenLabs)
// ─────────────────────────────────────────────────────
app.post('/api/speak', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text' });

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key':   ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept':       'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability:         0.48,
            similarity_boost:  0.82,
            style:             0.30,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('ElevenLabs error:', detail);
      return res.status(502).json({ error: 'ElevenLabs TTS failed', detail });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    const reader = response.body.getReader();
    const pump = async () => {
      const { done, value } = await reader.read();
      if (done) { res.end(); return; }
      res.write(Buffer.from(value));
      return pump();
    };
    await pump();

  } catch (err) {
    console.error('Speak error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────
//  SPEECH → TEXT  (Deepgram REST — no SDK auth issues)
// ─────────────────────────────────────────────────────
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio', stage: 'upload' });

  // Deepgram accepts the full codec string; keep it as-is, fallback to webm.
  const contentType = req.body.mime || req.file.mimetype || 'audio/webm';

  if (!DEEPGRAM_API_KEY) {
    return res.status(500).json({ error: 'مفتاح Deepgram غير مهيأ', stage: 'config' });
  }

  try {
    const dgUrl = 'https://api.deepgram.com/v1/listen'
      + '?model=nova-3'
      + '&smart_format=true'
      + '&punctuate=true'
      + '&language=ar'
      + '&detect_language=false';

    const response = await fetch(dgUrl, {
      method:  'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type':  contentType,
      },
      body: req.file.buffer,
    });

    const bodyText = await response.text();

    if (!response.ok) {
      console.error('Deepgram HTTP', response.status, bodyText);
      return res.status(502).json({
        error: 'فشل تحويل الصوت إلى نص',
        stage: 'deepgram',
        httpStatus: response.status,
        detail: bodyText.slice(0, 300),
        sentContentType: contentType,
        audioBytes: req.file.buffer.length,
      });
    }

    let data;
    try { data = JSON.parse(bodyText); }
    catch { return res.status(502).json({ error: 'رد غير صالح من Deepgram', detail: bodyText.slice(0,200) }); }

    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log(`Transcribed (${contentType}, ${req.file.buffer.length}b): "${transcript.slice(0,80)}"`);
    res.json({ transcript, audioBytes: req.file.buffer.length });

  } catch (err) {
    console.error('Transcribe exception:', err);
    res.status(500).json({ error: err.message, stage: 'exception' });
  }
});

// ─────────────────────────────────────────────────────
//  EVALUATE  (Claude — Arabic output)
// ─────────────────────────────────────────────────────
app.post('/api/evaluate', async (req, res) => {
  const {
    name, email, phone, exp, role, location, expectedSalary,
    questions, answers,
    subject, assessmentAnswers, // NEW: { subject: 'علوم', assessmentAnswers: ['A','D',...] }
  } = req.body;

  // Respond to the candidate INSTANTLY so the thank-you screen doesn't hang.
  // The evaluation + email then run in the background.
  res.json({ ok: true, queued: true });

  // ── BACKGROUND PROCESSING ───────────────────────
  (async () => {
    // 1) Grade the subject assessment in parallel (if provided)
    let assessmentResult = null;
    if (subject && Array.isArray(assessmentAnswers) && assessmentAnswers.length > 0) {
      try {
        assessmentResult = await gradeAssessment({ subject, candidateAnswers: assessmentAnswers });
        console.log(`Assessment graded for ${name} (${subject}): ${assessmentResult.score}/${assessmentResult.total}`);
      } catch (err) {
        console.error('Assessment grading failed:', err.message);
        assessmentResult = { error: err.message, score: 0, total: 0, percentage: 0, perQuestion: [] };
      }
    }

    const qaBlock = questions.map((q, i) =>
      `س${i+1} [${q.cat}]: ${q.q}\nالإجابة: ${answers[i] || '(لم يتم الإجابة)'}`
    ).join('\n\n');

    const prompt = `أنت "لاتينو"، أخصائي موارد بشرية أول في شبكة مدارس ورياض أطفال. أجريت للتو مقابلة فرز مبدئية (Initial Screening) صوتية. الهدف من هذه المقابلة هو تحديد ما إذا كان المرشح يستحق الانتقال إلى الامتحان التأهيلي (Entrance Exam) أم لا. الإجابات أدناه منقولة نصياً عبر تقنية تحويل الكلام إلى نص — قد تحتوي على أخطاء طفيفة في النسخ، لذا قيّم المحتوى والمقصد بشكل موضوعي.

المرشح: ${name}
الوظيفة المتقدم إليها: ${role}
سنوات الخبرة: ${exp}

نص المقابلة المبدئية الكامل:
${qaBlock}

قيّم هذا المرشح بدقة كمقابلة فرز أولية. ضع في اعتبارك: وضوح الدافع، المؤهلات والخبرة، الفهم التربوي الأساسي، مهارات التواصل، والجاهزية للالتزام. أعد JSON صحيحاً فقط — بدون markdown أو مقدمات:
{
  "overallScore": <عدد صحيح 0-100>,
  "grade": "<A|B|C|D>",
  "summary": "<ملخص تنفيذي احترافي من 2-3 جمل>",
  "questionEvals": [
    { "score": <عدد صحيح 1-5>, "evaluation": "<تقييم من جملة أو جملتين لهذه الإجابة تحديداً>" }
  ],
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>", "<نقطة قوة 3>"],
  "areasForGrowth": ["<مجال تطوير 1>", "<مجال تطوير 2>"],
  "recommendation": "<PASS|REJECT>",
  "recommendationReason": "<2-3 جمل تشرح القرار: هل ينتقل المرشح إلى الامتحان التأهيلي أم لا، ولماذا>"
}

ملاحظة: استخدم "PASS" إذا كان المرشح مؤهلاً للانتقال إلى الامتحان التأهيلي، و"REJECT" إذا لم يكن مناسباً في هذه المرحلة.`;

    try {
      const message = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 4000,
        messages:   [{ role: 'user', content: prompt }],
      });

      const raw    = message.content.map(b => b.text || '').join('');
      const clean  = raw.replace(/```json|```/g, '').trim();

      // Try to extract just the JSON object — Claude may add preamble or trailing text.
      // Find the outermost { ... } block.
      let jsonText = clean;
      const firstBrace = clean.indexOf('{');
      const lastBrace  = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = clean.slice(firstBrace, lastBrace + 1);
      }

      let result;
      try {
        result = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error('JSON parse failed. Stop reason:', message.stop_reason);
        console.error('Raw response length:', raw.length);
        console.error('First 200 chars:', raw.slice(0, 200));
        console.error('Last 200 chars :', raw.slice(-200));
        return; // exit background processing — can't email/sheet without parsed result
      }

      if (resend && HR_EMAIL) {
        try {
          const html = buildReportEmail({ name, email, phone, exp, role, location, expectedSalary, subject, assessmentResult, questions, answers, result });
          const recLabel = result.recommendation === 'PASS' ? 'مؤهَّل للامتحان التأهيلي' : 'غير مؤهَّل';
          await resend.emails.send({
            from:    `لاتينو <${FROM_EMAIL}>`,
            to:      HR_EMAIL.split(',').map(e => e.trim()),
            subject: `تقرير مقابلة: ${name} — ${role} — ${recLabel} (${result.overallScore}/100)`,
            html,
          });
          console.log(`Report emailed to ${HR_EMAIL} for candidate ${name}`);
        } catch (mailErr) {
          console.error('Email send failed:', mailErr);
        }
      } else {
        console.warn('Email not configured (RESEND_API_KEY / HR_EMAIL missing) — report not sent.');
      }

      // Also log to Google Sheet (parallel — runs even if email fails)
      await appendReportToSheet({ name, email, phone, exp, role, location, expectedSalary, subject, assessmentResult, questions, answers, result });
    } catch (err) {
      console.error('Evaluate (background) error:', err);
    }
  })();
});

// Build a clean RTL HTML email of the report for HR
function buildReportEmail({ name, email, phone, exp, role, location, expectedSalary, subject, assessmentResult, questions, answers, result }) {
  const { overallScore, grade, summary, questionEvals, strengths, areasForGrowth, recommendation, recommendationReason } = result;
  const pass     = recommendation === 'PASS';
  const recColor = pass ? '#27ae60' : '#e74c3c';
  const recLabel = pass ? '✓ مؤهَّل للانتقال إلى الامتحان التأهيلي' : '✕ غير مؤهَّل في هذه المرحلة';
  const date = new Date().toLocaleDateString('ar-EG', { year:'numeric', month:'long', day:'numeric' });

  const qaRows = questions.map((q, i) => {
    const ev = (questionEvals||[])[i] || {};
    const stars = '★'.repeat(ev.score||0) + '☆'.repeat(5-(ev.score||0));
    return `<tr>
      <td style="padding:12px;border-bottom:1px solid #eee;vertical-align:top;">
        <div style="font-weight:bold;color:#1a2840;margin-bottom:6px;">س${i+1}: ${q.display || q.q}</div>
        <div style="background:#f7f7f7;padding:10px;border-radius:6px;color:#444;font-size:14px;margin-bottom:6px;">${answers[i] || '(لا توجد إجابة)'}</div>
        <div style="color:#c9a84c;font-size:14px;">${stars} <span style="color:#666;">${ev.evaluation||''}</span></div>
      </td>
    </tr>`;
  }).join('');

  const strList  = (strengths||[]).map(s => `<li>${s}</li>`).join('');
  const growList = (areasForGrowth||[]).map(g => `<li>${g}</li>`).join('');

  // ── Subject assessment block (only present for teacher roles with a subject) ──
  const subjectName = subject && subject.startsWith('English') ? 'اللغة الإنجليزية'
                    : subject && subject.startsWith('عربي')    ? `اللغة العربية${subject.includes('الدنيا') ? ' — المرحلة الدنيا' : subject.includes('العليا') ? ' — المرحلة العليا' : ''}`
                    : subject;
  let assessmentBlock = '';
  if (subject && assessmentResult && assessmentResult.total > 0) {
    const pct      = assessmentResult.percentage;
    const pctColor = pct >= 70 ? '#27ae60' : pct >= 50 ? '#e8a020' : '#e74c3c';
    const perQ     = (assessmentResult.perQuestion || []);
    const allAssessmentQs = ASSESSMENTS[subject] || [];

    // Helper: format the candidate's answer for display
    const fmtSelected = (sel, type) => {
      if (!sel) return '—';
      if (type === 'truefalse') return sel === 'T' ? 'صحيح' : sel === 'F' ? 'خطأ' : sel;
      return sel;
    };
    const fmtCorrect = (correct, type) => {
      if (!correct || correct === '?') return correct || '?';
      if (type === 'truefalse') return correct === 'T' ? 'صحيح' : correct === 'F' ? 'خطأ' : correct;
      return correct;
    };

    const qRows = allAssessmentQs.map((item, i) => {
      const pq      = perQ[i] || {};
      const type    = item.type || 'mcq4';
      const earned  = (pq.earnedPoints !== undefined) ? pq.earnedPoints : (pq.isCorrect ? (item.marks || 1) : 0);
      const max     = pq.maxPoints || item.marks || 1;
      const ok      = earned >= max;
      const partial = !ok && earned > 0;
      const mark    = ok ? '✓' : (partial ? '◐' : '✗');
      const markBg  = ok ? '#eafaf0' : (partial ? '#fff8e8' : '#fdeeec');
      const markFg  = ok ? '#27ae60' : (partial ? '#e8a020' : '#e74c3c');
      const qLabel  = item.q ? item.q : '(سؤال على شكل صورة)';
      const isText  = type === 'openended' || type === 'vowelization' || type === 'numbers_to_words';
      const sel     = fmtSelected(pq.selected, type);
      const correct = fmtCorrect(pq.correct, type);

      // Section header row (rendered above question if sectionStart present)
      let sectionRow = '';
      if (item.sectionStart) {
        sectionRow = `<tr><td style="padding:14px 10px 8px;border-bottom:1px solid #eee;">
          <div style="font-weight:bold;color:#c9a84c;font-size:13px;border-bottom:1px solid #f0e6c8;padding-bottom:4px;">${item.sectionStart}</div>
        </td></tr>`;
      }

      // Long-text answers shown in a quoted block; short answers inline
      const selBlock = isText
        ? `<div style="background:#f7f7f7;border-right:3px solid ${markFg};padding:8px 10px;margin-top:6px;font-size:12px;color:#444;white-space:pre-wrap;">${escapeHtml(sel)}</div>`
        : ` <strong style="color:${markFg};">${sel}</strong>`;

      return sectionRow + `<tr>
        <td style="padding:10px;border-bottom:1px solid #eee;vertical-align:top;">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <span style="background:${markBg};color:${markFg};border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-weight:bold;font-size:14px;flex-shrink:0;">${mark}</span>
            <div style="flex:1;">
              <div style="font-weight:bold;color:#1a2840;font-size:13px;margin-bottom:4px;">
                س${i+1}: ${escapeHtml(qLabel)}
                <span style="color:#999;font-weight:normal;font-size:11px;">(${earned}/${max} علامة)</span>
              </div>
              <div style="color:#666;font-size:12px;">
                إجابة المرشح:${isText ? '' : selBlock}
                ${ok || isText ? '' : ` · الإجابة الصحيحة: <strong style="color:#27ae60;">${escapeHtml(correct)}</strong>`}
              </div>
              ${isText ? selBlock : ''}
              ${isText && !ok ? `<div style="color:#666;font-size:12px;margin-top:6px;">الإجابة المرجعيّة: <span style="color:#27ae60;">${escapeHtml(correct)}</span></div>` : ''}
              ${pq.explanation ? `<div style="color:#888;font-size:12px;margin-top:4px;font-style:italic;">${escapeHtml(pq.explanation)}</div>` : ''}
            </div>
          </div>
        </td>
      </tr>`;
    }).join('');

    assessmentBlock = `
      <div style="background:#f9f9f9;border-radius:8px;padding:18px;margin-bottom:24px;border:1px solid #eee;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-weight:bold;color:#1a2840;font-size:16px;">📝 تقييم مادة ${subjectName}</div>
          <div style="background:${pctColor};color:#fff;padding:6px 14px;border-radius:20px;font-weight:bold;font-size:14px;">${assessmentResult.score}/${assessmentResult.total} · ${pct}%</div>
        </div>
        <div style="color:#666;font-size:13px;line-height:1.6;">
          أجاب المرشح بشكل صحيح على ${assessmentResult.score} من أصل ${assessmentResult.total} سؤالاً في تقييم مادة ${subjectName}.
        </div>
      </div>

      <div style="font-weight:bold;color:#c9a84c;font-size:13px;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:12px;">تفاصيل تقييم مادة ${subjectName}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">${qRows}</table>
    `;
  }

  return `<!DOCTYPE html><html dir="rtl" lang="ar"><body style="font-family:Tahoma,Arial,sans-serif;background:#f0f0f0;margin:0;padding:20px;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
    <div style="background:#0d1520;color:#c9a84c;padding:24px 28px;">
      <div style="font-size:22px;font-weight:bold;">تقرير المقابلة المبدئية</div>
      <div style="color:#9aa;font-size:13px;margin-top:4px;">نظام لاتينو · ${date}</div>
    </div>
    <div style="padding:28px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="vertical-align:top;">
            <div style="font-size:24px;font-weight:bold;color:#1a2840;">${name}</div>
            <div style="color:#666;font-size:14px;margin-top:4px;">${role}${subject ? ` · مادة ${subjectName}` : ''} · ${exp}</div>
            ${email ? `<div style="color:#666;font-size:13px;margin-top:6px;">📧 <a href="mailto:${email}" style="color:#1a2840;text-decoration:none;direction:ltr;display:inline-block;">${email}</a></div>` : ''}
            ${phone ? `<div style="color:#666;font-size:13px;margin-top:4px;">📱 <a href="tel:${phone}" style="color:#1a2840;text-decoration:none;direction:ltr;display:inline-block;">${phone}</a></div>` : ''}
            ${location ? `<div style="color:#666;font-size:13px;margin-top:4px;">📍 ${location}</div>` : ''}
            ${expectedSalary ? `<div style="color:#666;font-size:13px;margin-top:4px;">💰 الراتب المتوقع: ${expectedSalary}</div>` : ''}
          </td>
          <td style="text-align:left;vertical-align:top;">
            <div style="display:inline-block;border:3px solid ${recColor};border-radius:50%;width:70px;height:70px;text-align:center;line-height:70px;font-size:24px;font-weight:bold;color:${recColor};">${grade}</div>
            <div style="color:#666;font-size:13px;margin-top:4px;">${overallScore}/100</div>
          </td>
        </tr>
      </table>

      <div style="background:${pass?'#eafaf0':'#fdeeec'};border:1px solid ${recColor};border-radius:8px;padding:16px;text-align:center;margin-bottom:24px;">
        <div style="font-size:18px;font-weight:bold;color:${recColor};">${recLabel}</div>
        <div style="color:#555;font-size:14px;margin-top:8px;line-height:1.6;">${recommendationReason||''}</div>
      </div>

      ${assessmentBlock}

      <div style="font-weight:bold;color:#c9a84c;font-size:13px;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:12px;">الملخص التنفيذي</div>
      <div style="color:#333;line-height:1.8;font-size:15px;margin-bottom:24px;">${summary||''}</div>

      <table style="width:100%;margin-bottom:24px;"><tr>
        <td style="width:50%;vertical-align:top;padding-left:8px;">
          <div style="font-weight:bold;color:#27ae60;font-size:13px;margin-bottom:8px;">نقاط القوة</div>
          <ul style="color:#444;font-size:14px;line-height:1.8;padding-right:18px;margin:0;">${strList}</ul>
        </td>
        <td style="width:50%;vertical-align:top;padding-right:8px;">
          <div style="font-weight:bold;color:#e8a020;font-size:13px;margin-bottom:8px;">مجالات التطوير</div>
          <ul style="color:#444;font-size:14px;line-height:1.8;padding-right:18px;margin:0;">${growList}</ul>
        </td>
      </tr></table>

      <div style="font-weight:bold;color:#c9a84c;font-size:13px;border-bottom:1px solid #eee;padding-bottom:8px;margin-bottom:12px;">تقييم الأسئلة والإجابات</div>
      <table style="width:100%;border-collapse:collapse;">${qaRows}</table>
    </div>
  </div>
</body></html>`;
}

// ─────────────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║   LATINO Interview Server             ║`);
  console.log(`║   http://localhost:${PORT}               ║`);
  console.log(`╚══════════════════════════════════════╝\n`);
  console.log(`  ElevenLabs : ${ELEVENLABS_API_KEY            ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  Deepgram   : ${DEEPGRAM_API_KEY              ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  Anthropic  : ${process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  Anthropic  : ${process.env.ANTHROPIC_API_KEY ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  Email      : ${(RESEND_API_KEY && HR_EMAIL) ? '✓ → ' + HR_EMAIL : '✗ not configured'}`);
  console.log(`  Sheets     : ${sheetsClient ? '✓ → ' + GOOGLE_SHEET_ID : '✗ not configured'}`);
  console.log(`  Voice ID   : ${VOICE_ID}\n`);
});
