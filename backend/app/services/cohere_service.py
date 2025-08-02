import re
from typing import Dict, List

import cohere

from app.services.base import BaseLLMService

class CohereService(BaseLLMService):
    def __init__(self, api_key: str):
        super().__init__()
        self.co = cohere.Client(api_key)

    def generate_sql_query(self, natural_language: str, schema: str) -> str:
        prompt = self.sql_prompt_template.format(
            schema=schema,
            user_question=natural_language
        )

        response = self.co.generate(
            model="command",
            prompt=prompt,
            max_tokens=200,
            temperature=0.1
        )

        raw_text = response.generations[0].text.strip()
        print(f"🛠 [Cohere] Generated raw SQL: {raw_text}")
        sql_query = re.sub(r'```sql|```', '', raw_text).strip()

        if not sql_query.endswith(';'):
            sql_query += ';'

        print(f"✅ [Cohere] Final SQL query: {sql_query}")
        return sql_query

    def explain_results(self, query: str, results: List[Dict], question: str) -> str:
        prompt = self.explanation_template.format(
            user_question=question,
            sql_query=query,
            sql_results=results
        )

        response = self.co.generate(
            model="command",
            prompt=prompt,
            max_tokens=300,
            temperature=0.2
        )

        explanation = response.generations[0].text.strip()
        print(f"📘 [Cohere] Generated explanation: {explanation}")
        return explanation
