"""Text-to-speech using gTTS."""
import io
from gtts import gTTS


class GoogleTTS:
    """Text-to-speech converter using Google Text-to-Speech."""

    def __init__(self, lang: str = "en", slow: bool = False):
        """
        Initialize Google TTS.

        Args:
            lang: Language code (e.g., 'en' for English).
            slow: Speak slowly if True.
        """
        self.lang = lang
        self.slow = slow

    def text_to_speech_bytes(self, text: str) -> bytes:
        """
        Convert text to speech and return as MP3 bytes.

        Args:
            text: Text to convert to speech.

        Returns:
            MP3 audio bytes.
        """
        # gTTS requires a file-like object for saving
        tts = gTTS(text, lang=self.lang, slow=self.slow)

        # Save to BytesIO buffer instead of file
        audio_buffer = io.BytesIO()
        tts.write_to_fp(audio_buffer)
        audio_buffer.seek(0)

        return audio_buffer.getvalue()

    def text_to_speech_file(self, text: str, output_file: str):
        """
        Convert text to speech and save to file.

        Args:
            text: Text to convert to speech.
            output_file: Path to save MP3 file.
        """
        tts = gTTS(text, lang=self.lang, slow=self.slow)
        tts.save(output_file)


if __name__ == "__main__":
    tts = GoogleTTS()

    # Test
    test_text = "Namaste! Welcome to the yoga practice."
    audio_bytes = tts.text_to_speech_bytes(test_text)
    print(f"Generated audio: {len(audio_bytes)} bytes")

    # Save to file for testing
    tts.text_to_speech_file(test_text, "/tmp/test_tts.mp3")
    print("Saved test audio to /tmp/test_tts.mp3")
