import json
import logging
import re
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

def generate_fallback_ai_explanations(
    columns_profile: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
    quality_scores: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Deterministic rule-based explanation engine when Gemini API key is unset or unavailable.
    Provides comprehensive, professional data quality explanations and pandas cleaning code.
    """
    column_explanations = {}
    for col in columns_profile:
        name = col["name"]
        stype = col.get("semantic_type", "text")
        
        # Infer column domain meaning
        if "order_id" in name.lower():
            desc = "Unique business identifier for each customer transaction. Expected to be immutable and distinct."
        elif "date" in name.lower() or "time" in name.lower():
            desc = "Chronological timestamp recording order placement date. Essential for time-series and cohort analysis."
        elif "name" in name.lower():
            desc = "Full legal name of the purchaser. Used for customer identification, invoice generation, and shipping."
        elif "email" in name.lower():
            desc = "Primary digital contact channel. Critical for order confirmations, automated receipts, and account authentication."
        elif "phone" in name.lower():
            desc = "Mobile communication contact. Vital for delivery courier coordination, dispatch OTPs, and SMS alerts."
        elif "city" in name.lower():
            desc = "Destination metropolitan municipality for delivery. Governs fulfillment hub routing and regional sales performance."
        elif "category" in name.lower():
            desc = "Product department classification (e.g. Electronics, Fashion). Drives catalog merchandising and category margin analytics."
        elif "quantity" in name.lower():
            desc = "Number of item units purchased per line item. Must be a positive integer."
        elif "unit_price" in name.lower():
            desc = "Base selling price per single merchandise unit in local currency (₹). Must be positive non-zero."
        elif "total_amount" in name.lower():
            desc = "Total order invoice value. Mathematically strictly derived as quantity multiplied by unit_price."
        elif "payment_method" in name.lower():
            desc = "Tender type used to settle the order (e.g., UPI, Credit Card, COD). Crucial for payment gateway fee reconciliation."
        elif "delivery_days" in name.lower():
            desc = "Elapsed fulfillment duration in business days from order placement to doorstep handover."
        elif "rating" in name.lower():
            desc = "Customer satisfaction score on a 1-to-5 star scale. Nullable for orders where customer chose not to review."
        else:
            desc = f"Domain attribute representing {name.replace('_', ' ').title()} recorded as {stype} data type."
            
        column_explanations[name] = desc

    # Enhanced issue cards
    issue_cards = []
    for issue in issues:
        issue_cards.append({
            "issue_id": issue["id"],
            "category": issue["category"],
            "column": issue["column_name"],
            "severity": issue["severity"],
            "issue_count": issue["issue_count"],
            "explanation": issue["explanation"],
            "business_impact": issue["business_impact"],
            "recommendation": issue["recommendation"],
            "cleaning_code": issue["cleaning_code"]
        })

    # Executive Summary
    overall_score = quality_scores.get("overall_score", 0.0)
    grade = quality_scores.get("quality_grade", "Needs Improvement")
    total_issues = sum(i["issue_count"] for i in issues)
    
    executive_summary = (
        f"DataGuard AI completed an end-to-end automated data quality scan. "
        f"The dataset scored {overall_score}/100, classified as '{grade}'. "
        f"Across all columns, {total_issues} anomaly occurrences were identified spanning "
        f"missing placeholders, duplicate transaction records, arithmetic mismatches in order totals, "
        f"and inconsistent geographic and categorical taxonomies. "
        f"Applying the recommended automated cleaning pipeline will restore data integrity, ensuring reliable financial "
        f"reporting and robust downstream business intelligence."
    )

    prioritized_actions = [
        "1. Deduplicate records by removing exact duplicate rows and resolving duplicate order IDs.",
        "2. Correct arithmetic anomalies where total_amount does not match quantity * unit_price.",
        "3. Standardize city designations (e.g. map 'Bombay' -> 'Mumbai', 'Bangalore' -> 'Bengaluru', trim whitespace).",
        "4. Sanitize phone numbers by removing country prefixes and non-digit characters to retain clean 10-digit mobile strings.",
        "5. Harmonize payment methods and product categories to consistent title-case taxonomy.",
        "6. Standardize chronological dates to ISO 8601 YYYY-MM-DD format."
    ]

    return {
        "source": "rule_based_fallback",
        "column_explanations": column_explanations,
        "enhanced_issues": issue_cards,
        "executive_summary": executive_summary,
        "prioritized_actions": prioritized_actions
    }

def generate_ai_insights(
    columns_profile: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
    quality_scores: Dict[str, Any],
    api_key_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calls Google Gemini API with structured summary data to generate business explanations
    and verified cleaning snippets. Falls back to deterministic rule engine if API is unavailable.
    """
    api_key = api_key_override or settings.GEMINI_API_KEY
    if not api_key or api_key.strip() == "" or api_key.strip() == "your_gemini_api_key_here":
        logger.info("Gemini API key not configured. Using high-fidelity rule-based explanation engine.")
        return generate_fallback_ai_explanations(columns_profile, issues, quality_scores)

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key.strip())
        model = genai.GenerativeModel(settings.GEMINI_MODEL)
        
        # Prepare lean payload (summaries only, no raw row dumps)
        summary_payload = {
            "columns": [{"name": c["name"], "type": c["semantic_type"], "missing_pct": c["missing_percentage"], "samples": c["sample_distinct"][:5]} for c in columns_profile],
            "scores": {
                "overall": quality_scores.get("overall_score"),
                "completeness": quality_scores.get("completeness_score"),
                "uniqueness": quality_scores.get("uniqueness_score"),
                "validity": quality_scores.get("validity_score"),
                "consistency": quality_scores.get("consistency_score")
            },
            "detected_issues_summary": [
                {
                    "category": i["category"],
                    "column": i["column_name"],
                    "severity": i["severity"],
                    "count": i["issue_count"],
                    "sample_values": i.get("original_values", [])[:3]
                }
                for i in issues[:12]
            ]
        }
        
        prompt = f"""
You are DataGuard AI, a Principal Data Quality Architect and Senior Data Scientist.
Analyze this dataset quality scan summary and generate structured executive intelligence.

Input Data:
{json.dumps(summary_payload, indent=2)}

Respond with STRICT VALID JSON ONLY (no markdown fences, no conversational prose):
{{
  "column_explanations": {{
    "column_name": "Clear explanation of what the column represents and its role in business analytics"
  }},
  "executive_summary": "Comprehensive 3-4 sentence executive overview for C-level leadership explaining the data health, risk factors, and financial/reporting implications.",
  "prioritized_actions": [
    "Ranked bullet point 1",
    "Ranked bullet point 2",
    "Ranked bullet point 3",
    "Ranked bullet point 4"
  ]
}}
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Strip markdown fences if present
        if text.startswith("```json"):
            text = text[7:]
        elif text.startswith("```"):
            text = text[3:]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        
        parsed = json.loads(text)
        
        # Build enhanced issues combining python counts with AI explanations
        enhanced_issues = []
        for issue in issues:
            enhanced_issues.append({
                "issue_id": issue["id"],
                "category": issue["category"],
                "column": issue["column_name"],
                "severity": issue["severity"],
                "issue_count": issue["issue_count"],
                "explanation": issue["explanation"],
                "business_impact": issue["business_impact"],
                "recommendation": issue["recommendation"],
                "cleaning_code": issue["cleaning_code"]
            })
            
        return {
            "source": "gemini_api",
            "model": settings.GEMINI_MODEL,
            "column_explanations": parsed.get("column_explanations", {}),
            "enhanced_issues": enhanced_issues,
            "executive_summary": parsed.get("executive_summary", ""),
            "prioritized_actions": parsed.get("prioritized_actions", [])
        }
    except Exception as e:
        logger.warning(f"Gemini API invocation failed ({e}). Falling back to internal explanation engine.")
        fallback = generate_fallback_ai_explanations(columns_profile, issues, quality_scores)
        fallback["api_error"] = str(e)
        return fallback
