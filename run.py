#!/usr/bin/env python3
"""
DataGuard AI — Startup Script
Runs the unified FastAPI + React server on http://localhost:8000
"""
import uvicorn
import os
import sys
from pathlib import Path

# Add current directory to PYTHONPATH
root_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(root_dir))

if __name__ == "__main__":
    print("================================================================")
    print("  🛡️  DataGuard AI – Intelligent Data Quality & Anomaly Detection Agent")
    print("  Tagline: Clean Data. Confident Decisions.")
    print("================================================================")
    print("  🚀 Starting Unified Application Server on http://localhost:8000")
    print("  📖 API Interactive Docs (Swagger): http://localhost:8000/docs")
    print("================================================================")
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
