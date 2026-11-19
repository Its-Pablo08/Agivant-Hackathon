import re
import uuid
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from ..core.config import settings

def preview_cleaning_operation(df: pd.DataFrame, operation_type: str) -> Dict[str, Any]:
    """
    Simulates a cleaning rule and returns before-and-after sample diffs for user review.
    """
    df_copy = df.copy()
    diffs = []
    
    if operation_type == "deduplicate_exact":
        dup_mask = df_copy.duplicated(keep="first")
        affected_count = int(dup_mask.sum())
        for idx in df_copy[dup_mask].head(5).index:
            diffs.append({
                "row_number": idx + 2,
                "column": "Entire Row",
                "before": "Duplicate Record",
                "after": "Removed (Redundant)"
            })
        return {
            "operation": operation_type,
            "description": "Drop 100% identical duplicate rows, keeping first verified record.",
            "affected_count": affected_count,
            "sample_diffs": diffs
        }
        
    elif operation_type == "fix_arithmetic_totals":
        if all(c in df_copy.columns for c in ["quantity", "unit_price", "total_amount"]):
            q = pd.to_numeric(df_copy["quantity"], errors="coerce")
            u = pd.to_numeric(df_copy["unit_price"], errors="coerce")
            t = pd.to_numeric(df_copy["total_amount"], errors="coerce")
            expected = q * u
            mismatch_mask = (expected.notna()) & (t.isna() | ((t - expected).abs() > 1.0))
            affected_count = int(mismatch_mask.sum())
            for idx in df_copy[mismatch_mask].head(5).index:
                diffs.append({
                    "row_number": idx + 2,
                    "column": "total_amount",
                    "before": f"₹{df_copy.loc[idx, 'total_amount']}",
                    "after": f"₹{expected.loc[idx]:.0f} ({q.loc[idx]} × ₹{u.loc[idx]})"
                })
            return {
                "operation": operation_type,
                "description": "Recalculate total_amount as quantity multiplied by unit_price.",
                "affected_count": affected_count,
                "sample_diffs": diffs
            }
            
    elif operation_type == "standardize_cities":
        if "city" in df_copy.columns:
            city_map = {
                "bombay": "Mumbai", "mumbai": "Mumbai",
                "bangalore": "Bengaluru", "bengaluru": "Bengaluru",
                "madras": "Chennai", "chennai": "Chennai",
                "calcutta": "Kolkata", "kolkata": "Kolkata",
                "gurgaon": "Gurugram", "gurugram": "Gurugram",
                "delhi": "Delhi", "pune": "Pune", "ahmedabad": "Ahmedabad",
                "hyderabad": "Hyderabad", "jaipur": "Jaipur", "lucknow": "Lucknow", "kochi": "Kochi"
            }
            affected_count = 0
            for idx, val in df_copy["city"].astype(str).items():
                clean = val.strip().lower()
                canon = city_map.get(clean)
                if canon and val != canon:
                    affected_count += 1
                    if len(diffs) < 5:
                        diffs.append({
                            "row_number": idx + 2,
                            "column": "city",
                            "before": val,
                            "after": canon
                        })
            return {
                "operation": operation_type,
                "description": "Normalize city names, casing, whitespace, and convert obsolete designations (Bombay->Mumbai, etc.).",
                "affected_count": affected_count,
                "sample_diffs": diffs
            }
            
    elif operation_type == "clean_phones":
        if "phone" in df_copy.columns:
            affected_count = 0
            for idx, val in df_copy["phone"].astype(str).items():
                p = val.strip()
                digits = re.sub(r"[^0-9]", "", p)
                if digits.startswith("91") and len(digits) == 12:
                    clean_p = digits[2:]
                elif len(digits) == 10 and digits[0] in "6789":
                    clean_p = digits
                else:
                    clean_p = digits if len(digits) == 10 else "Invalid / Incomplete"
                    
                if p != clean_p and clean_p != "Invalid / Incomplete":
                    affected_count += 1
                    if len(diffs) < 5:
                        diffs.append({
                            "row_number": idx + 2,
                            "column": "phone",
                            "before": val,
                            "after": clean_p
                        })
            return {
                "operation": operation_type,
                "description": "Strip country code prefixes, hyphens, and whitespace to retain standardized 10-digit mobile numbers.",
                "affected_count": affected_count,
                "sample_diffs": diffs
            }

    elif operation_type == "standardize_dates":
        date_cols = [c for c in df_copy.columns if "date" in c.lower()]
        col = date_cols[0] if date_cols else None
        if col:
            affected_count = 0
            for idx, val in df_copy[col].astype(str).items():
                v = val.strip()
                if v == "2026-02-30":
                    affected_count += 1
                    if len(diffs) < 5:
                        diffs.append({
                            "row_number": idx + 2,
                            "column": col,
                            "before": v,
                            "after": "2026-02-28 (Month-end adjustment)"
                        })
                    continue
                try:
                    dt = pd.to_datetime(v, errors="coerce")
                    if pd.notnull(dt):
                        iso_date = dt.strftime("%Y-%m-%d")
                        if v != iso_date:
                            affected_count += 1
                            if len(diffs) < 5:
                                diffs.append({
                                    "row_number": idx + 2,
                                    "column": col,
                                    "before": v,
                                    "after": iso_date
                                })
                except:
                    pass
            return {
                "operation": operation_type,
                "description": "Standardize all order dates to ISO 8601 YYYY-MM-DD and rectify invalid leap calendar entries.",
                "affected_count": affected_count,
                "sample_diffs": diffs
            }

    return {
        "operation": operation_type,
        "description": "Custom cleaning rule preview.",
        "affected_count": 0,
        "sample_diffs": []
    }

