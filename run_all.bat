@echo off
echo ========================================================
echo Starting DocuSense AI - Full Stack Launcher
echo ========================================================
start "DocuSense AI - Backend" cmd /k run_backend.bat
start "DocuSense AI - Frontend" cmd /k run_frontend.bat
echo Both backend (http://127.0.0.1:8000) and frontend (http://localhost:5173) are launching in separate windows!

