# AI Document Summarizer & Action Item Extractor (DocuSense AI)

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF.svg?logo=vite)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade, modern, and responsive full-stack web application that uses Large Language Models (LLMs) to analyze uploaded PDF, DOCX, and TXT documents. It synthesizes executive summaries, extracts key findings and actionable deliverables (with responsible persons and deadlines), provides grounded conversational document Q&A, and allows side-by-side comparative document analysis.

---

## 🌟 Key Features

### 1. Multi-Format Document Ingestion & Parsing
- **PDF Extraction**: High-speed, accurate digital PDF layout extraction via PyMuPDF (`fitz`).
- **Microsoft Word (.docx)**: Paragraph, heading, and table extraction with `python-docx`.
- **Text Files (.txt)**: Clean parsing with multi-encoding fallback (`utf-8`, `utf-8-sig`, `latin-1`, `cp1252`).
- **Scanned Document Detection**: Automatically calculates text density to detect scanned image PDFs without selectable text and presents clear guidance that OCR is required.
- **Security & Untrusted Input Isolation**: Documents are never executed, filename paths are sanitized using cryptographic UUIDs, and strict file size/MIME verification is enforced.

### 2. AI Document Summarization Pipeline
- **Executive Summary**: High-level distillation adhering to user-selected length and tone.
- **Detailed Summary**: Section-by-section breakdown of important findings and core arguments.
- **Key Points**: Quantified facts, statistics, and primary takeaways.
- **Action Items & Task Deliverables**: Identified tasks, responsible individuals, and explicit deadlines. Differentiates explicitly stated deliverables from AI-suggested recommendations.
- **Important Dates & Deadlines**: Chronological calendar milestones extracted from the document.
- **Keywords & Topic Tags**: Domain vocabulary classification.
- **Document Classification**: Categorizes files as Reports, Meeting Notes, Research Papers, Business Documents, or General Documents.
- **Hierarchical Chunking (Map-Reduce)**: Large documents exceeding standard token windows are segmented along semantic paragraph boundaries and synthesized into unified structured outputs.

### 3. Custom Summary Preferences
- **Summary Length**: Short (~150 words), Medium (~300 words), or Detailed (~500+ words).
- **Output Style**: Structured Report, Paragraphs, or Bullet Points.
- **Tone**: Professional, Academic, or Simple English.
- **Multi-Language Support**: English, Spanish, French, German, Japanese, Chinese, Hindi, Portuguese, and more.

### 4. Interactive Results & Management
- **Task Tracker**: Interactive checkboxes to mark action items as `Completed` or `Pending` with instant database persistence.
- **Export Formats**:
  - Download summary as formatted Plain Text (`.txt`).
  - Download structured executive report as a styled PDF (`.pdf`) using ReportLab.
  - Export action items spreadsheet as CSV (`.csv`).
- **Copy to Clipboard**: One-click summary copying with instant user toast feedback.

### 5. Advanced Intelligence Features
- **Grounded Document Q&A & Conversational Chat**: Ask questions about document content; the assistant answers strictly from source text and alerts you if facts are absent.
- **Deep Information Finder**: Extracts named entities/organizations, numerical metrics, and strategic decisions.
- **Document Comparison**: Select any two uploaded documents to compare similarities, divergences, and strategic recommendations.

### 6. Authentication & Security
- Secure registration and login with email and password.
- `bcrypt` password hashing (no plain-text storage).
- JWT (JSON Web Token) bearer authentication with user-isolated document access.
- Sliding-window in-memory rate limiting on AI endpoints.
- Modular LLM Provider factory supporting **Google Gemini**, **OpenAI**, or zero-config **Smart Heuristic Fallback** for immediate out-of-the-box local testing.

---

## 🏗 Architecture & Project Structure

