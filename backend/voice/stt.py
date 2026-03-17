"""Speech-to-text using OpenAI Whisper."""
import os
import io
from typing import Optional
import whisper


class WhisperSTT:
    """Speech-to-text converter using OpenAI Whisper."""

    def __init__(self, model: str = "base"):
        """
        Initialize Whisper STT.

        Args:
            model: Whisper model size (tiny, base, small, medium, large).
                   Larger models are more accurate but slower.
        """
        self.model = whisper.load_model(model)

    def transcribe_audio(self, audio_file: str) -> str:
        """
        Transcribe audio file to text.

        Args:
            audio_file: Path to audio file (supports mp3, wav, m4a, flac, etc.)

        Returns:
            Transcribed text.
        """
        result = self.model.transcribe(audio_file, language="en")
        return result["text"]

    def transcribe_audio_bytes(self, audio_bytes: bytes, format: str = "wav") -> str:
        """
        Transcribe audio bytes to text.

        Args:
            audio_bytes: Audio data as bytes.
            format: Audio format (wav, mp3, m4a, etc.)

        Returns:
            Transcribed text.
        """
        # Create a temporary file-like object
        import tempfile

        with tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            text = self.transcribe_audio(tmp_path)
        finally:
            # Clean up temp file
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

        return text


if __name__ == "__main__":
    stt = WhisperSTT(model="base")
    print("Whisper STT initialized")

    # Example: transcribe a test audio file if provided
    import sys

    if len(sys.argv) > 1:
        audio_file = sys.argv[1]
        text = stt.transcribe_audio(audio_file)
        print(f"Transcribed text: {text}")