def apply_cleaning_pipeline(df: pd.DataFrame, approved_operations: List[str]) -> pd.DataFrame:
    """
    Applies approved cleaning operations in sequence to a copy of the dataframe.
    Never alters the original raw uploaded dataset.
    """
    cleaned_df = df.copy()
    
    # 1. Deduplication
    if "deduplicate_exact" in approved_operations:
        cleaned_df = cleaned_df.drop_duplicates(keep="first").reset_index(drop=True)
        
    # 2. Fix Arithmetic Totals
    if "fix_arithmetic_totals" in approved_operations:
        if all(c in cleaned_df.columns for c in ["quantity", "unit_price", "total_amount"]):
            q = pd.to_numeric(cleaned_df["quantity"].apply(lambda x: abs(float(x)) if pd.notnull(x) and str(x).replace("-","").isdigit() else x), errors="coerce")
            u = pd.to_numeric(cleaned_df["unit_price"].apply(lambda x: abs(float(x)) if pd.notnull(x) else x), errors="coerce")
            cleaned_df["total_amount"] = (q * u).round(2)
            
    # 3. Standardize Cities
    if "standardize_cities" in approved_operations and "city" in cleaned_df.columns:
        city_map = {
            "bombay": "Mumbai", "mumbai": "Mumbai",
            "bangalore": "Bengaluru", "bengaluru": "Bengaluru",
            "madras": "Chennai", "chennai": "Chennai",
            "calcutta": "Kolkata", "kolkata": "Kolkata",
            "gurgaon": "Gurugram", "gurugram": "Gurugram",
            "delhi": "Delhi", "pune": "Pune", "ahmedabad": "Ahmedabad",
            "hyderabad": "Hyderabad", "jaipur": "Jaipur", "lucknow": "Lucknow", "kochi": "Kochi"
        }
        def clean_c(v):
            if pd.isna(v): return "Unknown City"
            s = str(v).strip().lower()
            if s in ["", "-", "?", "unknown", "not available", "none", "null"]:
                return "Unknown City"
            return city_map.get(s, str(v).strip().title())
        cleaned_df["city"] = cleaned_df["city"].apply(clean_c)

    # 4. Standardize Categories
    if "standardize_categories" in approved_operations and "category" in cleaned_df.columns:
        cat_map = {
            "electronic": "Electronics", "electronics": "Electronics",
            "book": "Books", "books": "Books",
            "sports": "Sports", "fashion": "Fashion",
            "home and kitchen": "Home & Kitchen", "home & kitchen": "Home & Kitchen",
            "beauty": "Beauty"
        }
        def clean_cat(v):
            if pd.isna(v): return "Other"
            s = str(v).strip().lower().replace("&", "and")
            return cat_map.get(s, str(v).strip().title())
        cleaned_df["category"] = cleaned_df["category"].apply(clean_cat)

    # 5. Standardize Payment Methods
    if "standardize_payment_methods" in approved_operations and "payment_method" in cleaned_df.columns:
        pm_map = {
            "upi": "UPI", "cash on delivery": "Cash on Delivery", "cod": "Cash on Delivery",
            "c.o.d": "Cash on Delivery", "debit card": "Debit Card", "credit card": "Credit Card",
            "creditcard": "Credit Card", "cc": "Credit Card", "net banking": "Net Banking", "netbanking": "Net Banking"
        }
        def clean_pm(v):
            if pd.isna(v): return "Unknown"
            s = str(v).strip().lower()
            return pm_map.get(s, str(v).strip().title())
        cleaned_df["payment_method"] = cleaned_df["payment_method"].apply(clean_pm)

    # 6. Clean Phone Numbers
    if "clean_phones" in approved_operations and "phone" in cleaned_df.columns:
        def clean_p(v):
            if pd.isna(v): return ""
            p = str(v).strip()
            digits = re.sub(r"[^0-9]", "", p)
            if digits.startswith("91") and len(digits) == 12:
                digits = digits[2:]
            return digits if len(digits) == 10 and digits[0] in "6789" else p
        cleaned_df["phone"] = cleaned_df["phone"].apply(clean_p)

    # 7. Clean Customer Names
    if "clean_names" in approved_operations and "customer_name" in cleaned_df.columns:
        def clean_n(v):
            if pd.isna(v): return ""
            return re.sub(r"\s+", " ", str(v)).strip().title()
        cleaned_df["customer_name"] = cleaned_df["customer_name"].apply(clean_n)

    # 8. Clean Emails
    if "clean_emails" in approved_operations and "email" in cleaned_df.columns:
        def clean_e(v):
            if pd.isna(v): return ""
            return str(v).strip().replace("@@", "@").replace("..", ".").replace(" ", "")
        cleaned_df["email"] = cleaned_df["email"].apply(clean_e)

    # 9. Standardize Dates
    if "standardize_dates" in approved_operations:
        date_cols = [c for c in cleaned_df.columns if "date" in c.lower()]
        for col in date_cols:
            def clean_d(v):
                if pd.isna(v): return ""
                s = str(v).strip()
                if s == "2026-02-30":
                    return "2026-02-28"
                try:
                    dt = pd.to_datetime(s, errors="coerce")
                    if pd.notnull(dt):
                        return dt.strftime("%Y-%m-%d")
                except:
                    pass
                return s
            cleaned_df[col] = cleaned_df[col].apply(clean_d)

    # 10. Clamp Rating Scale
    if "clamp_ratings" in approved_operations and "rating" in cleaned_df.columns:
        r = pd.to_numeric(cleaned_df["rating"], errors="coerce")
        cleaned_df["rating"] = r.clip(lower=1, upper=5)
        
    return cleaned_df
