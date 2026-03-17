"""FastAPI server for Yoga RAG application."""
import os
import sys
from pathlib import Path
from typing import Optional, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add parent directories to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from retrieval.chain import YogaRAGChain
from voice.stt import WhisperSTT
from voice.tts import GoogleTTS


# Pydantic models
class AskRequest(BaseModel):
    """Request model for asking questions."""

    question: str
    num_sources: Optional[int] = 5


class AskResponse(BaseModel):
    """Response model for questions."""

    question: str
    answer: str
    sources: List[dict]
    model: str


class VoiceAskRequest(BaseModel):
    """Request model for voice questions."""

    text: str
    num_sources: Optional[int] = 5
    enable_tts: Optional[bool] = True


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    message: str


# Initialize FastAPI app
app = FastAPI(
    title="Yoga RAG API",
    description="RAG-based Yoga Q&A API with voice support",
    version="1.0.0",
)

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize components (lazy loading)
rag_chain = None
stt = None
tts = None


def get_rag_chain() -> YogaRAGChain:
    """Get or initialize RAG chain."""
    global rag_chain
    if rag_chain is None:
        rag_chain = YogaRAGChain()
    return rag_chain


def get_stt() -> WhisperSTT:
    """Get or initialize Whisper STT."""
    global stt
    if stt is None:
        stt = WhisperSTT(model="base")
    return stt


def get_tts() -> GoogleTTS:
    """Get or initialize Google TTS."""
    global tts
    if tts is None:
        tts = GoogleTTS(lang="en")
    return tts


# Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Yoga RAG API is running",
    }


@app.post("/ask", response_model=AskResponse)
async def ask(request: AskRequest):
    """
    Ask a question about yoga.

    Args:
        request: Question and optional number of sources to retrieve.

    Returns:
        Answer with sources.
    """
    try:
        chain = get_rag_chain()
        result = chain.generate_answer(request.question, k=request.num_sources)
        return {
            "question": result["question"],
            "answer": result["answer"],
            "sources": result["sources"],
            "model": result["model"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")


@app.post("/ask-voice")
async def ask_voice(request: VoiceAskRequest):
    """
    Ask a question and get voice response.

    Args:
        request: Text question and voice settings.

    Returns:
        JSON with answer and optional audio stream.
    """
    try:
        chain = get_rag_chain()
        result = chain.generate_answer(request.text, k=request.num_sources)

        # Generate TTS audio if requested
        audio_bytes = None
        if request.enable_tts:
            tts = get_tts()
            audio_bytes = tts.text_to_speech_bytes(result["answer"])

        return {
            "question": result["question"],
            "answer": result["answer"],
            "sources": result["sources"],
            "model": result["model"],
            "audio": audio_bytes.hex() if audio_bytes else None,
            "audio_format": "mp3",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing voice request: {str(e)}")


@app.get("/tts")
async def text_to_speech(text: str):
    """
    Convert text to speech.

    Args:
        text: Text to convert to speech.

    Returns:
        MP3 audio stream.
    """
    try:
        tts = get_tts()
        audio_bytes = tts.text_to_speech_bytes(text)

        return StreamingResponse(
            iter([audio_bytes]),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=response.mp3"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio file to text.

    Args:
        file: Audio file to transcribe.

    Returns:
        Transcribed text.
    """
    try:
        # Read file contents
        audio_bytes = await file.read()

        # Transcribe
        stt = get_stt()
        text = stt.transcribe_audio_bytes(audio_bytes)

        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error transcribing audio: {str(e)}")


@app.get("/models")
async def get_available_models():
    """Get information about available models."""
    chain = get_rag_chain()
    return {
        "current_model": chain.model,
        "available_models": [
            "claude-opus-4-6",
            "claude-sonnet-4-6",
            "claude-haiku-4-5-20251001",
        ],
    }


def run_server(host: str = "localhost", port: int = 8000, reload: bool = False):
    """
    Run the FastAPI server.

    Args:
        host: Host to bind to.
        port: Port to bind to.
        reload: Enable auto-reload on code changes.
    """
    uvicorn.run(
        "api.server:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )


if __name__ == "__main__":
    # Read config from environment
    host = os.getenv("BACKEND_HOST", "localhost")
    port = int(os.getenv("BACKEND_PORT", 8000))

    print(f"\nStarting Yoga RAG API on {host}:{port}")
    print(f"Swagger UI: http://{host}:{port}/docs")
    print(f"ReDoc: http://{host}:{port}/redoc\n")

    run_server(host=host, port=port, reload=True)
