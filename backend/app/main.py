# app/main.py
import json
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cohere
import mysql.connector
from typing import Optional
import os
from dotenv import load_dotenv
import sqlparse

from app.database import DatabaseManager
from app.llm_service import LLMService
from app.routers.chat import fraud_analysis,chat_history


# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

API_PREFIX = "/api/v1"
# Create a main router with the prefix
main_router = APIRouter(prefix=API_PREFIX)

main_router.include_router(fraud_analysis.router)
main_router.include_router(chat_history.router)

app.include_router(main_router)




