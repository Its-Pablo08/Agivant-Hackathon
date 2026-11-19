import pytest
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "healthy"

def test_load_sample_and_analyze():
    # 1. Load hackathon sample
    load_resp = client.post("/api/load-sample")
    assert load_resp.status_code == 200
    data = load_resp.json()
    dataset_id = data["dataset_id"]
    assert dataset_id == "sample_hackathon_orders"
    assert data["total_rows"] == 500
    assert data["total_columns"] == 13

    # 2. Analyze dataset
    analyze_resp = client.post(f"/api/analyze/{dataset_id}")
    assert analyze_resp.status_code == 200
    res = analyze_resp.json()
    assert res["status"] == "completed"
    assert "scores" in res
    assert "overall_score" in res["scores"]
    assert res["scores"]["overall_score"] > 0
    assert "issues_count" in res
    assert res["issues_count"] > 10

    # 3. Test get dashboard stats
    dash_resp = client.get("/api/dashboard")
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_datasets"] >= 1
    assert dash_data["total_records_processed"] >= 500
    assert dash_data["total_issues_detected"] > 0

    # 4. Test get profile
    prof_resp = client.get(f"/api/profile/{dataset_id}")
    assert prof_resp.status_code == 200
    assert len(prof_resp.json()["columns"]) == 13

    # 5. Test get issues
    issues_resp = client.get(f"/api/issues/{dataset_id}")
    assert issues_resp.status_code == 200
    assert len(issues_resp.json()) > 0

    # 6. Test clean preview & execution
    prev_resp = client.post(f"/api/clean/preview/{dataset_id}", json={"operation_type": "deduplicate_exact"})
    assert prev_resp.status_code == 200
    assert "sample_diffs" in prev_resp.json()

    clean_resp = client.post(f"/api/clean/{dataset_id}", json={"approved_operations": ["deduplicate_exact", "fix_arithmetic_totals", "standardize_cities"]})
    assert clean_resp.status_code == 200
    assert clean_resp.json()["cleaned_rows"] <= 500

    # 7. Test PDF report generation
    pdf_resp = client.get(f"/api/report/{dataset_id}")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000

    # 8. Test CSV and JSON exports
    csv_resp = client.get(f"/api/export/issues/{dataset_id}")
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]

    json_resp = client.get(f"/api/export/json/{dataset_id}")
    assert json_resp.status_code == 200
    assert json_resp.json()["metadata"]["application"] == "DataGuard AI"
