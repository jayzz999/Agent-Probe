import os
from pathlib import Path
from dotenv import load_dotenv

# Find .env from project root (two levels up from this file)
_project_root = Path(__file__).resolve().parent.parent.parent
load_dotenv(_project_root / ".env", override=True)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MODEL_ID = "claude-sonnet-4-20250514"
TARGET_MODEL_ID = "claude-3-haiku-20240307"  # Weaker model for demo target
TARGET_SECRET = "SK-RABBITRON-7X9Q-PROD-2024-ANYX"
DEMO_MODE = True

# ElevenLabs TTS Configuration
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_INFILTRATOR = os.getenv("ELEVENLABS_VOICE_INFILTRATOR", "pNInz6obpgDQGcFmaJgB")  # Adam
ELEVENLABS_VOICE_TARGET = os.getenv("ELEVENLABS_VOICE_TARGET", "21m00Tcm4TlvDq8ikWAM")  # Rachel
ELEVENLABS_MODEL_ID = "eleven_multilingual_v2"
