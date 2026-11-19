import pandas as pd
from typing import Dict, Any, List

def calculate_quality_scores(df: pd.DataFrame, issues: List[Dict[str, Any]]) -> Dict[str, Any]:
    total_rows, total_cols = df.shape
    total_cells = max(1, total_rows * total_cols)
    
    # Aggregate issue impacts by category
    missing_cells = 0
    duplicate_rows = 0
    invalid_cells = 0
    inconsistent_cells = 0
    
    # Column-level issue counts
    col_issue_counts = {col: 0 for col in df.columns}
    
    for issue in issues:
        cat = issue["category"]
        col = issue["column_name"]
        count = issue["issue_count"]
        
        # Track column issues
        if col in col_issue_counts:
            col_issue_counts[col] += count
        elif col.startswith("All Columns"):
            for c in df.columns:
                col_issue_counts[c] += (count / total_cols)
                
        if cat == "Missing Values":
            # For optional rating column, soften impact
            if "rating" in col.lower():
                missing_cells += (count * 0.2) # minor penalty for optional field
            else:
                missing_cells += count
        elif cat == "Duplicate Records":
            duplicate_rows = max(duplicate_rows, count)
        elif cat == "Numerical Outliers & Impossible Values":
            invalid_cells += count
        elif cat == "Inconsistent Values":
            inconsistent_cells += count
            
    # 1. Completeness Score (0-100)
    # Required non-missing values
    completeness = max(0.0, min(100.0, 100.0 - (missing_cells / total_cells * 100.0 * 2.5)))
    
    # 2. Uniqueness Score (0-100)
    uniqueness = max(0.0, min(100.0, 100.0 - (duplicate_rows / max(1, total_rows) * 100.0)))
    
    # 3. Validity Score (0-100)
    validity = max(0.0, min(100.0, 100.0 - (invalid_cells / total_cells * 100.0 * 3.0)))
    
    # 4. Consistency Score (0-100)
    consistency = max(0.0, min(100.0, 100.0 - (inconsistent_cells / total_cells * 100.0 * 2.0)))
    
    # Weighted Overall Score
    overall = (completeness * 0.30) + (uniqueness * 0.25) + (validity * 0.25) + (consistency * 0.20)
    overall = round(overall, 1)
    completeness = round(completeness, 1)
    uniqueness = round(uniqueness, 1)
    validity = round(validity, 1)
    consistency = round(consistency, 1)
    
    # Quality Grade Classification
    if overall >= 90.0:
        grade = "Excellent"
        summary = "Dataset exhibits exceptional structural integrity, minimal anomalies, and is ready for production analytical models."
    elif overall >= 75.0:
        grade = "Good"
        summary = "Dataset is generally sound with minor formatting or non-critical consistency variances that can be quickly sanitized."
    elif overall >= 50.0:
        grade = "Needs Improvement"
        summary = "Significant data quality issues detected across multiple dimensions (duplicates, format discrepancies, arithmetic mismatches). Cleaning required before reporting."
    else:
        grade = "Poor"
        summary = "Severe data quality degradation. Contains pervasive missing fields, invalid mathematical totals, and duplicate entities."
        
    # Column-wise scoring
    column_scores = {}
    for col in df.columns:
        issues_in_col = col_issue_counts.get(col, 0)
        # Deduct based on proportion of rows affected in column
        col_score = max(10.0, min(100.0, 100.0 - (issues_in_col / max(1, total_rows) * 100.0)))
        
        if col_score >= 90:
            c_grade = "Excellent"
        elif col_score >= 75:
            c_grade = "Good"
        elif col_score >= 50:
            c_grade = "Needs Improvement"
        else:
            c_grade = "Poor"
            
        column_scores[col] = {
            "score": round(col_score, 1),
            "grade": c_grade,
            "issues_count": int(issues_in_col)
        }
        
    return {
        "overall_score": overall,
        "completeness_score": completeness,
        "uniqueness_score": uniqueness,
        "validity_score": validity,
        "consistency_score": consistency,
        "quality_grade": grade,
        "grade_summary": summary,
        "column_scores": column_scores,
        "formula": "Overall = (Completeness × 0.30) + (Uniqueness × 0.25) + (Validity × 0.25) + (Consistency × 0.20)"
    }
