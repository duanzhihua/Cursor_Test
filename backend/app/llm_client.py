import os
from typing import Literal

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI


ModelName = Literal["qwen3-max", "qwen-plus"]


def get_chat_model(model: ModelName = "qwen3-max") -> ChatOpenAI:
    """Return a ChatOpenAI configured for Alibaba DashScope (百炼) Qwen models."""
    load_dotenv()
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise RuntimeError("DASHSCOPE_API_KEY 未配置，请在 backend/.env 中设置。")

    return ChatOpenAI(
        api_key=api_key,
        base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
        model=model,
        temperature=0,
    )

