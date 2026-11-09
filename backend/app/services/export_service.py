import io
import csv
from typing import List
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from app.models.document import Document
from app.models.action_item import ActionItem

def generate_txt_export(doc: Document) -> str:
    lines = []
    lines.append("=" * 70)
    lines.append(f"AI DOCUMENT SUMMARY: {doc.filename}")
    lines.append(f"Generated on: {doc.updated_at.strftime('%Y-%m-%d %H:%M:%S') if doc.updated_at else ''}")
    lines.append(f"Document Type: {doc.document_type}")
    lines.append(f"Length: {doc.summary_length} | Style: {doc.summary_style} | Tone: {doc.summary_tone} | Language: {doc.summary_language}")
    lines.append("=" * 70)
    lines.append("\n[EXECUTIVE SUMMARY]")
    lines.append(doc.executive_summary or "No executive summary available.")

    lines.append("\n[DETAILED SUMMARY]")
    lines.append(doc.detailed_summary or "No detailed summary available.")

    if doc.key_points:
        lines.append("\n[KEY POINTS]")
        for idx, kp in enumerate(doc.key_points, 1):
            lines.append(f"  {idx}. {kp}")

    if doc.action_items:
        lines.append("\n[ACTION ITEMS]")
        for item in doc.action_items:
            type_tag = "[Explicit]" if item.is_explicit else "[Suggested]"
            status_tag = f"[{item.status}]"
            lines.append(f"  * {status_tag} {type_tag} {item.task_description}")
            lines.append(f"    - Assigned to: {item.responsible_person} | Due Date: {item.due_date}")

    if doc.important_dates:
        lines.append("\n[IMPORTANT DATES & DEADLINES]")
        for dt in doc.important_dates:
            lines.append(f"  * {dt}")

    if doc.keywords:
        lines.append("\n[KEYWORDS & TOPICS]")
        lines.append("  " + ", ".join(doc.keywords))

    lines.append("\n" + "=" * 70)
    return "\n".join(lines)

def generate_csv_action_items(items: List[ActionItem]) -> str:
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Task Description", "Responsible Person", "Due Date", "Status", "Type", "Created At"])
    for item in items:
        writer.writerow([
            item.id,
            item.task_description,
            item.responsible_person or "Not specified",
            item.due_date or "Not specified",
            item.status,
            "Explicit Task" if item.is_explicit else "AI Suggested",
            item.created_at.strftime("%Y-%m-%d %H:%M") if item.created_at else ""
        ])
    return output.getvalue()

def generate_pdf_report(doc: Document) -> bytes:
    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e3a8a"),
        spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=15
    )
    h2_style = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1e293b"),
        spaceBefore=14,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#334155"),
        spaceAfter=6
    )
    bullet_style = ParagraphStyle(
        "BulletItem",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        leftIndent=15,
        spaceAfter=4
    )

    story = []

    # Title & Metadata
    clean_title = (doc.filename or "Document Summary").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    story.append(Paragraph(clean_title, title_style))
    meta_info = f"Document Type: <b>{doc.document_type}</b> &nbsp;|&nbsp; Pages: <b>{doc.page_count}</b> &nbsp;|&nbsp; Words: <b>{doc.word_count}</b> &nbsp;|&nbsp; Date: <b>{doc.created_at.strftime('%b %d, %Y') if doc.created_at else ''}</b>"
    story.append(Paragraph(meta_info, subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e2e8f0"), spaceAfter=12))

    # Executive Summary
    story.append(Paragraph("Executive Summary", h2_style))
    exec_text = (doc.executive_summary or "No executive summary available.").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
    story.append(Paragraph(exec_text, body_style))
    story.append(Spacer(1, 8))

    # Key Points
    if doc.key_points:
        story.append(Paragraph("Key Points", h2_style))
        for kp in doc.key_points:
            safe_kp = str(kp).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(f"• {safe_kp}", bullet_style))
        story.append(Spacer(1, 8))

    # Action Items Table
    if doc.action_items:
        story.append(Paragraph("Extracted Action Items", h2_style))
        table_data = [["Task Description", "Assigned To", "Due Date", "Status"]]
        for item in doc.action_items:
            safe_desc = Paragraph(item.task_description.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"), bullet_style)
            safe_resp = item.responsible_person or "Not specified"
            safe_due = item.due_date or "Not specified"
            safe_status = item.status or "Pending"
            table_data.append([safe_desc, safe_resp, safe_due, safe_status])

        t = Table(table_data, colWidths=[270, 95, 95, 70])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        story.append(t)
        story.append(Spacer(1, 8))

    # Important Dates
    if doc.important_dates:
        story.append(Paragraph("Important Dates & Deadlines", h2_style))
        for dt in doc.important_dates:
            safe_dt = str(dt).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(f"📅 {safe_dt}", bullet_style))
        story.append(Spacer(1, 8))

    # Detailed Summary
    if doc.detailed_summary:
        story.append(Paragraph("Detailed Summary", h2_style))
        det_text = doc.detailed_summary.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\n", "<br/>")
        story.append(Paragraph(det_text, body_style))
        story.append(Spacer(1, 8))

    # Keywords
    if doc.keywords:
        story.append(Paragraph("Keywords & Topics", h2_style))
        kw_text = ", ".join(doc.keywords).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        story.append(Paragraph(kw_text, body_style))

    pdf.build(story)
    return buffer.getvalue()

