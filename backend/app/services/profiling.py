import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List

def detect_column_semantic_type(series: pd.Series) -> str:
    # Drop missing
    non_null = series.dropna().astype(str).str.strip()
    non_null = non_null[~non_null.isin(["", "-", "?", "unknown", "Unknown", "none", "null", "NaN", "not available"])]
    if len(non_null) == 0:
        return "empty"
    
    # Check numeric
    numeric_count = 0
    sample = non_null.head(100)
    for val in sample:
        try:
            float(val.replace(",", "").replace("₹", "").replace("$", ""))
            numeric_count += 1
        except:
            pass
    if numeric_count / len(sample) > 0.8:
        # Check if integer or float
        is_int = True
        for val in sample:
            try:
                v = float(val.replace(",", "").replace("₹", "").replace("$", ""))
                if not v.is_integer():
                    is_int = False
                    break
            except:
                pass
        return "integer" if is_int else "float"
        
    # Check date
    date_count = 0
    for val in sample:
        try:
            pd.to_datetime(val, format="mixed", errors="raise")
            date_count += 1
        except:
            pass
    if date_count / len(sample) > 0.8:
        return "datetime"
        
    # Check boolean
    bool_vals = {"true", "false", "yes", "no", "0", "1", "t", "f"}
    if all(v.lower() in bool_vals for v in sample):
        return "boolean"
        
    # Categorical vs Text
    unique_ratio = series.nunique() / len(series) if len(series) > 0 else 0
    if unique_ratio < 0.15 or series.nunique() <= 30:
        return "categorical"
        
    return "text"

def profile_dataset(df: pd.DataFrame) -> Dict[str, Any]:
    total_rows, total_cols = df.shape
    columns_profile = []
    
    # Check exact duplicates in whole dataframe
    exact_duplicates_count = int(df.duplicated().sum())
    
    for col in df.columns:
        series = df[col]
        total_records = len(series)
        
        # Missing values: NaN + whitespace + placeholders
        str_series = series.astype(str).str.strip()
        is_placeholder = str_series.str.lower().isin(["", "nan", "null", "none", "-", "?", "unknown", "not available", "n/a"])
        missing_count = int(series.isna().sum() + is_placeholder.sum() - (series.isna() & is_placeholder).sum())
        missing_pct = round((missing_count / total_rows) * 100, 2) if total_rows > 0 else 0.0
        
        unique_count = int(series.nunique(dropna=True))
        semantic_type = detect_column_semantic_type(series)
        
        # Numerical stats
        min_val, max_val, mean_val, median_val, std_val = None, None, None, None, None
        histogram_bins = []
        
        # Try converting to numeric for stats
        num_series = pd.to_numeric(series.replace(["-", "?", "unknown", "Unknown", "", "None", "null"], np.nan), errors="coerce")
        valid_nums = num_series.dropna()
        if len(valid_nums) > 0 and semantic_type in ["integer", "float"]:
            min_val = float(valid_nums.min()) if not math.isnan(valid_nums.min()) else None
            max_val = float(valid_nums.max()) if not math.isnan(valid_nums.max()) else None
            mean_val = round(float(valid_nums.mean()), 2) if not math.isnan(valid_nums.mean()) else None
            median_val = round(float(valid_nums.median()), 2) if not math.isnan(valid_nums.median()) else None
            std_val = round(float(valid_nums.std()), 2) if (len(valid_nums) > 1 and not math.isnan(valid_nums.std())) else 0.0
            
            # Generate 8 histogram bins for chart
            try:
                counts, bin_edges = np.histogram(valid_nums, bins=min(8, max(3, len(valid_nums.unique()))))
                for i in range(len(counts)):
                    histogram_bins.append({
                        "range": f"{round(bin_edges[i], 1)} - {round(bin_edges[i+1], 1)}",
                        "count": int(counts[i])
                    })
            except:
                pass
        
        # Frequent values
        val_counts = series.dropna().astype(str).value_counts().head(5).to_dict()
        top_values = [{"value": str(k), "count": int(v)} for k, v in val_counts.items()]
        
        # Distinct sample values (filtered clean samples)
        sample_distinct = [str(x) for x in series.dropna().unique()[:8] if str(x).strip() != ""]
        
        columns_profile.append({
            "name": col,
            "data_type": str(series.dtype),
            "semantic_type": semantic_type,
            "total_records": total_records,
            "missing_count": missing_count,
            "missing_percentage": missing_pct,
            "unique_count": unique_count,
            "min": min_val,
            "max": max_val,
            "mean": mean_val,
            "median": median_val,
            "std": std_val,
            "top_values": top_values,
            "sample_distinct": sample_distinct,
            "histogram": histogram_bins
        })
        
    return {
        "total_rows": total_rows,
        "total_columns": total_cols,
        "exact_duplicates": exact_duplicates_count,
        "columns": columns_profile
    }
