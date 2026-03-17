# Yoga RAG Application

A complete Retrieval-Augmented Generation (RAG) system for answering questions about yoga using the `yoga_research_document.md` knowledge base. Features include semantic search, AI-powered responses, and real-time voice input/output.

## 🏗️ Architecture

### Components

1. **Data Ingestion Pipeline** — Loads, chunks, and embeds yoga documents into ChromaDB
2. **Data Retrieval Pipeline** — Searches relevant documents and generates answers with Claude
3. **Web UI** — Modern Next.js React interface with chat and voice support
4. **Voice Assistant** — Speech-to-text (Whisper) and text-to-speech (gTTS) integration

### Technology Stack

**Backend (Python)**
- **LLM:** Anthropic Claude API
- **Embeddings:** sentence-transformers (all-MiniLM-L6-v2)
- **Vector DB:** ChromaDB
- **RAG Framework:** LangChain
- **API:** FastAPI
- **Voice STT:** OpenAI Whisper
- **Voice TTS:** Google Text-to-Speech (gTTS)

**Frontend (TypeScript)**
- **Framework:** Next.js 14
- **UI:** React 18 + Tailwind CSS
- **Voice Input:** Web Speech API (browser-native)
- **HTTP Client:** fetch API

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key (get one at https://console.anthropic.com)

### Step 1: Set Up Backend

```bash
# Navigate to the project root
cd yoga-rag2

# Add your Anthropic API key to .env
# Edit .env and replace the ANTHROPIC_API_KEY value
nano .env

# Create Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Ingest the yoga document into ChromaDB (run once)
python -m ingestion.embedder

# Start the FastAPI server
python -m api.server
```

The backend API will be available at http://localhost:8000. Check Swagger docs at http://localhost:8000/docs

### Step 2: Set Up Frontend

In a new terminal:

```bash
cd yoga-rag2/frontend

# Install dependencies
npm install

# Start the Next.js development server
npm run dev
```

The frontend will be available at http://localhost:3000

### Step 3: Use the Application

1. Open http://localhost:3000 in your browser
2. Type a yoga question in the chat box
3. Click **Send** or press **Enter** to submit
4. Enable **🔊 Audio responses** to hear the answers spoken aloud
5. Click the **🎤** button to use voice input (Chrome/Edge required)

## 📋 Project Structure

```
yoga-rag2/
├── yoga_research_document.md       # Source knowledge base
├── .env                            # API keys (keep secret!)
├── .env.example                    # Template for .env
├── backend/
│   ├── requirements.txt            # Python dependencies
│   ├── ingestion/
│   │   ├── loader.py              # Load markdown document
│   │   ├── chunker.py             # Semantic text splitting
│   │   └── embedder.py            # Generate embeddings & store in ChromaDB
│   ├── retrieval/
│   │   ├── retriever.py           # Query similarity search
│   │   └── chain.py               # LangChain RAG orchestration
│   ├── voice/
│   │   ├── stt.py                 # Whisper speech-to-text
│   │   └── tts.py                 # gTTS text-to-speech
│   └── api/
│       └── server.py              # FastAPI REST API
├── frontend/
│   ├── package.json               # Node.js dependencies
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx         # Root layout
│       │   ├── page.tsx           # Main chat page
│       │   ├── globals.css        # Global styles
│       │   └── components/
│       │       ├── ChatWindow.tsx # Message display
│       │       ├── MessageBubble.tsx
│       │       ├── InputBar.tsx   # Message input
│       │       └── VoiceButton.tsx # Voice input button
│       └── lib/
│           └── api.ts             # API client
└── chroma_db/                      # Auto-created vector store (git-ignored)
```

## 🔧 Configuration

### Environment Variables (.env)

```env
# Required
ANTHROPIC_API_KEY=sk_ant_...      # Your Anthropic API key

# Optional (defaults shown)
LLM_MODEL=claude-haiku-4-5-20251001
ENABLE_VOICE=true
USE_GTTS=true
BACKEND_HOST=localhost
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

**LLM Model Options:**
- `claude-opus-4-6` — Best quality, higher cost
- `claude-sonnet-4-6` — Balanced quality/speed/cost
- `claude-haiku-4-5-20251001` — Fast, low cost (recommended for testing)

### Changing LLM Models

Edit `.env` to change `LLM_MODEL`, then restart the backend:

```bash
cd backend
python -m api.server
```

## 📚 API Endpoints

### POST /ask
Ask a question and get an answer with sources.

**Request:**
```json
{
  "question": "What are the benefits of Tadasana?",
  "num_sources": 5
}
```

**Response:**
```json
{
  "question": "What are the benefits of Tadasana?",
  "answer": "Tadasana (Mountain Pose) provides several key benefits...",
  "sources": [
    {
      "content": "Tadasana is a standing pose that...",
      "source": "yoga_research_document.md",
      "chunk_index": 42,
      "score": 0.89
    }
  ],
  "model": "claude-haiku-4-5-20251001"
}
```

### GET /tts?text=...
Convert text to speech and get MP3 audio.

### POST /ask-voice
Ask a question and get voice response.

### POST /transcribe
Upload audio file and get transcription.

### GET /health
Check API health status.

### GET /models
Get available models.

See Swagger UI at http://localhost:8000/docs for interactive API testing.

## 🎤 Voice Features

### Voice Input (Speech-to-Text)
- Uses **Web Speech API** (browser-native)
- Works in Chrome, Edge, and Safari
- Click 🎤 button to start listening
- Red button indicates active listening
- Automatically submits transcript as a question

### Voice Output (Text-to-Speech)
- Uses **Google Text-to-Speech** (gTTS)
- Enable with "🔊 Audio responses" toggle
- Answers are automatically spoken aloud
- Works offline (gTTS requires internet for first request)

## 🔍 Example Queries

Try asking:
- "What is Tadasana and how do I perform it?"
- "What are the health benefits of yoga?"
- "I have lower back pain, which yoga poses should I avoid?"
- "Explain the Vinyasa flow step by step"
- "What are the contraindications for headstands?"
- "How does yoga help with stress relief?"
- "What is pranayama and why is it important?"

## ⚙️ Re-ingesting Data

If you modify `yoga_research_document.md`, re-ingest the data:

```bash
cd backend
python -m ingestion.embedder
```

This will:
1. Load and parse the updated document
2. Split into semantic chunks
3. Generate embeddings
4. Store in ChromaDB (overwrites previous data)

## 🚨 Troubleshooting

### Backend Connection Error
```
⚠️ Cannot connect to backend API
```
**Solution:** Make sure the backend is running:
```bash
cd backend
python -m api.server
```

### Voice Input Not Working
**Possible Causes:**
- Browser doesn't support Web Speech API (use Chrome/Edge)
- Microphone permission not granted
- Speech recognition service unavailable

**Solution:** Use text input instead.

### Slow Responses
- First request may be slow (loading models)
- Check your internet connection (for Claude API calls)
- Try smaller model: `claude-haiku-4-5-20251001`

### ANTHROPIC_API_KEY Error
**Solution:** Make sure you:
1. Copied your API key from https://console.anthropic.com
2. Pasted it in `.env` file (not `.env.example`)
3. Restarted the backend server

## 📖 Development

### Update Frontend UI
Edit files in `frontend/src/app/` and changes auto-reload.

### Add Custom Prompts
Edit the `PROMPT_TEMPLATE` in `backend/retrieval/chain.py`.

### Change Embedding Model
Edit `HuggingFaceEmbeddings` in `backend/ingestion/embedder.py`.

### Use Different Vector DB
Replace ChromaDB with Pinecone, Weaviate, etc. in `backend/retrieval/retriever.py`.

## 📄 License

This project is provided as-is for educational and research purposes.

## 🙏 Acknowledgments

- Yoga knowledge base: `yoga_research_document.md`
- Claude LLM: Anthropic
- Embeddings: HuggingFace
- Vector DB: ChromaDB
- Vector Search: Chroma
- Frontend Framework: Vercel (Next.js)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review API docs at http://localhost:8000/docs
3. Check backend logs for errors
4. Ensure all dependencies are installed with correct versions
