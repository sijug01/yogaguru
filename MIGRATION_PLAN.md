# Python Backend → Next.js Serverless Migration Plan

## Overview
Migrate FastAPI backend to Next.js API routes, deploy on Vercel, store TF-IDF index in `/public`.

## Architecture

```
CURRENT STATE
├── frontend/ (Next.js React)
├── backend/ (Python FastAPI)
└── yoga_research_document.md

MIGRATED STATE
├── app/ (Next.js - frontend + backend)
│   ├── page.tsx (React UI)
│   ├── api/
│   │   ├── ask/route.ts
│   │   ├── tts/route.ts
│   │   ├── transcribe/route.ts
│   │   ├── health/route.ts
│   │   └── ingest/route.ts (optional manual rebuild)
│   ├── lib/
│   │   ├── indexing.ts (TF-IDF logic)
│   │   ├── retriever.ts (search)
│   │   ├── chain.ts (Claude integration)
│   │   └── storage.ts (file I/O)
│   └── components/
├── public/
│   ├── yoga_index/
│   │   ├── vectorizer.pkl
│   │   ├── docs.pkl
│   │   └── index.json (metadata)
│   └── favicon.svg
├── backend/ (KEEP - Python ingestion)
│   └── ingestion/
│       └── embedder.py (unchanged)
└── yoga_research_document.md
```

## Migration Steps

### Phase 1: Setup Next.js Backend Infrastructure
1. ✅ Install required npm packages (scikit-learn equivalent, Claude SDK)
2. Create `/app/lib/` TypeScript utilities
3. Create `/app/api/` route handlers
4. Test each endpoint locally

### Phase 2: Convert Python Logic to TypeScript
1. Port TF-IDF retriever logic (use simple array operations)
2. Port RAG chain logic (Claude integration)
3. Port TTS/STT integration
4. Handle pickle file loading in TypeScript

### Phase 3: Index Management
1. Load index from `/public/yoga_index/` on API startup
2. Cache in memory across requests
3. Detect document changes (file hash)
4. Auto-rebuild or manual `/api/ingest` endpoint

### Phase 4: Deployment
1. Update `package.json` with new dependencies
2. Configure `vercel.json` (if needed)
3. Set environment variables (ANTHROPIC_API_KEY, etc.)
4. Deploy to Vercel

### Phase 5: Keep Python Ingestion
1. Keep `backend/ingestion/embedder.py` unchanged
2. Run locally: `python -m ingestion.embedder`
3. Copy generated files to `/public/yoga_index/`
4. Commit to git

## Dependencies to Add

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "gtts": "^2.5.0",
    "node-pickle": "^1.0.0",
    "binary-parser": "^1.6.0"
  }
}
```

## Key Implementation Details

### Index Loading Strategy
- Load index once on first request
- Cache in module scope (Node.js keeps it across invocations)
- Check file modification date to detect stale index
- Auto-rebuild if index.json missing or outdated

### API Endpoints
- `POST /api/ask` - Ask question (same as `/ask`)
- `GET /api/tts` - Text to speech (same as `/tts`)
- `POST /api/transcribe` - Audio transcription (same as `/transcribe`)
- `GET /api/health` - Health check (same as `/health`)
- `POST /api/ingest` - Manual index rebuild (optional)

### Environment Variables
```
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-haiku-4-5-20251001
```

## File Changes Summary

### Delete (Python backend no longer needed at runtime)
- `backend/api/server.py`
- `backend/retrieval/chain.py`
- `backend/retrieval/retriever.py`
- `backend/voice/tts.py` (logic ported to TS)

### Keep (Python ingestion)
- `backend/ingestion/embedder.py`
- `backend/ingestion/loader.py`
- `backend/ingestion/chunker.py`
- `backend/ingestion/simple_embedder.py`

### Create (Next.js)
- `app/api/ask/route.ts`
- `app/api/tts/route.ts`
- `app/api/transcribe/route.ts`
- `app/api/health/route.ts`
- `app/lib/indexing.ts`
- `app/lib/retriever.ts`
- `app/lib/chain.ts`
- `app/lib/storage.ts`

### Move/Copy (Index files)
- From: `backend/chroma_db/` → To: `public/yoga_index/`

## Verification Checklist

- [ ] All API endpoints work locally
- [ ] Index loads from `/public/yoga_index/`
- [ ] Claude API calls work
- [ ] TTS generates audio correctly
- [ ] Frontend connects to new API routes
- [ ] Deploys to Vercel without errors
- [ ] Cold start time < 3 seconds
- [ ] Python ingestion still works standalone

## Rollback Plan
- Keep backend/ directory untouched
- Can revert to FastAPI if needed
- Index files backed up in git
