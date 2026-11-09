import os
import pytest
from fastapi import HTTPException
from app.services.parser import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
    parse_document,
    clean_and_normalize_text
)

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_docs")

def test_clean_and_normalize_text():
    raw = "  Hello   world! \r\n\r\n\r\n\r\nTest\u00a0special quotes: “smart” and — dash.  "
    cleaned = clean_and_normalize_text(raw)
    assert "Hello world!" in cleaned
    assert "quotes: \"smart\" and - dash." in cleaned
    assert "\n\n\n" not in cleaned

def test_extract_text_from_pdf():
    pdf_path = os.path.join(SAMPLE_DIR, "sample_paper.pdf")
    text, pages, ocr = extract_text_from_pdf(pdf_path)
    assert pages >= 1
    assert "Neural Document Understanding" in text
    assert "Abstract" in text
    assert len(text) > 100

def test_extract_text_from_multipage_pdf():
    pdf_path = os.path.join(SAMPLE_DIR, "sample_executive_report.pdf")
    text, pages, ocr = extract_text_from_pdf(pdf_path)
    assert pages == 2
    assert "Global Enterprise Cloud Modernization" in text
    assert "Sarah Jenkins" in text
    assert "David Chen" in text
    assert not ocr

def test_extract_text_from_docx():
    docx_path = os.path.join(SAMPLE_DIR, "sample_meeting.docx")
    text, pages, ocr = extract_text_from_docx(docx_path)
    assert pages >= 1
    assert "Sprint Planning & Architecture Sync" in text
    assert "Robert Taylor" in text

def test_extract_text_from_txt():
    txt_path = os.path.join(SAMPLE_DIR, "sample_report.txt")
    text, pages, ocr = extract_text_from_txt(txt_path)
    assert pages >= 1
    assert "Quarterly Strategic Review" in text
    assert "Marcus Vance" in text

def test_empty_document_handling():
    empty_path = os.path.join(SAMPLE_DIR, "empty_document.txt")
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_txt(empty_path)
    assert exc_info.value.status_code == 422
    assert "empty" in exc_info.value.detail.lower()

def test_empty_pdf_handling():
    empty_pdf = os.path.join(SAMPLE_DIR, "empty_document.pdf")
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_pdf(empty_pdf)
    assert exc_info.value.status_code == 422
    assert "empty" in exc_info.value.detail.lower() or "ocr" in exc_info.value.detail.lower()

def test_unsupported_format():
    with pytest.raises(HTTPException) as exc_info:
        parse_document("somefile.xyz", "xyz")
    assert exc_info.value.status_code == 400
    assert "unsupported" in exc_info.value.detail.lower()
