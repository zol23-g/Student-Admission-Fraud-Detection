# test_cohere.py
import cohere
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("COHERE_API_KEY")
print("COHERE_API_KEY:", api_key)
co = cohere.Client(api_key)
try:
    response = co.generate(model="command", prompt="Test", max_tokens=10)
    print("API Key Valid: Success")
except cohere.CohereAPIError as e:
    print("API Key Invalid:", str(e))