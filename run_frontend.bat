@echo off
echo ========================================================
echo Starting AI Document Summarizer - Vite React Frontend
echo ========================================================
cd frontend
if not exist node_modules (
    echo Installing npm dependencies...
    npm install
)
echo Starting frontend development server on http://localhost:5173 ...
npm run dev
pause

