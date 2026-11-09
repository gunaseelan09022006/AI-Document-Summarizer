import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Search for .env in both backend directory and root workspace directory
current_dir = os.path.dirname(os.path.abspath(__file__))               # backend/app/core
backend_dir = os.path.dirname(os.path.dirname(current_dir))            # backend
root_dir = os.path.dirname(backend_dir)                                # workspace root

# Pre-load environment files so os.environ is populated
load_dotenv(os.path.join(backend_dir, ".env"))
load_dotenv(os.path.join(root_dir, ".env"))

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Document Summarizer"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "super-secret-key-change-in-production-ai-doc-summarizer"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./sql_app.db"

    # LLM Configuration
    # Supported providers: "auto", "gemini", "openai", "mock"
    LLM_PROVIDER: str = "auto"
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-1.5-flash"
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Upload & Security
    MAX_UPLOAD_SIZE_MB: int = 25
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "txt"]
    UPLOAD_DIR: str = "./uploads"

    # Rate Limiting
    AI_RATE_LIMIT_PER_MINUTE: int = 20

    model_config = SettingsConfigDict(
        env_file=(
            os.path.join(backend_dir, ".env"),
            os.path.join(root_dir, ".env"),
            ".env"
        ),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
