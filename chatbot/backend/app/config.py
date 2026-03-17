from pathlib import Path
from pydantic_settings import BaseSettings


BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATABASE_URL = f"sqlite+aiosqlite:///{(BACKEND_DIR / 'chatbot.db').as_posix()}"


class Settings(BaseSettings):
    deepseek_api_key: str = ""
    default_model: str = "deepseek-chat"
    database_url: str = DEFAULT_DATABASE_URL

    model_config = {
        "env_file": Path(__file__).resolve().parent.parent / ".env",
        "env_file_encoding": "utf-8",
    }


settings = Settings()
