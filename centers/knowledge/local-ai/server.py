from __future__ import annotations
import os, tempfile, pathlib, requests
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from faster_whisper import WhisperModel

HOST = "127.0.0.1"
PORT = int(os.getenv("KNOWLEDGE_AI_PORT", "8765"))
OLLAMA_URL = os.getenv("KNOWLEDGE_OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
WHISPER_MODEL_PATH = os.getenv("KNOWLEDGE_WHISPER_MODEL", "").strip()
WHISPER_DEVICE = os.getenv("KNOWLEDGE_WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE = os.getenv("KNOWLEDGE_WHISPER_COMPUTE", "int8")
MAX_UPLOAD_MB = int(os.getenv("KNOWLEDGE_MAX_UPLOAD_MB", "150"))

app = FastAPI(title="Holding Knowledge Local AI", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://kazemi44468-bot.github.io",
        "http://localhost",
        "http://127.0.0.1",
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
_whisper = None

class GenerateRequest(BaseModel):
    model: str
    prompt: str
    stream: bool = False
    options: dict = {}

def get_whisper():
    global _whisper
    if _whisper is not None:
        return _whisper
    if not WHISPER_MODEL_PATH:
        raise HTTPException(503, "مسیر مدل محلی Whisper در KNOWLEDGE_WHISPER_MODEL تنظیم نشده است.")
    if not pathlib.Path(WHISPER_MODEL_PATH).exists():
        raise HTTPException(503, "پوشه مدل Whisper پیدا نشد؛ مدل را پیشاپیش در دستگاه دریافت کنید.")
    try:
        _whisper = WhisperModel(
            WHISPER_MODEL_PATH,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE,
            local_files_only=True,
        )
        return _whisper
    except Exception as exc:
        raise HTTPException(503, f"بارگذاری مدل محلی ناموفق بود: {exc}")

@app.get("/health")
def health():
    ollama = {"available": False, "models": []}
    try:
        response = requests.get(OLLAMA_URL + "/api/tags", timeout=3)
        response.raise_for_status()
        ollama["models"] = [x.get("name", "") for x in response.json().get("models", [])]
        ollama["available"] = True
    except Exception as exc:
        ollama["error"] = str(exc)
    whisper_ready = bool(WHISPER_MODEL_PATH and pathlib.Path(WHISPER_MODEL_PATH).exists())
    return {
        "service": "ready",
        "ollama": ollama,
        "whisper_model_configured": whisper_ready,
        "whisper_model_path": WHISPER_MODEL_PATH or None,
        "offline_note": "پس از نصب محلی مدل‌ها، پردازش‌ها روی همین رایانه انجام می‌شوند.",
    }

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...), language: str = Form("fa")):
    suffix = pathlib.Path(file.filename or "audio.bin").suffix or ".bin"
    data = await file.read()
    if not data:
        raise HTTPException(400, "فایل خالی است.")
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(413, f"حداکثر حجم مجاز {MAX_UPLOAD_MB} مگابایت است.")
    model = get_whisper()
    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            temp_path = tmp.name
        segments, info = model.transcribe(
            temp_path,
            language=language or "fa",
            vad_filter=True,
            beam_size=5,
            condition_on_previous_text=True,
        )
        parts = []
        details = []
        for segment in segments:
            text = segment.text.strip()
            if text:
                parts.append(text)
                details.append({"start": segment.start, "end": segment.end, "text": text})
        return {"text": "\n".join(parts), "language": info.language, "duration": info.duration, "segments": details}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"تبدیل گفتار به متن انجام نشد: {exc}")
    finally:
        if temp_path:
            try: os.unlink(temp_path)
            except OSError: pass

@app.post("/generate")
def generate(payload: GenerateRequest):
    try:
        response = requests.post(
            OLLAMA_URL + "/api/generate",
            json=payload.model_dump(),
            timeout=(10, 900),
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as exc:
        raise HTTPException(503, f"اتصال به موتور زبانی محلی برقرار نشد: {exc}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
