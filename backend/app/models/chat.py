import pydantic
from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    provider: str = "cohere"  # Default to Cohere