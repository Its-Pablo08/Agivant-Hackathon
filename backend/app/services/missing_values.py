import uuid
import pandas as pd
from typing import List, Dict, Any

PLACEHOLDERS = {"", "nan", "null", "none", "-", "?", "unknown", "not available", "n/a", "na"}

def detect_missing_values(df: pd.DataFrame) -> List[Dict[str, Any]]:
    issues = []
    
    for col in df.columns:
        series = df[col]
        # Check actual NaN/None
        null_mask = series.isna()
        
        # Check whitespace and placeholders
        str_series = series.astype(str).str.strip().str.lower()
        placeholder_mask = str_series.isin(PLACEHOLDERS)
        
        combined_mask = null_mask | placeholder_mask
        missing_count = int(combined_mask.sum())
        
        if missing_count > 0:
            affected_indices = df.index[combined_mask].tolist()
            # 1-based row numbers for user-friendly display (row 1 is first data row)
            affected_row_numbers = [idx + 2 for idx in affected_indices] # matching Excel line number (header is 1)
            
            # Sample original values found in placeholders
            sample_orig = df.loc[combined_mask, col].head(5).fillna("<BLANK>").astype(str).tolist()
            sample_orig = [v if v.strip() != "" else "<BLANK>" for v in sample_orig]
            
            missing_pct = round((missing_count / len(df)) * 100, 2)
            
            # Check domain specifics
            is_rating = col.lower() in ["rating", "review", "feedback"]
            is_critical = col.lower() in ["order_id", "total_amount", "customer_name", "email", "phone"]
            
            if is_rating:
                severity = "Low"
                explanation = f"The '{col}' column contains {missing_count} unrated/blank records ({missing_pct}%). In e-commerce datasets, customer ratings are frequently optional and not all buyers leave a review."
                recommendation = "Retain blank values as unrated, or impute with a sentinel category/flag indicating 'Unrated'."
                cleaning_code = f"# Optional ratings can be kept as null or filled with 'Unrated'\n# df['{col}'] = df['{col}'].fillna('Unrated')"
                business_impact = "Minimal operational disruption, but analyses should account for non-response bias when computing mean customer satisfaction."
            elif is_critical:
                severity = "Critical" if col.lower() in ["order_id", "total_amount"] else "High"
                if col.lower() == "total_amount" and "quantity" in df.columns and "unit_price" in df.columns:
                    explanation = f"Found {missing_count} blank total_amount entries ({missing_pct}% of orders). These orders have valid quantities and unit prices but omit the total calculation."
                    recommendation = "Recalculate missing total amounts by computing quantity * unit_price for affected rows."
                    cleaning_code = "df['total_amount'] = df['total_amount'].fillna(df['quantity'] * df['unit_price'])"
                    business_impact = "Revenue understatement and inaccurate accounting reconciliations."
                elif col.lower() == "email":
                    explanation = f"Found {missing_count} orders ({missing_pct}%) without a customer email address or with empty values."
                    recommendation = "Flag orders without email addresses for customer profile updates or cross-reference phone numbers."
                    cleaning_code = f"df['{col}'] = df['{col}'].replace({list(PLACEHOLDERS)[:5]}, 'unspecified@customer.local')"
                    business_impact = "Inability to send digital invoices, tracking notifications, or order confirmation emails."
                else:
                    explanation = f"Column '{col}' has {missing_count} missing or placeholder records ({missing_pct}%). Critical customer/order identifier missing."
                    recommendation = "Investigate ingestion pipeline or impute with 'Unknown' placeholder."
                    cleaning_code = f"df['{col}'] = df['{col}'].replace({list(PLACEHOLDERS)[:5]}, 'Unknown')"
                    business_impact = "Data loss for downstream CRM, order tracking, and customer reconciliation."
            else:
                severity = "Medium" if missing_pct > 2.0 else "Low"
                # Check if city column
                if "city" in col.lower():
                    explanation = f"Column '{col}' contains {missing_count} placeholder/missing values ({missing_pct}%), such as '-', '?', 'not available', and 'Unknown'."
                    recommendation = "Replace non-standard placeholder strings with standard null or 'Unknown City', or infer from customer history."
                    cleaning_code = f"df['{col}'] = df['{col}'].replace(['-', '?', 'unknown', 'not available', 'Unknown', ''], 'Unknown City')"
                    business_impact = "Skews regional sales reporting and prevents logistics dispatch planning."
                else:
                    explanation = f"Column '{col}' has {missing_count} missing or placeholder values ({missing_pct}%)."
                    recommendation = "Impute missing values using mode/median or standardize placeholder representations."
                    cleaning_code = f"df['{col}'] = df['{col}'].replace({list(PLACEHOLDERS)[:4]}, 'Unknown')"
                    business_impact = "May reduce data completeness for reporting and analytical aggregations."

            issues.append({
                "id": f"MISSING_{col}_{uuid.uuid4().hex[:6]}",
                "category": "Missing Values",
                "column_name": col,
                "severity": severity,
                "issue_count": missing_count,
                "affected_rows": affected_row_numbers[:100],  # cap list for UI performance
                "total_affected_rows": missing_count,
                "original_values": sample_orig,
                "recommended_values": ["Standardized or Imputed Value"],
                "explanation": explanation,
                "business_impact": business_impact,
                "recommendation": recommendation,
                "cleaning_code": cleaning_code
            })
            
    return issues
