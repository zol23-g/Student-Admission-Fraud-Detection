import json
from fastapi import APIRouter, HTTPException, Depends
from langchain_openai import ChatOpenAI
from app.database import DatabaseManager
from app.llm_service import LLMService
from app.models.chat import ChatRequest
from app.config import settings
import mysql.connector
from mysql.connector import Error
from langchain_community.utilities import SQLDatabase
from langchain_experimental.sql import SQLDatabaseChain
from langchain_core.prompts.prompt import PromptTemplate
from langchain.chains.llm import LLMChain

router = APIRouter(prefix="/chat")

def get_db_manager():
    try:
        manager = DatabaseManager(settings.db_config)
        # Verify connection works
        with manager.get_connection() as conn:
            if not conn.is_connected():
                conn.reconnect(attempts=3, delay=1)
        return manager
    except Error as err:
        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {err.msg}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database initialization error: {str(e)}"
        )

def get_llm_service(provider: str):
    return LLMService(
        provider=provider.lower(),
        cohere_api_key=settings.cohere_api_key,
        google_api_key=settings.google_api_key,
        local_api_url="http://localhost:1234/v1"
    )

@router.post("/chat-with-db")
async def chat_with_db(
    request: ChatRequest,
    db_manager: DatabaseManager = Depends(get_db_manager),
    llm_service: LLMService = Depends(get_llm_service)
):
    try:
        schema = db_manager.get_table_schema()
        print(f"📦 Schema used: {schema}")
   
        generated_sql = llm_service.generate_sql_query(request.message, schema)
        print(f"🛠 SQL Generated: {generated_sql}")

        results = db_manager.execute_query(generated_sql)
        print(f"📊 Query Results: {results}")

        if not results:
            explanation = (
                "🔍 I ran the query, but found no matching results.\n"
                "This may be because:\n"
                "- The information doesn't exist.\n"
                "- The query was too narrow.\n"
                "- Or the student or field was mistyped.\n\n"
                "Try refining your request or ask for broader insights."
            )
        else:
            explanation = llm_service.explain_results(generated_sql, results, request.message)

        db_manager.save_chat(
            message=request.message,
            response=explanation,
            sql_query=generated_sql,
            query_results=json.dumps(results) if results else None,
            explanation=explanation,
            user_id="1",
            conversation_id=request.conversation_id or "default",
            provider=request.provider
        )

        return {
            "sql_query": generated_sql,
            "results": results,
            "explanation": explanation,
            "provider": request.provider
        }

    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(ve)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )

@router.get("/chat-history/{conversation_id}")
async def get_chat_history(
    conversation_id: str,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        history = db_manager.get_chat_history(conversation_id)
        if not history:
            raise HTTPException(
                status_code=404,
                detail="No chat history found"
            )
        return {"conversation_id": conversation_id, "history": history}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve history: {str(e)}"
        )

@router.get("/user-chats/{user_id}")
async def get_user_chats(
    user_id: str,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    try:
        chats = db_manager.get_user_chats(user_id)
        if not chats:
            raise HTTPException(
                status_code=404,
                detail="No chats found for this user"
            )
        return {"user_id": user_id, "chats": chats}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve user chats: {str(e)}"
        )
    

@router.post("/query-with-chain")
async def query_with_chain(
    request: ChatRequest,
    db_manager: DatabaseManager = Depends(get_db_manager)
):
    """Advanced query using LangChain SQL generation with robust execution"""
    try:
        # Initialize LLM with error handling
        llm = ChatOpenAI(
            model="anthropic/claude-3-haiku",
            openai_api_base="https://openrouter.ai/api/v1",
            openai_api_key=settings.openai_api_key,
            temperature=0.1,
            max_tokens=200,
            request_timeout=30
        )

        # Dynamically fetch all column names with error handling
        try:
            with db_manager.get_connection() as conn:
                with conn.cursor() as cursor:
                    cursor.execute("""
                        SELECT COLUMN_NAME 
                        FROM INFORMATION_SCHEMA.COLUMNS 
                        WHERE TABLE_NAME = 'students' 
                        AND TABLE_SCHEMA = %s
                    """, (settings.db_name,))
                    columns = [row[0] for row in cursor.fetchall()]
        except Exception as e:
            raise ValueError(f"Failed to fetch columns: {str(e)}")

        # Enhanced prompt with specific instructions
        _DEFAULT_TEMPLATE = """You are a MySQL expert. Convert this question to SQL:
        
        Rules:
        1. Only return the SQL query, nothing else
        2. Never use SELECT * - only select needed columns
        3. Use proper JOIN syntax if needed
        4. For counts, use COUNT(*) not COUNT(1)
        5. For fraud analysis, use these fields:
           - fraud_ring: count of occurrences
           - fraud_rating: percentage score
           - *_desc: description fields
        
        Table: students
        Columns: {columns}
        
        Question: {input}
        
        SQL Query:"""
        
        PROMPT = PromptTemplate(
            input_variables=["input", "columns"],
            template=_DEFAULT_TEMPLATE,
        )

        # Generate SQL with retry logic
        max_retries = 3
        generated_sql = ""
        
        for attempt in range(max_retries):
            try:
                sql_response = llm.invoke(PROMPT.format(
                    input=request.message,
                    columns=", ".join(columns)
                )).content
                
                # Clean and validate SQL
                generated_sql = sql_response.strip()
                if "```sql" in generated_sql:
                    generated_sql = generated_sql.split("```sql")[1].split("```")[0].strip()
                generated_sql = generated_sql.rstrip(';').strip() + ';'
                
                # Basic SQL validation
                if not generated_sql.lower().startswith(('select', 'with')):
                    raise ValueError("Generated query must be a SELECT statement")
                if ';' in generated_sql[:-1]:
                    raise ValueError("Query contains multiple statements")
                
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                continue

        print(f"🛠 Generated SQL: {generated_sql}")

        # Execute query with enhanced safety
        try:
            with db_manager.get_connection() as conn:
                with conn.cursor(dictionary=True) as cursor:
                    cursor.execute(generated_sql)
                    results = cursor.fetchall()
        except Exception as e:
            raise ValueError(f"Query execution failed: {str(e)}")

        print(f"📊 Found {len(results)} results")

        # Generate explanation with fallback
        try:
            explanation_prompt = f"""Analyze these database results:
            
            Question: {request.message}
            SQL Query: {generated_sql}
            Results: {json.dumps(results[:3])} {f'(first 3 of {len(results)} rows)' if len(results) > 3 else ''}
            
            Provide a short, concise explanation in business language.
            Focus on key insights and patterns.
            """
            
            explanation = llm.invoke(explanation_prompt).content
        except Exception:
            explanation = "Results analysis unavailable - please review the raw data"

        # Save with transaction handling
        try:
            db_manager.save_chat(
                message=request.message,
                response=explanation,
                sql_query=generated_sql,
                query_results=json.dumps(results),
                user_id="1",
                conversation_id=request.conversation_id or "chain-query",
                provider=request.provider
            )
        except Exception as e:
            print(f"⚠️ Failed to save chat: {str(e)}")

        return {
            "question": request.message,
            "sql_query": generated_sql,
            "explanation": explanation,
            "result_count": len(results),
            "results": results[:3] if results else []
        }

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )