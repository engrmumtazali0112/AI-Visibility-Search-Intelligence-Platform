import os

class Config:
    """Base configuration, values pulled from environment variables."""
    
    SECRET_KEY = os.environ.get("SECRET_KEY", "change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///dev.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # AI Configuration
    MOCK_AI = os.environ.get("MOCK_AI", "false").lower() in ("true", "1", "yes")
    
    # Anthropic Claude (Primary)
    ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
    ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-4-6")
    
    # Google Gemini (Fallback)
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
    GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
    
    # OpenAI (Fallback)
    OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
    OPENAI_MODEL = os.environ.get("OPENAI_MODEL", "gpt-4o")

    DATAFORSEO_LOGIN = os.environ.get("DATAFORSEO_LOGIN")
    DATAFORSEO_PASSWORD = os.environ.get("DATAFORSEO_PASSWORD")

    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(Config):
    DEBUG = False


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}