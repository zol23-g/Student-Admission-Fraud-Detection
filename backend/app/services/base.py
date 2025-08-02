import re
import os
from typing import List, Dict, Optional
from abc import ABC, abstractmethod
class BaseLLMService(ABC):
    def __init__(self):
        base_path = os.path.join(os.path.dirname(__file__), "..", "prompts")
        self.sql_prompt_template = self._load_template(os.path.join(base_path, "sql_prompt.txt"))
        self.explanation_template = self._load_template(os.path.join(base_path, "explanation_prompt.txt"))

    def _load_template(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    @abstractmethod
    def generate_sql_query(self, natural_language: str, schema: str) -> str:
        pass

    @abstractmethod
    def explain_results(self, query: str, results: List[Dict], question: str) -> str:
        pass

