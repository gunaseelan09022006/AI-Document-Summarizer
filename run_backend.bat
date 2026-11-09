@echo off
echo ========================================================
echo Starting AI Document Summarizer - FastAPI Backend
echo ========================================================
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing dependencies if needed...
pip install -r requirements.txt
echo Starting backend on http://127.0.0.1:8000 ...
python run.py
pause

