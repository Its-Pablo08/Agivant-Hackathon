import os
import json
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from ..core.config import settings

def generate_pdf_report(
    dataset_info: Dict[str, Any],
    profile_info: Dict[str, Any],
    quality_scores: Dict[str, Any],
    issues: List[Dict[str, Any]],
    ai_insights: Dict[str, Any],
    output_path: str
) -> str:
    """
    Generates an enterprise-grade, C-level executive PDF data quality report.
    """
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Brand Palette
    primary_color = colors.HexColor("#3730A3")    # Deep Indigo
    accent_color = colors.HexColor("#4F46E5")     # Indigo Accent
    dark_slate = colors.HexColor("#1E293B")       # Text Slate
    light_bg = colors.HexColor("#F8FAFC")         # Neutral Card Bg
    border_color = colors.HexColor("#E2E8F0")     # Light Border
    
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=primary_color,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#64748B"),
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        "SectionHeader",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=14,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        "BodyDark",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_slate
    )

    code_style = ParagraphStyle(
        "CodeStyle",
        parent=styles["Normal"],
        fontName="Courier",
        fontSize=7.5,
        leading=10,
        textColor=colors.HexColor("#1E1B4B")
    )
    
    story = []
    
    # Header Banner
    story.append(Paragraph("DataGuard AI", title_style))
    story.append(Paragraph("Enterprise Data Quality & Anomaly Detection Intelligence Report", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=accent_color, spaceAfter=12))
    
    # Dataset Metadata Table
    meta_data = [
        [
            Paragraph(f"<b>Dataset:</b> {dataset_info.get('filename', 'Unknown')}", body_style),
            Paragraph(f"<b>Scan Date:</b> {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", body_style)
        ],
        [
            Paragraph(f"<b>Records:</b> {dataset_info.get('total_rows', 0):,} rows", body_style),
            Paragraph(f"<b>Columns:</b> {dataset_info.get('total_columns', 0)} attributes", body_style)
        ],
        [
            Paragraph(f"<b>Total Anomalies:</b> {sum(i.get('issue_count', 0) for i in issues):,} detected", body_style),
            Paragraph(f"<b>Classification:</b> <b>{quality_scores.get('quality_grade', 'N/A')}</b>", body_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[270, 270])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), light_bg),
        ("BOX", (0, 0), (-1, -1), 0.5, border_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))
    
    # Quality Scoring Cards
    story.append(Paragraph("1. Data Quality Dimension Scores", h2_style))
    
    score_data = [
        [
            Paragraph(f"<b>OVERALL SCORE</b><br/><font size=16 color='#3730A3'><b>{quality_scores.get('overall_score', 0)}/100</b></font>", body_style),
            Paragraph(f"<b>Completeness (30%)</b><br/><font size=12><b>{quality_scores.get('completeness_score', 0)}%</b></font>", body_style),
            Paragraph(f"<b>Uniqueness (25%)</b><br/><font size=12><b>{quality_scores.get('uniqueness_score', 0)}%</b></font>", body_style),
            Paragraph(f"<b>Validity (25%)</b><br/><font size=12><b>{quality_scores.get('validity_score', 0)}%</b></font>", body_style),
            Paragraph(f"<b>Consistency (20%)</b><br/><font size=12><b>{quality_scores.get('consistency_score', 0)}%</b></font>", body_style)
        ]
    ]
    t_scores = Table(score_data, colWidths=[130, 102, 102, 102, 104])
    t_scores.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#EEF2FF")),
        ("BOX", (0, 0), (-1, -1), 1, accent_color),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#C7D2FE")),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(t_scores)
    story.append(Spacer(1, 10))
    
    formula_text = "<b>Documented Formula:</b> Overall Score = (Completeness × 0.30) + (Uniqueness × 0.25) + (Validity × 0.25) + (Consistency × 0.20)"
    story.append(Paragraph(formula_text, subtitle_style))
    story.append(Spacer(1, 10))
    
    # Executive Summary (AI or Rule-based)
    story.append(Paragraph("2. Executive Summary", h2_style))
    exec_summary = ai_insights.get("executive_summary", quality_scores.get("grade_summary", ""))
    story.append(Paragraph(exec_summary, body_style))
    story.append(Spacer(1, 14))
    
    # Column Profiles
    story.append(Paragraph("3. Column-Level Attribute Profiles", h2_style))
    col_rows = [["Column Name", "Type", "Missing %", "Unique", "Sample Distinct Values"]]
    for col in profile_info.get("columns", [])[:13]:
        samples_str = ", ".join(col.get("sample_distinct", [])[:3])
        if len(samples_str) > 35:
            samples_str = samples_str[:32] + "..."
        col_rows.append([
            col.get("name", ""),
            col.get("semantic_type", ""),
            f"{col.get('missing_percentage', 0)}%",
            str(col.get("unique_count", 0)),
            samples_str
        ])
    t_cols = Table(col_rows, colWidths=[110, 80, 70, 60, 220])
    t_cols.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), primary_color),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_cols)
    story.append(Spacer(1, 16))
    
    # Detected Issues Table
    story.append(Paragraph("4. Detected Data Quality Issues & Anomalies", h2_style))
    issue_rows = [["Category", "Column", "Severity", "Impacted Rows", "Example / Description"]]
    for iss in issues[:15]:
        sample_str = "; ".join(iss.get("original_values", [])[:2])
        if len(sample_str) > 55:
            sample_str = sample_str[:52] + "..."
        issue_rows.append([
            Paragraph(iss.get("category", ""), body_style),
            Paragraph(iss.get("column_name", "")[:25], body_style),
            Paragraph(f"<b>{iss.get('severity', '')}</b>", body_style),
            Paragraph(f"{iss.get('issue_count', 0)} rows", body_style),
            Paragraph(sample_str if sample_str else iss.get("explanation", "")[:50], body_style)
        ])
    t_issues = Table(issue_rows, colWidths=[110, 100, 65, 75, 190])
    t_issues.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, light_bg]),
        ("GRID", (0, 0), (-1, -1), 0.5, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_issues)
    story.append(Spacer(1, 16))
    
    # Cleaning Recommendations & Python Code Snippets
    story.append(Paragraph("5. AI Cleaning Recommendations & Python Code", h2_style))
    for iss in issues[:4]:
        story.append(Paragraph(f"<b>Issue:</b> {iss.get('category')} — <i>{iss.get('column_name')}</i> ({iss.get('severity')})", body_style))
        story.append(Paragraph(f"<b>Recommendation:</b> {iss.get('recommendation')}", body_style))
        story.append(Paragraph(f"<b>Business Justification:</b> {iss.get('business_impact')}", body_style))
        code_p = Paragraph(f"<font face='Courier' color='#1E1B4B'>{iss.get('cleaning_code', '').replace(chr(10), '<br/>')}</font>", code_style)
        t_code = Table([[code_p]], colWidths=[540])
        t_code.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F1F5F9")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(t_code)
        story.append(Spacer(1, 8))
        
    doc.build(story)
    return output_path

