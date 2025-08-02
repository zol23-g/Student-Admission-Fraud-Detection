import re
from typing import Dict, List
import requests

from app.services.base import BaseLLMService



class LocalLLMService(BaseLLMService):
    def __init__(self, base_url: str = "http://localhost:1234/v1"):
        super().__init__()
        self.base_url = base_url  # LM Studio/Ollama endpoint

    def _call_local_api(self, prompt: str, max_tokens: int = 200, temperature: float = 0.1) -> str:
        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                json={
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
                timeout=120,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]
        except Exception as e:
            raise ValueError(f"Local LLM API error: {str(e)}")

    def generate_sql_query(self, natural_language: str, schema: str) -> str:
        prompt = self.sql_prompt_template.format(
            schema=schema,
            user_question=natural_language
        )
        print(f"Here is the prompt: {prompt}")

        raw_text = self._call_local_api(prompt, max_tokens=200, temperature=0.1)
        sql_query = re.sub(r'```sql|```', '', raw_text).strip()
        return sql_query if sql_query.endswith(';') else f"{sql_query};"

    def explain_results(self, query: str, results: List[Dict], question: str) -> str:
        results_str = "\n".join([str(r) for r in results])
        prompt = self.explanation_template.format(
            user_question=question,
            sql_query=query,
            sql_results=results_str
        )
        print(f"Here is the prompt: {prompt}")
        return self._call_local_api(prompt, max_tokens=300, temperature=0.2)


