# Setup Guide — Yoga RAG Application

Complete step-by-step setup instructions to get your Yoga RAG application running.

## Prerequisites Check

Before starting, ensure you have:

- [ ] **Python 3.11+** — Check with `python3 --version`
- [ ] **Node.js 18+** — Check with `node --version`
- [ ] **Anthropic API Key** — Get from https://console.anthropic.com
- [ ] **Git** (optional) — Check with `git --version`

If any are missing, install them first.

---

## Phase 1: Backend Setup (10-15 minutes)

### 1.1 Navigate to Project

```bash
cd ~/path/to/yoga-rag2
```

### 1.2 Add Your API Key

Open `.env` in a text editor:

```bash
# macOS/Linux
nano .env

# Windows
notepad .env
```

Find the line `ANTHROPIC_API_KEY=` and add your key:

```env
ANTHROPIC_API_KEY=sk_ant_YOUR_ACTUAL_KEY_HERE
```

Save and close. ⚠️ **Never commit `.env` to git!**

### 1.3 Create Virtual Environment

```bash
# Create venv
python3 -m venv venv

# Activate it
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows
```

You should see `(venv)` in your terminal prompt.

### 1.4 Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

This takes 2-5 minutes. Coffee time! ☕

### 1.5 Ingest the Yoga Document

```bash
python -m ingestion.embedder
```

Expected output:
```
Loading document: .../yoga_research_document.md
Loaded 1 documents
Chunking documents...
Created 123 chunks
Generating embeddings and storing in ChromaDB...
Stored 123 chunks in .../chroma_db
Embedding pipeline complete!

Test query results: 3 documents
Result 1:
  Content: Tadasana (Mountain Pose) is a foundational standing asana...
```

This downloads the embeddings model (~80MB) and creates `chroma_db/` folder.

### 1.6 Start Backend Server

```bash
python -m api.server
```

Expected output:
```
Starting Yoga RAG API on localhost:8000
Swagger UI: http://localhost:8000/docs
ReDoc: http://localhost:8000/redoc

INFO:     Uvicorn running on http://localhost:8000 (Press CTRL+C to quit)
```

✅ **Backend is ready!** Leave this terminal running.

---

## Phase 2: Frontend Setup (5-10 minutes)

Open a **new terminal** in the project root:

```bash
cd ~/path/to/yoga-rag2/frontend
```

### 2.1 Install Node Dependencies

```bash
npm install
```

Takes 1-2 minutes.

### 2.2 Start Frontend Server

```bash
npm run dev
```

Expected output:
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  - Environments: .env.local

✓ Ready in 3.2s
```

✅ **Frontend is ready!** Leave this terminal running.

---

## Phase 3: Use the Application

Open your browser and go to: **http://localhost:3000**

You should see:

```
🧘 Yoga RAG Assistant
● Connected
```

### Try These Test Questions

1. **Simple question:**
   ```
   What is Tadasana?
   ```

2. **Detailed question:**
   ```
   What are the benefits of practicing yoga regularly?
   ```

3. **Safety question:**
   ```
   I have a lower back injury. Which yoga poses should I avoid?
   ```

4. **Instruction question:**
   ```
   Can you explain how to do Downward Dog step by step?
   ```

### Enable Voice Features

1. Click the **🎤 Record** button to speak your question
   - A red dot appears when listening
   - Speak clearly when the button is red
   - Release and your speech will be transcribed

2. Enable **🔊 Audio responses** to hear answers spoken aloud
   - Answers are automatically spoken after generation
   - Audio plays in your browser
   - Can be toggled on/off anytime

---

## Testing the API Directly

Open Swagger UI: **http://localhost:8000/docs**

### Test the `/ask` endpoint:

1. Click **POST /ask**
2. Click **Try it out**
3. Enter JSON:
   ```json
   {
     "question": "What is the benefit of mountain pose?",
     "num_sources": 5
   }
   ```
4. Click **Execute**
5. Scroll down to see the response

---

## Troubleshooting

### ❌ "Cannot connect to backend API"

**Problem:** Frontend shows red ● Disconnected

**Solutions:**
1. Check backend terminal is running (step 1.6)
2. Backend should show `INFO: Uvicorn running on http://localhost:8000`
3. Try http://localhost:8000/health in a new browser tab
4. If error: kill backend with Ctrl+C and restart

