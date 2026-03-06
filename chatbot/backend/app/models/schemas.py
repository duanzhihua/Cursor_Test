from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MessageItem(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None
    model: str = "deepseek-chat"
    history: list[MessageItem] = Field(default_factory=list)
    system_prompt: str | None = None
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)


class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    supports_thinking: bool


class SessionCreateRequest(BaseModel):
    title: str = "新对话"
    default_model: str = "deepseek-chat"


class SessionUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class StoredMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    role: str
    content: str
    reasoning_content: str | None = None
    model: str | None = None
    created_at: datetime


class SessionInfo(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    default_model: str
    created_at: datetime
    updated_at: datetime


class SessionDetail(SessionInfo):
    messages: list[StoredMessage] = Field(default_factory=list)
