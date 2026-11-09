import os
import io
import pytest
from fastapi import HTTPException
from app.core.config import settings
from app.services.parser import parse_document, extract_text_from_pdf
from app.services.llm.gemini import GeminiProvider
from app.services.llm.mock import MockLLMProvider
from app.services.summarizer import (
    summarize_document,
    parse_and_validate_summary_json,
    sanitize_text,
    deduplicate_list,
    SYSTEM_SUMMARIZER_PROMPT
)
from app.schemas.summary import SummaryOptions

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_docs")

def test_multipage_executive_pdf_extraction():
    """Verify PyMuPDF extracts rich text across multiple pages with accurate metadata."""
    pdf_path = os.path.join(SAMPLE_DIR, "sample_executive_report.pdf")
    text, pages, ocr = extract_text_from_pdf(pdf_path)

    assert pages == 2
    assert "Global Enterprise Cloud Modernization" in text
    assert "Sarah Jenkins" in text
    assert "David Chen" in text
    assert "December 15, 2026" in text
    assert len(text) > 400

def test_empty_pdf_rejection():
    """Verify empty or zero-text PDF raises 422 with clear OCR explanation."""
    pdf_path = os.path.join(SAMPLE_DIR, "empty_document.pdf")
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_pdf(pdf_path)

    assert exc_info.value.status_code == 422
    assert "empty" in exc_info.value.detail.lower() or "ocr" in exc_info.value.detail.lower()

@pytest.mark.asyncio
async def test_gemini_missing_api_key_raises_clear_error():
    """Verify GeminiProvider raises clear HTTP 400 with setup instructions if API key is missing."""
    provider = GeminiProvider(api_key="")
    with pytest.raises(HTTPException) as exc_info:
        await provider.generate(prompt="Test prompt")

    assert exc_info.value.status_code == 400
    assert "GEMINI_API_KEY" in exc_info.value.detail
    assert "backend/.env" in exc_info.value.detail

@pytest.mark.asyncio
async def test_mock_provider_never_leaks_prompt_instructions():
    """Verify MockLLMProvider extracts strictly document text without schema or prompt leakage."""
    provider = MockLLMProvider()
    doc_text = (
        "Project Alpha Kickoff Meeting\n"
        "Date: November 15, 2026\n"
        "Lead Engineer Robert Garcia must complete database sharding architecture by December 5, 2026.\n"
        "Linda Miller will coordinate user testing sessions."
    )
    prompt = f"""Please analyze the following document text and produce a structured analysis.
<document_content>
{doc_text}
</document_content>
Return ONLY a JSON object matching the standard schema with keys:
executive_summary, detailed_summary, key_points, action_items, important_dates, keywords, document_type.
"""
    raw_response = await provider.generate(prompt=prompt, system_prompt=SYSTEM_SUMMARIZER_PROMPT, json_mode=True)
    summary = parse_and_validate_summary_json(raw_response)

    # Check executive summary
    assert "Return ONLY a JSON object" not in summary.executive_summary
    assert "standard schema" not in summary.executive_summary
    assert "smart heuristic parser" not in summary.executive_summary
    assert "Set GEMINI_API_KEY" not in summary.executive_summary

    # Check key points
    for point in summary.key_points:
        assert "Return ONLY a JSON" not in point
        assert "schema" not in point.lower()

    # Check action items
    for item in summary.action_items:
        assert "Return ONLY a JSON" not in item.task_description
        assert "schema" not in item.task_description.lower()

def test_sanitize_text_removes_leakage():
    """Verify prompt leakage phrases are scrubbed cleanly."""
    leaked = (
        "Here is the executive summary: Return ONLY a JSON object matching the standard schema. "
        "The project launched in Q3. Generated via smart heuristic parser. Set GEMINI_API_KEY in .env for full LLM analysis."
    )
    cleaned = sanitize_text(leaked)
    assert "Return ONLY a JSON object" not in cleaned
    assert "matching the standard schema" not in cleaned
    assert "Generated via smart heuristic parser" not in cleaned
    assert "Set GEMINI_API_KEY in .env" not in cleaned
    assert "The project launched in Q3." in cleaned

def test_deduplicate_list_preserves_unique():
    """Verify deduplication removes redundant points while preserving order."""
    items = [
        "First key point regarding project architecture.",
        "Second key point regarding cloud migration.",
        "first key point regarding project architecture", # Duplicate
        "  SECOND KEY POINT REGARDING CLOUD MIGRATION. ", # Duplicate
        "Return ONLY a JSON object matching standard schema", # Leaked prompt
        "Third distinct point."
    ]
    deduped = deduplicate_list(items)
    assert len(deduped) == 3
    assert deduped[0] == "First key point regarding project architecture."
    assert deduped[1] == "Second key point regarding cloud migration."
    assert deduped[2] == "Third distinct point."

