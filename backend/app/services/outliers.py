import uuid
import numpy as np
import pandas as pd
from typing import List, Dict, Any

def detect_outliers_and_anomalies(df: pd.DataFrame) -> List[Dict[str, Any]]:
    issues = []
    
    # 1. Arithmetic consistency: quantity * unit_price == total_amount
    if all(c in df.columns for c in ["quantity", "unit_price", "total_amount"]):
        q = pd.to_numeric(df["quantity"], errors="coerce")
        u = pd.to_numeric(df["unit_price"], errors="coerce")
        t = pd.to_numeric(df["total_amount"], errors="coerce")
        
        valid_mask = q.notna() & u.notna() & t.notna()
        expected_total = q * u
        # Check absolute difference greater than 1 rupee to avoid floating point precision issues
        mismatch_mask = valid_mask & ((t - expected_total).abs() > 1.0)
        mismatch_count = int(mismatch_mask.sum())
        
        if mismatch_count > 0:
            affected_indices = df.index[mismatch_mask].tolist()
            affected_rows = [idx + 2 for idx in affected_indices]
            
            sample_mismatches = []
            for idx in affected_indices[:4]:
                sample_mismatches.append(
                    f"Row {idx+2}: {q.loc[idx]} × ₹{u.loc[idx]} = ₹{expected_total.loc[idx]} (Recorded: ₹{t.loc[idx]})"
                )
                
            issues.append({
                "id": f"OUTLIER_MATH_{uuid.uuid4().hex[:6]}",
                "category": "Numerical Outliers & Impossible Values",
                "column_name": "total_amount (Arithmetic Logic Mismatch)",
                "severity": "Critical",
                "issue_count": mismatch_count,
                "affected_rows": affected_rows[:100],
                "total_affected_rows": mismatch_count,
                "original_values": sample_mismatches,
                "recommended_values": ["Recomputed total = quantity × unit_price"],
                "explanation": f"Found {mismatch_count} orders where recorded total_amount does not equal quantity × unit_price. E.g., calculation errors, discount discrepancies without promo columns, or manual data entry bugs.",
                "business_impact": "Disrupts financial audits, invoice generation, tax filing, and customer billing trust.",
                "recommendation": "Recalculate total_amount based on quantity multiplied by unit_price for all verified line items.",
                "cleaning_code": "df['total_amount'] = df['quantity'] * df['unit_price']"
            })

    # 2. Domain Impossible Values (Negatives in non-negative columns)
    non_negative_cols = [
        ("quantity", 1, None, "Orders cannot have negative quantities"),
        ("unit_price", 0.01, None, "Prices must be positive values"),
        ("total_amount", 0.01, None, "Order amounts cannot be negative or zero without explicit refund flags"),
        ("delivery_days", 0, 60, "Delivery duration must be between 0 and 60 days"),
        ("rating", 1, 5, "Customer ratings must fall strictly within the 1 to 5 scale")
    ]
    
    for col, min_allowed, max_allowed, desc in non_negative_cols:
        if col in df.columns:
            series = pd.to_numeric(df[col].replace(["-", "?", "", "None", "null"], np.nan), errors="coerce")
            
            # Negative check
            if min_allowed is not None:
                neg_mask = series.notna() & (series < min_allowed)
                neg_count = int(neg_mask.sum())
                if neg_count > 0:
                    affected_indices = df.index[neg_mask].tolist()
                    affected_rows = [idx + 2 for idx in affected_indices]
                    sample_vals = series.loc[neg_mask].head(5).tolist()
                    
                    issues.append({
                        "id": f"OUTLIER_IMPOSSIBLE_{col}_{uuid.uuid4().hex[:6]}",
                        "category": "Numerical Outliers & Impossible Values",
                        "column_name": col,
                        "severity": "Critical" if col in ["quantity", "total_amount", "unit_price"] else "High",
                        "issue_count": neg_count,
                        "affected_rows": affected_rows[:100],
                        "total_affected_rows": neg_count,
                        "original_values": [f"Value {v} (Violates min threshold {min_allowed})" for v in sample_vals],
                        "recommended_values": [f"Correct value to positive or enforce lower bound {min_allowed}"],
                        "explanation": f"Detected {neg_count} impossible values in '{col}' less than {min_allowed}. {desc}.",
                        "business_impact": "Negative balances cause incorrect aggregates, negative revenue figures, or application crashes.",
                        "recommendation": "Convert inverted sign errors using absolute value or flag transaction for manual audit.",
                        "cleaning_code": f"df['{col}'] = df['{col}'].apply(lambda x: abs(x) if pd.notnull(x) and x < {min_allowed} else x)"
                    })
            
            # Max out-of-scale check (for rating, delivery_days)
            if max_allowed is not None:
                max_mask = series.notna() & (series > max_allowed)
                max_count = int(max_mask.sum())
                if max_count > 0:
                    affected_indices = df.index[max_mask].tolist()
                    affected_rows = [idx + 2 for idx in affected_indices]
                    sample_vals = series.loc[max_mask].head(5).tolist()
                    
                    issues.append({
                        "id": f"OUTLIER_SCALE_{col}_{uuid.uuid4().hex[:6]}",
                        "category": "Numerical Outliers & Impossible Values",
                        "column_name": col,
                        "severity": "High",
                        "issue_count": max_count,
                        "affected_rows": affected_rows[:100],
                        "total_affected_rows": max_count,
                        "original_values": [f"Value {v} exceeds maximum allowed {max_allowed}" for v in sample_vals],
                        "recommended_values": [f"Rescale or cap at {max_allowed}"],
                        "explanation": f"Column '{col}' contains {max_count} values exceeding the business maximum of {max_allowed}. For instance, customer ratings cannot be 6 or 10, and delivery times over 60 days indicate anomalous tracking data.",
                        "business_impact": "Distorts customer satisfaction indices (CSAT) and SLA performance indicators.",
                        "recommendation": f"Clip values to maximum boundary {max_allowed} or audit data entry forms.",
                        "cleaning_code": f"df['{col}'] = df['{col}'].clip(upper={max_allowed})"
                    })

    # 3. Statistical Numerical Outliers via IQR & Z-Score
    for col in ["quantity", "unit_price", "total_amount", "delivery_days"]:
        if col in df.columns:
            s = pd.to_numeric(df[col].replace(["-", "?", "", "None", "null"], np.nan), errors="coerce").dropna()
            if len(s) > 10:
                q1 = float(s.quantile(0.25))
                q3 = float(s.quantile(0.75))
                iqr = q3 - q1
                lower_bound = round(q1 - 1.5 * iqr, 2)
                upper_bound = round(q3 + 1.5 * iqr, 2)
                
                # We identify values strictly outside IQR bounds (excluding negatives already flagged)
                iqr_outlier_mask = (s > upper_bound)
                outlier_count = int(iqr_outlier_mask.sum())
                
                # Check if extreme (e.g. quantity=120 when median is 2, or unit_price=124999 when median is 1199)
                if outlier_count > 0 and (outlier_count / len(s) < 0.10):  # legitimate outliers are rare
                    affected_indices = s[iqr_outlier_mask].index.tolist()
                    affected_rows = [idx + 2 for idx in affected_indices]
                    sample_vals = s[iqr_outlier_mask].sort_values(ascending=False).head(5).tolist()
                    
                    issues.append({
                        "id": f"OUTLIER_STAT_{col}_{uuid.uuid4().hex[:6]}",
                        "category": "Numerical Outliers & Impossible Values",
                        "column_name": col,
                        "severity": "Medium",
                        "issue_count": outlier_count,
                        "affected_rows": affected_rows[:100],
                        "total_affected_rows": outlier_count,
                        "original_values": [f"Value {v} (IQR Upper Bound: {upper_bound})" for v in sample_vals],
                        "recommended_values": [f"Review potential high-value transactions or cap with winsorization"],
                        "explanation": f"Column '{col}' exhibits {outlier_count} statistical outliers exceeding the upper IQR boundary of {upper_bound}. E.g. extreme values like {sample_vals[:3]}.",
                        "business_impact": "Extreme values disproportionately pull arithmetic averages, distorting forecast models and typical customer basket size metrics.",
                        "recommendation": "Do not delete blindly: evaluate whether these represent luxury goods/bulk orders or data entry keystroke slips.",
                        "cleaning_code": f"# Check or cap upper outliers via winsorization\nupper_limit = df['{col}'].quantile(0.99)\n# df['{col}'] = df['{col}'].clip(upper=upper_limit)"
                    })

    # 4. Impossible Dates (Invalid dates like 2026-02-30, and out-of-scope years like 1999 or 2027)
    date_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower()]
    for col in date_cols:
        series = df[col].astype(str).str.strip()
        invalid_dates = []
        out_of_year = []
        
        for idx, val in series.items():
            if val in ["", "nan", "null", "-", "?"]:
                continue
            # Check calendar existence
            try:
                # Try parsing with dayfirst=False and dayfirst=True
                dt = pd.to_datetime(val, format="mixed", errors="raise")
                if dt.year != 2026:
                    out_of_year.append((idx + 2, val, dt.year))
            except Exception as e:
                invalid_dates.append((idx + 2, val, str(e)))
                
        if len(invalid_dates) > 0:
            issues.append({
                "id": f"OUTLIER_DATE_INVALID_{uuid.uuid4().hex[:6]}",
                "category": "Numerical Outliers & Impossible Values",
                "column_name": col,
                "severity": "Critical",
                "issue_count": len(invalid_dates),
                "affected_rows": [r[0] for r in invalid_dates],
                "total_affected_rows": len(invalid_dates),
                "original_values": [f"Row {r[0]}: '{r[1]}' (Calendar impossible date)" for r in invalid_dates],
                "recommended_values": ["Valid calendar date (e.g., 2026-02-28)"],
                "explanation": f"Column '{col}' contains {len(invalid_dates)} non-existent calendar dates such as '2026-02-30' (February only has 28 days in 2026).",
                "business_impact": "Causes database timestamp parsing exceptions and breaks time-series indexing.",
                "recommendation": "Correct day to end-of-month (2026-02-28) or prompt user for correction.",
                "cleaning_code": f"df['{col}'] = df['{col}'].replace('2026-02-30', '2026-02-28')"
            })
            
        if len(out_of_year) > 0:
            issues.append({
                "id": f"OUTLIER_DATE_YEAR_{uuid.uuid4().hex[:6]}",
                "category": "Numerical Outliers & Impossible Values",
                "column_name": col,
                "severity": "High",
                "issue_count": len(out_of_year),
                "affected_rows": [r[0] for r in out_of_year],
                "total_affected_rows": len(out_of_year),
                "original_values": [f"Row {r[0]}: '{r[1]}' (Year {r[2]})" for r in out_of_year],
                "recommended_values": ["Adjust date to 2026 fiscal year"],
                "explanation": f"Detected {len(out_of_year)} dates outside the designated 2026 operating timeframe (e.g., 1/1/1999 and 8/15/2027).",
                "business_impact": "Skews quarterly cohort analyses and annual revenue comparisons.",
                "recommendation": "Realign chronological dates to correct operating year 2026 or flag for audit.",
                "cleaning_code": f"# Correct date anomalies\ndf['{col}'] = pd.to_datetime(df['{col}'], errors='coerce')"
            })

    return issues
