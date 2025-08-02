import re
from typing import List, Dict
import google.generativeai as genai

from app.services.base import BaseLLMService

class GeminiService(BaseLLMService):
    def __init__(self, api_key: str):
        super().__init__()
        genai.configure(api_key=api_key)

        self.model = genai.GenerativeModel('gemini-2.5-flash')  # or gemini-pro
        self.safety_settings = [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
        ]

    def _generate_text(self, prompt: str, max_tokens: int = 300, temperature: float = 0.1) -> str:
        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    max_output_tokens=max_tokens,
                    temperature=temperature
                ),
                safety_settings=self.safety_settings
            )

            if response.candidates and response.candidates[0].finish_reason == 2:
                raise ValueError("Content blocked by safety filters")
            if not response.text:
                raise ValueError("Empty response from Gemini API")
            return response.text.strip()

        except Exception as e:
            print(f"⚠️ Gemini API Error: {str(e)}")
            raise

    def generate_sql_query(self, natural_language: str, schema: str) -> str:
        prompt = self.sql_prompt_template.format(
            schema=schema,
            user_question=natural_language
        )
        print(f"📝 [Gemini] SQL generation prompt:\n{prompt}")

        try:
            raw_text = self._generate_text(prompt, max_tokens=200, temperature=0.1)
            print(f"🛠 [Gemini] Generated raw SQL: {raw_text}")
            sql_query = re.sub(r'```sql|```', '', raw_text).strip()
            return sql_query if sql_query.endswith(';') else sql_query + ';'
        except Exception as e:
            print(f"⚠️ SQL generation failed: {str(e)}")
            raise ValueError(f"Failed to generate SQL query: {str(e)}")

    def explain_results(self, query: str, results: List[Dict], question: str) -> str:
        try:
            if not results:
                return "No results were returned from the query."

            formatted_results = []
            for idx, result in enumerate(results):
                row_str = ", ".join(f"{k}: {v}" for k, v in result.items())
                formatted_results.append(f"Row {idx + 1}: {row_str}")

            results_str = "\n".join(formatted_results)

            prompt = f"""
You are a data analyst.

Analyze the following SQL query result and provide a clear, factual summary.

- Original Question: {question}
- SQL Query: {query}
- Query Result:
{results_str}

Explain what the result means in a neutral tone suitable for a business report.
"""

            print(f"📝 [Gemini] Explanation prompt:\n{prompt}")

            explanation = self._generate_text(prompt, max_tokens=300, temperature=0.3)

            if explanation.lower().startswith("here is"):
                explanation = explanation.split(":", 1)[-1].strip()

            print(f"📘 [Gemini] Generated explanation: {explanation}")
            return explanation

        except Exception as e:
            print(f"⚠️ Explanation generation failed: {str(e)}")

            # Fallback logic
            if results:
                first_result = results[0]
                for key, value in first_result.items():
                    return f"The query returned '{value}' as the most frequent value in the '{key}' column."
            return "The query executed successfully, but no explanation could be generated due to a system error."
