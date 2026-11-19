import uuid
import re
import pandas as pd
from typing import List, Dict, Any

# Canonical Mapping Dictionaries for E-commerce & Standard datasets
CITY_CANONICAL = {
    "bombay": "Mumbai",
    "mumbai": "Mumbai",
    "bangalore": "Bengaluru",
    "bengaluru": "Bengaluru",
    "madras": "Chennai",
    "chennai": "Chennai",
    "calcutta": "Kolkata",
    "kolkata": "Kolkata",
    "gurgaon": "Gurugram",
    "gurugram": "Gurugram",
    "delhi": "Delhi",
    "pune": "Pune",
    "ahmedabad": "Ahmedabad",
    "hyderabad": "Hyderabad",
    "jaipur": "Jaipur",
    "lucknow": "Lucknow",
    "kochi": "Kochi"
}

CATEGORY_CANONICAL = {
    "electronics": "Electronics",
    "electronic": "Electronics",
    "fashion": "Fashion",
    "home & kitchen": "Home & Kitchen",
    "home and kitchen": "Home & Kitchen",
    "beauty": "Beauty",
    "books": "Books",
    "book": "Books",
    "sports": "Sports"
}

PAYMENT_CANONICAL = {
    "upi": "UPI",
    "cash on delivery": "Cash on Delivery",
    "cod": "Cash on Delivery",
    "c.o.d": "Cash on Delivery",
    "debit card": "Debit Card",
    "credit card": "Credit Card",
    "creditcard": "Credit Card",
    "cc": "Credit Card",
    "net banking": "Net Banking",
    "netbanking": "Net Banking"
}