### ❌ "ModuleNotFoundError: No module named 'anthropic'"

**Problem:** Missing Python dependencies

**Solution:**
```bash
cd backend
pip install -r requirements.txt
```

### ❌ "ANTHROPIC_API_KEY not found"

**Problem:** .env file not set up correctly

**Solutions:**
1. Check `.env` file has your key (not `.env.example`)
2. Make sure key starts with `sk_ant_`
3. No quotes around key: `ANTHROPIC_API_KEY=sk_ant_xxx` (not `sk_ant_"xxx"`)
4. Restart backend after editing .env

### ❌ "Port 8000 already in use"

**Problem:** Another app is using port 8000

**Solutions:**
```bash
# macOS/Linux: Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Windows: Kill process on port 8000
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

Then restart: `python -m api.server`

### ❌ Voice input not working

**Possible Causes:**
- Browser doesn't support Web Speech API (use Chrome/Edge/Safari)
- Microphone permission not granted
- Browser console shows errors

**Solutions:**
1. Use Chrome, Edge, or Safari
2. Allow microphone access when prompted
3. Check browser console (F12) for errors
4. Fall back to text input if voice unavailable

### ❌ Audio response is garbled/robotic

**Problem:** gTTS can produce robotic audio

**Solution:**
- This is normal for gTTS (free service)
- Audio quality is adequate for understanding
- For better quality, switch to OpenAI TTS (paid, edit `backend/voice/tts.py`)

### ❌ Slow first request

**Problem:** Takes 10+ seconds for first question

**Reason:** Loading models on first use (normal)

**Solution:** Subsequent requests are much faster (1-3 seconds)

---

## Next Steps

### Customize the System

1. **Edit system prompt:** `backend/retrieval/chain.py` → `PROMPT_TEMPLATE`
2. **Change LLM model:** `.env` → `LLM_MODEL` (see options in README.md)
3. **Adjust chunk size:** `backend/ingestion/embedder.py` → `chunk_size=500`
4. **Add custom embedding model:** `backend/ingestion/embedder.py` → `model_name=...`

### Deploy to Production

See deployment guides in main README.md (Coming soon)

### Modify Knowledge Base

If you edit `yoga_research_document.md`:

```bash
cd backend
python -m ingestion.embedder  # Re-ingest updated document
```

Then restart backend.

---

## File Locations

Key files to remember:

| File | Purpose |
|------|---------|
| `.env` | Your API keys (SECRET!) |
| `yoga_research_document.md` | Knowledge base source |
| `backend/api/server.py` | FastAPI REST server |
| `frontend/src/app/page.tsx` | Main chat UI |
| `chroma_db/` | Vector database (auto-created) |
| `venv/` | Python environment (auto-created) |
| `frontend/node_modules/` | JS dependencies (auto-created) |

---

## Getting Help

If you get stuck:

1. **Check the README.md** for full documentation
2. **Check the plan file** at `.claude/plans/woolly-churning-clarke.md`
3. **Review backend logs** in the terminal running the API server
4. **Check browser console** (F12) for frontend errors
5. **Test API directly** at http://localhost:8000/docs

---

## Success Checklist

- [ ] Backend running at http://localhost:8000
- [ ] Frontend running at http://localhost:3000
- [ ] Can ask a question and get an answer
- [ ] Sources appear below answer
- [ ] Voice button works (or gracefully disabled)
- [ ] Audio responses work (optional)
- [ ] Swagger API docs load at http://localhost:8000/docs

If all checked ✅ — **Congratulations!** Your Yoga RAG app is ready! 🎉

---

## Stopping the Application

When you're done:

```bash
# In backend terminal: Press Ctrl+C
# In frontend terminal: Press Ctrl+C

# Deactivate Python environment:
deactivate
```

To start again later, just run steps 1.6 and 2.2 in two terminals.
