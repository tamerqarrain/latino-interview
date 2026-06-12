# Latino — AI Voice Interview System
### Schools & KG Network · ElevenLabs + Deepgram + Claude · Deploy on Railway

---

## Tech Stack

| Task           | Service       | Model                    |
|----------------|---------------|--------------------------|
| Voice Output   | ElevenLabs    | eleven_turbo_v2_5        |
| Voice Input    | Deepgram      | nova-2                   |
| AI Evaluation  | Claude Sonnet | claude-sonnet-4-20250514 |
| Server         | Node.js       | Express + WebSocket      |
| Hosting        | Railway       | Free tier                |

---

## 🚀 Deploy to Railway (5 minutes)

### Step 1 — Get your 3 API keys

| Service    | URL                              | Free tier              |
|------------|----------------------------------|------------------------|
| ElevenLabs | https://elevenlabs.io            | 10,000 chars/month     |
| Deepgram   | https://console.deepgram.com     | $200 free credit       |
| Anthropic  | https://console.anthropic.com    | Pay per use (~$0.01/interview) |

### Step 2 — Push to GitHub

```bash
cd latino-interview
git init
git add .
git commit -m "Initial commit"

# Create a private GitHub repo and push
# (via GitHub Desktop, gh CLI, or github.com → New Repository)
git remote add origin https://github.com/YOUR_USERNAME/latino-interview.git
git push -u origin main
```

### Step 3 — Deploy on Railway

1. Go to **https://railway.app** and sign in with GitHub
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `latino-interview` repository
4. Railway auto-detects Node.js and starts building

### Step 4 — Add environment variables

In your Railway project dashboard:
1. Click your service → **"Variables"** tab
2. Add these one by one:

```
ANTHROPIC_API_KEY      =  sk-ant-...
ELEVENLABS_API_KEY     =  your_key_here
DEEPGRAM_API_KEY       =  your_key_here
ELEVENLABS_VOICE_ID    =  pNInz6obpgDQGcFmaJgB
```

Railway will automatically redeploy after you save variables.

### Step 5 — Get your public URL

1. Click **"Settings"** tab in your Railway service
2. Under **"Networking"** → click **"Generate Domain"**
3. Your app is live at: `https://latino-interview-xxxx.up.railway.app`

---

## Run locally

```bash
# Install dependencies
npm install

# Copy and fill in your keys
cp .env.example .env
# Edit .env with your real API keys

# Start
npm start
# → http://localhost:3000
```

---

## How the interview works

1. Enter candidate name, experience, role → **Begin Interview**
2. Latino greets the candidate by name (ElevenLabs voice)
3. Latino speaks each question aloud
4. Candidate answers verbally into the microphone
5. Press **Done Answering** → Deepgram transcribes the answer
6. Latino bridges to the next question
7. After all 8 questions → Claude evaluates → full report generated
8. Report shows: score, grade, per-question ratings, strengths, HIRE/CONSIDER/REJECT

---

## Roles & Questions (8 per role)

| Role                    | Focus Areas                                                     |
|-------------------------|-----------------------------------------------------------------|
| Teacher                 | Pedagogy, differentiation, assessment, classroom management     |
| Educator / KG Specialist| Play-based learning, child development, inclusion, parent comms |
| Administrative Staff    | Records, confidentiality, time management, operations           |
| Cluster Leader          | Strategic leadership, data, talent development, vision          |

---

## Change the interviewer voice

1. Browse: https://elevenlabs.io/voice-library
2. Copy the Voice ID from the URL of any voice you like
3. Set `ELEVENLABS_VOICE_ID` in Railway variables (or `.env`)
4. Redeploy

Popular choices:
- `pNInz6obpgDQGcFmaJgB` — Adam (default, clear professional male)
- `ErXwobaYiN019PkySvjV` — Antoni (warm male)
- `EXAVITQu4vr4xnSDxMaL` — Bella (professional female)
- `onwK4e9ZLuTAKqWW03F9` — Daniel (British male)

---

## Project structure

```
latino-interview/
├── server.js          ← Express server + API routes
├── questions.js       ← Interview questions by role
├── railway.toml       ← Railway deployment config
├── public/
│   └── index.html     ← Full frontend (setup → interview → report)
├── .env.example       ← API key template
├── .gitignore
└── package.json
```
