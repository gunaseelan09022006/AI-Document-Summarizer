import os
import io
import pytest
from app.core.config import settings

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_docs")

def test_document_lifecycle(client, auth_headers, monkeypatch):
    # Enable mock provider for deterministic offline end-to-end testing
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")

    # 1. Upload valid TXT document
    txt_path = os.path.join(SAMPLE_DIR, "sample_report.txt")
    with open(txt_path, "rb") as f:
        file_bytes = f.read()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("sample_report.txt", io.BytesIO(file_bytes), "text/plain")},
        headers=auth_headers
    )
    assert upload_res.status_code == 201
    doc_data = upload_res.json()
    doc_id = doc_data["id"]
    assert doc_data["filename"] == "sample_report.txt"
    assert doc_data["status"] == "uploaded"
    assert doc_data["word_count"] > 50

    # 2. Get document list
    list_res = client.get("/api/documents", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Get single document
    get_res = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id

    # 4. Summarize document
    summary_res = client.post(
        f"/api/documents/{doc_id}/summarize",
        json={
            "length": "Medium",
            "style": "Structured Report",
            "tone": "Professional",
            "language": "English"
        },
        headers=auth_headers
    )
    assert summary_res.status_code == 200
    summarized_doc = summary_res.json()
    assert summarized_doc["status"] == "summarized"
    assert summarized_doc["executive_summary"] is not None
    # Verify no prompt leaks
    assert "Return ONLY a JSON" not in summarized_doc["executive_summary"]
    assert "smart heuristic parser" not in summarized_doc["executive_summary"]
    assert len(summarized_doc["key_points"]) > 0
    assert len(summarized_doc["action_items"]) > 0

    # 5. Ask Question
    ask_res = client.post(
        f"/api/documents/{doc_id}/ask",
        json={"question": "What was the system uptime?"},
        headers=auth_headers
    )
    assert ask_res.status_code == 200
    assert "answer" in ask_res.json()

    # 6. Export TXT
    txt_export = client.get(f"/api/documents/{doc_id}/export?format=txt", headers=auth_headers)
    assert txt_export.status_code == 200
    assert "AI DOCUMENT SUMMARY" in txt_export.text

    # 7. Export PDF
    pdf_export = client.get(f"/api/documents/{doc_id}/export?format=pdf", headers=auth_headers)
    assert pdf_export.status_code == 200
    assert pdf_export.headers["content-type"] == "application/pdf"
    assert len(pdf_export.content) > 1000

    # 8. Delete document
    del_res = client.delete(f"/api/documents/{doc_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Confirm deletion
    get_del = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_del.status_code == 404

def test_summarize_endpoint_fails_with_clear_error_when_no_api_key(client, auth_headers, monkeypatch):
    """Verify endpoint does NOT silently use mock when Gemini key is missing in production/auto mode."""
    monkeypatch.setattr(settings, "LLM_PROVIDER", "gemini")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "")

    txt_path = os.path.join(SAMPLE_DIR, "sample_report.txt")
    with open(txt_path, "rb") as f:
        file_bytes = f.read()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("sample_report.txt", io.BytesIO(file_bytes), "text/plain")},
        headers=auth_headers
    )
    doc_id = upload_res.json()["id"]

    summary_res = client.post(
        f"/api/documents/{doc_id}/summarize",
        json={
            "length": "Medium",
            "style": "Structured Report",
            "tone": "Professional",
            "language": "English"
        },
        headers=auth_headers
    )
    # Must fail with 400 and provide clear instructions
    assert summary_res.status_code == 400
    assert "GEMINI_API_KEY" in summary_res.json()["detail"]

    # Check that document status was recorded as error
    get_res = client.get(f"/api/documents/{doc_id}", headers=auth_headers)
    assert get_res.json()["status"] == "error"
    assert "GEMINI_API_KEY" in get_res.json()["error_message"]

def test_invalid_extension_upload(client, auth_headers):
    bad_file = io.BytesIO(b"malicious executable payload")
    res = client.post(
        "/api/documents/upload",
        files={"file": ("malware.exe", bad_file, "application/octet-stream")},
        headers=auth_headers
    )
    assert res.status_code == 400
    assert "unsupported" in res.json()["detail"].lower()

def test_document_ownership_isolation(client, auth_headers):
    # User A uploads a document
    txt_path = os.path.join(SAMPLE_DIR, "sample_report.txt")
    with open(txt_path, "rb") as f:
        file_bytes = f.read()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("private_doc.txt", io.BytesIO(file_bytes), "text/plain")},
        headers=auth_headers
    )
    doc_id = upload_res.json()["id"]

    # Register User B
    b_res = client.post("/api/auth/register", json={
        "email": "user_b@example.com",
        "password": "Password123!",
        "full_name": "User B"
    })
    b_token = b_res.json()["access_token"]
    user_b_headers = {"Authorization": f"Bearer {b_token}"}

    # User B tries to access User A's document
    access_res = client.get(f"/api/documents/{doc_id}", headers=user_b_headers)
    assert access_res.status_code == 404

    # User B tries to delete User A's document
    del_res = client.delete(f"/api/documents/{doc_id}", headers=user_b_headers)
    assert del_res.status_code == 404