def export_issues_to_csv(issues: List[Dict[str, Any]], output_path: str) -> str:
    """
    Exports all detected issues and affected rows to a structured CSV file.
    """
    with open(output_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Issue ID", "Category", "Column Name", "Severity", "Affected Record Count",
            "Affected Row Indices", "Original Values Sample", "Explanation", "Business Impact",
            "Recommended Fix", "Pandas Cleaning Code"
        ])
        for iss in issues:
            rows_str = ", ".join(map(str, iss.get("affected_rows", [])[:50]))
            orig_str = " | ".join(map(str, iss.get("original_values", [])[:5]))
            writer.writerow([
                iss.get("id"),
                iss.get("category"),
                iss.get("column_name"),
                iss.get("severity"),
                iss.get("issue_count"),
                rows_str,
                orig_str,
                iss.get("explanation"),
                iss.get("business_impact"),
                iss.get("recommendation"),
                iss.get("cleaning_code")
            ])
    return output_path

def export_analysis_to_json(
    dataset_info: Dict[str, Any],
    profile_info: Dict[str, Any],
    quality_scores: Dict[str, Any],
    issues: List[Dict[str, Any]],
    ai_insights: Dict[str, Any],
    output_path: str
) -> str:
    """
    Exports full analysis results as a standardized JSON artifact.
    """
    data = {
        "metadata": {
            "application": "DataGuard AI",
            "version": "1.0.0",
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "dataset": dataset_info
        },
        "quality_scores": quality_scores,
        "column_profiles": profile_info,
        "detected_issues": issues,
        "ai_insights": ai_insights
    }
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    return output_path