```
AI Document Summarizer/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application entry & CORS
│   │   ├── database.py              # SQLAlchemy engine & session dependency
│   │   ├── api/                     # REST API routers
│   │   │   ├── auth.py              # Login, register, me
│   │   │   ├── documents.py         # Upload, summarize, Q&A, export, delete
│   │   │   ├── action_items.py      # Action item listing, toggle, CSV export
│   │   │   ├── compare.py           # Document comparison endpoint
│   │   │   └── stats.py             # Dashboard statistics & LLM engine info
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic BaseSettings & env parsing
│   │   │   ├── security.py          # bcrypt password hashing & JWT encoding/decoding
│   │   │   └── rate_limiter.py      # Sliding-window rate limiting
│   │   ├── models/                  # SQLAlchemy ORM models (User, Document, ActionItem)
│   │   ├── schemas/                 # Pydantic v2 validation models
│   │   └── services/
│   │       ├── parser.py            # PyMuPDF, python-docx, txt & scanned PDF detector
│   │       ├── chunker.py           # Semantic paragraph text chunker
│   │       ├── summarizer.py        # Hierarchical summarization & prompt injection defense
│   │       ├── qa_service.py        # Precision Q&A and Chat service
│   │       ├── compare_service.py   # Document comparison analyzer
│   │       ├── export_service.py    # ReportLab PDF & CSV generators
│   │       └── llm/                 # Modular LLM adapters (Gemini, OpenAI, Fallback)
│   ├── sample_docs/                 # Sample TXT, DOCX, and PDF documents for testing
│   ├── tests/                       # Pytest unit & integration test suite (12 tests)
│   ├── requirements.txt             # Backend dependencies
│   ├── .env.example                 # Environment configuration template
│   └── run.py                       # Backend server script
├── frontend/
│   ├── src/
│   │   ├── components/              # Sidebar, Navbar, StatCard, SkeletonLoader, Toast, EmptyState
│   │   ├── context/                 # AuthContext (JWT) & ThemeContext (Dark/Light)
│   │   ├── pages/                   # Dashboard, Upload, SummaryDetail, Documents, ActionItems, Chat, Compare, Settings, Login, Register
│   │   ├── services/                # Axios instance with JWT interceptors
│   │   ├── App.jsx                  # React Router routes & Layout
│   │   ├── index.css                # Tailwind CSS directives & scrollbar styles
│   │   └── main.jsx                 # Application DOM mount
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── run_backend.bat                  # One-click Windows backend runner
├── run_frontend.bat                 # One-click Windows frontend runner
├── run_all.bat                      # One-click Full-Stack launcher
└── README.md
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Python 3.10+** (Tested on Python 3.12)
- **Node.js 18+** and **npm**

---

### Step 1: Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # On Windows:
   python -m venv venv
   .\venv\Scripts\activate

   # On macOS/Linux:
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env     # Windows
   # or
   cp .env.example .env       # Linux/macOS
   ```

5. (Optional) Add your Google Gemini or OpenAI API Key:
   Open `backend/.env` and insert your key:
   ```ini
   # Free key from https://aistudio.google.com/
   GEMINI_API_KEY="AIzaSyYourActualGeminiKey"
   GEMINI_MODEL="gemini-1.5-flash"
   ```
   > **Note**: If no API key is provided, the application will automatically activate its built-in **Smart Heuristic Fallback Engine**, allowing full local testing, text parsing, date extraction, and action item detection without an external API key!

6. Run the backend server:
   ```bash
   python run.py
   ```
   *The FastAPI backend will start at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### Step 2: Frontend Setup

1. Open a second terminal and navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install npm dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The React application will be available at `http://localhost:5173`.*

---

### Step 3: One-Click Windows Launchers

For convenience on Windows:
- Double-click **`run_all.bat`** to start both Backend and Frontend in separate command windows automatically.
- Or use **`run_backend.bat`** and **`run_frontend.bat`** individually.

---

## 🧪 Running Automated Tests

