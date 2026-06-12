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
const deepgram  = new DeepgramClient(process.env.DEEPGRAM_API_KEY);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID           = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

// ─────────────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    elevenlabs: !!ELEVENLABS_API_KEY,
    deepgram:   !!process.env.DEEPGRAM_API_KEY,
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
//  TEXT → SPEECH  (ElevenLabs streaming)
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
            stability:        0.48,
            similarity_boost: 0.82,
            style:            0.30,
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
//  SPEECH → TEXT  (Deepgram pre-recorded)
// ─────────────────────────────────────────────────────
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No audio' });

  try {
    const { result, error } = await deepgram.listen.v1.transcribeFile(
      req.file.buffer,
      {
        model:        'nova-2',
        smart_format: true,
        punctuate:    true,
        language:     'en',
      }
    );

    if (error) throw new Error(String(error));

    const transcript =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    res.json({ transcript });

  } catch (err) {
    console.error('Transcribe error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────
//  EVALUATE  (Claude)
// ─────────────────────────────────────────────────────
app.post('/api/evaluate', async (req, res) => {
  const { name, exp, role, questions, answers } = req.body;

  const qaBlock = questions.map((q, i) =>
    `Q${i+1} [${q.cat}]: ${q.q}\nAnswer: ${answers[i] || '(No answer provided)'}`
  ).join('\n\n');

  const prompt = `You are Latino, a senior HR specialist for a schools and kindergartens network. You have just conducted a voice interview. The candidate answers below are Deepgram speech-to-text transcripts — minor transcription artefacts may exist; evaluate content and intent charitably.

Candidate: ${name}
Role: ${role}
Experience: ${exp}

Interview Transcript:
${qaBlock}

Evaluate thoroughly. Return ONLY valid JSON — no markdown fences, no preamble:
{
  "overallScore": <integer 0-100>,
  "grade": "<A|B|C|D>",
  "summary": "<2-3 sentence professional executive summary>",
  "questionEvals": [
    { "score": <integer 1-5>, "evaluation": "<1-2 sentence evaluation of this specific answer>" }
  ],
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "areasForGrowth": ["<area 1>", "<area 2>"],
  "recommendation": "<HIRE|CONSIDER|REJECT>",
  "recommendationReason": "<2-3 sentences explaining the final hiring recommendation>"
}`;

  try {
    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
//  WebSocket: Deepgram live streaming (optional upgrade)
// ─────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  let dgConn = null;

  ws.on('message', async (data) => {
    if (typeof data === 'string') {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }

      if (msg.type === 'start') {
        dgConn = deepgram.listen.v1.connect({
          model:           'nova-2',
          smart_format:    true,
          punctuate:       true,
          interim_results: true,
          language:        'en',
          encoding:        'linear16',
          sample_rate:     16000,
          channels:        1,
        });

        dgConn.on('open',    ()    => ws.send(JSON.stringify({ type: 'ready' })));
        dgConn.on('Results', (d)   => {
          const alt  = d?.channel?.alternatives?.[0];
          const text = alt?.transcript || '';
          if (!text) return;
          ws.send(JSON.stringify({
            type:       d.is_final ? 'final' : 'interim',
            transcript: text,
          }));
        });
        dgConn.on('error', (e)   => ws.send(JSON.stringify({ type: 'error', message: String(e) })));
      }

      if (msg.type === 'stop' && dgConn) {
        try { dgConn.finish(); } catch {}
        dgConn = null;
      }
      return;
    }

    if (dgConn && Buffer.isBuffer(data)) dgConn.send(data);
  });

  ws.on('close', () => {
    if (dgConn) { try { dgConn.finish(); } catch {} }
  });
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
  console.log(`  ElevenLabs : ${ELEVENLABS_API_KEY             ? '✓ configured' : '✗ MISSING — add to .env'}`);
  console.log(`  Deepgram   : ${process.env.DEEPGRAM_API_KEY   ? '✓ configured' : '✗ MISSING — add to .env'}`);
  console.log(`  Anthropic  : ${process.env.ANTHROPIC_API_KEY  ? '✓ configured' : '✗ MISSING — add to .env'}`);
  console.log(`  Voice ID   : ${VOICE_ID}\n`);
});
