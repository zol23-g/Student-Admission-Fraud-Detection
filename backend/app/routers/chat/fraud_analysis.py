# import json
# from fastapi import APIRouter, Depends, HTTPException
# from app.database import DatabaseManager
# from app.llm_service import LLMService
# from app.models.chat import ChatRequest
# from app import settings

# router = APIRouter(prefix="/fraud-analysis")

# def get_db_manager():
#     return DatabaseManager(settings.db_config)

# def get_llm_service(provider: str):
#     return LLMService(
#         provider=provider.lower(),
#         cohere_api_key=settings.cohere_api_key,
#         google_api_key=settings.google_api_key,
#     )

# @router.post("/analyze-student/{student_id}")
# async def analyze_student_fraud(
#     student_id: int,
#     request: ChatRequest,
#     db_manager: DatabaseManager = Depends(get_db_manager),
#     llm_service: LLMService = Depends(get_llm_service)
# ):
#     """Specialized endpoint for fraud analysis of a specific student"""
#     try:
#         query = """
#         SELECT id, full_name, fraud_rating, fraud_level,
#             address_fraud_rating, email_rating, phone_fraud_rating,
#             ip_fraud_rating, ssn_rating, fraud_ring_flag,
#             fraud_desc, fraud_ring_desc
#         FROM students
#         WHERE id = %s
#         """
        
#         student_data = db_manager.execute_query(query, (student_id,))
        
#         if not student_data:
#             raise HTTPException(status_code=404, detail="Student not found")
            
#         prompt = f"""
#         Analyze this student's fraud risk profile:
#         {student_data[0]}
        
#         Provide a detailed risk assessment covering:
#         1. Overall fraud risk level
#         2. Specific risk factors in each category (address, email, etc.)
#         3. Recommendations for further verification if needed
#         4. Any signs of potential fraud ring participation
#         """
        
#         if request.provider.lower() == "cohere":
#             analysis = llm_service.service.co.generate(
#                 model="command",
#                 prompt=prompt,
#                 max_tokens=500,
#                 temperature=0.1
#             ).generations[0].text
#         else:
#             analysis = llm_service.service._generate_text(prompt, max_tokens=500, temperature=0.1)
        
#         return {
#             "student_data": student_data[0],
#             "fraud_analysis": analysis,
#             "provider": request.provider
#         }
        
#     except HTTPException:
#         raise
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



import json
from fastapi import APIRouter, Depends, HTTPException
from app.database import DatabaseManager
from app.llm_service import LLMService
from app.models.chat import ChatRequest
from app.config import settings
import mysql.connector
from mysql.connector import Error

router = APIRouter(prefix="/fraud-analysis")

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
    """Dependency that provides configured LLM service"""
    return LLMService(
        provider=provider.lower(),
        cohere_api_key=settings.cohere_api_key,
        google_api_key=settings.google_api_key,
        local_api_url="http://localhost:1234/v1" if provider.lower() == "local" else None
    )

@router.post("/analyze-student/{student_id}")
async def analyze_student_fraud(
    student_id: int,
    request: ChatRequest,
    db_manager: DatabaseManager = Depends(get_db_manager),
    llm_service: LLMService = Depends(get_llm_service)
):
    """Specialized endpoint for fraud analysis of a specific student"""
    try:
        # Get student data with managed connection
        query = """
        SELECT id, full_name, fraud_rating, fraud_level,
            address_fraud_rating, email_rating, phone_fraud_rating,
            ip_fraud_rating, ssn_rating, fraud_ring_flag,
            fraud_desc, fraud_ring_desc
        FROM students
        WHERE id = %s
        """
        
        student_data = db_manager.execute_query(query, (student_id,))
        
        if not student_data:
            raise HTTPException(
                status_code=404,
                detail=f"Student with ID {student_id} not found"
            )
            
        # Prepare analysis prompt
        prompt = f"""
        Analyze this student's fraud risk profile:
        {student_data[0]}
        
        Provide a detailed risk assessment covering:
        1. Overall fraud risk level (1-5 scale)
        2. Specific risk factors in each category (address, email, etc.)
        3. Recommendations for further verification if needed
        4. Any signs of potential fraud ring participation
        """
        
        # Generate analysis based on provider
        if request.provider.lower() == "cohere":
            analysis = llm_service.service.co.generate(
                model="command",
                prompt=prompt,
                max_tokens=500,
                temperature=0.1
            ).generations[0].text
        else:
            analysis = llm_service.service._generate_text(
                prompt, 
                max_tokens=500, 
                temperature=0.1
            )
        
        # Save analysis to database
        db_manager.save_chat(
            message=f"Fraud analysis request for student {student_id}",
            response=analysis,
            sql_query=query,
            query_results=json.dumps(student_data),
            explanation="Fraud risk assessment",
            user_id="1",  # Should be replaced with actual user ID from auth
            conversation_id=request.conversation_id or "fraud-analysis",
            provider=request.provider
        )
        
        return {
            "student_data": student_data[0],
            "fraud_analysis": analysis,
            "provider": request.provider
        }
        
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid request: {str(ve)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )