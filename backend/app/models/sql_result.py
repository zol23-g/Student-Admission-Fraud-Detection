import json
from fastapi import FastAPI, HTTPException
import pydantic
from pydantic import BaseModel
class SQLQueryResult(BaseModel):
    query: str
    result: list
    explanation: str
    provider: str