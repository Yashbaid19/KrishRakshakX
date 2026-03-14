import os
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load .env file
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(ROOT_DIR / ".env")

# Get Ollama URL
OLLAMA_URL = os.getenv("OLLAMA_URL")

def generate_response(prompt: str) -> str:
    """
    Sends prompt to Ollama model and returns generated response
    """

    if not OLLAMA_URL:
        raise ValueError("OLLAMA_URL is not set in environment variables")

    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": "mistral:latest",
                "prompt": prompt,
                "stream": False
            },
            timeout=500
        )

        response.raise_for_status()

        data = response.json()

        return data.get("response", "No response generated")

    except requests.exceptions.RequestException as e:
        print("Ollama connection error:", e)
        return "AI service unavailable. Please try again later."