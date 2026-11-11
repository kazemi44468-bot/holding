@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist .venv (
  py -3 -m venv .venv
)
call .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
echo.
echo Before use, set KNOWLEDGE_WHISPER_MODEL to a local faster-whisper model folder.
echo Ollama must be installed and running with a downloaded local language model.
echo.
python server.py
pause
