import os
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import fitz # PyMuPDF

os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
sample_dir = os.path.dirname(os.path.abspath(__file__))

styles = getSampleStyleSheet()

# 1. Generate sample_meeting.docx
docx_path = os.path.join(sample_dir, "sample_meeting.docx")
doc = Document()
doc.add_heading("Sprint Planning & Architecture Sync", level=1)
doc.add_paragraph("Date: October 18, 2026 | Attendees: Alex Kumar, Linda Zhao, Robert Taylor")
doc.add_paragraph("Objective: Review upcoming technical debt and assign critical sprint deliverables for document processing.")

doc.add_heading("Discussion Highlights", level=2)
doc.add_paragraph("The engineering squad reviewed customer incidents regarding large document parsing timeouts.")
doc.add_paragraph("Robert presented benchmarks showing PyMuPDF performs 12x faster than traditional PDF parsers.")

doc.add_heading("Action Items", level=2)
p1 = doc.add_paragraph()
p1.add_run("Task 1: Migrate document parser to PyMuPDF and implement streaming upload chunks. Assigned to Robert Taylor. Deadline: October 28, 2026.")
p2 = doc.add_paragraph()
p2.add_run("Task 2: Implement JWT refresh rotation and invalidate revoked bearer tokens. Assigned to Linda Zhao. Deadline: November 4, 2026.")
p3 = doc.add_paragraph()
p3.add_run("Task 3: Create automated unit tests for PDF and DOCX parser validation. Assigned to Alex Kumar. Deadline: October 30, 2026.")

doc.save(docx_path)
print(f"Created: {docx_path}")

# 2. Generate sample_paper.pdf
pdf_path = os.path.join(sample_dir, "sample_paper.pdf")
pdf = SimpleDocTemplate(pdf_path, pagesize=letter)
story = [
    Paragraph("Neural Document Understanding in Distributed Systems", styles["Title"]),
    Paragraph("Author: Research & Development Institute, October 2026", styles["Italic"]),
    Spacer(1, 12),
    Paragraph("Abstract", styles["Heading2"]),
    Paragraph("We investigate high-speed semantic document chunking using recursive token estimation. Traditional chunking strategies suffer from boundary fractures when dealing with multi-column legal briefs and academic papers. Our framework maintains 98.4% contextual cohesion across 10,000 test documents.", styles["BodyText"]),
    Spacer(1, 10),
    Paragraph("Key Milestones", styles["Heading2"]),
    Paragraph("1. November 12, 2026: Benchmark validation across multi-lingual corpora.", styles["BodyText"]),
    Paragraph("2. December 1, 2026: Publication of open source dataset and model weights.", styles["BodyText"]),
    Spacer(1, 10),
    Paragraph("Required Follow-up Tasks", styles["Heading2"]),
    Paragraph("Action: Benchmark throughput on ARM64 cloud instances. Responsible: Dr. Vance. Due Date: November 15, 2026.", styles["BodyText"])
]
pdf.build(story)
print(f"Created: {pdf_path}")

# 3. Generate sample_executive_report.pdf (Multi-page comprehensive report)
exec_report_path = os.path.join(sample_dir, "sample_executive_report.pdf")
exec_pdf = SimpleDocTemplate(exec_report_path, pagesize=letter)
exec_story = [
    Paragraph("Global Enterprise Cloud Modernization & AI Strategy 2026-2027", styles["Title"]),
    Paragraph("Prepared by: Strategic Technology Committee | Date: November 2, 2026", styles["Italic"]),
    Spacer(1, 14),
    Paragraph("Executive Overview", styles["Heading1"]),
    Paragraph(
        "This strategic document outlines the multi-year migration plan to modernize enterprise document intelligence "
        "and data workflows across all regional operations. Over the next twelve months, the organization will decommission legacy "
        "on-premises archive servers and deploy an enterprise-grade AI-assisted document processing architecture.",
        styles["BodyText"]
    ),
    Spacer(1, 10),
    Paragraph("Financial & Operational Goals", styles["Heading2"]),
    Paragraph(
        "The project has an allocated capital expenditure budget of $4.2 million. Expected operational cost reductions "
        "are projected at 34% by Q3 2027, with a payback period estimated at 18 months. Document processing cycle time will decrease from "
        "4 business days to under 4 minutes.",
        styles["BodyText"]
    ),
    Spacer(1, 10),
    Paragraph("Key Milestones & Critical Dates", styles["Heading2"]),
    Paragraph("• December 15, 2026: Complete vendor security audits and FedRAMP compliance review.", styles["BodyText"]),
    Paragraph("• January 20, 2027: Beta deployment of the automated PDF summarization and OCR pipeline.", styles["BodyText"]),
    Paragraph("• March 31, 2027: Full decommission of legacy storage arrays.", styles["BodyText"]),
    Spacer(1, 14),
    PageBreak(),
    Paragraph("Action Items & Workstream Ownership", styles["Heading1"]),
    Paragraph("The following mandatory action items must be completed by the designated workstream owners:", styles["BodyText"]),
    Spacer(1, 8),
    Paragraph("1. Finalize hybrid cloud data encryption keys and IAM security boundaries. Responsible: Sarah Jenkins (Security Lead). Deadline: December 1, 2026.", styles["BodyText"]),
    Paragraph("2. Deploy regional FastAPI microservices with PyMuPDF parser engines and rate limiters. Responsible: David Chen (Lead Architect). Deadline: December 18, 2026.", styles["BodyText"]),
    Paragraph("3. Conduct comprehensive penetration testing and SOC2 Type II audit. Responsible: CyberSecurity Group. Deadline: January 15, 2027.", styles["BodyText"]),
    Paragraph("4. Deliver end-user training sessions for operations personnel across EMEA and APAC. Responsible: Maria Santos. Deadline: February 10, 2027.", styles["BodyText"]),
    Spacer(1, 14),
    Paragraph("Conclusions & Governance", styles["Heading2"]),
    Paragraph(
        "Bi-weekly steering committee meetings will convene every other Tuesday to monitor execution progress against milestones. "
        "All escalated architectural exceptions must be submitted to the Technology Governance Board.",
        styles["BodyText"]
    )
]
exec_pdf.build(exec_story)
print(f"Created: {exec_report_path}")

# 4. Generate empty_document.pdf (A blank page PDF with no text)
empty_pdf_path = os.path.join(sample_dir, "empty_document.pdf")
doc_empty = fitz.open()
doc_empty.new_page() # blank page
doc_empty.save(empty_pdf_path)
doc_empty.close()
print(f"Created: {empty_pdf_path}")

# 5. Create empty_document.txt
empty_path = os.path.join(sample_dir, "empty_document.txt")
with open(empty_path, "w", encoding="utf-8") as f:
    f.write("   \n\n   ")
print(f"Created: {empty_path}")
