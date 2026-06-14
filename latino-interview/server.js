require('dotenv').config();
const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const Anthropic  = require('@anthropic-ai/sdk');
const { DeepgramClient } = require('@deepgram/sdk');
const multer     = require('multer');
const path       = require('path');
const { Resend } = require('resend');
const QUESTIONS  = require('./questions');

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
            speed:             1.1,
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
  const { name, exp, role, questions, answers } = req.body;

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
      model:      'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw    = message.content.map(b => b.text || '').join('');
    const clean  = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    // Email the report to HR (candidate never sees it)
    let emailed = false;
    if (resend && HR_EMAIL) {
      try {
        const html = buildReportEmail({ name, exp, role, questions, answers, result });
        const recLabel = result.recommendation === 'PASS' ? 'مؤهَّل للامتحان التأهيلي' : 'غير مؤهَّل';
        await resend.emails.send({
          from:    `لاتينو <${FROM_EMAIL}>`,
          to:      HR_EMAIL.split(',').map(e => e.trim()),
          subject: `تقرير مقابلة: ${name} — ${role} — ${recLabel} (${result.overallScore}/100)`,
          html,
        });
        emailed = true;
        console.log(`Report emailed to ${HR_EMAIL} for candidate ${name}`);
      } catch (mailErr) {
        console.error('Email send failed:', mailErr);
      }
    } else {
      console.warn('Email not configured (RESEND_API_KEY / HR_EMAIL missing) — report not sent.');
    }

    // Return only a minimal confirmation; do NOT send the report to the candidate's browser
    res.json({ ok: true, emailed });

  } catch (err) {
    console.error('Evaluate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Build a clean RTL HTML email of the report for HR
function buildReportEmail({ name, exp, role, questions, answers, result }) {
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
            <div style="color:#666;font-size:14px;margin-top:4px;">${role} · ${exp}</div>
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
  console.log(`  Voice ID   : ${VOICE_ID}\n`);
});
