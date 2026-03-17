"""
DeepSeek 推理模型服务 (deepseek-chat + thinking enabled)

特性:
  - 响应包含 reasoning_content (思考过程) + content (最终回答)
  - 不支持 temperature 等采样参数
  - 不支持 system message, 需要将 system 角色转为 user
"""

from collections.abc import AsyncGenerator
from openai import OpenAI

from app.config import settings

client = OpenAI(
    api_key=settings.deepseek_api_key,
    base_url="https://api.deepseek.com",
)


def _convert_system_to_user(messages: list[dict]) -> list[dict]:
    converted = []
    for msg in messages:
        if msg["role"] == "system":
            converted.append({"role": "user", "content": f"[System Instruction]\n{msg['content']}"})
        else:
            converted.append(msg)
    return converted


async def stream_reasoner(
    messages: list[dict],
) -> AsyncGenerator[dict, None]:
    safe_messages = _convert_system_to_user(messages)

    response = client.chat.completions.create(
        model="deepseek-chat",
        messages=safe_messages,
        stream=True,
        extra_body={"thinking": {"type": "enabled"}},
    )

    for chunk in response:
        if not chunk.choices:
            continue

        delta = chunk.choices[0].delta
        finish_reason = chunk.choices[0].finish_reason

        reasoning = getattr(delta, "reasoning_content", None)
        if reasoning:
            yield {"type": "reasoning", "token": reasoning}

        content = getattr(delta, "content", None)
        if content:
            yield {"type": "content", "token": content}

        if finish_reason == "stop":
            usage = None
            if chunk.usage:
                details = chunk.usage.completion_tokens_details
                usage = {
                    "total_tokens": chunk.usage.total_tokens,
                    "reasoning_tokens": getattr(details, "reasoning_tokens", 0) if details else 0,
                }
            yield {"type": "done", "model": "deepseek-reasoner", "usage": usage}
