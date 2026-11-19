from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CleanRequest(BaseModel):
    approved_operations: List[str]

class CleanPreviewRequest(BaseModel):
    operation_type: str

class GeminiKeyRequest(BaseModel):
    api_key: str

class ExplainRequest(BaseModel):
    api_key: Optional[str] = None