A comprehensive unit test suite is included in `backend/tests/` covering:
- PDF text extraction (`PyMuPDF`)
- DOCX text extraction (`python-docx`)
- Text file decoding & normalization
- Scanned PDF / zero-text unprocessable document errors
- Invalid file extension rejection (.exe, .bin)
- User registration, duplicate email handling, and JWT authentication
- Cross-user document isolation (User A cannot access or delete User B's documents)
- Summarization and structured output validation
- Action item completion status updates and CSV export

Run pytest with:
```bash
.\backend\venv\Scripts\pytest .\backend\tests -v
```

Output:
```
backend/tests/test_action_items.py::test_action_item_updates_and_csv PASSED [  8%]
backend/tests/test_auth.py::test_register_and_login PASSED               [ 16%]
backend/tests/test_auth.py::test_get_me PASSED                           [ 25%]
backend/tests/test_documents.py::test_document_lifecycle PASSED          [ 33%]
backend/tests/test_documents.py::test_invalid_extension_upload PASSED    [ 41%]
backend/tests/test_documents.py::test_document_ownership_isolation PASSED [ 50%]
backend/tests/test_parser.py::test_clean_and_normalize_text PASSED       [ 58%]
backend/tests/test_parser.py::test_extract_text_from_pdf PASSED          [ 66%]
backend/tests/test_parser.py::test_extract_text_from_docx PASSED         [ 75%]
backend/tests/test_parser.py::test_extract_text_from_txt PASSED          [ 83%]
backend/tests/test_parser.py::test_empty_document_handling PASSED        [ 91%]
backend/tests/test_parser.py::test_unsupported_format PASSED             [100%]
======================= 12 passed in 3.97s =======================
```

---

## 📋 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account and receive JWT token | No |
| `POST` | `/api/auth/login` | Sign in with email and password | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `GET` | `/api/dashboard/stats` | Retrieve metrics and active LLM configuration | Yes |
| `POST` | `/api/documents/upload` | Upload & parse PDF, DOCX, or TXT file | Yes |
| `GET` | `/api/documents` | List user documents (supports search and type filters) | Yes |
| `GET` | `/api/documents/{id}` | Get document metadata, summaries, and action items | Yes |
| `DELETE`| `/api/documents/{id}` | Delete document and remove file from disk | Yes |
| `POST` | `/api/documents/{id}/summarize` | Generate/Regenerate summary with custom options | Yes |
| `POST` | `/api/documents/{id}/ask` | Precision Q&A grounded strictly in document text | Yes |
| `POST` | `/api/documents/{id}/chat` | Conversational multi-turn chat with document context | Yes |
| `POST` | `/api/documents/{id}/extract-info` | Extract entities, dates, statistics, and decisions | Yes |
| `GET` | `/api/documents/{id}/export` | Export document as PDF (`format=pdf`) or TXT (`format=txt`) | Yes |
| `POST` | `/api/documents/compare` | Compare two documents and summarize differences | Yes |
| `GET` | `/api/action-items` | List extracted action items across documents | Yes |
| `PATCH`| `/api/action-items/{id}` | Update task status (`Pending` / `Completed`) | Yes |
| `DELETE`| `/api/action-items/{id}`| Delete an action item | Yes |
| `GET` | `/api/action-items/export/csv` | Download action items as a CSV spreadsheet | Yes |

---

## 📄 Sample Output Format

When a document (e.g., `sample_report.txt`) is summarized, the structured output is rendered across dedicated cards:

```json
{
  "document_type": "Report",
  "executive_summary": "During Q3 2026, the AI Core Platform team achieved a 42% decrease in model inference latency and expanded multi-modal processing throughput by 3.5x across all production clusters. Customer onboarding escalated by 68% following the launch of the real-time document intelligence pipeline. However, infrastructure expenditure expanded by 18% over budgeted estimates, necessitating immediate optimization of memory usage, asynchronous queue batching, and automated cache evictions.",
  "key_points": [
    "System Uptime achieved 99.98% availability against target SLO of 99.95%.",
    "Pipeline Throughput successfully processed 4.2 million document pages in Q3 with average turnaround of 1.4 seconds per page.",
    "Memory Allocation: Vector indexing and PDF extraction represented 54% of peak RAM consumption during burst intervals.",
    "User Feedback: Over 88% of enterprise beta users reported high satisfaction with the structured action items extractor."
  ],
  "action_items": [
    {
      "task_description": "Optimize vector cache eviction policy and reduce Redis memory footprint by 25%.",
      "responsible_person": "Elena Rostova",
      "due_date": "November 10, 2026",
      "is_explicit": true,
      "status": "Pending"
    },
    {
      "task_description": "Finalize OCR fallback pipeline for low-contrast scanned receipts and medical records.",
      "responsible_person": "David Chen",
      "due_date": "November 20, 2026",
      "is_explicit": true,
      "status": "Pending"
    },
    {
      "task_description": "Update end-to-end API authorization tests to verify JWT token expiration and user document isolation.",
      "responsible_person": "Sarah Jenkins",
      "due_date": "November 15, 2026",
      "is_explicit": true,
      "status": "Pending"
    }
  ],
  "important_dates": [
    "November 10, 2026 - Complete load testing of hierarchical document chunking architecture",
    "November 25, 2026 - Conduct security and vulnerability audit for document upload endpoints",
    "December 15, 2026 - Deploy version 2.4 to North America and EU production regions",
    "January 5, 2027 - Deliver full annual financial audit to executive leadership"
  ],
  "keywords": [
    "Latency",
    "Throughput",
    "Hierarchical Chunking",
    "Infrastructure",
    "FastAPI",
    "PyMuPDF",
    "Token Expiration"
  ]
}
```

---

## 🛠 Troubleshooting

1. **"Scanned document detected" error on PDF upload:**
   - The uploaded PDF contains only image bitmaps without an embedded text layer. Ensure your PDF has searchable text or run OCR (e.g., Tesseract OCR or Adobe Acrobat) prior to uploading.
2. **Missing LLM API Key:**
   - The application functions seamlessly in **Demo Mode** using its built-in heuristic extractor. To activate Gemini, obtain a free API key at [Google AI Studio](https://aistudio.google.com/) and paste it into `backend/.env` under `GEMINI_API_KEY`.
3. **Database Migration to PostgreSQL:**
   - In `backend/.env`, simply update `DATABASE_URL`:
     ```ini
     DATABASE_URL="postgresql://postgres:password@localhost:5432/doc_summarizer"
     ```
     FastAPI will automatically create and bind all tables via SQLAlchemy ORM without code changes.

---

## 📜 License
This project is open-source and available under the [MIT License](LICENSE).

