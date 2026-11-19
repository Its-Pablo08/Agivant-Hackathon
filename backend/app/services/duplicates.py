import uuid
import pandas as pd
from typing import List, Dict, Any

def detect_duplicates(df: pd.DataFrame) -> List[Dict[str, Any]]:
    issues = []
    
    # 1. Exact duplicate rows
    exact_dup_mask = df.duplicated(keep=False)
    exact_dup_count = int(exact_dup_mask.sum())
    
    if exact_dup_count > 0:
        affected_indices = df.index[exact_dup_mask].tolist()
        affected_rows = [idx + 2 for idx in affected_indices]
        
        # Group exact duplicate examples
        sample_dup_records = []
        grouped = df[exact_dup_mask].groupby(list(df.columns))
        for _, group in list(grouped)[:5]:
            rows = [idx + 2 for idx in group.index.tolist()]
            sample_dup_records.append({
                "duplicate_row_numbers": rows,
                "record_preview": group.iloc[0].to_dict()
            })
            
        issues.append({
            "id": f"DUP_EXACT_{uuid.uuid4().hex[:6]}",
            "category": "Duplicate Records",
            "column_name": "All Columns (Exact Row Duplicates)",
            "severity": "Critical",
            "issue_count": exact_dup_count,
            "affected_rows": affected_rows[:100],
            "total_affected_rows": exact_dup_count,
            "original_values": [f"{len(group)} identical copies on rows {', '.join(map(str, [i+2 for i in group.index]))}" for _, group in list(grouped)[:4]],
            "recommended_values": ["Keep first occurrence, drop redundant rows"],
            "explanation": f"Detected {exact_dup_count} records ({round(exact_dup_count/len(df)*100, 1)}% of dataset) that are 100% identical duplicates across all columns.",
            "business_impact": "Double-counting of sales volume, skewed customer lifetime value, and inflated inventory dispatch requests.",
            "recommendation": "Remove duplicate occurrences while retaining the first verified record.",
            "cleaning_code": "df = df.drop_duplicates(keep='first')"
        })

    # 2. Duplicate Primary / Business Keys (e.g. order_id)
    id_cols = [c for c in df.columns if "id" in c.lower() or "order" in c.lower()]
    primary_key_col = id_cols[0] if id_cols else None
    
    if primary_key_col:
        id_dup_mask = df.duplicated(subset=[primary_key_col], keep=False)
        # Exclude rows that are already exact duplicates to avoid double penalization
        key_only_mask = id_dup_mask & (~exact_dup_mask)
        key_only_count = int(key_only_mask.sum())
        
        if key_only_count > 0:
            affected_indices = df.index[key_only_mask].tolist()
            affected_rows = [idx + 2 for idx in affected_indices]
            
            sample_keys = df.loc[key_only_mask, primary_key_col].unique()[:5].tolist()
            
            issues.append({
                "id": f"DUP_KEY_{uuid.uuid4().hex[:6]}",
                "category": "Duplicate Records",
                "column_name": primary_key_col,
                "severity": "High",
                "issue_count": key_only_count,
                "affected_rows": affected_rows[:100],
                "total_affected_rows": key_only_count,
                "original_values": [f"ID {k} reused across non-identical rows" for k in sample_keys],
                "recommended_values": ["Generate unique IDs for conflicting entries or verify source sync"],
                "explanation": f"Column '{primary_key_col}' has {key_only_count} records sharing duplicate identifiers with conflicting transaction data (e.g., different dates, amounts, or customer records).",
                "business_impact": "Primary key constraint violation, database insertion errors, and inability to uniquely reference orders.",
                "recommendation": "Resolve identifier collision by assigning unique suffixes or reconciling with source order management systems.",
                "cleaning_code": f"# Deduplicate by {primary_key_col} or assign distinct IDs\ndf['{primary_key_col}'] = df['{primary_key_col}'].where(~df.duplicated(subset=['{primary_key_col}']), df['{primary_key_col}'] + '_dup')"
            })

    # 3. Repeated Transaction Records (Suspected duplicate orders with different IDs)
    candidate_cols = []
    for c in ["customer_name", "order_date", "total_amount", "category", "unit_price"]:
        if c in df.columns:
            candidate_cols.append(c)
            
    if len(candidate_cols) >= 3:
        suspected_mask = df.duplicated(subset=candidate_cols, keep=False)
        # Only consider those where order_id is actually different
        if primary_key_col:
            suspected_mask = suspected_mask & (~df.duplicated(subset=[primary_key_col], keep=False))
        
        suspected_count = int(suspected_mask.sum())
        if suspected_count > 0:
            affected_indices = df.index[suspected_mask].tolist()
            affected_rows = [idx + 2 for idx in affected_indices]
            
            issues.append({
                "id": f"DUP_TX_{uuid.uuid4().hex[:6]}",
                "category": "Duplicate Records",
                "column_name": "Transaction Signatures (Customer + Date + Amount)",
                "severity": "Medium",
                "issue_count": suspected_count,
                "affected_rows": affected_rows[:100],
                "total_affected_rows": suspected_count,
                "original_values": [f"Customer orders on same date for same amount/items ({suspected_count} instances)"],
                "recommended_values": ["Verify if separate repeat orders or accidental double-click submits"],
                "explanation": f"Detected {suspected_count} transactions where the customer, order date, and item details match, but under distinct order IDs.",
                "business_impact": "Possible accidental customer double-click submissions causing redundant fulfillment and return costs.",
                "recommendation": "Flag for customer verification or review time intervals between checkout submissions.",
                "cleaning_code": f"# Flag suspected duplicate transactions\ndf['is_suspected_dup_tx'] = df.duplicated(subset={candidate_cols}, keep=False)"
            })
            
    return issues
