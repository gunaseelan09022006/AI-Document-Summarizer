import httpx
import logging
from typing import Optional
from fastapi import HTTPException, status
from app.services.llm.base import LLMProvider
from app.core.config import settings

logger = logging.getLogger("gemini_provider")

class GeminiProvider(LLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = (api_key or settings.GEMINI_API_KEY or "").strip()
        raw_model = (model or settings.GEMINI_MODEL or "gemini-1.5-flash").strip()
        self.model = raw_model.removeprefix("models/")
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent"

    @property
    def provider_name(self) -> str:
        return f"Google Gemini ({self.model})"

    async def check_health(self) -> bool:
        return bool(self.api_key and len(self.api_key) > 5)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False
    ) -> str:
        if not self.api_key or len(self.api_key) < 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Google Gemini API key is missing. Please configure GEMINI_API_KEY in your backend/.env file "
                    "(e.g., GEMINI_API_KEY=AIzaSy...) to generate AI summaries. "
                    "You can get a free key at https://aistudio.google.com/."
                )
            )

        body = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 4096,
            }
        }

        if system_prompt:
            body["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }

        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=90.0) as client:
            try:
                response = await client.post(
                    f"{self.base_url}?key={self.api_key}",
                    json=body,
                    headers={"Content-Type": "application/json"}
                )
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Request to Google Gemini API timed out after 90 seconds. Please try again."
                )
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Network error connecting to Google Gemini API: {str(exc)}"
                )

        if response.status_code != 200:
            error_data = {}
            try:
                error_data = response.json()
            except Exception:
                pass
            error_obj = error_data.get("error", {})
            err_msg = error_obj.get("message", response.text)
            status_desc = error_obj.get("status", "")

            if response.status_code == 400 and ("API_KEY_INVALID" in err_msg or "API key not valid" in err_msg or status_desc == "INVALID_ARGUMENT"):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google Gemini API Key. Please verify your GEMINI_API_KEY in backend/.env."
                )
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Google Gemini model '{self.model}' was not found. Please set GEMINI_MODEL='gemini-1.5-flash' in backend/.env."
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Google Gemini API quota or rate limit exceeded. Please wait a moment before trying again."
                )
            elif response.status_code == 403:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Google Gemini API access denied. Ensure your API key has generative language permissions enabled."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Google Gemini API error (HTTP {response.status_code}): {err_msg}"
            )

        data = response.json()
        try:
            candidates = data.get("candidates", [])
            if not candidates:
                prompt_feedback = data.get("promptFeedback", {})
                block_reason = prompt_feedback.get("blockReason", "Unknown")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Google Gemini blocked the generation request (Block Reason: {block_reason})."
                )

            candidate = candidates[0]
            finish_reason = candidate.get("finishReason")
            if finish_reason in ["SAFETY", "BLOCKLIST", "PROHIBITED_CONTENT"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Google Gemini blocked generation due to safety filters ({finish_reason})."
                )

            parts = candidate.get("content", {}).get("parts", [])
            if not parts or "text" not in parts[0]:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail="Google Gemini returned an empty response candidate."
                )

            return parts[0]["text"].strip()
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unexpected response structure from Google Gemini API: {str(e)}"
            )
