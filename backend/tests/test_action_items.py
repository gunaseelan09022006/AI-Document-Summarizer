import os
import io

SAMPLE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "sample_docs")

def test_action_item_updates_and_csv(client, auth_headers):
    # Upload and summarize document to create action items
    txt_path = os.path.join(SAMPLE_DIR, "sample_report.txt")
    with open(txt_path, "rb") as f:
        file_bytes = f.read()

    upload_res = client.post(
        "/api/documents/upload",
        files={"file": ("report_with_actions.txt", io.BytesIO(file_bytes), "text/plain")},
        headers=auth_headers
    )
    doc_id = upload_res.json()["id"]

    summary_res = client.post(
        f"/api/documents/{doc_id}/summarize",
        json={"length": "Medium", "style": "Structured Report", "tone": "Professional", "language": "English"},
        headers=auth_headers
    )
    assert summary_res.status_code == 200

    # Get action items
    actions_res = client.get(f"/api/action-items?document_id={doc_id}", headers=auth_headers)
    assert actions_res.status_code == 200
    items = actions_res.json()
    assert len(items) > 0

    first_item = items[0]
    item_id = first_item["id"]
    assert first_item["status"] == "Pending"

    # Update status to Completed
    patch_res = client.patch(
        f"/api/action-items/{item_id}",
        json={"status": "Completed"},
        headers=auth_headers
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Completed"

    # Export CSV
    csv_res = client.get("/api/action-items/export/csv", headers=auth_headers)
    assert csv_res.status_code == 200
    assert "Task Description" in csv_res.text
    assert "Completed" in csv_res.text

    # Delete action item
    del_res = client.delete(f"/api/action-items/{item_id}", headers=auth_headers)
    assert del_res.status_code == 200

