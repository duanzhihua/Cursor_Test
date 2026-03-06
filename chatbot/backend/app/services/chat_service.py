"""
DeepSeek 对话模型服务 (deepseek-chat 普通模式)

特性:
  - 仅返回 content, 无 reasoning_content
  - 支持 temperature, top_p 等采样参数
  - 支持 system message
"""

from collections.abc import AsyncGenerator
from openai import OpenAI

from app.config import settings

client = OpenAI(
    api_key=settings.deepseek_api_key,
    base_url="https://api.deepseek.com",
)


async def stream_chat(
    messages: list[dict],
    temperature: float = 1.0,
) -> AsyncGenerator[dict, None]:
    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,
        temperature=temperature,
    )

    for chunk in response:
        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta
        finish_reason = chunk.choices[0].finish_reason

        content = getattr(delta, "content", None)
        if content:
            yield {"type": "content", "token": content}

        if finish_reason == "stop":
            usage = None
            if chunk.usage:
                usage = {
                    "total_tokens": chunk.usage.total_tokens,
                    "reasoning_tokens": 0,
                }
            yield {"type": "done", "model": "deepseek-chat", "usage": usage}
