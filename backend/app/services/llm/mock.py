import re
import json
from typing import Optional, List, Dict
from collections import Counter
from app.services.llm.base import LLMProvider

class MockLLMProvider(LLMProvider):
    """
    Offline/Test Heuristic Provider used only when LLM_PROVIDER is explicitly set to 'mock' or 'test'.
    Extracts dates, actions, keywords, and summaries strictly from document text,
    without leaking prompt instructions.
    """
    @property
    def provider_name(self) -> str:
        return "Offline Test Provider (Mock)"

    async def check_health(self) -> bool:
        return True

    def _extract_doc_text(self, prompt: str) -> str:
        """Extract only document text from bounded tags, ignoring all prompt instructions."""
        # Check bounded XML-like tags first
        doc_match = re.search(r"<document_content>([\s\S]*?)</document_content>", prompt)
        if doc_match:
            return doc_match.group(1).strip()

        sec_match = re.search(r"<section_content>([\s\S]*?)</section_content>", prompt)
        if sec_match:
            return sec_match.group(1).strip()

        ctx_match = re.search(r"<document_context>([\s\S]*?)</document_context>", prompt)
        if ctx_match:
            return ctx_match.group(1).strip()

        # Legacy fallbacks with strict bounds
        if "DOCUMENT TEXT:" in prompt:
            parts = prompt.split("DOCUMENT TEXT:", 1)[1]
            # Strip anything after closing quotes or prompt schema instructions
            clean = re.split(r'"""|Please return ONLY|Return ONLY a JSON', parts)[0]
            return clean.strip()

        if "SECTION TEXT:" in prompt:
            parts = prompt.split("SECTION TEXT:", 1)[1]
            clean = re.split(r'"""|Return a JSON object|Please return ONLY', parts)[0]
            return clean.strip()

        if "SECTION SUMMARIES:" in prompt:
            parts = prompt.split("SECTION SUMMARIES:", 1)[1]
            clean = re.split(r'"""|Return ONLY a JSON', parts)[0]
            return clean.strip()

        return ""

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False
    ) -> str:
        # If Q&A / chat prompt
        if "USER QUESTION:" in prompt or "QUESTION:" in prompt:
            doc_text = self._extract_doc_text(prompt)
            q_match = re.search(r"USER QUESTION:\s*(.*?)(?:\n|$)", prompt)
            question = q_match.group(1).strip() if q_match else "your question"
            if doc_text:
                first_sentence = doc_text.split(".")[0]
                return f"Based on the document: {first_sentence}."
            return "The provided document does not contain information to answer this question."

        # If comparison prompt
        if "<document_1>" in prompt and "<document_2>" in prompt:
            doc1_match = re.search(r"<document_1>([\s\S]*?)</document_1>", prompt)
            doc2_match = re.search(r"<document_2>([\s\S]*?)</document_2>", prompt)
            d1_text = doc1_match.group(1).strip() if doc1_match else ""
            d2_text = doc2_match.group(1).strip() if doc2_match else ""
            res = {
                "doc1_title": "Document 1",
                "doc2_title": "Document 2",
                "comparison_summary": "Comparative analysis between Document 1 and Document 2.",
                "key_similarities": [
                    "Both documents discuss operational procedures.",
                    "Both documents share common project objectives."
                ],
                "key_differences": [
                    "Document 1 focuses on strategic vision.",
                    "Document 2 emphasizes operational execution."
                ],
                "recommendations": [
                    "Align milestone deliverables across both project phases.",
                    "Conduct a coordinated review with team leads."
                ]
            }
            return json.dumps(res)

        # Extract strictly document text
        doc_text = self._extract_doc_text(prompt)
        paragraphs = [p.strip() for p in doc_text.split("\n\n") if len(p.strip()) > 20]
        lines = [line.strip() for line in doc_text.split("\n") if len(line.strip()) > 15]

        # Executive summary
        if paragraphs:
            exec_summary = paragraphs[0]
            if len(paragraphs) > 1 and len(exec_summary) < 200:
                exec_summary += " " + paragraphs[1]
        elif lines:
            exec_summary = lines[0]
        else:
            exec_summary = "This document presents key findings, guidelines, and directives concerning the analyzed subject matter."

        # Detailed summary
        det_summary = "\n\n".join(paragraphs[:4]) if paragraphs else exec_summary

        # Key points from lines
        key_points = []
        for line in lines:
            clean_l = line.lstrip("-*#0123456789. ")
            # Ignore schema keywords or instruction words
            lower_l = clean_l.lower()
            if any(instr in lower_l for instr in ["return only", "json object", "matching the standard", "document text", "please analyze"]):
                continue
            if 20 < len(clean_l) < 180 and clean_l not in key_points:
                key_points.append(clean_l)
            if len(key_points) >= 5:
                break
        if not key_points:
            key_points = [
                "Primary document objectives and scope defined.",
                "Key operational milestones and performance indicators outlined.",
                "Resource allocation and team responsibilities established."
            ]

        # Extract dates
        date_pattern = re.compile(
            r'\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b|\b\d{4}-\d{2}-\d{2}\b|\bQ[1-4]\s+\d{4}\b',
            re.IGNORECASE
        )
        dates = []
        for line in lines:
            matches = date_pattern.findall(line)
            for m in matches:
                clean_date = f"{m} - {line[:60].strip('-*# ')}"
                if clean_date not in dates:
                    dates.append(clean_date)
            if len(dates) >= 4:
                break
        if not dates:
            for line in lines:
                if any(yr in line for yr in ["2024", "2025", "2026", "2027", "2028"]):
                    clean_date = line[:70].strip("-*# ")
                    if clean_date not in dates:
                        dates.append(clean_date)
                if len(dates) >= 3:
                    break

        # Extract action items
        action_keywords = ["must", "should", "will", "todo", "action", "assign", "complete", "submit", "deadline", "review", "deliver", "execute"]
        action_items = []
        for line in lines:
            line_lower = line.lower()
            if any(instr in line_lower for instr in ["return only", "json object", "matching the", "schema"]):
                continue
            if any(kw in line_lower for kw in action_keywords) and len(line) < 180:
                clean_task = line.lstrip("-*#0123456789. ")
                action_items.append({
                    "task_description": clean_task,
                    "responsible_person": "Project Lead",
                    "due_date": dates[0].split(" - ")[0] if dates else "Not specified",
                    "is_explicit": True
                })
            if len(action_items) >= 4:
                break

        if not action_items:
            action_items = [
                {
                    "task_description": "Review document recommendations and finalize proposed changes.",
                    "responsible_person": "Not specified",
                    "due_date": "Not specified",
                    "is_explicit": False
                }
            ]

        # Keywords
        words = [w.capitalize() for w in re.findall(r"[A-Za-z]{5,}", doc_text) if len(w) > 4]
        # Filter out common stop words and prompt words
        ignored = {"Document", "Return", "Object", "Please", "Section", "Summary", "Standard", "Schema", "Matching"}
        filtered_words = [w for w in words if w not in ignored]
        common = [w for w, _ in Counter(filtered_words).most_common(6)]
        keywords = common if common else ["Operations", "Strategy", "Analysis", "Planning"]

        # Classification
        text_lower = doc_text.lower()
        if "meeting" in text_lower or "attendees" in text_lower:
            doc_type = "Meeting Notes"
        elif "abstract" in text_lower or "methodology" in text_lower:
            doc_type = "Research Paper"
        elif "invoice" in text_lower or "financial" in text_lower or "agreement" in text_lower:
            doc_type = "Business Document"
        elif "report" in text_lower or "review" in text_lower:
            doc_type = "Report"
        else:
            doc_type = "General Document"

        # Check if caller expects a chunk response with "section_summary"
        if "section_summary" in prompt:
            chunk_result = {
                "section_summary": exec_summary,
                "key_points": key_points[:3],
                "action_items": action_items[:2],
                "dates": dates[:2]
            }
            return json.dumps(chunk_result)

        result = {
            "executive_summary": exec_summary,
            "detailed_summary": det_summary,
            "key_points": key_points,
            "action_items": action_items,
            "important_dates": dates,
            "keywords": keywords,
            "document_type": doc_type
        }
        return json.dumps(result)
