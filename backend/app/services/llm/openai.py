import httpx
from typing import Optional
from fastapi import HTTPException, status
from app.services.llm.base import LLMProvider
from app.core.config import settings

class OpenAIProvider(LLMProvider):
    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or settings.OPENAI_API_KEY
        self.model = model or settings.OPENAI_MODEL or "gpt-4o-mini"
        self.base_url = "https://api.openai.com/v1/chat/completions"

    @property
    def provider_name(self) -> str:
        return f"OpenAI ({self.model})"

    async def check_health(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 10)

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        json_mode: bool = False
    ) -> str:
        if not self.api_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OpenAI API key is missing. Please set OPENAI_API_KEY in your backend .env file."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
        }

        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(
                    self.base_url,
                    json=payload,
                    headers=headers
                )
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Request to OpenAI API timed out. Please try again."
                )
            except httpx.RequestError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Network error connecting to OpenAI API: {str(exc)}"
                )

        if response.status_code != 200:
            error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
            err_msg = error_data.get("error", {}).get("message", response.text)
            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid OpenAI API Key provided. Please verify your OPENAI_API_KEY."
                )
            elif response.status_code == 429:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="OpenAI rate limit or quota exceeded. Please check your account billing status."
                )
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OpenAI API error (Status {response.status_code}): {err_msg}"
            )

        data = response.json()
        try:
            choices = data.get("choices", [])
            if not choices:
                raise ValueError("No choices returned from OpenAI.")
            return choices[0]["message"]["content"].strip()
        except (KeyError, IndexError, ValueError) as e:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unexpected response structure from OpenAI: {str(e)}"
            )

