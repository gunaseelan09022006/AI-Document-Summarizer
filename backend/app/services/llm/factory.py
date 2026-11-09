from app.core.config import settings
from app.services.llm.base import LLMProvider
from app.services.llm.gemini import GeminiProvider
from app.services.llm.openai import OpenAIProvider
from app.services.llm.mock import MockLLMProvider

def get_llm_provider() -> LLMProvider:
    """
    Returns the configured LLM provider.
    - 'mock' or 'test': explicitly returns MockLLMProvider (for offline testing).
    - 'openai': returns OpenAIProvider.
    - 'gemini': returns GeminiProvider.
    - 'auto' (default):
        - If OPENAI_API_KEY is set and GEMINI_API_KEY is not: returns OpenAIProvider.
        - Otherwise returns GeminiProvider (validates key and raises clear setup error on missing key).
    
    IMPORTANT: Never silently fall back to MockLLMProvider when an API key is missing.
    Users must receive a clear actionable error with setup instructions.
    """
    provider_pref = (settings.LLM_PROVIDER or "auto").strip().lower()

    if provider_pref in ("mock", "test", "demo"):
        return MockLLMProvider()

    if provider_pref == "openai":
        return OpenAIProvider()

    if provider_pref == "gemini":
        return GeminiProvider()

    # Default "auto" resolution
    has_gemini = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    has_openai = bool(settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 5)

    if has_gemini:
        return GeminiProvider()
    elif has_openai:
        return OpenAIProvider()
    else:
        # Return GeminiProvider so that when generate() is called, it raises
        # a clear HTTP 400 with instructions on setting GEMINI_API_KEY in backend/.env
        return GeminiProvider()
