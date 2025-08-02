import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    cohere_api_key: str = os.getenv("COHERE_API_KEY")
    google_api_key: str = os.getenv("GOOGLE_API_KEY")
    openai_api_key: str = os.getenv("OPENAI_API_KEY")
    db_host: str = os.getenv("DB_HOST")
    db_user: str = os.getenv("DB_USER")
    db_password: str = os.getenv("DB_PASSWORD")
    db_name: str = os.getenv("DB_NAME")
    db_timeout: int = 30

    @property
    def db_config(self):
        return {
            'host': self.db_host,
            'user': self.db_user,
            'password': self.db_password,
            'database': self.db_name,
            'connect_timeout': self.db_timeout,
            'pool_name': 'fraud_detection_pool',
            'pool_size': 5
        }

settings = Settings()