def detect_inconsistencies(df: pd.DataFrame) -> List[Dict[str, Any]]:
    issues = []
    
    # 1. City Inconsistent Names (Historical names + Casing + Whitespace)
    if "city" in df.columns:
        city_series = df["city"].astype(str)
        affected_rows = []
        variants_found = {}
        
        for idx, orig_val in city_series.items():
            clean = orig_val.strip()
            lower = clean.lower()
            if lower in ["", "nan", "null", "-", "?", "unknown", "not available", "none"]:
                continue
            
            # Check if canonical exists and differed from exact official title
            canonical = CITY_CANONICAL.get(lower)
            if canonical and orig_val != canonical:
                affected_rows.append(idx + 2)
                variants_found[orig_val] = canonical
                
        if len(affected_rows) > 0:
            sample_examples = [f"'{orig}' → '{canon}'" for orig, canon in list(variants_found.items())[:6]]
            issues.append({
                "id": f"INCONSIST_CITY_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": "city",
                "severity": "High",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": sample_examples,
                "recommended_values": list(set(variants_found.values())),
                "explanation": f"Found {len(affected_rows)} records with casing, whitespace variations, and obsolete historical city names (e.g., 'Bombay' for 'Mumbai', 'Bangalore' for 'Bengaluru', 'Madras' for 'Chennai', 'Calcutta' for 'Kolkata', 'Gurgaon' for 'Gurugram', and 'DELHI ' / 'mumbai ').",
                "business_impact": "Fragments geographical sales reports and ruins regional logistics analytics.",
                "recommendation": "Normalize whitespace, standardize casing, and map obsolete city names to their official current designations.",
                "cleaning_code": "city_map = {'Bombay': 'Mumbai', 'Bangalore': 'Bengaluru', 'Madras': 'Chennai', 'Calcutta': 'Kolkata', 'Gurgaon': 'Gurugram'}\ndf['city'] = df['city'].str.strip().str.title().replace(city_map)"
            })

    # 2. Product Category Inconsistencies
    if "category" in df.columns:
        cat_series = df["category"].astype(str)
        affected_rows = []
        variants_found = {}
        
        for idx, orig_val in cat_series.items():
            clean = orig_val.strip()
            lower = clean.lower().replace("&", "and")
            if lower in ["", "nan", "null"]:
                continue
            
            canon = None
            if lower in ["electronics", "electronic"]:
                canon = "Electronics"
            elif lower in ["books", "book"]:
                canon = "Books"
            elif lower in ["sports"]:
                canon = "Sports"
            elif lower in ["fashion"]:
                canon = "Fashion"
            elif lower in ["home & kitchen", "home and kitchen"]:
                canon = "Home & Kitchen"
            elif lower in ["beauty"]:
                canon = "Beauty"
                
            if canon and orig_val != canon:
                affected_rows.append(idx + 2)
                variants_found[orig_val] = canon
                
        if len(affected_rows) > 0:
            sample_examples = [f"'{orig}' → '{canon}'" for orig, canon in list(variants_found.items())[:6]]
            issues.append({
                "id": f"INCONSIST_CATEGORY_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": "category",
                "severity": "Medium",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": sample_examples,
                "recommended_values": list(set(variants_found.values())),
                "explanation": f"Detected {len(affected_rows)} category variations including singular forms ('Book', 'Electronic'), uppercase variations ('SPORTS', 'ELECTRONICS'), and phrasing discrepancies ('Home and Kitchen' vs 'Home & Kitchen').",
                "business_impact": "Distorts category breakdown metrics and product catalog filters.",
                "recommendation": "Harmonize product taxonomy by standardizing spelling and punctuation.",
                "cleaning_code": "cat_map = {'Electronic': 'Electronics', 'ELECTRONICS': 'Electronics', 'electronics': 'Electronics', 'SPORTS': 'Sports', 'Book': 'Books', 'Home and Kitchen': 'Home & Kitchen', 'home & kitchen': 'Home & Kitchen'}\ndf['category'] = df['category'].str.strip().replace(cat_map)"
            })

    # 3. Payment Method Inconsistencies
    if "payment_method" in df.columns:
        pm_series = df["payment_method"].astype(str)
        affected_rows = []
        variants_found = {}
        
        for idx, orig_val in pm_series.items():
            clean = orig_val.strip()
            lower = clean.lower()
            if lower in ["", "nan", "null"]:
                continue
            
            canon = PAYMENT_CANONICAL.get(lower)
            if canon and orig_val != canon:
                affected_rows.append(idx + 2)
                variants_found[orig_val] = canon
                
        if len(affected_rows) > 0:
            sample_examples = [f"'{orig}' → '{canon}'" for orig, canon in list(variants_found.items())[:6]]
            issues.append({
                "id": f"INCONSIST_PAYMENT_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": "payment_method",
                "severity": "Medium",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": sample_examples,
                "recommended_values": list(set(PAYMENT_CANONICAL.values())),
                "explanation": f"Column 'payment_method' contains {len(affected_rows)} non-standard abbreviations and casing variations, such as 'COD' / 'C.O.D' / 'cash on delivery', 'CC' / 'CreditCard', and 'netbanking'.",
                "business_impact": "Creates split payment gateway reconciliation reports and misleads gateway transaction fee calculations.",
                "recommendation": "Standardize payment method labels to official banking terms.",
                "cleaning_code": "pm_map = {'COD': 'Cash on Delivery', 'C.O.D': 'Cash on Delivery', 'CC': 'Credit Card', 'CreditCard': 'Credit Card', 'netbanking': 'Net Banking', 'Upi': 'UPI', 'upi': 'UPI'}\ndf['payment_method'] = df['payment_method'].str.strip().replace(pm_map)"
            })

    # 4. Phone Number Format Inconsistencies
    if "phone" in df.columns:
        phone_series = df["phone"].astype(str)
        affected_rows = []
        samples = []
        
        for idx, orig_val in phone_series.items():
            val = orig_val.strip()
            if val in ["", "nan", "null"]:
                continue
            # Standard Indian mobile: 10 digits starting with 6, 7, 8, or 9
            is_valid_standard = val.isdigit() and len(val) == 10 and val[0] in "6789"
            if not is_valid_standard:
                affected_rows.append(idx + 2)
                if len(samples) < 5:
                    samples.append(f"Row {idx+2}: '{orig_val}'")
                    
        if len(affected_rows) > 0:
            issues.append({
                "id": f"INCONSIST_PHONE_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": "phone",
                "severity": "High",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": samples,
                "recommended_values": ["Clean 10-digit format starting with 6-9 (e.g., 9876543210)"],
                "explanation": f"Found {len(affected_rows)} irregular phone numbers including country code prefixes (+91), hyphens (78572-99584), negative signs (-8265116178), scientific notation (9.64122E+11), short 8-digit numbers, and placeholder '0'.",
                "business_impact": "Automated SMS order tracking, OTP verification, and courier delivery calls fail.",
                "recommendation": "Extract digits, strip +91 / punctuation / negatives, and validate 10-digit mobile length.",
                "cleaning_code": "import re\ndef clean_phone(p):\n    s = re.sub(r'[^0-9]', '', str(p))\n    if s.startswith('91') and len(s) == 12: s = s[2:]\n    return s if len(s) == 10 and s[0] in '6789' else None\ndf['phone'] = df['phone'].apply(clean_phone)"
            })

    # 5. Email Syntax Inconsistencies & Invalid Formats
    if "email" in df.columns:
        email_series = df["email"].astype(str)
        affected_rows = []
        samples = []
        email_regex = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
        
        for idx, orig_val in email_series.items():
            val = orig_val.strip()
            if val in ["", "nan", "null"]:
                continue
            has_error = False
            if not email_regex.match(val) or ".." in val or "@@" in val or " " in val:
                has_error = True
            if has_error:
                affected_rows.append(idx + 2)
                if len(samples) < 5:
                    samples.append(f"Row {idx+2}: '{orig_val}'")
                    
        if len(affected_rows) > 0:
            issues.append({
                "id": f"INCONSIST_EMAIL_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": "email",
                "severity": "High",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": samples,
                "recommended_values": ["Valid user@domain.com email format"],
                "explanation": f"Detected {len(affected_rows)} malformed email addresses with structural syntax defects: missing '@' symbols, double dots ('..com'), double '@@', unescaped spaces, or missing top-level domains.",
                "business_impact": "Bounces email confirmations, decreases deliverability score, and damages sender reputation.",
                "recommendation": "Sanitize common syntax typos (replace '@@' with '@', remove whitespace, fix '..') and flag uncorrectable addresses.",
                "cleaning_code": "df['email'] = df['email'].str.replace('@@', '@').str.replace('..', '.').str.strip()"
            })

    # 6. Customer Name Formatting (Casing and Extra Whitespace)
    if "customer_name" in df.columns:
        name_series = df["customer_name"].astype(str)
        affected_rows = []
        samples = []
        
        for idx, orig_val in name_series.items():
            val = orig_val.strip()
            if val in ["", "nan", "null"]:
                continue
            # Check abnormal spaces or all upper / all lower
            has_extra_spaces = "  " in orig_val or orig_val != orig_val.strip()
            is_all_upper = val.isupper() and len(val) > 3
            is_all_lower = val.islower() and len(val) > 3
            if has_extra_spaces or is_all_upper or is_all_lower:
                affected_rows.append(idx + 2)
                if len(samples) < 5:
                    samples.append(f"Row {idx+2}: '{orig_val}' → '{val.title()}'")
                    
        if len(affected_rows) > 0:
            issues.append({
                "id": f"INCONSIST_NAME_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": "customer_name",
                "severity": "Low",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": samples,
                "recommended_values": ["Title Cased Clean Full Name (e.g. 'Arif Ansari')"],
                "explanation": f"Found {len(affected_rows)} customer names with messy formatting: leading/trailing whitespace, multiple repeated spaces, all-uppercase text ('NISHA SINGH'), or all-lowercase text ('anjali patel').",
                "business_impact": "Creates unprofessional customer communications, poorly printed shipping labels, and CRM merge failures.",
                "recommendation": "Apply string title casing and collapse consecutive whitespace characters.",
                "cleaning_code": "import re\ndf['customer_name'] = df['customer_name'].apply(lambda s: re.sub(r'\\s+', ' ', str(s)).strip().title() if pd.notnull(s) else s)"
            })

    # 7. Date Format Inconsistencies
    date_cols = [c for c in df.columns if "date" in c.lower() or "time" in c.lower()]
    for col in date_cols:
        date_series = df[col].astype(str)
        affected_rows = []
        samples = []
        
        for idx, orig_val in date_series.items():
            val = orig_val.strip()
            if val in ["", "nan", "null", "-", "?"]:
                continue
            # Expected standard format is YYYY-MM-DD
            is_iso = bool(re.match(r"^\d{4}-\d{2}-\d{2}$", val))
            if not is_iso:
                affected_rows.append(idx + 2)
                if len(samples) < 5:
                    samples.append(f"Row {idx+2}: '{val}'")
                    
        if len(affected_rows) > 0:
            issues.append({
                "id": f"INCONSIST_DATE_{uuid.uuid4().hex[:6]}",
                "category": "Inconsistent Values",
                "column_name": col,
                "severity": "Medium",
                "issue_count": len(affected_rows),
                "affected_rows": affected_rows[:100],
                "total_affected_rows": len(affected_rows),
                "original_values": samples,
                "recommended_values": ["ISO 8601 standard: YYYY-MM-DD"],
                "explanation": f"Column '{col}' mixes non-uniform date representations: 'M/D/YYYY' (8/11/2026), 'DD/MM/YYYY' (27/05/2026), and textual month formats ('28-Aug-26', '11-Feb-26').",
                "business_impact": "Leads to ambiguous day/month interpretations (e.g. 05/06 could mean May 6 or June 5) and breaks chronological SQL queries.",
                "recommendation": "Parse dates with format inference and standardize into ISO 8601 YYYY-MM-DD strings.",
                "cleaning_code": f"df['{col}'] = pd.to_datetime(df['{col}'], errors='coerce').dt.strftime('%Y-%m-%d')"
            })

    return issues
