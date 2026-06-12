require('dotenv').config();
const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const Anthropic  = require('@anthropic-ai/sdk');
const { DeepgramClient } = require('@deepgram/sdk');
const multer     = require('multer');
const path       = require('path');
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

// ─────────────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    elevenlabs: !!ELEVENLABS_API_KEY,
    deepgram:   !!DEEPGRAM_API_KEY,
    anthropic:  !!process.env.ANTHROPIC_API_KEY,
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
  if (!req.file) return res.status(400).json({ error: 'No audio' });

  const contentType = req.body.mime || req.file.mimetype || 'audio/webm';

  try {
    const response = await fetch(
      'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=ar',
      {
        method:  'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type':  contentType,
        },
        body: req.file.buffer,
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      console.error('Deepgram error:', detail);
      return res.status(502).json({ error: 'Deepgram transcription failed', detail });
    }

    const data = await response.json();
    const transcript =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    console.log(`Transcribed (${contentType}, ${req.file.buffer.length}b): "${transcript.slice(0,60)}"`);
    res.json({ transcript });

  } catch (err) {
    console.error('Transcribe error:', err);
    res.status(500).json({ error: err.message });
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

  const prompt = `أنت "لاتينو"، أخصائي موارد بشرية أول في شبكة مدارس ورياض أطفال. أجريت للتو مقابلة عمل صوتية. الإجابات أدناه منقولة نصياً عبر تقنية تحويل الكلام إلى نص — قد تحتوي على أخطاء طفيفة في النسخ، لذا قيّم المحتوى والمقصد بشكل موضوعي.

المرشح: ${name}
الوظيفة المتقدم إليها: ${role}
سنوات الخبرة: ${exp}

نص المقابلة الكامل:
${qaBlock}

قيّم هذا المرشح بدقة واحترافية. أعد JSON صحيحاً فقط — بدون markdown أو مقدمات:
{
  "overallScore": <عدد صحيح 0-100>,
  "grade": "<A|B|C|D>",
  "summary": "<ملخص تنفيذي احترافي من 2-3 جمل>",
  "questionEvals": [
    { "score": <عدد صحيح 1-5>, "evaluation": "<تقييم من جملة أو جملتين لهذه الإجابة تحديداً>" }
  ],
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>", "<نقطة قوة 3>"],
  "areasForGrowth": ["<مجال تطوير 1>", "<مجال تطوير 2>"],
  "recommendation": "<HIRE|CONSIDER|REJECT>",
  "recommendationReason": "<2-3 جمل تشرح التوصية النهائية>"
}`;

  try {
    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages:   [{ role: 'user', content: prompt }],
    });

    const raw    = message.content.map(b => b.text || '').join('');
    const clean  = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);
    res.json(result);

  } catch (err) {
    console.error('Evaluate error:', err);
    res.status(500).json({ error: err.message });
  }
});

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
  console.log(`  Voice ID   : ${VOICE_ID}\n`);
});
