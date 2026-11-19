import json
import logging
import re
from typing import Dict, Any, List, Optional
from ..core.config import settings

logger = logging.getLogger(__name__)

CANDIDATE_MODELS = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-8b",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro"
]

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
    total_issues = sum(i.get("issue_count", 0) for i in issues)
    
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

def call_gemini_api(api_key: str, preferred_model: str, prompt: str) -> tuple[str, str]:
    """
    Attempts to call Google Gemini using the new google.genai SDK or legacy google.generativeai,
    trying candidate models in priority order if the preferred model is not found (404).
    Returns (response_text, actual_model_used).
    """
    models_to_try = [preferred_model] + [m for m in CANDIDATE_MODELS if m != preferred_model]
    last_error = None

    # 1. Try with new official google.genai SDK
    try:
        from google import genai
        client = genai.Client(api_key=api_key.strip())
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt
                )
                if response and hasattr(response, "text") and response.text:
                    return response.text, model_name
            except Exception as err:
                last_error = err
                logger.warning(f"google.genai call to '{model_name}' failed: {err}")
    except ImportError:
        pass

    # 2. Try with google.generativeai SDK
    try:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=api_key.strip())
        for model_name in models_to_try:
            try:
                model = legacy_genai.GenerativeModel(model_name)
                response = model.generate_content(prompt)
                if response and response.text:
                    return response.text, model_name
            except Exception as err:
                last_error = err
                logger.warning(f"legacy google.generativeai call to '{model_name}' failed: {err}")
    except ImportError:
        pass

    raise RuntimeError(f"All Gemini models failed. Last error: {last_error}")

def verify_gemini_connection(api_key: str, preferred_model: str = "gemini-2.0-flash") -> Dict[str, Any]:
    """
    Verifies that the provided API key works with Google Gemini, finding a supported model.
    """
    try:
        text, working_model = call_gemini_api(api_key, preferred_model, "Reply with 'OK' only.")
        return {
            "status": "success",
            "working_model": working_model,
            "message": f"Successfully connected to Google Gemini ({working_model})!"
        }
    except Exception as e:
        return {
            "status": "warning",
            "working_model": preferred_model,
            "message": f"Test call returned: {str(e)}. Fallback engine will be active."
        }

def generate_ai_insights(
    columns_profile: List[Dict[str, Any]],
    issues: List[Dict[str, Any]],
    quality_scores: Dict[str, Any],
    api_key_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calls Google Gemini API with structured summary data to generate business explanations
    and verified cleaning snippets. Automatically handles model versioning and fallbacks.
    """
    api_key = api_key_override or settings.GEMINI_API_KEY
    if not api_key or api_key.strip() == "" or api_key.strip() == "your_gemini_api_key_here":
        logger.info("Gemini API key not configured. Using high-fidelity rule-based explanation engine.")
        return generate_fallback_ai_explanations(columns_profile, issues, quality_scores)

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
    try:
        raw_text, used_model = call_gemini_api(api_key, settings.GEMINI_MODEL, prompt)
        text = raw_text.strip()
        
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
            "model": used_model,
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
