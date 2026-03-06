from pydantic import BaseModel, Field


class MessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    model: str = "deepseek-chat"
    history: list[MessageItem] = []
    system_prompt: str | None = None
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    supports_thinking: bool
