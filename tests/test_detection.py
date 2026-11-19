import pytest
import pandas as pd
from pathlib import Path
from backend.app.services.missing_values import detect_missing_values
from backend.app.services.duplicates import detect_duplicates
from backend.app.services.outliers import detect_outliers_and_anomalies
from backend.app.services.inconsistencies import detect_inconsistencies
from backend.app.services.scoring import calculate_quality_scores

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "online_store_orders.csv"

@pytest.fixture
def df():
    return pd.read_csv(DATA_PATH, keep_default_na=False)

def test_missing_values_detection(df):
    issues = detect_missing_values(df)
    assert len(issues) > 0
    categories = [i["category"] for i in issues]
    assert all(c == "Missing Values" for c in categories)
    cols = [i["column_name"] for i in issues]
    # Should detect missing in email, city, total_amount, rating
    assert "email" in cols
    assert "city" in cols
    assert "total_amount" in cols

def test_duplicates_detection(df):
    issues = detect_duplicates(df)
    assert len(issues) > 0
    # Must find exact duplicate rows
    exact_issues = [i for i in issues if "Exact Row Duplicates" in i["column_name"]]
    assert len(exact_issues) == 1
    assert exact_issues[0]["issue_count"] >= 10

def test_outliers_detection(df):
    issues = detect_outliers_and_anomalies(df)
    assert len(issues) > 0
    cols = [i["column_name"] for i in issues]
    # Must catch arithmetic mismatch in total_amount
    math_issues = [i for i in issues if "total_amount (Arithmetic Logic Mismatch)" in i["column_name"]]
    assert len(math_issues) == 1
    # Must catch impossible negative values or calendar impossible dates (e.g. 2026-02-30)
    date_issues = [i for i in issues if "order_date" in i["column_name"]]
    assert len(date_issues) >= 1

def test_inconsistencies_detection(df):
    issues = detect_inconsistencies(df)
    assert len(issues) > 0
    cols = [i["column_name"] for i in issues]
    # Must catch city spelling / historical variants (Bombay, etc.)
    assert "city" in cols
    # Must catch phone format issues (+91, hyphens, negatives, etc.)
    assert "phone" in cols
    # Must catch email formatting errors
    assert "email" in cols
    # Must catch payment method abbreviations
    assert "payment_method" in cols

def test_quality_scoring(df):
    issues = []
    issues.extend(detect_missing_values(df))
    issues.extend(detect_duplicates(df))
    issues.extend(detect_outliers_and_anomalies(df))
    issues.extend(detect_inconsistencies(df))
    
    scores = calculate_quality_scores(df, issues)
    assert 0 <= scores["overall_score"] <= 100
    assert 0 <= scores["completeness_score"] <= 100
    assert 0 <= scores["uniqueness_score"] <= 100
    assert 0 <= scores["validity_score"] <= 100
    assert 0 <= scores["consistency_score"] <= 100
    assert scores["quality_grade"] in ["Excellent", "Good", "Needs Improvement", "Poor"]
    assert "column_scores" in scores
    assert len(scores["column_scores"]) == len(df.columns)
