
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain_openai import ChatOpenAI
import os

# ✅ Connect to MySQL
db_uri = "mysql+pymysql://root:@localhost/student"
db = SQLDatabase.from_uri(db_uri, include_tables=["students"])

# ✅ Initialize through OpenRouter with correct model name
llm = ChatOpenAI(
    model="anthropic/claude-3-haiku",  # Correct model name for OpenRouter
    openai_api_base="https://openrouter.ai/api/v1",
    openai_api_key="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",  # Replace with your actual key
    temperature=0.1
)

# ✅ Build and run chain (using invoke() instead of deprecated run())
db_chain = SQLDatabaseChain.from_llm(
    llm, 
    db, 
    verbose=True,
    use_query_checker=True
)

try:
    response = db_chain.invoke({"query": "what are the addresses and names of students with highest address fraud occcurance ?"})
    print("\n🔍 Result:", response['result'])
except Exception as e:
    print(f"⚠️ Error: {e}")