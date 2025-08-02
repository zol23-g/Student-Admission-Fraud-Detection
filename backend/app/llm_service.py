# # app/llm_service.py

# import cohere
# import re
# import os
# from typing import List, Dict



# class LLMService:
#     def __init__(self, api_key: str):
#         self.co = cohere.Client(api_key)

#         base_path = os.path.join(os.path.dirname(__file__), "prompts")
#         self.sql_prompt_template = self._load_template(os.path.join(base_path, "sql_prompt.txt"))
#         self.explanation_template = self._load_template(os.path.join(base_path, "explanation_prompt.txt"))

#     def _load_template(self, path: str) -> str:
#         with open(path, "r", encoding="utf-8") as f:
#             return f.read()


#     def generate_sql_query(self, natural_language: str, schema: str) -> str:
#         prompt = self.sql_prompt_template.format(
#             schema=schema,
#             user_question=natural_language
#         )

#         response = self.co.generate(
#             model="command",
#             prompt=prompt,
#             max_tokens=200,
#             temperature=0.1
#         )

#         raw_text = response.generations[0].text.strip()
#         print(f"🛠 Generated raw SQL: {raw_text}")
#         sql_query = re.sub(r'```sql|```', '', raw_text).strip()

#         if not sql_query.endswith(';'):
#             sql_query += ';'

#         print(f"✅ Final SQL query: {sql_query}")
#         return sql_query

#     def explain_results(self, query: str, results: List[Dict], question: str) -> str:
#         prompt = self.explanation_template.format(
#             user_question=question,
#             sql_query=query,
#             sql_results=results
#         )

#         response = self.co.generate(
#             model="command",
#             prompt=prompt,
#             max_tokens=300,
#             temperature=0.2
#         )

#         explanation = response.generations[0].text.strip()
#         print(f"📘 Generated explanation: {explanation}")
#         return explanation



# app/llm_service.py

from typing import List, Dict, Optional

from app.services.cohere_service import CohereService
from app.services.gemini_service import GeminiService
from app.services.local_service import LocalLLMService




                
class LLMService:
    def __init__(self, provider: str = "cohere", cohere_api_key: Optional[str] = None, google_api_key: Optional[str] = None,local_api_url: Optional[str] = "http://localhost:1234/v1",):
        self.provider = provider.lower()
        
        if self.provider == "cohere":
            if not cohere_api_key:
                raise ValueError("Cohere API key is required when using Cohere provider")
            self.service = CohereService(cohere_api_key)
        elif self.provider == "gemini":
            if not google_api_key:
                raise ValueError("Google API key is required when using Gemini provider")
            self.service = GeminiService(google_api_key)
        elif self.provider == "local":
            self.service = LocalLLMService(local_api_url)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

    def generate_sql_query(self, natural_language: str, schema: str) -> str:
        return self.service.generate_sql_query(natural_language, schema)

    def explain_results(self, query: str, results: List[Dict], question: str) -> str:
        return self.service.explain_results(query, results, question)