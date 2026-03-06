"""
LLM 统一路由层 -- 根据 model 参数分发到对应的模型服务

支持模型:
  - deepseek-reasoner: 开启思考链, 走 reasoner_service
  - deepseek-chat: 普通对话, 走 chat_service
"""

from collections.abc import AsyncGenerator

from app.services.reasoner_service import stream_reasoner
from app.services.chat_service import stream_chat


SUPPORTED_MODELS = {
    "deepseek-reasoner": {
        "id": "deepseek-reasoner",
        "name": "DeepSeek 深度思考",
        "description": "开启思考链，擅长数学、逻辑推理、编程",
        "supports_thinking": True,
    },
    "deepseek-chat": {
        "id": "deepseek-chat",
        "name": "DeepSeek 对话",
        "description": "通用对话，快速响应",
        "supports_thinking": False,
    },
}


def get_available_models() -> list[dict]:
    return list(SUPPORTED_MODELS.values())


async def stream_by_model(
    messages: list[dict],
    model: str = "deepseek-chat",
    system_prompt: str | None = None,
    temperature: float = 1.0,
) -> AsyncGenerator[dict, None]:
    if system_prompt:
        messages = [{"role": "system", "content": system_prompt}, *messages]

    if model == "deepseek-reasoner":
        async for event in stream_reasoner(messages):
            yield event
    else:
        async for event in stream_chat(messages, temperature=temperature):
            yield event
