import re
import os
import shutil
import logging
import pymupdf
from docx import Document as DocxDocument
from typing import Tuple, Optional
from fastapi import HTTPException, status

logger = logging.getLogger("document_parser")
logger.setLevel(logging.INFO)

def clean_and_normalize_text(text: str) -> str:
    """
    Normalize extracted text, clean whitespace, fix line-wrap hyphenation,
    and remove extraction artifacts without altering meaningful content.
    """
    if not text:
        return ""

    # Normalize line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Replace special unicode spaces and zero-width artifacts
    text = text.replace("\u00a0", " ").replace("\u200b", "").replace("\ufeff", "")

    # Standardize unicode quotes and hyphens/dashes
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    text = text.replace("—", " - ").replace("–", " - ")

    # Rejoin words broken across line breaks with hyphens (e.g., "intel-\nligence" -> "intelligence")
    text = re.sub(r"([A-Za-z]{2,})-\n([A-Za-z]{2,})", r"\1\2", text)

    # Strip unprintable control characters except newline and tab
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]", "", text)

    # Collapse 3 or more consecutive newlines to maximum 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Normalize spaces on each line while preserving indentation/paragraphs
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in text.split("\n")]
    cleaned = "\n".join(lines).strip()
    return cleaned

def get_sanitized_preview(text: str, max_chars: int = 140) -> str:
    """
    Generate a sanitized text preview for logging and debugging without
    exposing sensitive document data (emails, phone numbers, identifiers).
    """
    if not text:
        return "[Empty Document]"
    preview = text[:max_chars].strip()
    preview = re.sub(r"\S+@\S+", "[EMAIL]", preview)
    preview = re.sub(r"\b\d{4,}\b", "[NUM]", preview)
    preview = re.sub(r"\s+", " ", preview)
    return preview

def extract_text_from_pdf(file_path: str) -> Tuple[str, int, bool]:
    """
    Extract text from PDF using PyMuPDF (pymupdf).
    Detects scanned image-only PDFs, attempts OCR fallback if available,
    and returns (cleaned_text, page_count, ocr_applied).
    """
    try:
        doc = pymupdf.open(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read PDF file. File may be corrupted or password-protected. Error: {str(e)}"
        )

    page_count = len(doc)
    if page_count == 0:
        doc.close()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF contains no pages."
        )

    full_text_parts = []
    for page_idx in range(page_count):
        page = doc[page_idx]
        page_text = page.get_text("text")
        if page_text and page_text.strip():
            full_text_parts.append(page_text.strip())

    doc.close()
    raw_text = "\n\n".join(full_text_parts)
    cleaned_text = clean_and_normalize_text(raw_text)

    # Scanned PDF detection: check if text density is negligible
    total_chars = len(cleaned_text.strip())
    avg_chars_per_page = total_chars / max(1, page_count)
    ocr_applied = False

    if total_chars < 50 or avg_chars_per_page < 30:
        # Check if tesseract OCR is available on the host system
        tesseract_available = shutil.which("tesseract") is not None
        if tesseract_available:
            try:
                import pytesseract
                from PIL import Image
                import io

                doc = pymupdf.open(file_path)
                ocr_parts = []
                for page_idx in range(page_count):
                    page = doc[page_idx]
                    pix = page.get_pixmap(dpi=150)
                    img = Image.open(io.BytesIO(pix.tobytes("png")))
                    page_ocr = pytesseract.image_to_string(img)
                    if page_ocr and page_ocr.strip():
                        ocr_parts.append(page_ocr.strip())
                doc.close()

                ocr_text = clean_and_normalize_text("\n\n".join(ocr_parts))
                if len(ocr_text.strip()) >= 30:
                    cleaned_text = ocr_text
                    ocr_applied = True
            except Exception as ocr_err:
                logger.warning(f"OCR attempt failed: {ocr_err}")

        # If still insufficient or empty after OCR attempt
        if not cleaned_text or len(cleaned_text.strip()) < 30:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "This PDF appears to be a scanned document or image containing no selectable text. "
                    "Please upload a text-searchable document or ensure OCR is applied to the file before uploading."
                )
            )

    logger.info(
        "PDF extraction complete: pages=%d, total_chars=%d, ocr=%s, preview='%s...'",
        page_count, len(cleaned_text), ocr_applied, get_sanitized_preview(cleaned_text)
    )
    return cleaned_text, page_count, ocr_applied

def extract_text_from_docx(file_path: str) -> Tuple[str, int, bool]:
    """Extract text from DOCX file using python-docx."""
    try:
        doc = DocxDocument(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to read DOCX file. File may be corrupted or invalid. Error: {str(e)}"
        )

    text_parts = []
    # Extract from paragraphs
    for p in doc.paragraphs:
        if p.text.strip():
            text_parts.append(p.text)

    # Extract from tables
    for table in doc.tables:
        for row in table.rows:
            row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if row_text:
                text_parts.append(" | ".join(row_text))

    raw_text = "\n\n".join(text_parts)
    cleaned_text = clean_and_normalize_text(raw_text)

    if not cleaned_text or len(cleaned_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded DOCX file contains no readable text."
        )

    # DOCX does not have fixed pages; estimate 450 words per page
    words = cleaned_text.split()
    page_count = max(1, (len(words) + 449) // 450)
    logger.info(
        "DOCX extraction complete: pages_est=%d, total_chars=%d, words=%d, preview='%s...'",
        page_count, len(cleaned_text), len(words), get_sanitized_preview(cleaned_text)
    )
    return cleaned_text, page_count, False

def extract_text_from_txt(file_path: str) -> Tuple[str, int, bool]:
    """Extract text from TXT file with multi-encoding fallback."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    raw_text = None

    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                raw_text = f.read()
            break
        except (UnicodeDecodeError, LookupError):
            continue

    if raw_text is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not decode the text file with supported character encodings."
        )

    cleaned_text = clean_and_normalize_text(raw_text)
    if not cleaned_text or len(cleaned_text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded TXT file is empty or contains no readable text."
        )

    words = cleaned_text.split()
    page_count = max(1, (len(words) + 449) // 450)
    logger.info(
        "TXT extraction complete: pages_est=%d, total_chars=%d, words=%d, preview='%s...'",
        page_count, len(cleaned_text), len(words), get_sanitized_preview(cleaned_text)
    )
    return cleaned_text, page_count, False

def parse_document(file_path: str, file_type: str) -> Tuple[str, int, int, bool]:
    """
    Parse document, extract and validate text.
    Returns: (cleaned_text, page_count, word_count, ocr_applied)
    """
    ext = file_type.lower().strip(".")
    if ext == "pdf":
        text, pages, ocr = extract_text_from_pdf(file_path)
    elif ext == "docx":
        text, pages, ocr = extract_text_from_docx(file_path)
    elif ext == "txt":
        text, pages, ocr = extract_text_from_txt(file_path)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Supported formats are: PDF, DOCX, TXT."
        )

    # Security check: Ensure we never accept empty or zero-content documents
    if not text or len(text.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"The uploaded {ext.upper()} document contains no extractable text content."
        )

    word_count = len(text.split())
    return text, pages, word_count, ocr
