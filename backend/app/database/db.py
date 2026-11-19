import sqlite3
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from ..core.config import settings

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(settings.DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    # 1. datasets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS datasets (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size_bytes INTEGER DEFAULT 0,
        total_rows INTEGER DEFAULT 0,
        total_columns INTEGER DEFAULT 0,
        uploaded_at TEXT NOT NULL,
        analysis_status TEXT DEFAULT 'pending'
    )
    """)
    
    # 2. analysis_results
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS analysis_results (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        overall_score REAL NOT NULL,
        completeness_score REAL NOT NULL,
        uniqueness_score REAL NOT NULL,
        validity_score REAL NOT NULL,
        consistency_score REAL NOT NULL,
        quality_grade TEXT NOT NULL,
        column_scores_json TEXT,
        executive_summary TEXT,
        analyzed_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
    """)
    
    # 3. detected_issues
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detected_issues (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        category TEXT NOT NULL,
        column_name TEXT NOT NULL,
        severity TEXT NOT NULL,
        issue_count INTEGER NOT NULL,
        affected_rows_json TEXT,
        original_values_json TEXT,
        recommended_values_json TEXT,
        explanation TEXT,
        business_impact TEXT,
        recommendation TEXT,
        cleaning_code TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
    """)
    
    # 4. reports
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        report_path TEXT NOT NULL,
        report_type TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
    """)

    # 5. cleaned_datasets
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cleaned_datasets (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL,
        cleaned_path TEXT NOT NULL,
        total_rows INTEGER NOT NULL,
        total_columns INTEGER NOT NULL,
        applied_operations_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

# Database Helper Functions
def save_dataset(dataset_dict: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO datasets (id, filename, file_path, file_size_bytes, total_rows, total_columns, uploaded_at, analysis_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        dataset_dict["id"],
        dataset_dict["filename"],
        dataset_dict["file_path"],
        dataset_dict.get("file_size_bytes", 0),
        dataset_dict.get("total_rows", 0),
        dataset_dict.get("total_columns", 0),
        dataset_dict.get("uploaded_at", datetime.now(timezone.utc).isoformat()),
        dataset_dict.get("analysis_status", "pending")
    ))
    conn.commit()
    conn.close()

def update_dataset_status(dataset_id: str, status: str, total_rows: int = None, total_columns: int = None):
    conn = get_connection()
    cursor = conn.cursor()
    if total_rows is not None and total_columns is not None:
        cursor.execute("UPDATE datasets SET analysis_status = ?, total_rows = ?, total_columns = ? WHERE id = ?", (status, total_rows, total_columns, dataset_id))
    else:
        cursor.execute("UPDATE datasets SET analysis_status = ? WHERE id = ?", (status, dataset_id))
    conn.commit()
    conn.close()

def get_all_datasets() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets ORDER BY uploaded_at DESC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_dataset_by_id(dataset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM datasets WHERE id = ?", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_analysis_result(res: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO analysis_results 
    (id, dataset_id, overall_score, completeness_score, uniqueness_score, validity_score, consistency_score, quality_grade, column_scores_json, executive_summary, analyzed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        res["id"],
        res["dataset_id"],
        res["overall_score"],
        res["completeness_score"],
        res["uniqueness_score"],
        res["validity_score"],
        res["consistency_score"],
        res["quality_grade"],
        json.dumps(res.get("column_scores", {})),
        res.get("executive_summary", ""),
        res.get("analyzed_at", datetime.now(timezone.utc).isoformat())
    ))
    conn.commit()
    conn.close()

def get_analysis_result(dataset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_results WHERE dataset_id = ? ORDER BY analyzed_at DESC LIMIT 1", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("column_scores_json"):
        try:
            d["column_scores"] = json.loads(d["column_scores_json"])
        except:
            d["column_scores"] = {}
    return d

def save_detected_issues(dataset_id: str, issues: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    # Delete old issues for this dataset
    cursor.execute("DELETE FROM detected_issues WHERE dataset_id = ?", (dataset_id,))
    
    for issue in issues:
        cursor.execute("""
        INSERT INTO detected_issues 
        (id, dataset_id, category, column_name, severity, issue_count, affected_rows_json, original_values_json, recommended_values_json, explanation, business_impact, recommendation, cleaning_code, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            issue["id"],
            dataset_id,
            issue["category"],
            issue["column_name"],
            issue["severity"],
            issue["issue_count"],
            json.dumps(issue.get("affected_rows", [])),
            json.dumps(issue.get("original_values", [])),
            json.dumps(issue.get("recommended_values", [])),
            issue.get("explanation", ""),
            issue.get("business_impact", ""),
            issue.get("recommendation", ""),
            issue.get("cleaning_code", ""),
            datetime.now(timezone.utc).isoformat()
        ))
    conn.commit()
    conn.close()

def get_detected_issues(dataset_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM detected_issues WHERE dataset_id = ? ORDER BY CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 ELSE 4 END, issue_count DESC", (dataset_id,))
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for r in rows:
        item = dict(r)
        for key in ["affected_rows_json", "original_values_json", "recommended_values_json"]:
            if item.get(key):
                clean_key = key.replace("_json", "")
                try:
                    item[clean_key] = json.loads(item[key])
                except:
                    item[clean_key] = []
        result.append(item)
    return result

def save_cleaned_dataset(cleaned_dict: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT OR REPLACE INTO cleaned_datasets (id, dataset_id, cleaned_path, total_rows, total_columns, applied_operations_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        cleaned_dict["id"],
        cleaned_dict["dataset_id"],
        cleaned_dict["cleaned_path"],
        cleaned_dict["total_rows"],
        cleaned_dict["total_columns"],
        json.dumps(cleaned_dict.get("applied_operations", [])),
        datetime.now(timezone.utc).isoformat()
    ))
    conn.commit()
    conn.close()

def get_cleaned_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cleaned_datasets WHERE dataset_id = ? ORDER BY created_at DESC LIMIT 1", (dataset_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if d.get("applied_operations_json"):
        try:
            d["applied_operations"] = json.loads(d["applied_operations_json"])
        except:
            d["applied_operations"] = []
    return d

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) as total_datasets, COALESCE(SUM(total_rows), 0) as total_rows FROM datasets")
    d_row = cursor.fetchone()
    total_datasets = d_row["total_datasets"] if d_row else 0
    total_rows = d_row["total_rows"] if d_row else 0
    
    cursor.execute("SELECT COALESCE(SUM(issue_count), 0) as total_issues FROM detected_issues")
    i_row = cursor.fetchone()
    total_issues = i_row["total_issues"] if i_row else 0
    
    cursor.execute("SELECT AVG(overall_score) as avg_score FROM analysis_results")
    s_row = cursor.fetchone()
    avg_score = round(s_row["avg_score"], 1) if (s_row and s_row["avg_score"] is not None) else 0.0
    
    # Category distribution
    cursor.execute("SELECT category, SUM(issue_count) as count FROM detected_issues GROUP BY category")
    category_counts = {row["category"]: row["count"] for row in cursor.fetchall()}
    
    # Severity distribution
    cursor.execute("SELECT severity, COUNT(*) as count FROM detected_issues GROUP BY severity")
    severity_counts = {row["severity"]: row["count"] for row in cursor.fetchall()}
    
    # Recent scans with score
    cursor.execute("""
    SELECT d.id, d.filename, d.total_rows, d.total_columns, d.uploaded_at, d.analysis_status,
           a.overall_score, a.quality_grade, a.completeness_score, a.uniqueness_score, a.validity_score, a.consistency_score
    FROM datasets d
    LEFT JOIN analysis_results a ON d.id = a.dataset_id
    ORDER BY d.uploaded_at DESC
    LIMIT 6
    """)
    recent_scans = [dict(r) for r in cursor.fetchall()]
    
    conn.close()
    return {
        "total_datasets": total_datasets,
        "total_records_processed": total_rows,
        "total_issues_detected": total_issues,
        "average_quality_score": avg_score,
        "category_distribution": category_counts,
        "severity_distribution": severity_counts,
        "recent_scans": recent_scans
    }
