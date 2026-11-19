import os
import shutil
import uuid
import pandas as pd
from pathlib import Path
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse

from ..core.config import settings
from ..database import db
from ..services.profiling import profile_dataset
from ..services.missing_values import detect_missing_values
from ..services.duplicates import detect_duplicates
from ..services.outliers import detect_outliers_and_anomalies
from ..services.inconsistencies import detect_inconsistencies
from ..services.scoring import calculate_quality_scores
from ..services.ai_engine import generate_ai_insights, generate_fallback_ai_explanations
from ..services.cleaning import preview_cleaning_operation, apply_cleaning_pipeline
from ..services.report_generator import generate_pdf_report, export_issues_to_csv, export_analysis_to_json
from ..schemas.responses import CleanRequest, CleanPreviewRequest, GeminiKeyRequest, ExplainRequest

router = APIRouter(prefix="/api")

# Memory cache for active profiling results (persists during server uptime)
_PROFILE_CACHE = {}

def read_csv_safe(file_path: Path) -> pd.DataFrame:
    """
    Safely reads CSV files handling encodings, BOM, and blank string preservation.
    """
    try:
        return pd.read_csv(file_path, encoding="utf-8", keep_default_na=False)
    except UnicodeDecodeError:
        try:
            return pd.read_csv(file_path, encoding="latin1", keep_default_na=False)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Encoding error reading CSV: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    """
    Uploads and validates a CSV file (up to MAX_UPLOAD_SIZE_MB).
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files (.csv) are supported.")
        
    dataset_id = str(uuid.uuid4())
    safe_filename = f"{dataset_id}_{Path(file.filename).name}"
    save_path = settings.UPLOADS_DIR / safe_filename
    
    # Save file
    try:
        with open(save_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save uploaded file: {str(e)}")
        
    file_size = save_path.stat().st_size
    if file_size > settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_MB}MB.")
        
    df = read_csv_safe(save_path)
    total_rows, total_cols = df.shape
    
    if total_rows == 0:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Uploaded CSV file is completely empty.")
        
    # Preview sample
    preview_rows = df.head(5).to_dict(orient="records")
    column_names = list(df.columns)
    
    # Record in DB
    dataset_info = {
        "id": dataset_id,
        "filename": file.filename,
        "file_path": str(save_path),
        "file_size_bytes": file_size,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "analysis_status": "uploaded"
    }
    db.save_dataset(dataset_info)
    
    return {
        "message": "File uploaded successfully.",
        "dataset_id": dataset_id,
        "filename": file.filename,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "columns": column_names,
        "preview": preview_rows
    }

@router.post("/load-sample")
def load_sample_hackathon_dataset():
    """
    Convenience endpoint for judges to instantly load the official 500-order hackathon dataset.
    """
    sample_path = settings.DATA_DIR / "online_store_orders.csv"
    if not sample_path.exists():
        raise HTTPException(status_code=404, detail="online_store_orders.csv not found in data directory.")
        
    dataset_id = "sample_hackathon_orders"
    dest_path = settings.UPLOADS_DIR / f"{dataset_id}_online_store_orders.csv"
    shutil.copyfile(sample_path, dest_path)
    
    df = read_csv_safe(dest_path)
    total_rows, total_cols = df.shape
    
    dataset_info = {
        "id": dataset_id,
        "filename": "online_store_orders.csv",
        "file_path": str(dest_path),
        "file_size_bytes": dest_path.stat().st_size,
        "total_rows": total_rows,
        "total_columns": total_cols,
        "analysis_status": "uploaded"
    }
    db.save_dataset(dataset_info)
    
    return {
        "message": "Hackathon dataset loaded successfully.",
        "dataset_id": dataset_id,
        "filename": "online_store_orders.csv",
        "total_rows": total_rows,
        "total_columns": total_cols,
        "columns": list(df.columns),
        "preview": df.head(5).to_dict(orient="records")
    }

@router.post("/analyze/{dataset_id}")
def analyze_dataset(dataset_id: str):
    """
    Executes full pipeline: profiling, 4 detection engines, quality scoring, and AI explanation generation.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    file_path = Path(dataset["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Dataset file missing on disk.")
        
    df = read_csv_safe(file_path)
    
    # 1. Profile dataset
    profile = profile_dataset(df)
    _PROFILE_CACHE[dataset_id] = profile
    
    # 2. Run All 4 Detection Engines
    issues = []
    issues.extend(detect_missing_values(df))
    issues.extend(detect_duplicates(df))
    issues.extend(detect_outliers_and_anomalies(df))
    issues.extend(detect_inconsistencies(df))
    
    # 3. Calculate 4-Dimension Quality Scores
    scores = calculate_quality_scores(df, issues)
    
    # 4. Generate AI Insights / Rule-based Fallback
    ai_insights = generate_ai_insights(profile["columns"], issues, scores)
    
    # 5. Persist to SQLite
    db.save_detected_issues(dataset_id, issues)
    
    analysis_record = {
        "id": str(uuid.uuid4()),
        "dataset_id": dataset_id,
        "overall_score": scores["overall_score"],
        "completeness_score": scores["completeness_score"],
        "uniqueness_score": scores["uniqueness_score"],
        "validity_score": scores["validity_score"],
        "consistency_score": scores["consistency_score"],
        "quality_grade": scores["quality_grade"],
        "column_scores": scores["column_scores"],
        "executive_summary": ai_insights.get("executive_summary", scores["grade_summary"])
    }
    db.save_analysis_result(analysis_record)
    db.update_dataset_status(dataset_id, "analyzed", total_rows=df.shape[0], total_columns=df.shape[1])
    
    return {
        "dataset_id": dataset_id,
        "status": "completed",
        "scores": scores,
        "profile": profile,
        "issues_count": len(issues),
        "total_anomalies": sum(i["issue_count"] for i in issues),
        "ai_insights": ai_insights
    }

@router.get("/dashboard")
def get_dashboard():
    """
    Returns real aggregated analytics for the main dashboard.
    """
    return db.get_dashboard_stats()

@router.get("/datasets")
def list_datasets():
    """
    Returns history of all uploaded datasets.
    """
    return db.get_all_datasets()

@router.get("/datasets/{dataset_id}")
def get_dataset(dataset_id: str):
    """
    Returns metadata for a specific dataset.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    return dataset

@router.get("/profile/{dataset_id}")
def get_profile(dataset_id: str):
    """
    Returns column profiling dashboard data.
    """
    if dataset_id in _PROFILE_CACHE:
        return _PROFILE_CACHE[dataset_id]
        
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    df = read_csv_safe(Path(dataset["file_path"]))
    profile = profile_dataset(df)
    _PROFILE_CACHE[dataset_id] = profile
    return profile

@router.get("/issues/{dataset_id}")
def get_issues(dataset_id: str):
    """
    Returns all detected issues for the dataset.
    """
    return db.get_detected_issues(dataset_id)

@router.get("/score/{dataset_id}")
def get_score(dataset_id: str):
    """
    Returns quality score card.
    """
    res = db.get_analysis_result(dataset_id)
    if not res:
        raise HTTPException(status_code=404, detail="Dataset has not been analyzed yet.")
    return res

@router.post("/ai/explain/{dataset_id}")
def generate_explanations(dataset_id: str, req: Optional[ExplainRequest] = None):
    """
    Triggers or re-generates AI explanations with optional user-supplied Gemini API key.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    profile = _PROFILE_CACHE.get(dataset_id)
    if not profile:
        df = read_csv_safe(Path(dataset["file_path"]))
        profile = profile_dataset(df)
        _PROFILE_CACHE[dataset_id] = profile
        
    issues = db.get_detected_issues(dataset_id)
    scores = db.get_analysis_result(dataset_id) or {}
    
    api_key_override = req.api_key if req and req.api_key else None
    insights = generate_ai_insights(profile["columns"], issues, scores, api_key_override=api_key_override)
    return insights

@router.post("/clean/preview/{dataset_id}")
def preview_clean(dataset_id: str, req: CleanPreviewRequest):
    """
    Returns sample diff preview for a proposed cleaning operation.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    df = read_csv_safe(Path(dataset["file_path"]))
    return preview_cleaning_operation(df, req.operation_type)

@router.post("/clean/{dataset_id}")
def clean_dataset(dataset_id: str, req: CleanRequest):
    """
    Executes approved cleaning operations on a copy of the dataset and saves cleaned CSV.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    df = read_csv_safe(Path(dataset["file_path"]))
    cleaned_df = apply_cleaning_pipeline(df, req.approved_operations)
    
    cleaned_id = str(uuid.uuid4())
    cleaned_filename = f"cleaned_{dataset['filename']}"
    cleaned_path = settings.CLEANED_DIR / f"{cleaned_id}_{cleaned_filename}"
    cleaned_df.to_csv(cleaned_path, index=False)
    
    # Save cleaned record
    cleaned_record = {
        "id": cleaned_id,
        "dataset_id": dataset_id,
        "cleaned_path": str(cleaned_path),
        "total_rows": cleaned_df.shape[0],
        "total_columns": cleaned_df.shape[1],
        "applied_operations": req.approved_operations
    }
    db.save_cleaned_dataset(cleaned_record)
    
    return {
        "message": "Dataset cleaned successfully.",
        "cleaned_id": cleaned_id,
        "original_rows": df.shape[0],
        "cleaned_rows": cleaned_df.shape[0],
        "applied_operations": req.approved_operations,
        "download_url": f"/api/export/cleaned/{dataset_id}",
        "preview": cleaned_df.head(5).to_dict(orient="records")
    }

@router.get("/report/{dataset_id}")
def download_pdf_report(dataset_id: str):
    """
    Generates and serves the PDF data quality report.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
        
    profile = _PROFILE_CACHE.get(dataset_id)
    if not profile:
        df = read_csv_safe(Path(dataset["file_path"]))
        profile = profile_dataset(df)
        
    scores = db.get_analysis_result(dataset_id) or {}
    issues = db.get_detected_issues(dataset_id)
    ai_insights = generate_fallback_ai_explanations(profile["columns"], issues, scores)
    
    report_filename = f"DataGuard_Report_{Path(dataset['filename']).stem}.pdf"
    report_path = settings.REPORTS_DIR / report_filename
    
    generate_pdf_report(dataset, profile, scores, issues, ai_insights, str(report_path))
    return FileResponse(path=report_path, filename=report_filename, media_type="application/pdf")

@router.get("/export/issues/{dataset_id}")
def export_issues(dataset_id: str):
    """
    Downloads CSV file of all detected issues.
    """
    issues = db.get_detected_issues(dataset_id)
    export_path = settings.REPORTS_DIR / f"issues_{dataset_id}.csv"
    export_issues_to_csv(issues, str(export_path))
    return FileResponse(path=export_path, filename=f"detected_issues_{dataset_id}.csv", media_type="text/csv")

@router.get("/export/cleaned/{dataset_id}")
def export_cleaned(dataset_id: str):
    """
    Downloads cleaned CSV dataset.
    """
    cleaned = db.get_cleaned_dataset(dataset_id)
    if not cleaned or not Path(cleaned["cleaned_path"]).exists():
        raise HTTPException(status_code=404, detail="Cleaned dataset not found. Please run cleaning operations first.")
    return FileResponse(path=cleaned["cleaned_path"], filename=f"cleaned_dataset.csv", media_type="text/csv")

@router.get("/export/json/{dataset_id}")
def export_json(dataset_id: str):
    """
    Downloads comprehensive analysis JSON.
    """
    dataset = db.get_dataset_by_id(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found.")
    profile = _PROFILE_CACHE.get(dataset_id) or profile_dataset(read_csv_safe(Path(dataset["file_path"])))
    scores = db.get_analysis_result(dataset_id) or {}
    issues = db.get_detected_issues(dataset_id)
    ai_insights = generate_fallback_ai_explanations(profile["columns"], issues, scores)
    
    json_path = settings.REPORTS_DIR / f"analysis_{dataset_id}.json"
    export_analysis_to_json(dataset, profile, scores, issues, ai_insights, str(json_path))
    return FileResponse(path=json_path, filename=f"dataguard_analysis_{dataset_id}.json", media_type="application/json")

@router.get("/settings/status")
def get_settings_status():
    """
    Returns status of Gemini API configuration.
    """
    has_key = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip() != "" and settings.GEMINI_API_KEY != "your_gemini_api_key_here")
    masked_key = ""
    if has_key:
        k = settings.GEMINI_API_KEY.strip()
        masked_key = k[:4] + "..." + k[-4:] if len(k) > 8 else "***"
    return {
        "gemini_configured": has_key,
        "masked_key": masked_key,
        "model": settings.GEMINI_MODEL,
        "fallback_available": True
    }

@router.post("/settings/gemini-key")
def update_gemini_key(req: GeminiKeyRequest):
    """
    Updates Gemini API key dynamically at runtime.
    """
    key = req.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty.")
    settings.GEMINI_API_KEY = key
    
    # Test key
    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        resp = model.generate_content("Ping")
        return {"status": "success", "message": "Google Gemini API key verified and saved successfully!"}
    except Exception as e:
        return {"status": "warning", "message": f"Key saved, but test call returned: {str(e)}. Fallback engine will be active if needed."}
